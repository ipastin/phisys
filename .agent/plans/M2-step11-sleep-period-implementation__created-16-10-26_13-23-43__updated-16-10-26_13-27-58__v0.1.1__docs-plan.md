---
title: MyPhisys — M2 Step 11 synthetic sleep period implementation
created: "16-10-26 13-23-43"
updated: "16-10-26 13-27-58"
timezone: Europe/Moscow
version: 0.1.1
commit: "feat(analytics): compare adjacent synthetic sleep weeks"
status: in_progress
---

# M2 Step 11 — synthetic sleep period comparison

## 1. Goal / Why

Expose a deterministic, descriptive comparison of adjacent complete seven-local-date `sleep_duration` windows. A missing or conflicting fact must not become a numeric claim.

## 2. Status / Authorization

Igor approved Option A from [readiness PR #10](https://github.com/ipastin/phisys/pull/10) and authorized implementation, golden/disposable-DB regressions and an implementation PR. Merge and deploy are excluded. This implementation is `in_progress` until exact-head CI and owner review.

## 3. Context / Sources

The implementation branch starts at `origin/main` `0b9dc9e84f6b9a3b6bdf863a90efd418b6a5e84c`; PR #10 head `1142bda011fae5fd9c8af350ff15b20eb61c1126` supplies the Option A contract without merging that PR. Read root `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, `.agent/PLANS.md`, Project Spec v0.4.0 `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, `04 ANALYTICS`, `11 IMPLEMENTATION`, `12 EVALS`, `13 ADR` (ADR-054–064). ADR-151–170 ambiguity is outside this slice.

## 4. Scope / Non-goals

Only synthetic daily sleep: previous seven local dates versus current seven local dates, median hours, signed absolute/relative delta and descriptive direction. Sparse sleep is insufficient. No slope, persistence, clinical label, sparse lab interpretation, LLM, UI, canonical model or schema change.

## 5. Invariants / Architecture impact

Use existing Quality for previous, current and combined periods. Block incomplete periods, unproven connector continuity, excluded facts, unresolved conflicts, missing active Raw support and same-day overlap. A single connector does not prove device or method continuity. The read boundary remains person-scoped `BEGIN READ ONLY`; duplicate receipt count stays `unavailable`. Step 10 `28/7/21` baseline is separate.

## 6. Files and dependencies

`packages/analytics/src/index.ts` owns registry version, pure comparator and DB wrapper; `packages/analytics/test/quality.test.ts` owns golden cases; `packages/analytics/test/integration.test.ts` owns disposable-DB regressions. Existing `packages/database/src/analytics.ts` reader, package exports, scripts, fixtures, migrations and CI are reused without changes. No production caller imports analytics yet.

## 7. Milestones / Concrete steps

1. Add immutable comparison policy and parameters with metric profile SemVer increment; preserve Quality and baseline policies.
2. Evaluate adjacent periods with nested provenance, explicit blockers and `comparison: null` on insufficient evidence.
3. Read the combined 14-day span once through existing reader; verify synthetic golden and DB behavior.
4. Review diff, push implementation branch, open PR and inspect CI on exact head.

## 8. Validation / Acceptance

Golden cases cover complete stable/shifted/zero-reference windows, missing day/week/sparse, invalid/excluded/conflict/overlap/Raw support, source transition, out-of-window facts, order independence, unverified/stale qualified results, leap day and DST local dates. DB cases cover comparison, person isolation, duplicate retry, missing week and connector boundary. Existing DB privilege regression checks forbidden Raw payload and Raw/Canonical writes.

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | pass | 16-10-26, all 9 tasks |
| `pnpm lint` | pass | 16-10-26 |
| `pnpm format:check` | pass | 16-10-26 |
| `pnpm test` | pass | 16-10-26, analytics unit 23; architecture 19 |
| `DATABASE_URL=<disposable PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` | pass | 16-10-26, database 3, ingestion 13, connectors 2, analytics 8; second empty DB after a test assertion correction |
| `pnpm install --frozen-lockfile --store-dir <local store> --package-import-method=copy` | pass | 16-10-26, 186 packages from existing store, no download |
| `pnpm build` | pass | 16-10-26, 6 packages |
| Exact-head CI | not_run | Inspect after PR push |

False comparisons: all deliberate blocker variants return null. Erroneous suppression: complete stable/shifted and unverified/stale variants return numeric comparisons. No production false-insight rate is inferred from synthetic cases.

## 9. Progress

- [x] Clean checkout, fresh `origin/main`, PR #10 contract and affected callers/tests/fixtures/config/exports reviewed.
- [x] Pure comparison, DB wrapper and synthetic regressions implemented.
- [x] Local unit, architecture and disposable-DB behavior checked.
- [x] Final local checks and diff review.
- [ ] Exact-head CI and implementation PR review.

## 10. Decision log

Option A was approved by owner. It suppresses even a single missing date; Option B allows partial weeks but risks selection bias, while Option C aligns observations across unequal spans. This slice uses A so adjacent weeks have equal date coverage. `sleepDuration` profile moves `1.1.0` to `1.2.0`; Quality and baseline algorithms retain their versions.

## 11. Surprises / Open questions

The first DB attempt hit sandbox `EPERM` on localhost, then completed with granted localhost access. A repeated `test:db` needs another empty disposable DB because schema creation is not idempotent. M1 cannot prove a method/device switch within the same connector; stronger metadata needs a separate decision. Historical knowledge-as-of cannot be reconstructed from the current projection.

## 12. Recovery / Idempotence

Re-run pure checks in this branch. For `test:db`, use a new empty PostgreSQL 16 database with `M1_DISPOSABLE_DB=1`; remove the task-owned container after validation. No migration or persistent data changes are part of the branch.

## 13. Outcomes / Retrospective

Behavioral outcome is supported by local synthetic golden and DB tests. Exact-head CI, PR review and owner acceptance remain pending; merge and deploy require separate instructions.
