---
title: MyPhisys — M1 implementation evidence
created: "15-10-26 18-31-17"
updated: "15-10-26 19-34-10"
timezone: Europe/Moscow
version: 0.2.2
commit: "docs(plan): record review fixes and CI evidence"
status: in_progress
---

# M1 implementation evidence

## Goal and authority

Implement the approved [M1 ExecPlan v0.2.0](M1-health-data-pipeline__created-15-10-26_18-06-16__updated-15-10-26_18-20-16__v0.2.0__docs-plan.md), Steps 03–07, on a branch from fresh `main`. The owner's 15-10-26 implementation request authorizes code and a PR; merge and deploy remain separate actions. Decisions D1–D3 stay as approved.

## M1.0 baseline

- Repository `ipastin/phisys`, `main` and GitHub `main` at `12bd8dfc274c6bb8dccfddf9c83d335195b11352` (GitHub compare `identical`, 15-10-26 18-30 Europe/Moscow).
- Working branch `codex/m1-health-data-pipeline` created from local `main`; plan branch differs from `main` by only the approved plan file.
- Production packages at baseline: `architecture-guardrails` only. Architecture fixture package names are synthetic graph inputs, not production callers.
- Existing callers/config: root pnpm/Turbo scripts, CI, architecture checker, TypeScript and ESLint config. New packages must enter those gates. No production API/UX caller exists yet.
- Local Node `24.17.0`, pnpm `12.13.0`; CI pins Node `24.22.0`. Local Docker socket is initially unavailable from sandbox. Runtime and DB checks remain `not_run` until actually executed.

## Schema assertions before Step 03

The minimum M1 slice uses `identity`, `source`, `health`, and `jobs` PostgreSQL schemas. Future analytics, document, medication, agent, and UI tables are excluded under D1.

1. `identity.person` owns a UUIDv7 primary key. Each `source.source`, `source.record`, `source.raw_record`, and clinical row has a person binding. Cross-person foreign keys include `person_id`, so an ID from another person cannot be attached accidentally.
2. `source.record` identifies one logical source record by `(person_id, connector_id, external_record_id)`. `source.raw_record` stores immutable versioned payloads with operation `upsert` or `delete`, version, content hash, source time and ingestion time. A repeat of the same version and hash is idempotent; same version with different hash goes to review/quarantine. A delete is a new tombstone version, never a destructive deletion of Raw.
3. Raw and canonical tables enable and force RLS. A person-scoped session uses `app.person_id`; absent/mismatched scope denies access. Connector DB role can insert/read only Source/Raw objects needed for delivery; it has no write privilege on `health`. The ingestion/domain role owns validated canonical writes. Tests use non-owner roles, because owner/superuser checks do not prove RLS.
4. `health.concept` uses internal canonical IDs. `health.fact` supports `observation` and `symptom`, original numeric value/unit, optional canonical value/unit with conversion metadata, status value where measurement is unknown, effective temporal value and precision, separate recorded/ingested times, epistemic state and verification status. A fact cannot be inserted without a provenance link to immutable Raw in the same transaction.
5. Corrections append new fact versions with a predecessor link. Duplicate representations may support one fact. Conflicts are explicit unresolved rows and do not silently choose a source. Deletion of one supporting source preserves a fact with other live support; deletion of its last support invalidates its current fact version.
6. `health.event` indexes each clinical fact version for Timeline without copying its full value. `jobs.outbox` records every affected DB mutation in the same transaction, with unique event identity for retry safety. A failed transaction leaves no partial fact or outbox row.
7. Migrations have forward and rollback paths; reapplying a forward migration after rollback on a disposable database is supported. No production credentials or records are used.

## Contract assertions before Steps 04–07

- `health-core` is pure and FHIR/vendor independent. It validates quantity, concept, temporal precision, status, provenance, epistemic and verification as separate fields. It never invents a day/time, zero, `false`, normal or negative value from missing input.
- Ingestion accepts a typed SourceRecord and returns `imported`, `duplicate`, `needs_review`, or `quarantined` with typed reasons. Only deterministic allowlisted concepts, units, time precision and unambiguous source/person identity auto-promote under D2. Unknown or ambiguous meaning cannot become a verified canonical fact.
- Identity is exact `(connector_id, external_record_id)` within person. Cross-source dedupe requires an explicit event identity; a coincidentally equal value/time is insufficient. Different claims for the same explicit event identity create unresolved conflict.
- Manual connector supports weight, blood pressure, generic allowlisted observation and symptom. It submits SourceRecords through the same Raw and ingestion boundary under D3. No runtime endpoint or UI is introduced.
- Synthetic v1 covers 90 days of sleep/HR, steps and weight; sparse labs, symptoms, a missing week, source change, outlier and conflict. Fixed IDs/timestamps and expected outcomes make replay deterministic. This is the M1 subset of the golden profile; it is not a full EVALS §3 pass.

## Progress and dependency order

`M1.0 assertions → Step 03 DB/migrations → Step 04 core → Step 05 fixture → Step 06 ingestion → Step 07 manual adapter/CI`. At each step, record command, cwd, commit SHA, Moscow timestamp, result (`pass`, `fail`, `not_run`, `needs_review`) and evidence pointer. Do not count the existence of a test as a behavioral pass.

