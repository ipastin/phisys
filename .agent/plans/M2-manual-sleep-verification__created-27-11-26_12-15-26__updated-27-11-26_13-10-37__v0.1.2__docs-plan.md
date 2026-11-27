---
title: "M2 — Manual sleep verification and revoke"
created: "27-11-26 12-15-26"
updated: "27-11-26 13-10-37"
timezone: Europe/Moscow
version: 0.1.2
commit: "docs(plan): record verification review corrections"
status: in_progress
---

# M2 — Manual sleep verification and revoke

## Goal and authorization

Let an authenticated owner explicitly confirm or revoke a specific current Manual
`sleep_duration` revision. A complete verified series can reach `sufficient`
Quality through the existing analytics reader. Meaningfulness remains `held`.

On 27-11-26 the owner approved variant A, then approved server-side Supabase Auth
verification and one active server-owned `(issuer, subject) → personId` binding,
with implementation, synthetic DB acceptance and a separate draft PR. The
approval covers this slice. Step 14, merge, deploy and live provisioning have
separate authorization. 0.5 h remains a hypothesis for separate calibration.

## Context and sources

- Repository `ipastin/phisys`. Verified main and branch base
  `3679cc0e206c5b6e8ec6e56f0c696e25a6121663` with partial A13 from
  [PR #17](https://github.com/ipastin/phisys/pull/17).
  Implementation branch `codex/m2-sleep-manual-verification`.
- [Source index](../../docs/SOURCE_OF_TRUTH.md). Project Spec v0.4.0
  `03 DATA MODEL` §§4, 11, 13, `04 ANALYTICS` §§16–18, `09 CONNECTORS` §14,
  `11 IMPLEMENTATION` §§2, 6, Steps 12–15 and `12 EVALS` A13/A17/A20.
  ADR-018, ADR-077, ADR-100, ADR-130–132 apply.
- Supabase Auth is in the target stack. Baseline main has no live auth adapter,
  account-to-person mapping or application server. `withPerson` enforces the
  supplied scope at the DB boundary. The verification service resolves ownership
  before entering that scope. The public server-side factory uses a configured
  Supabase Auth project and publishable key to validate an access token.

## Scope and invariants

- Server verifies the access token with the configured project, resolves one
  active account link and derives the person scope. Mapping provisioning is a
  privileged operation. The verification role can resolve its authenticated
  subject and cannot create, update or remove bindings.
  The server checks the subject and delegation claim on the same token that
  Supabase accepted, before opening a database connection. A token containing
  `client_id` cannot perform any self-only operation.
- A preview identifies the current Canonical revision, displayed value and
  local date, and ordered active Raw supports. Confirm/revoke is a separate
  explicit operation scoped to that revision. Owner link, current fact and
  audit/status mutation are checked in one transaction.
- Store the append-only decision, actor, version, revision and Raw support
  references. An accepted correction or support mutation invalidates the old
  preview. Revoke preserves the fact and provenance and returns it to
  `unverified`. A successful revoke consumes the submitted revision even if the
  current status is already unverified. Only the current Manual sleep slice can
  acquire `user_verified`.
- Preserve person RLS, minimal analytics grants, Canonical → Raw → Source,
  read-only analytics and one 35-date Meaningfulness read. Preserve the
  14-date Step 12.1 entrypoint, T1, D1 and `knowledgeAsOf: unavailable`.
  No positive promotion, user-facing claims, UI or external routes in this slice.

## Files and milestones

1. Add database migration 0003 for owner bindings, restricted verification
   grants, fact revision and append-only decision evidence. Wire the existing
   migration entrypoint and disposable DB migration check.
2. Expose the server-side verification service from the database backend
   package. Use the existing active provenance semantics for the new revision
   read. Keep token and authentication metadata out of health facts and logs.
3. Update the existing ingestion branches that change the Raw support of a
   current Manual sleep fact. Serialize with confirmation through the fact row.
4. Exercise the supported imports, verification and analytics from synthetic
   DB tests. Verify lint, format, typecheck, unit, architecture and build.
   Push the branch, open a draft PR, then verify Actions on the exact PR head.

## Validation and acceptance

Run from the repository root. Commands are `pnpm lint`, `pnpm format:check`,
`pnpm typecheck`, `pnpm test`, `pnpm build` and
`M1_DISPOSABLE_DB=1 DATABASE_URL=<disposable PostgreSQL 16> pnpm test:db`.
Also check `git diff --check` and the PR Actions workflow.

- Synthetic authenticator exercises the configured server validation request.
  Denied tokens and missing, disabled or foreign bindings have no write effects.
  Verify isolation from Raw payload and read-only analytics grants.
- Standard Manual writes supply 28 reference and 7 current dates. Before
  confirmation they are unverified. After owner confirmation, expect
  `sufficient`, signed descriptive D1, A13 evidence, sorted support and `held`.
  Verify one analytics read and one shared T1 instant.
- Confirm/revoke replays are idempotent. A new Raw version with the same value,
  a changed value, a removed support, and a stale preview never carry forward
  an old confirmation. An old command cannot restore a revoked fact.
- A mock Supabase response returns the same owner profile for a direct token
  and a delegated token. Only the direct token can enter the DB path.
- A pending confirm reaches the DB after revoke has consumed its preview.
  The fact remains unverified and an exact revoke retry adds no second event.
- A PostgreSQL constraint forces the status write to fail after the audit
  insert. The audit row, fact status and revision roll back together.

## Progress and decisions

- [x] 27-11-26 12-15-26 — verified main, created the separate branch and
  recorded the approved trust boundary.
- [x] 27-11-26 12-32-45 — implementation
  `660db2e604456218c16197e8c4d2a699883c2c50`. Migration, server entrypoint
  and revision-aware ingestion covered by local acceptance.
- [x] 27-11-26 12-32-45 — from repository root, implementation tree
  `660db2e604456218c16197e8c4d2a699883c2c50`: lint, format, typecheck,
  build, unit and architecture tests, and `git diff --check`: `pass`.
  `pnpm test:db` with `M1_DISPOSABLE_DB=1` and disposable PostgreSQL 16:
  `pass`, 31 tests. Verification-specific evidence is in
  [the analytics DB suite](../../packages/analytics/test/integration.test.ts)
  and [the migration DB suite](../../packages/database/test/integration.test.ts).
- [x] Draft [PR #18](https://github.com/ipastin/phisys/pull/18).
  [CI #86](https://github.com/ipastin/phisys/actions/runs/45975009751) passed
  on the pre-review head `162365c4c8cb76a37ab6cf4226a48809a02d86d2`.
- [x] 27-11-26 13-10-37 — the owner authorized both review fixes and rollback
  coverage. Implementation `98deae8e373994e5a44b5192c4f25914a2f902d5` passed
  lint, formatting, typecheck, unit and architecture tests, build, diff check
  and 34 DB tests on disposable PostgreSQL 16 from the repository root.
- [ ] Record the corrected draft head and exact-head CI in the PR description.

Use a narrow server role and the configured Auth project over a request-supplied
identity or a test-only authority. The role shares the fact row lock with
ingestion. An incrementing revision prevents a preview from becoming valid
again when support changes and later returns to the same set.
The review correction uses the existing Auth request to verify the submitted
token, then reads its claims for the self-only check.
[Supabase OAuth token documentation](https://supabase.com/docs/guides/auth/oauth-server/token-security)
defines `client_id` as the OAuth client marker. A successful revoke consumes the
revision instead of reporting success with an outstanding confirm still valid.

The backend creates `createSleepVerificationService(pool, { projectUrl, publishableKey })`
with a pool authorized to assume `myphisys_sleep_verifier`. It calls
`getRevision(accessToken, factId)` to obtain the preview, then explicitly calls
`confirm` or `revoke` with the token and `{ factId, revision }`.
An active link in `identity.person_owner` is provisioned by an authorized
operator. The issuer key is the configured HTTPS project origin plus `/auth/v1`.
The adapter uses the Supabase Auth user endpoint used by
[`getUser(token)`](https://supabase.com/docs/reference/javascript/auth-getuser).

## Recovery, open questions and outcomes

An interrupted or failed decision transaction rolls back evidence and effective
verification together. Request retries can return the already-committed state for
the same command. A stale revision requires a new preview. Migration rollback
is for disposable DB verification and removes its own verification projections.
Live Supabase provisioning and live-account validation are `not_run`.
The Auth HTTP boundary was exercised with synthetic user responses, including
anonymous, delegated and rejected tokens. The role tests used PostgreSQL, with
no SQL fixture assigning `user_verified`. Acceptance review of the corrected
head remains `needs_review`.
