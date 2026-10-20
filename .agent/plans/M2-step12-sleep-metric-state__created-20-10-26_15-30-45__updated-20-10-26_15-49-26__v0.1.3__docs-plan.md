---
title: MyPhisys — M2 Step 12.1 partial sleep metric-state implementation
created: "20-10-26 15-30-45"
updated: "20-10-26 15-49-26"
timezone: Europe/Moscow
version: 0.1.3
commit: "docs(plan): record Step 12.1 validation outcome"
status: complete
---

# M2 Step 12.1 — partial sleep metric-state implementation

## 1. Goal / Why

Compute two adjacent closed seven-local-date `sleep_duration` metric-state snapshots and a descriptive diff from one current, person-scoped read. Preserve input and Raw support identity so recomputation after correction is auditable. This is partial A15/A16/A20 coverage, not full Health State Snapshot or Step 12.

## 2. Status / Authorization

`in_progress`; owner Igor Pastin authorized implementation and a draft PR on 20-10-26. T1 and D1 are confirmed in [PR #12](https://github.com/ipastin/phisys/pull/12). Merge, deploy, PR #10/#12 integration, schema changes, and source-pack edits are outside this authorization.

## 3. Context / Sources

Remote `main` was checked with `git ls-remote` on 20-10-26 and equals local `main`/`origin/main` at `c266de4d61b50caef3a59abdbd65ca73126b3928`. Step 11 is merged there. PR #10 and PR #12 are separate open draft planning PRs; PR #12 head `04ba5229e1e6be7229d1822bb75867ff8c68c1a6` contains one Markdown plan. This branch `codex/m2-step12-sleep-metric-state` starts at verified `main`, without cherry-picking either PR.

Authority: root `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, `.agent/PLANS.md`, Project Spec v0.4.0 `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, `03 DATA MODEL`, `04 ANALYTICS` §§13–18, `13 ADR` ADR-056/057/062–064/067/068/071, `11 IMPLEMENTATION` Steps 08–14, and `12 EVALS` A15/A16/A20. The PR #12 plan is decision context, not a merged source or implementation dependency. ADR-151–170 status ambiguity is irrelevant to this slice.

## 4. Scope / Non-goals

Add a Step 12.1 entrypoint and pure evaluator in existing analytics, compose Step 11 Quality/comparison, and add synthetic unit and disposable-DB regressions. Mark conditions, medications, allergies, goals, recent events, and conflicts `unavailable`. No schema migration, new package, historical replay, Step 13, insight, LLM, UI, or health claim.

## 5. Invariants / Architecture impact

The runtime reads once via `readCurrentSleepFacts` (`BEGIN READ ONLY`, `SET LOCAL ROLE myphisys_analytics`, person RLS, minimum column grants), captures one UTC `calculatedAt` after read, then invokes pure evaluation. The external entrypoint accepts no timestamp override. `calculatedAt` is computation time; `knowledgeAsOf` is explicitly `unavailable`. Fact observation dates remain LocalDate. Every output retains Quality reasons, algorithm/profile versions, sorted fact IDs, and Canonical→Raw→Source support without Raw payload. `numeric_changed` is descriptive only; promotion requires Step 13 Meaningfulness with Quality, reasons, uncertainty, baseline and persistence.

## 6. Files and dependencies

- `packages/analytics/src/index.ts`: new public contract and evaluation over existing comparison; no change to Step 11 exports/callers.
- `packages/analytics/test/quality.test.ts`: synthetic exact/near-zero, Quality, deterministic identity, compatibility, time/consumer cases.
- `packages/analytics/test/integration.test.ts`: read boundary, runtime time, person isolation, correction and Raw support lifecycle.
- `.agent/plans/…`: this living implementation plan. Existing fixtures (`packages/ingestion/test/golden.ts`), grants (`packages/database/migrations/0002_up.sql`), database reader, package export and CI are reused unchanged unless a failing acceptance case proves otherwise.

## 7. Milestones / Concrete steps

1. Inspect all analytics callers/tests/fixtures/config/exports and existing read/Quality behavior; confirm no schema need.
2. Implement pure two-snapshot composition and compatible descriptive diff; maintain unavailable structural and historical states.
3. Add trusted runtime capture after the single scoped read and focused synthetic/DB tests.
4. Run local checks, review diff/security boundary, commit and open draft PR against exact `main`; inspect exact-head CI.

## 8. Validation / Acceptance

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:db` where disposable PostgreSQL is available, `pnpm build`, `git diff --check`, and exact-head GitHub CI. Golden cases: unchanged zero, tiny nonzero signed delta, limited numerical result, insufficient/blocker suppression, stable sorted identity after input order change, correction/support swap with same median but changed provenance, same T1 across snapshots/diff/Quality, no external override, incompatible person/scope/profile, no historical as-of or direct insight. Existing DB tests cover RLS, grants, read-only and Raw payload denial; new DB cases exercise the Step 12.1 entrypoint. Full A15/A16 and Step 13/14 remain `needs_review`.

Local evidence on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`, implementation commit `5aab6751a6f9fafeced69502f6e0e20c7d8cd146`: `pnpm lint` pass; `pnpm format:check` pass; `pnpm typecheck` pass after correcting a type-only window field; `pnpm test` pass (analytics 29 unit cases plus architecture 19); `DATABASE_URL=<disposable local PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` pass (database 3, ingestion 13, connectors 2, analytics 9); `pnpm build` pass; staged diff check pass. Disposable container was removed. Output evidence: command results in this task and the new `metric-state.test.ts` / extended analytics DB integration test.

CI evidence: [MyPhisys validation run #48](https://github.com/ipastin/phisys/actions/runs/39425042478) completed successfully for exact implementation head `5aab6751a6f9fafeced69502f6e0e20c7d8cd146`. The `validate` job passed runtime, frozen install, lint, format, typecheck, unit/architecture tests, disposable-DB tests, build, high-severity audit and full-history secret scan. This evidence-only plan update will create a new PR head and re-trigger CI; that final run must be checked before handoff.

## 9. Progress

- [x] 20-10-26 15-30-45: fresh `main`, PR #10/#12, Step 11, instructions, specs and affected code inspected.
- [x] 20-10-26 15-43-42: contract and implementation; reused one read and Step 11 Quality/comparison.
- [x] 20-10-26 15-43-42: synthetic and disposable-DB evidence passed; container removed.
- [x] 20-10-26 15-49-26: local checks passed; commit `5aab675` and draft [PR #13](https://github.com/ipastin/phisys/pull/13) created; exact implementation-head CI run #48 passed.

## 10. Decision log

20-10-26: The owner selected Option A over structural Observation/Symptom projection (requires new reader/grants and lifecycle semantics) and full historical state (requires schema/history and broader domain model). T1 and D1 govern this slice. Reuse Step 11 comparison/Quality instead of duplicating median and support logic; this keeps all existing blocker semantics. No Step 12 significance threshold.

## 11. Surprises / Open questions

The current mutable store cannot reconstruct historical `knowledge_as_of`. Exact duplicate receipt count remains `unavailable`. There is no Step 13/14 consumer in this repository; the Step 12.1 diff type carries a literal `promotion` gate and contract comment, while actual future consumer enforcement is `needs_review`. Docker Desktop was initially stopped, then started for disposable DB verification. One type-only field was accidentally applied to the existing baseline type, caught by `pnpm typecheck` and corrected before the final checks.

## 12. Recovery / Idempotence

All work is isolated on this branch. Re-run pure tests without side effects; DB tests require `M1_DISPOSABLE_DB=1`. Do not merge or transplant PR #10/#12. Recheck remote base before PR creation; retain the branch and exact CI SHA for review.

## 13. Outcomes / Retrospective

Option A/T1/D1 slice implemented and verified on synthetic data. A15 and A16 are partial; A20 has executable per-fact provenance coverage for the sleep slice only. Full structural state, historical knowledge-as-of, Step 13 Meaningfulness, Step 14 What Changed and real-data outcome are `not_run`/`needs_review`. No schema, grants, Raw payload access, UI, LLM, merge or deploy changes. Next step: review draft PR #13 and decide later structural/historical scope; merge/deploy require separate decisions.