- [x] M1.0: fresh `main` verified with GitHub compare; new `codex/m1-health-data-pipeline` branch, approved plan copied without changing its decisions; schema and contract assertions above fixed before code.
- [x] M1.1: PostgreSQL 16 migration up/down/reapply, person-scoped forced RLS, separate connector/domain roles, UUIDv7 application IDs, immutable Raw trigger and transactional outbox.
- [x] M1.2: pure canonical validation for concept, quantity, unit, time precision, provenance, epistemic and verification axes.
- [x] M1.3: deterministic versioned 90-day synthetic profile with missing week, source transition, outlier, sparse labs, symptom and conflict.
- [x] M1.4: Raw → validation → canonical transaction, exact identity/version retry, explicit cross-source event dedupe, conflict and quarantine, correction/tombstone support reassessment.
- [x] M1.5: manual weight/BP/observation/symptom adapter through the same SourceRecord route, including BP component tombstones; root scripts and CI DB service updated.
- [x] PR CI run `38767837343` passed on head `82e4fbe688f3fd35e085e8536269973ca35a697e`, before review fixes.
- [x] CodeRabbit and Codex review of that head received; rollback handling, concurrent event locking, fixed event key and int32 version range addressed with tests.
- [ ] CI and review on the new pushed head after review fixes. No merge or deploy authorization.

## Validation evidence

All commands below used repository root as cwd and a working tree based on `12bd8dfc274c6bb8dccfddf9c83d335195b11352`. CI evidence is tied to the exact SHA shown in each row; the newest PR head is checked separately. Tests use synthetic data only.

| Time, Europe/Moscow | Command / action | Result | Evidence |
| --- | --- | --- | --- |
| 15-10-26 18-30 | GitHub compare `12bd8df…main` and `git ls-remote --heads origin main` | `pass` | `identical`, remote `main` same SHA |
| 15-10-26 19-01 | `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, package unit tests, `pnpm build` | `pass` | ESLint/Prettier/TypeScript/Turbo/Vitest local output; Node `24.17.0` |
| 15-10-26 19-02 | `pnpm test:architecture` | `pass` | 19/19 boundary tests; increased per-case timeout after initial local timeout failures |
| 15-10-26 19-06 | `DATABASE_URL=... M1_DISPOSABLE_DB=1 pnpm test:db` on fresh localhost PostgreSQL 16 | `pass` | 3/3 DB, 7/7 ingestion, 2/2 manual integration tests; migration up/down/reapply in first suite |
| 15-10-26 19-10 | `DATABASE_URL=... M1_DISPOSABLE_DB=1 pnpm exec vitest run packages/ingestion/test/integration.test.ts` | `pass` | 8/8 ingestion tests, including quarantined correction support regression |
| 15-10-26 19-06 | `pnpm install --frozen-lockfile`; `pnpm audit --audit-level high` | `pass` | lockfile current; no known vulnerabilities |
| 15-10-26 19-18 | GitHub Actions run `38767837343` on `82e4fbe688f3fd35e085e8536269973ca35a697e` | `pass` | Pinned Node `24.22.0`, frozen install, lint, format, typecheck, unit/architecture/DB suites, build, audit and secret scan all passed |
| 15-10-26 19-28 | `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` after review fixes | `pass` | Includes rollback-failure unit test |
| 15-10-26 19-33 | `DATABASE_URL=... M1_DISPOSABLE_DB=1 pnpm test:db` on fresh PostgreSQL 16 | `pass` | 3/3 DB, 10/10 ingestion, 2/2 manual; includes event concurrency, key lifecycle and int32 regression |
| Pending new PR head | CI on pinned Node `24.22.0` and renewed review | `not_run` | The prior successful run does not certify the review-fix commit |

## Decision and risk log

- SQL migrations and `pg` transactions are used for PostgreSQL RLS, immutable trigger, role grants and atomic outbox. Drizzle ORM remains in the accepted target stack but is not added as an unused schema mirror in this M1 slice. Option A is the current direct SQL path with one physical schema authority; option B is a Drizzle mapping when a read/write consumer needs typed queries; option C would duplicate schema definitions now. B/C add maintenance before a consumer exists. This implementation choice is `needs_review` before expanding database APIs, without changing the accepted health semantics.
- The M1 domain entry point is a library, with no auth/API surface. It requires a caller to supply a person UUIDv7 and a domain-scoped DB connection; production identity binding, credentials and cloud provisioning remain outside M1 under D3. Do not expose this function directly to a client.
- `source.raw_record` stores the full received envelope as JSONB and is immutable. Invalid time retains its original string in Raw with nullable `recorded_at`, then is quarantined. Unsupported concept/unit, version collision and semantic/value conflict do not create a verified clinical fact.
- A quarantined or conflicting correction does not remove the support of an earlier accepted source version; only an accepted later tombstone does. The regression is covered by a DB integration test.
- A source record cannot change its `eventKey` between versions; changes are retained in Raw and quarantined. Concurrent records for one event serialize before canonical lookup. Source version is bounded to PostgreSQL `integer`. These boundaries have DB integration tests.
- Transaction rollback failure does not hide the original error; the broken PostgreSQL client is discarded. A unit test covers the failure path.
- Local tests demonstrate role/RLS behavior and transaction atomicity on PostgreSQL 16. They do not prove production authorization, retention/export/delete policy, clinical terminology coverage or full EVALS §3 medication/document cases.

## Outcome

M1 behavior is locally reproducible on a disposable database. The next step is CI/review on the review-fix PR head, followed by owner-controlled merge as a separate action. Production use remains outside this milestone.

## Risks and recovery

Only disposable synthetic databases may be migrated or reset. Raw history and quarantine must survive retry. Production retention/delete/export policy remains a later privacy review. The local runtime mismatch or unavailable DB must be reported as an unrun check until resolved; CI evidence on the exact PR head is separate.
