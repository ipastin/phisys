import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { activeSleepSupports, type SleepFactRow } from './analytics.js';
import { withTransaction } from './transaction.js';

const policyVersion = 'manual-sleep-verification-v1';
const factUuid =
  /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const subjectUuid =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export type SupabaseAuthConfig = Readonly<{
  projectUrl: string;
  publishableKey: string;
}>;

type Verification = 'unverified' | 'user_verified';
type Action = 'confirm' | 'revoke';

export type ManualSleepRevision = Readonly<{
  factId: string;
  value: unknown;
  effective: unknown;
  supports: SleepFactRow['supports'];
  verification: Verification;
  hasUnresolvedConflict: boolean;
  revision: string;
}>;

export type SleepVerificationRequest = Pick<
  ManualSleepRevision,
  'factId' | 'revision'
>;

export class SleepVerificationError extends Error {
  constructor(
    public readonly code:
      | 'invalid_request'
      | 'authentication_required'
      | 'authentication_unavailable'
      | 'owner_binding_unavailable'
      | 'revision_unavailable'
      | 'stale_revision',
  ) {
    super(code);
    this.name = 'SleepVerificationError';
  }
}

async function authenticateOwner(
  issuer: string,
  publishableKey: string,
  accessToken: string,
): Promise<string> {
  const encodedClaims =
    typeof accessToken === 'string'
      ? /^[\w-]+\.([\w-]+)\.[\w-]+$/.exec(accessToken)?.[1]
      : undefined;
  if (!encodedClaims)
    throw new SleepVerificationError('authentication_required');

  let user: { id?: unknown; role?: unknown; is_anonymous?: unknown } | null;
  try {
    const response = await fetch(`${issuer}/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 401 || response.status === 403)
      throw new SleepVerificationError('authentication_required');
    if (response.status !== 200)
      throw new SleepVerificationError('authentication_unavailable');
    user = (await response.json()) as typeof user;
  } catch (error) {
    if (error instanceof SleepVerificationError) throw error;
    throw new SleepVerificationError('authentication_unavailable');
  }
  if (
    !user ||
    typeof user.id !== 'string' ||
    !subjectUuid.test(user.id) ||
    user.role !== 'authenticated' ||
    user.is_anonymous !== false
  )
    throw new SleepVerificationError('authentication_required');

  // Supabase authenticated this exact token. Its profile response omits client_id.
  let claims: unknown;
  try {
    claims = JSON.parse(
      Buffer.from(encodedClaims, 'base64url').toString('utf8'),
    );
  } catch {
    throw new SleepVerificationError('authentication_required');
  }
  const subject = user.id.toLowerCase();
  if (
    !claims ||
    typeof claims !== 'object' ||
    !('sub' in claims) ||
    typeof claims.sub !== 'string' ||
    claims.sub.toLowerCase() !== subject ||
    Object.hasOwn(claims, 'client_id')
  )
    throw new SleepVerificationError('authentication_required');
  return subject;
}

type RevisionRow = {
  value: unknown;
  effective: unknown;
  verification: Verification;
  verification_revision: string;
  supports: SleepFactRow['supports'] | null;
  has_unresolved_conflict: boolean;
};

export function createSleepVerificationService(
  pool: Pool,
  config: SupabaseAuthConfig,
) {
  const project = new URL(config.projectUrl);
  const { publishableKey } = config;
  if (
    project.protocol !== 'https:' ||
    project.username ||
    project.password ||
    project.pathname !== '/' ||
    project.search ||
    project.hash ||
    !/^sb_publishable_[\w-]+$/.test(publishableKey)
  )
    throw new Error(
      'An HTTPS Supabase project origin and publishable key are required',
    );
  const issuer = `${project.origin}/auth/v1`;

  async function withRevision<T>(
    accessToken: string,
    factId: string,
    run: (
      db: PoolClient,
      binding: { personId: string; subject: string; version: string },
      preview: ManualSleepRevision,
    ) => Promise<T>,
  ): Promise<T> {
    if (typeof factId !== 'string' || !factUuid.test(factId))
      throw new SleepVerificationError('invalid_request');
    factId = factId.toLowerCase();
    const subject = await authenticateOwner(
      issuer,
      publishableKey,
      accessToken,
    );

    return withTransaction(pool, async (db) => {
      await db.query('SET LOCAL ROLE myphisys_sleep_verifier');
      await db.query(
        "SELECT set_config('app.verification_issuer', $1, true), set_config('app.verification_subject', $2, true)",
        [issuer, subject],
      );
      const owner = await db.query<{ person_id: string }>(
        `SELECT person_id FROM identity.person_owner
         WHERE issuer=$1 AND subject=$2 AND disabled_at IS NULL FOR SHARE`,
        [issuer, subject],
      );
      const personId = owner.rows[0]?.person_id;
      if (!personId)
        throw new SleepVerificationError('owner_binding_unavailable');
      await db.query("SELECT set_config('app.person_id', $1, true)", [
        personId,
      ]);

      // Ingestion locks this same row before changing the fact or its support.
      // Read supports in a second statement so a waiter sees the committed revision.
      const locked = await db.query(
        'SELECT id FROM health.fact WHERE person_id=$1 AND id=$2 FOR UPDATE',
        [personId, factId],
      );
      if (!locked.rowCount)
        throw new SleepVerificationError('revision_unavailable');
      const result = await db.query<RevisionRow>(
        `SELECT f.value, f.effective, f.verification, f.verification_revision::text,
                support.items AS supports, EXISTS (
                  SELECT 1 FROM health.conflict c
                  WHERE c.person_id=f.person_id AND c.existing_fact_id=f.id
                    AND c.state='unresolved'
                ) AS has_unresolved_conflict
         FROM health.fact f
         LEFT JOIN LATERAL (${activeSleepSupports}) support ON true
         WHERE f.person_id=$1 AND f.id=$2`,
        [personId, factId],
      );
      const fact = result.rows[0];
      if (
        !fact?.supports?.length ||
        fact.supports.some(({ connectorId }) => connectorId !== 'manual')
      )
        throw new SleepVerificationError('revision_unavailable');
      const preview = {
        factId,
        value: fact.value,
        effective: fact.effective,
        supports: fact.supports,
        verification: fact.verification,
        hasUnresolvedConflict: fact.has_unresolved_conflict,
      };
      const version = fact.verification_revision;
      const revision = createHash('sha256')
        .update(
          JSON.stringify([
            policyVersion,
            issuer,
            subject,
            personId,
            version,
            preview,
          ]),
        )
        .digest('hex');
      return run(db, { personId, subject, version }, { ...preview, revision });
    });
  }

  async function decide(
    accessToken: string,
    request: SleepVerificationRequest,
    action: Action,
  ) {
    const { factId, revision } = request;
    if (typeof revision !== 'string' || !/^[\da-f]{64}$/.test(revision))
      throw new SleepVerificationError('invalid_request');
    const verification: Verification =
      action === 'confirm' ? 'user_verified' : 'unverified';

    return withRevision(accessToken, factId, async (db, binding, preview) => {
      const { personId, subject, version } = binding;
      if (action === 'confirm' && preview.hasUnresolvedConflict)
        throw new SleepVerificationError('revision_unavailable');
      if (revision !== preview.revision) {
        const replay = await db.query(
          `SELECT 1 FROM health.sleep_verification_event
           WHERE person_id=$1 AND fact_id=$2 AND from_revision=$3::bigint-1
             AND revision_fingerprint=$4 AND action=$5`,
          [personId, preview.factId, version, revision, action],
        );
        if (!replay.rowCount || preview.verification !== verification)
          throw new SleepVerificationError('stale_revision');
        return { verification };
      }
      // A fresh revoke closes the revision even if a pending confirm has not reached SQL.
      if (action === 'confirm' && preview.verification === verification)
        return { verification };

      await db.query(
        `INSERT INTO health.sleep_verification_event
           (person_id, fact_id, from_revision, issuer, subject, action,
            policy_version, revision_fingerprint, supports)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          personId,
          preview.factId,
          version,
          issuer,
          subject,
          action,
          policyVersion,
          revision,
          JSON.stringify(preview.supports),
        ],
      );
      const updated = await db.query(
        `UPDATE health.fact SET verification=$3, verification_revision=verification_revision+1
         WHERE person_id=$1 AND id=$2`,
        [personId, preview.factId, verification],
      );
      if (updated.rowCount !== 1)
        throw new SleepVerificationError('revision_unavailable');
      return { verification };
    });
  }

  return {
    getRevision: (accessToken: string, factId: string) =>
      withRevision(
        accessToken,
        factId,
        async (_db, _binding, preview) => preview,
      ),
    confirm: (accessToken: string, request: SleepVerificationRequest) =>
      decide(accessToken, request, 'confirm'),
    revoke: (accessToken: string, request: SleepVerificationRequest) =>
      decide(accessToken, request, 'revoke'),
  };
}
