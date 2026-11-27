import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import {
  createSleepVerificationService,
  Pool,
  readCurrentSleepFacts,
  uuidv7,
} from '@myphisys/database';
import { ingest } from '@myphisys/ingestion';
import { manualRecords } from '../../connectors/src/index.js';
import { goldenRecords } from '../../ingestion/test/golden.js';
import {
  sleepBaselineTrend,
  sleepMeaningfulness,
  sleepMetricStatePair,
  sleepPeriodComparison,
  sleepQuality,
  type QualityWindow,
} from '../src/index.js';

if (!process.env.DATABASE_URL || process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error(
    'DB integration tests require DATABASE_URL and M1_DISPOSABLE_DB=1',
  );

const admin = new Pool({ connectionString: process.env.DATABASE_URL });
const writerUrl = new URL(process.env.DATABASE_URL);
writerUrl.username = 'myphisys_m2_writer';
writerUrl.password = '';
const readerUrl = new URL(process.env.DATABASE_URL);
readerUrl.username = 'myphisys_m2_reader';
readerUrl.password = '';
const verifierUrl = new URL(process.env.DATABASE_URL);
verifierUrl.username = 'myphisys_m2_verifier';
verifierUrl.password = '';
const writer = new Pool({ connectionString: writerUrl.toString() });
const reader = new Pool({ connectionString: readerUrl.toString() });
const verifier = new Pool({ connectionString: verifierUrl.toString() });
const personA = uuidv7();
const personB = uuidv7();
const personC = uuidv7();
const personD = uuidv7();
const window: QualityWindow = {
  startDate: '2026-01-01',
  endDateExclusive: '2026-04-01',
  asOfDate: '2026-04-01',
  calculatedAt: '2026-04-01T00:00:00Z',
};

beforeAll(async () => {
  await admin.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m2_writer') THEN CREATE ROLE myphisys_m2_writer LOGIN; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m2_reader') THEN CREATE ROLE myphisys_m2_reader LOGIN; END IF; END $$",
  );
  await admin.query('GRANT myphisys_domain TO myphisys_m2_writer');
  await admin.query('GRANT myphisys_analytics TO myphisys_m2_reader');
  await admin.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m2_verifier') THEN CREATE ROLE myphisys_m2_verifier LOGIN; END IF; END $$",
  );
  await admin.query('GRANT myphisys_sleep_verifier TO myphisys_m2_verifier');
  await admin.query(
    'INSERT INTO identity.person(id) VALUES ($1),($2),($3),($4)',
    [personA, personB, personC, personD],
  );
  for (const record of goldenRecords(personA).filter(
    (item) => item.payload.conceptId === 'sleep_duration',
  ))
    expect((await ingest(writer, record)).state).toBe('imported');
  expect(
    (
      await ingest(writer, {
        ...goldenRecords(personB).find(
          (item) => item.payload.conceptId === 'sleep_duration',
        )!,
        externalRecordId: 'person-b-sleep',
      })
    ).state,
  ).toBe('imported');
  for (const record of goldenRecords(personC).filter(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value < '2026-02-05',
  )) {
    const date = (record.payload.effective as { value: string }).value;
    expect(
      (
        await ingest(writer, {
          ...record,
          payload: {
            ...record.payload,
            value: {
              kind: 'quantity',
              originalUnit: 'h',
              originalValue:
                date === '2026-01-01'
                  ? 1
                  : date < '2026-01-15'
                    ? 7.5
                    : date < '2026-01-29'
                      ? 8.5
                      : 5,
            },
          },
        })
      ).state,
    ).toBe('imported');
  }
  for (const record of goldenRecords(personD).filter(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value < '2026-01-15',
  ))
    expect(
      (
        await ingest(writer, {
          ...record,
          eventKey: `step11:${(record.payload.effective as { value: string }).value}`,
          payload: {
            ...record.payload,
            value: { kind: 'quantity', originalValue: 8, originalUnit: 'h' },
          },
        })
      ).state,
    ).toBe('imported');
}, 120_000);

afterAll(async () => {
  await Promise.all([reader.end(), writer.end(), verifier.end(), admin.end()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const verificationConfig = {
  projectUrl: 'https://verification.example',
  publishableKey: 'sb_publishable_fixture',
};
const verificationIssuer = `${verificationConfig.projectUrl}/auth/v1`;
const verificationService = createSleepVerificationService(
  verifier,
  verificationConfig,
);
function syntheticToken(
  claims: { sub: string; client_id?: string },
  marker = 'fixture',
) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `synthetic.${payload}.${marker}`;
}

async function verificationOwner() {
  const personId = uuidv7();
  const subject = randomUUID();
  await admin.query('INSERT INTO identity.person(id) VALUES ($1)', [personId]);
  await admin.query(
    'INSERT INTO identity.person_owner(issuer,subject,person_id) VALUES ($1,$2,$3)',
    [verificationIssuer, subject, personId],
  );
  return { personId, subject, token: syntheticToken({ sub: subject }) };
}

function syntheticSupabase(
  subjects: ReadonlyMap<string, string>,
  beforeProfile?: (token: string) => Promise<void>,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (url, options) => {
      expect(url).toBe(`${verificationIssuer}/user`);
      expect(options?.redirect).toBe('error');
      const headers = new Headers(options?.headers);
      expect(headers.get('apikey')).toBe(verificationConfig.publishableKey);
      const token = headers.get('authorization')?.slice('Bearer '.length) ?? '';
      const id = subjects.get(token);
      if (!id) return new Response(null, { status: 401 });
      await beforeProfile?.(token);
      return Response.json({
        id,
        role: 'authenticated',
        is_anonymous: token.endsWith('.anonymous'),
      });
    }),
  );
}

function manualNight(
  personId: string,
  date: string,
  value: number,
  version = 1,
) {
  return manualRecords({
    personId,
    type: 'observation',
    conceptId: 'sleep_duration',
    value,
    unit: 'h',
    version,
    externalRecordId: date,
    eventKey: `manual-sleep:${date}`,
    recordedAt: `${date}T12:00:00.000Z`,
    effective: { kind: 'local_date', value: date },
  })[0]!;
}

async function importManualNight(record: ReturnType<typeof manualNight>) {
  const result = await ingest(writer, record);
  if (result.state !== 'imported' || !result.factId)
    throw new Error('Synthetic Manual sleep fact was not imported');
  return result.factId;
}

test('DB Manual verification resolves an active verified owner and serializes retries and revoke', async () => {
  const a = await verificationOwner();
  const b = await verificationOwner();
  const anonymous = syntheticToken({ sub: a.subject }, 'anonymous');
  const unboundSubject = randomUUID();
  const unbound = syntheticToken({ sub: unboundSubject });
  syntheticSupabase(
    new Map([
      [a.token, a.subject],
      [b.token, b.subject],
      [anonymous, a.subject],
      [unbound, unboundSubject],
    ]),
  );
  const factId = await importManualNight(
    manualNight(a.personId, '2026-01-01', 8),
  );
  const preview = await verificationService.getRevision(a.token, factId);
  expect(preview).toMatchObject({
    value: { canonicalValue: 8, canonicalUnit: 'h' },
    effective: { kind: 'local_date', value: '2026-01-01' },
    verification: 'unverified',
    supports: [{ connectorId: 'manual', version: 1 }],
  });

  const suppliedOwner = {
    ...preview,
    personId: a.personId,
    actorId: a.subject,
  };
  await expect(
    verificationService.confirm(b.token, suppliedOwner),
  ).rejects.toMatchObject({ code: 'revision_unavailable' });
  await expect(
    verificationService.confirm('synthetic.fixture.rejected', preview),
  ).rejects.toMatchObject({ code: 'authentication_required' });
  await expect(
    verificationService.confirm(anonymous, preview),
  ).rejects.toMatchObject({ code: 'authentication_required' });
  await expect(
    verificationService.confirm(unbound, preview),
  ).rejects.toMatchObject({ code: 'owner_binding_unavailable' });

  // The DB role cannot change even its own link or read payload.
  const db = await verifier.connect();
  try {
    await db.query('BEGIN');
    await db.query('SET LOCAL ROLE myphisys_sleep_verifier');
    await db.query(
      "SELECT set_config('app.verification_issuer',$1,true), set_config('app.verification_subject',$2,true)",
      [verificationIssuer, a.subject],
    );
    expect(
      (await db.query('SELECT person_id FROM identity.person_owner')).rows,
    ).toEqual([{ person_id: a.personId }]);
    expect(
      (
        await db.query(
          "SELECT has_column_privilege(current_user, 'source.raw_record', 'payload', 'SELECT') AS allowed",
        )
      ).rows[0]?.allowed,
    ).toBe(false);
    await expect(
      db.query(
        'UPDATE identity.person_owner SET disabled_at=clock_timestamp()',
      ),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await db.query('ROLLBACK');
    db.release();
  }
  const sameConfirmation = await Promise.all([
    verificationService.confirm(a.token, preview),
    verificationService.confirm(a.token, preview),
  ]);
  expect(sameConfirmation).toEqual([
    { verification: 'user_verified' },
    { verification: 'user_verified' },
  ]);
  const confirmed = await verificationService.getRevision(a.token, factId);
  await expect(
    verificationService.revoke(b.token, confirmed),
  ).rejects.toMatchObject({ code: 'revision_unavailable' });
  await expect(verificationService.revoke(a.token, confirmed)).resolves.toEqual(
    { verification: 'unverified' },
  );
  await expect(verificationService.revoke(a.token, confirmed)).resolves.toEqual(
    { verification: 'unverified' },
  );
  await expect(
    verificationService.confirm(a.token, preview),
  ).rejects.toMatchObject({ code: 'stale_revision' });
  const revoked = await verificationService.getRevision(a.token, factId);
  await admin.query(
    'UPDATE identity.person_owner SET disabled_at=clock_timestamp() WHERE person_id=$1',
    [a.personId],
  );
  for (const action of [
    verificationService.confirm,
    verificationService.revoke,
  ])
    await expect(action(a.token, revoked)).rejects.toMatchObject({
      code: 'owner_binding_unavailable',
    });
  expect(
    (
      await admin.query(
        `SELECT action, issuer, subject, supports, policy_version FROM health.sleep_verification_event
     WHERE person_id=$1 ORDER BY from_revision`,
        [a.personId],
      )
    ).rows,
  ).toEqual(
    ['confirm', 'revoke'].map((action) => ({
      action,
      issuer: verificationIssuer,
      subject: a.subject,
      supports: preview.supports,
      policy_version: 'manual-sleep-verification-v1',
    })),
  );
});

test('DB Manual verification rejects a delegated token before opening a DB connection', async () => {
  const owner = await verificationOwner();
  const delegated = syntheticToken({
    sub: owner.subject,
    client_id: randomUUID(),
  });
  const mismatched = syntheticToken({ sub: randomUUID() });
  syntheticSupabase(
    new Map([
      [owner.token, owner.subject],
      [delegated, owner.subject],
      [mismatched, owner.subject],
    ]),
  );
  const factId = await importManualNight(
    manualNight(owner.personId, '2026-01-01', 8),
  );
  const preview = await verificationService.getRevision(owner.token, factId);
  const connect = vi.spyOn(verifier, 'connect');

  await expect(
    verificationService.getRevision(delegated, factId),
  ).rejects.toMatchObject({ code: 'authentication_required' });
  for (const action of [
    verificationService.confirm,
    verificationService.revoke,
  ]) {
    for (const token of [delegated, mismatched])
      await expect(action(token, preview)).rejects.toMatchObject({
        code: 'authentication_required',
      });
  }
  expect(connect).not.toHaveBeenCalled();
});

test('DB Manual revoke closes an unverified revision before a pending confirm arrives', async () => {
  const owner = await verificationOwner();
  const delayedToken = syntheticToken({ sub: owner.subject }, 'delayed');
  const entered = Promise.withResolvers<void>();
  const resume = Promise.withResolvers<void>();
  syntheticSupabase(
    new Map([
      [owner.token, owner.subject],
      [delayedToken, owner.subject],
    ]),
    async (token) => {
      if (token === delayedToken) {
        entered.resolve();
        await resume.promise;
      }
    },
  );
  const factId = await importManualNight(
    manualNight(owner.personId, '2026-01-01', 8),
  );
  const preview = await verificationService.getRevision(owner.token, factId);
  expect(preview.verification).toBe('unverified');
  const pending = Promise.allSettled([
    verificationService.confirm(delayedToken, preview),
  ]);
  await entered.promise;
  try {
    await expect(
      verificationService.revoke(owner.token, preview),
    ).resolves.toEqual({ verification: 'unverified' });
  } finally {
    resume.resolve();
  }
  expect(await pending).toMatchObject([
    { status: 'rejected', reason: { code: 'stale_revision' } },
  ]);
  await expect(
    verificationService.revoke(owner.token, preview),
  ).resolves.toEqual({ verification: 'unverified' });
  const current = await verificationService.getRevision(owner.token, factId);
  expect(current.verification).toBe('unverified');
  expect(current.revision).not.toBe(preview.revision);
  expect(
    (
      await admin.query(
        `SELECT action, revision_fingerprint FROM health.sleep_verification_event
     WHERE person_id=$1 AND fact_id=$2`,
        [owner.personId, factId],
      )
    ).rows,
  ).toEqual([{ action: 'revoke', revision_fingerprint: preview.revision }]);
});

test('DB Manual verification rolls back audit and status when the status update fails', async () => {
  const owner = await verificationOwner();
  syntheticSupabase(new Map([[owner.token, owner.subject]]));
  const factId = await importManualNight(
    manualNight(owner.personId, '2026-01-01', 8),
  );
  const preview = await verificationService.getRevision(owner.token, factId);
  await admin.query(
    `ALTER TABLE health.fact ADD CONSTRAINT test_verification_update_failure
     CHECK (id <> '${factId}'::uuid OR verification_revision = 0) NOT VALID`,
  );
  try {
    await expect(
      verificationService.confirm(owner.token, preview),
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'test_verification_update_failure',
    });
    expect(
      (
        await admin.query(
          'SELECT 1 FROM health.sleep_verification_event WHERE person_id=$1 AND fact_id=$2',
          [owner.personId, factId],
        )
      ).rowCount,
    ).toBe(0);
    expect(await verificationService.getRevision(owner.token, factId)).toEqual(
      preview,
    );
  } finally {
    await admin.query(
      'ALTER TABLE health.fact DROP CONSTRAINT test_verification_update_failure',
    );
  }
  await expect(
    verificationService.confirm(owner.token, preview),
  ).resolves.toEqual({ verification: 'user_verified' });
});

test('DB Manual verification invalidates a stale preview when Raw support changes or returns', async () => {
  const owner = await verificationOwner();
  syntheticSupabase(new Map([[owner.token, owner.subject]]));
  const record = manualNight(owner.personId, '2026-01-01', 8);
  const factId = await importManualNight(record);
  const preview = await verificationService.getRevision(owner.token, factId);
  const extra = { ...record, externalRecordId: 'other-manual-record' };
  const [added, confirmation] = await Promise.allSettled([
    ingest(writer, extra),
    verificationService.confirm(owner.token, preview),
  ]);
  expect(added).toMatchObject({
    status: 'fulfilled',
    value: { state: 'duplicate' },
  });
  if (confirmation.status === 'rejected')
    expect(confirmation.reason).toMatchObject({ code: 'stale_revision' });
  const withExtra = await verificationService.getRevision(owner.token, factId);
  expect(withExtra.verification).toBe('unverified');
  expect(withExtra.supports).toHaveLength(2);
  await verificationService.confirm(owner.token, withExtra);
  await ingest(writer, {
    ...extra,
    version: 2,
    operation: 'delete',
    payload: {},
  });
  const remaining = await verificationService.getRevision(owner.token, factId);
  expect(remaining).toMatchObject({
    supports: preview.supports,
    verification: 'unverified',
  });
  await expect(
    verificationService.confirm(owner.token, preview),
  ).rejects.toMatchObject({ code: 'stale_revision' });
  await expect(
    verificationService.confirm(owner.token, withExtra),
  ).rejects.toMatchObject({ code: 'stale_revision' });
  await expect(
    verificationService.confirm(owner.token, remaining),
  ).resolves.toEqual({ verification: 'user_verified' });

  const external = await importManualNight({
    ...manualNight(owner.personId, '2026-01-02', 8),
    connectorId: 'synthetic-external',
  });
  await expect(
    verificationService.getRevision(owner.token, external),
  ).rejects.toMatchObject({ code: 'revision_unavailable' });
});

test('DB Manual verification moves a complete sleep series to sufficient and corrections preserve held', async () => {
  const owner = await verificationOwner();
  syntheticSupabase(new Map([[owner.token, owner.subject]]));
  const request = {
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
  };
  const factIds = [];
  for (let day = 1; day <= 35; day++) {
    const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
    factIds.push(
      await importManualNight(
        manualNight(owner.personId, date, day >= 29 && day <= 32 ? 7 : 8),
      ),
    );
  }
  expect(
    await sleepMeaningfulness(reader, owner.personId, request),
  ).toMatchObject({
    status: 'held',
    diff: {
      status: 'numeric_changed',
      deltaHours: -1,
      qualityStatus: 'limited',
    },
    persistence: {
      status: 'unavailable',
      reasonCode: 'persistence_quality_blocked',
    },
  });
  for (const factId of factIds) {
    const revision = await verificationService.getRevision(owner.token, factId);
    await verificationService.confirm(owner.token, revision);
  }
  const connect = vi.spyOn(reader, 'connect');
  const verified = await sleepMeaningfulness(reader, owner.personId, request);
  expect(connect).toHaveBeenCalledTimes(1);
  connect.mockRestore();
  expect(verified).toMatchObject({
    status: 'held',
    knowledgeAsOf: 'unavailable',
    diff: {
      status: 'numeric_changed',
      deltaHours: -1,
      qualityStatus: 'sufficient',
      calculatedAt: verified.calculatedAt,
    },
    baselineEvidence: {
      result: { status: 'sufficient', calculatedAt: verified.calculatedAt },
    },
    persistence: {
      status: 'pattern_observed',
      calculatedAt: verified.calculatedAt,
    },
  });
  const verifiedQuality = verified.baselineEvidence.result.quality.combined;
  expect(verifiedQuality.provenance.factIds).toEqual([...factIds].sort());
  expect(
    verifiedQuality.provenance.factSupports.every(
      ({ supports }) =>
        supports.length === 1 &&
        supports[0]?.connectorId === 'manual' &&
        !!supports[0].sourceId,
    ),
  ).toBe(true);

  const old = await verificationService.getRevision(owner.token, factIds[29]!);
  const corrected = await importManualNight(
    manualNight(owner.personId, '2026-01-30', 8, 2),
  );
  await expect(
    verificationService.confirm(owner.token, old),
  ).rejects.toMatchObject({ code: 'revision_unavailable' });
  const newRevision = await verificationService.getRevision(
    owner.token,
    corrected,
  );
  expect(newRevision.verification).toBe('unverified');
  await expect(
    verificationService.confirm(owner.token, {
      factId: corrected,
      revision: old.revision,
    }),
  ).rejects.toMatchObject({ code: 'stale_revision' });
  await verificationService.confirm(owner.token, newRevision);
  expect(
    await sleepMeaningfulness(reader, owner.personId, request),
  ).toMatchObject({
    status: 'held',
    diff: { status: 'unchanged', deltaHours: 0, qualityStatus: 'sufficient' },
    persistence: { status: 'pattern_not_observed' },
  });
  const current = await verificationService.getRevision(owner.token, corrected);
  await verificationService.revoke(owner.token, current);
  expect(
    await sleepMeaningfulness(reader, owner.personId, request),
  ).toMatchObject({
    status: 'held',
    diff: { status: 'unchanged', deltaHours: 0, qualityStatus: 'limited' },
    persistence: {
      status: 'unavailable',
      reasonCode: 'persistence_quality_blocked',
    },
  });
}, 60_000);

test('DB adjacent weeks compare person-scoped medians and preserve Raw lineage', async () => {
  const period: QualityWindow = {
    startDate: '2026-01-08',
    endDateExclusive: '2026-01-15',
    asOfDate: '2026-01-15',
    calculatedAt: '2026-01-15T00:00:00Z',
  };
  const a = await sleepPeriodComparison(reader, personA, period);
  const b = await sleepPeriodComparison(reader, personB, period);
  const partialA = await sleepMetricStatePair(reader, personA, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  const partialB = await sleepMetricStatePair(reader, personB, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(partialA.diff.status).toBe('numeric_changed');
  expect(partialA.diff.qualityStatus).toBe('limited');
  expect(partialB.diff.status).toBe('unknown');
  expect(partialA.previous.identity.personId).toBe(personA);
  expect(partialB.previous.identity.personId).toBe(personB);
  expect(partialA.diff.quality?.combined.provenance.factIds).not.toEqual(
    partialB.diff.quality?.combined.provenance.factIds,
  );
  expect(partialA.previous.calculatedAt).toBe(partialA.current.calculatedAt);
  expect(partialA.current.calculatedAt).toBe(partialA.diff.calculatedAt);
  expect(partialA.diff.calculatedAt).toBe(
    partialA.diff.quality?.combined.calculatedAt,
  );
  expect(partialA.knowledgeAsOf).toBe('unavailable');
  expect(a.status).toBe('limited');
  expect(a.comparison).not.toBeNull();
  expect(a.quality.previous.coverage.observedDays).toBe(7);
  expect(a.quality.current.coverage.observedDays).toBe(7);
  expect(a.quality.combined.provenance.factSupports).toHaveLength(14);
  expect(a.quality.combined.duplicateReceiptCount).toBe('unavailable');
  expect(b.status).toBe('insufficient');
  expect(b.comparison).toBeNull();
  expect(b.quality.combined.provenance.factIds).toHaveLength(1);
  expect(
    b.quality.combined.provenance.factIds.some((id) =>
      a.quality.combined.provenance.factIds.includes(id),
    ),
  ).toBe(false);
  expect(await sleepPeriodComparison(reader, personA, period)).toEqual(a);
  const record = goldenRecords(personA).find(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value === '2026-01-08',
  )!;
  expect((await ingest(writer, record)).state).toBe('duplicate');
  expect(await sleepPeriodComparison(reader, personA, period)).toEqual(a);
});

test('DB missing week and connector boundary do not fabricate comparison', async () => {
  const missing = await sleepPeriodComparison(reader, personA, {
    startDate: '2026-02-22',
    endDateExclusive: '2026-03-01',
    asOfDate: '2026-03-01',
    calculatedAt: '2026-03-01T00:00:00Z',
  });
  expect(missing.status).toBe('insufficient');
  expect(missing.comparison).toBeNull();
  expect(missing.quality.previous.missingDates).toHaveLength(7);
  const switched = await sleepPeriodComparison(reader, personA, {
    startDate: '2026-03-02',
    endDateExclusive: '2026-03-09',
    asOfDate: '2026-03-09',
    calculatedAt: '2026-03-09T00:00:00Z',
  });
  expect(switched.quality.previous.coverage.observedDays).toBe(7);
  expect(switched.quality.current.coverage.observedDays).toBe(7);
  expect(switched.reasons).toContain('source_continuity_unproven');
  expect(switched.comparison).toBeNull();
  await expect(
    sleepPeriodComparison(reader, personA, {
      startDate: '2026-02-30',
      endDateExclusive: '2026-03-09',
      asOfDate: '2026-03-09',
      calculatedAt: '2026-03-09T00:00:00Z',
    }),
  ).rejects.toThrow();
});

test('DB correction, support swap and tombstones recompute period provenance and availability', async () => {
  const period: QualityWindow = {
    startDate: '2026-01-08',
    endDateExclusive: '2026-01-15',
    asOfDate: '2026-01-15',
    calculatedAt: '2026-01-15T00:00:00Z',
  };
  const original = goldenRecords(personD).find(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value === '2026-01-01',
  )!;
  const base = {
    ...original,
    eventKey: 'step11:2026-01-01',
    payload: {
      ...original.payload,
      value: { kind: 'quantity' as const, originalValue: 8, originalUnit: 'h' },
    },
  };
  const before = await sleepPeriodComparison(reader, personD, period);
  const initialState = await sleepMetricStatePair(reader, personD, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(before.comparison?.absoluteDeltaHours).toBe(0);
  expect(initialState.diff.status).toBe('unchanged');
  const support = { ...base, externalRecordId: 'step11-second-support' };
  expect((await ingest(writer, support)).state).toBe('duplicate');
  const withSupport = await sleepPeriodComparison(reader, personD, period);
  expect(withSupport.comparison).toEqual(before.comparison);
  expect(withSupport.quality.combined.provenance.rawRecordIds).toHaveLength(15);
  expect(
    (
      await ingest(writer, {
        ...base,
        version: 2,
        operation: 'delete',
        payload: {},
      })
    ).state,
  ).toBe('imported');
  const afterSwap = await sleepPeriodComparison(reader, personD, period);
  const swappedState = await sleepMetricStatePair(reader, personD, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(afterSwap.comparison).toEqual(before.comparison);
  expect(swappedState.diff.status).toBe('unchanged');
  expect(swappedState.previous.identity.factSupports).not.toEqual(
    initialState.previous.identity.factSupports,
  );
  expect(afterSwap.quality.combined.provenance.rawRecordIds).toHaveLength(14);
  expect(afterSwap.quality.combined.provenance.rawRecordIds).not.toEqual(
    before.quality.combined.provenance.rawRecordIds,
  );
  const firstCurrent = goldenRecords(personD).find(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value === '2026-01-08',
  )!;
  expect(
    (
      await ingest(writer, {
        ...firstCurrent,
        eventKey: 'step11:2026-01-08',
        version: 2,
        payload: {
          ...firstCurrent.payload,
          value: { kind: 'quantity', originalValue: 9, originalUnit: 'h' },
        },
      })
    ).state,
  ).toBe('imported');
  const singleCorrection = await sleepMetricStatePair(reader, personD, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(singleCorrection.diff.status).toBe('unchanged');
  expect(singleCorrection.current.identity.inputFactIds).not.toEqual(
    swappedState.current.identity.inputFactIds,
  );
  for (const current of goldenRecords(personD).filter((item) => {
    const date = (item.payload.effective as { value: string }).value;
    return (
      item.payload.conceptId === 'sleep_duration' &&
      date >= '2026-01-09' &&
      date <= '2026-01-11'
    );
  })) {
    const date = (current.payload.effective as { value: string }).value;
    expect(
      (
        await ingest(writer, {
          ...current,
          eventKey: `step11:${date}`,
          version: 2,
          payload: {
            ...current.payload,
            value: { kind: 'quantity', originalValue: 9, originalUnit: 'h' },
          },
        })
      ).state,
    ).toBe('imported');
  }
  const corrected = await sleepPeriodComparison(reader, personD, period);
  const correctedState = await sleepMetricStatePair(reader, personD, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(correctedState.diff).toMatchObject({
    status: 'numeric_changed',
    deltaHours: 1,
  });
  expect(corrected.comparison).toMatchObject({
    previousMedianHours: 8,
    currentMedianHours: 9,
    absoluteDeltaHours: 1,
    direction: 'increasing',
  });
  expect(corrected.quality.combined.provenance.rawRecordIds).not.toEqual(
    afterSwap.quality.combined.provenance.rawRecordIds,
  );
  expect(
    (
      await ingest(writer, {
        ...support,
        version: 2,
        operation: 'delete',
        payload: {},
      })
    ).state,
  ).toBe('imported');
  const removed = await sleepPeriodComparison(reader, personD, period);
  const removedState = await sleepMetricStatePair(reader, personD, {
    startDate: period.startDate,
    endDateExclusive: period.endDateExclusive,
    asOfDate: period.asOfDate,
  });
  expect(removed.status).toBe('insufficient');
  expect(removedState.diff.status).toBe('unknown');
  expect(removedState.diff.deltaHours).toBeNull();
  expect(removed.comparison).toBeNull();
  expect(removed.quality.previous.missingDates).toContain('2026-01-01');
});

test('person-scoped reader traces current facts to active Raw sources', async () => {
  const facts = await readCurrentSleepFacts(
    reader,
    personA,
    window.startDate,
    window.endDateExclusive,
  );
  expect(facts).toHaveLength(83);
  expect(facts.every((fact) => fact.supports.length === 1)).toBe(true);
  expect(new Set(facts.map((fact) => fact.supports[0]?.connectorId))).toEqual(
    new Set(['synthetic-device-a', 'synthetic-device-b']),
  );
  const quality = await sleepQuality(reader, personA, window);
  expect(quality.coverage.observedDays).toBe(83);
  expect(quality.missingDates).toHaveLength(7);
  expect(quality.sourceContinuity.status).toBe('transition');
  expect(quality.provenance.rawRecordIds).toHaveLength(83);
  expect(quality.provenance.supports).toHaveLength(83);
  expect(quality.provenance.factSupports).toHaveLength(83);
  expect(
    quality.provenance.factSupports.find(
      ({ factId }) => factId === facts[0]?.id,
    )?.supports,
  ).toEqual(facts[0]?.supports);
  expect(quality.provenance.supports[0]).toMatchObject({
    version: 1,
    transformation: 'm1-map-v1',
  });
  expect(quality.duplicateReceiptCount).toBe('unavailable');
  expect(await sleepQuality(reader, personA, window)).toEqual(quality);
});

test('exact retry cannot inflate canonical samples or provenance', async () => {
  const record = goldenRecords(personA).find(
    (item) => item.payload.conceptId === 'sleep_duration',
  )!;
  const before = await sleepQuality(reader, personA, window);
  expect((await ingest(writer, record)).state).toBe('duplicate');
  expect(await sleepQuality(reader, personA, window)).toEqual(before);
});

test('analytics role isolates persons and has no Raw or Canonical write privilege', async () => {
  const a = await sleepQuality(reader, personA, window);
  const b = await sleepQuality(reader, personB, window);
  expect(a.sampleCount).toBe(83);
  expect(b.sampleCount).toBe(1);
  expect(
    b.provenance.factIds.some((id) => a.provenance.factIds.includes(id)),
  ).toBe(false);

  const db = await reader.connect();
  try {
    await db.query('BEGIN');
    await db.query('SET LOCAL ROLE myphisys_analytics');
    await db.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    expect(
      (
        await db.query('SELECT id FROM health.fact WHERE person_id=$1', [
          personB,
        ])
      ).rowCount,
    ).toBe(0);
    await expect(
      db.query(
        "UPDATE health.fact SET state='invalidated' WHERE person_id=$1",
        [personA],
      ),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await db.query('ROLLBACK');
    db.release();
  }
  const raw = await reader.connect();
  try {
    await raw.query('BEGIN');
    await raw.query('SET LOCAL ROLE myphisys_analytics');
    await raw.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    await expect(
      raw.query('SELECT payload FROM source.raw_record WHERE person_id=$1', [
        personA,
      ]),
    ).rejects.toMatchObject({ code: '42501' });
    await raw.query('ROLLBACK');
    await raw.query('BEGIN');
    await raw.query('SET LOCAL ROLE myphisys_analytics');
    await raw.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    await expect(
      raw.query('DELETE FROM source.raw_record WHERE person_id=$1', [personA]),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await raw.query('ROLLBACK');
    raw.release();
  }
});

test('DB baseline resists a current shift and reference outlier', async () => {
  const result = await sleepBaselineTrend(reader, personC, {
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
    calculatedAt: '2026-02-05T00:00:00Z',
  });
  expect(result.status).toBe('limited');
  expect(result.baseline).toMatchObject({
    sampleDays: 28,
    medianHours: 8,
    madHours: 0.5,
    iqrHours: 1,
  });
  expect(result.trend).toMatchObject({
    currentMedianHours: 5,
    absoluteDeltaHours: -3,
    direction: 'decreasing',
  });
  expect(await sleepBaselineTrend(reader, personC, result.window)).toEqual(
    result,
  );
});

test('DB sleep Meaningfulness holds a descriptive change with scoped lineage', async () => {
  const request = {
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
  };
  const decision = await sleepMeaningfulness(reader, personC, request);
  const sparse = await sleepMeaningfulness(reader, personB, request);
  expect(decision).toMatchObject({
    status: 'held',
    reasonCodes: ['diff_limited_quality', 'baseline_limited_quality'],
    diff: {
      status: 'numeric_changed',
      deltaHours: -3.5,
      qualityStatus: 'limited',
      current: { personId: personC },
    },
    baselineEvidence: { result: { baseline: { sampleDays: 28 } } },
    persistence: {
      personId: personC,
      status: 'unavailable',
      reasonCode: 'persistence_quality_blocked',
    },
    knowledgeAsOf: 'unavailable',
  });
  expect(sparse).toMatchObject({
    reasonCodes: ['diff_insufficient_quality'],
    diff: { deltaHours: null, current: { personId: personB } },
    baselineEvidence: { result: { baseline: null } },
    persistence: {
      personId: personB,
      status: 'unavailable',
      reasonCode: 'persistence_current_coverage_insufficient',
    },
  });
  const quality = decision.baselineEvidence.result.quality;
  expect(quality.combined.calculatedAt).toBe(decision.diff.calculatedAt);
  expect(decision.persistence.calculatedAt).toBe(decision.diff.calculatedAt);
  expect(decision.persistence.inputFingerprint).toBe(
    decision.baselineEvidence.inputFingerprint,
  );
  const personRows = await readCurrentSleepFacts(
    reader,
    personC,
    '2026-01-01',
    request.endDateExclusive,
  );
  expect(quality.combined.provenance.factIds).toEqual(
    personRows.map(({ id }) => id).sort(),
  );
  expect(quality.combined.provenance.factSupports).toEqual(
    personRows
      .map(({ id, supports }) => ({ factId: id, supports }))
      .sort((a, b) => a.factId.localeCompare(b.factId)),
  );
  expect(quality.combined.provenance.rawRecordIds).toHaveLength(35);
  expect(
    sparse.baselineEvidence.result.quality.combined.provenance.factIds.some(
      (id) => quality.combined.provenance.factIds.includes(id),
    ),
  ).toBe(false);
});

test('DB sparse series and M1 source switch suppress baseline/trend', async () => {
  const sparseWindow: QualityWindow = {
    startDate: '2026-02-15',
    endDateExclusive: '2026-02-22',
    asOfDate: '2026-02-22',
    calculatedAt: '2026-02-22T00:00:00Z',
  };
  const missing = await sleepBaselineTrend(reader, personA, sparseWindow);
  expect(missing.status).toBe('insufficient');
  expect(missing.reasons).toContain('insufficient_current');
  expect(missing.baseline).toBeNull();
  expect(missing.trend).toBeNull();

  const sparse = await sleepBaselineTrend(reader, personB, {
    ...sparseWindow,
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
  });
  expect(sparse.reasons).toContain('insufficient_reference');
  expect(sparse.trend).toBeNull();

  const switched = await sleepBaselineTrend(reader, personA, {
    ...sparseWindow,
    startDate: '2026-03-09',
    endDateExclusive: '2026-03-16',
    asOfDate: '2026-03-16',
  });
  expect(switched.reasons).toContain('source_continuity_unproven');
  expect(switched.trend).toBeNull();
});

test('M1 accepts finite outlier but Quality excludes it from person-scoped samples', async () => {
  const record = goldenRecords(personB).find(
    (item) => item.payload.conceptId === 'sleep_duration',
  )!;
  expect(
    (
      await ingest(writer, {
        ...record,
        externalRecordId: 'person-b-impossible-sleep',
        payload: {
          ...record.payload,
          effective: { kind: 'local_date', value: '2026-01-02' },
          value: { kind: 'quantity', originalValue: 1000, originalUnit: 'h' },
        },
      })
    ).state,
  ).toBe('imported');
  const quality = await sleepQuality(reader, personB, window);
  expect(quality.sampleCount).toBe(1);
  expect(quality.coverage.observedDays).toBe(1);
  expect(quality.excludedFactIds).toHaveLength(1);
  expect(quality.reasons).toContain('invalid_point');
});
