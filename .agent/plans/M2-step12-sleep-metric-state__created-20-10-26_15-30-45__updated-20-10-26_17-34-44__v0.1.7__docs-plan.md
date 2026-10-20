---
title: MyPhisys — M2 Step 12.1 partial sleep metric-state implementation
created: "20-10-26 15-30-45"
updated: "20-10-26 17-34-44"
timezone: Europe/Moscow
version: 0.1.7
commit: "docs(plan): record combined Quality P2 validation"
status: complete
---

# M2 Step 12.1 — partial sleep metric-state implementation

## 1. Goal / Why

Compute two adjacent closed seven-local-date `sleep_duration` metric-state snapshots and a descriptive diff from one current, person-scoped read. Preserve input and Raw support identity so recomputation after correction is auditable. This is partial A15/A16/A20 coverage, not full Health State Snapshot or Step 12.

## 2. Status / Authorization

`complete` for the approved Step 12.1 slice and independent-review fixes; owner Igor Pastin authorized implementation and a draft PR on 20-10-26, then explicitly authorized fixing P1/P2 findings, the standalone-diff P2, and the confirmed remaining combined-Quality P2 in [PR #13](https://github.com/ipastin/phisys/pull/13). T1 and D1 are confirmed in [PR #12](https://github.com/ipastin/phisys/pull/12). Merge, deploy, PR #10/#12 integration, schema changes, and source-pack edits are outside this authorization.

## 3. Context / Sources

Remote `main` was checked with `git ls-remote` on 20-10-26 and equals local `main`/`origin/main` at `c266de4d61b50caef3a59abdbd65ca73126b3928`. Step 11 is merged there. PR #10 and PR #12 are separate open draft planning PRs; PR #12 head `04ba5229e1e6be7229d1822bb75867ff8c68c1a6` contains one Markdown plan. This branch `codex/m2-step12-sleep-metric-state` starts at verified `main`, without cherry-picking either PR.

Authority: root `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, `.agent/PLANS.md`, Project Spec v0.4.0 `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, `03 DATA MODEL`, `04 ANALYTICS` §§13–18, `13 ADR` ADR-056/057/062–064/067/068/071, `11 IMPLEMENTATION` Steps 08–14, and `12 EVALS` A15/A16/A20. The PR #12 plan is decision context, not a merged source or implementation dependency. ADR-151–170 status ambiguity is irrelevant to this slice.

## 4. Scope / Non-goals

Add a Step 12.1 entrypoint and pure evaluator in existing analytics, compose Step 11 Quality/comparison, and add synthetic unit and disposable-DB regressions. Mark conditions, medications, allergies, goals, recent events, and conflicts `unavailable`. No schema migration, new package, historical replay, Step 13, insight, LLM, UI, or health claim.

## 5. Invariants / Architecture impact

The runtime reads once via `readCurrentSleepFacts` (`BEGIN READ ONLY`, `SET LOCAL ROLE myphisys_analytics`, person RLS, minimum column grants), captures one UTC `calculatedAt` after read, then invokes pure evaluation. The external entrypoint accepts no timestamp override. `calculatedAt` is computation time; `knowledgeAsOf` is explicitly `unavailable`. Fact observation dates remain LocalDate. Every output retains Quality reasons, algorithm/profile versions, sorted fact IDs, and Canonical→Raw→Source support without Raw payload. `numeric_changed` is descriptive only; promotion requires Step 13 Meaningfulness with Quality, reasons, uncertainty, baseline and persistence.

Review correction: snapshot identity includes a deterministic SHA-256 fingerprint of current canonical fact fields and active support fields, sorted by fact ID and Raw ID with stable object-key serialization. The digest identifies inputs without disclosing individual sleep values in the identity. The runtime copies the three accepted request dates before its asynchronous read and uses only that copy afterward. The diff records its own algorithm version plus Step 11 comparison version, policy, parameters and selected method (or `null` when blocked).

Repeat-review P2 correction: standalone diff accepts comparison metadata only when its previous/current input fingerprints and full previous/current Quality match the supplied snapshots. Missing fingerprints yield `incompatible`, not an exception. This prevents a stale comparison from asserting `unchanged` or a numeric delta after a canonical input or Quality revision, even when fact IDs, support references and medians remain equal. The runtime still evaluates one coherent pair from one read.

Combined-Quality P2 correction: both snapshot identities also bind a fingerprint of all comparison-relevant canonical rows (including invalid rows recorded by combined Quality, excluding valid out-of-window noise) and the full combined Quality result. A standalone diff with a comparison from a different set returns `incompatible`, a null delta and null diff Quality, so it does not expose that comparison's foreign fact IDs as the pair's Quality. Coherent blocked comparisons still return `unknown` with their Quality reasons. No reader, grants or schema change.

## 6. Files and dependencies

- `packages/analytics/src/index.ts`: existing comparison now carries previous/current/comparison-relevant input fingerprints; snapshot identity binds combined Quality, and the standalone diff validates the context. Incompatible diff Quality is null. No reader, grant or schema changes.
- `packages/analytics/test/metric-state.test.ts`: synthetic exact/near-zero, Quality, deterministic identity, compatibility, time/consumer cases, plus mixed-comparison and combined-Quality regressions.
- `packages/analytics/test/integration.test.ts`: read boundary, runtime time, person isolation, correction and Raw support lifecycle; nullable incompatible Quality is handled in assertions.
- `.agent/plans/…`: this living implementation plan. Existing fixtures (`packages/ingestion/test/golden.ts`), grants (`packages/database/migrations/0002_up.sql`), database reader, package export and CI are reused unchanged unless a failing acceptance case proves otherwise.

## 7. Milestones / Concrete steps

1. Inspect all analytics callers/tests/fixtures/config/exports and existing read/Quality behavior; confirm no schema need.
2. Implement pure two-snapshot composition and compatible descriptive diff; maintain unavailable structural and historical states.
3. Add trusted runtime capture after the single scoped read and focused synthetic/DB tests.
4. Run local checks, review diff/security boundary, commit and open draft PR against exact `main`; inspect exact-head CI.

## 8. Validation / Acceptance

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:db` where disposable PostgreSQL is available, `pnpm build`, `git diff --check`, and exact-head GitHub CI. Golden cases: unchanged zero, tiny nonzero signed delta, limited numerical result, insufficient/blocker suppression, stable sorted identity after input order change, correction/support swap with same median but changed provenance, same T1 across snapshots/diff/Quality, no external override, incompatible person/scope/profile, no historical as-of or direct insight. Existing DB tests cover RLS, grants, read-only and Raw payload denial; new DB cases exercise the Step 12.1 entrypoint. Full A15/A16 and Step 13/14 remain `needs_review`.

Review regressions on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`: focused Vitest first failed on four assertions against PR #13 head `ac33a16ad3c0b2c56b3917956e2e9ab939939825`, confirming identical identity after value change, absent comparison metadata, and request reuse after `await`. After the fix, `pnpm exec vitest run packages/analytics/test/metric-state.test.ts` passed 7/7. The cases also cover verification change without median change, blocked comparison metadata, and injected `knowledgeAsOf`/`calculated_at` during the read.

Standalone P2 regression on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`: the new synthetic case first failed against head `86a8c168cbd7bd03244c85c5f4b177d0b807b1f6` (`unchanged` instead of `incompatible`) when one canonical value changed but IDs, supports and median did not. After fix, focused Vitest passed 8/8. The case also covers changed verification, a Quality-only revision, missing fingerprints, and a coherent comparison that remains `unchanged`. Local `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` (analytics 32 unit cases; architecture 19), `DATABASE_URL=<disposable local PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` (database 3, ingestion 13, connectors 2, analytics 9), `pnpm build`, and `git diff --check` passed. Disposable container was removed. The final optional-chaining edge case passed focused Vitest, typecheck and format check after the full run. [Exact code-head CI](https://github.com/ipastin/phisys/actions/runs/39435500585) passed on `0ba233afda306656504191afd102cf64d0e1c150`: frozen install, lint, format, typecheck, unit/architecture and disposable-DB tests, build, high-severity audit and full-history secret scan. Final plan-only head CI is `needs_review` until completed; record it in PR #13.

Combined-Quality P2 on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`: synthetic two 14-fact sets with different additional invalid fact IDs first failed on `e569c5f1587dc7b57e1bb1755ab9257364a1b256` (`unknown` instead of `incompatible`), then passed 9/9 focused. A coherent blocked comparison remains `unknown` with its own combined Quality fact IDs; mixed comparison returns `incompatible`, null delta and null Quality. Existing out-of-window regression initially caught overbroad fingerprinting; selecting combined Quality's fact IDs restored that invariant. Local `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` passed (analytics 33 unit cases; architecture 19), `DATABASE_URL=<disposable local PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` passed (database 3, ingestion 13, connectors 2, analytics 9), and `git diff --check` passed. `pnpm test` included a successful build; the disposable container was removed. A final nullable-Quality test assertion edit passed focused Vitest, typecheck and format check. [Exact code-head CI](https://github.com/ipastin/phisys/actions/runs/39440298730) passed on `7dd1c65f965f551297353ad35f248028b1634cd0`: frozen install, lint, format, typecheck, unit/architecture and disposable-DB tests, build, high-severity audit and full-history secret scan. Final plan-only head CI is `needs_review` until completed; record it in PR #13.

Local review-fix checks on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`, working tree based on `ac33a16ad3c0b2c56b3917956e2e9ab939939825`: `pnpm lint` pass; `pnpm format:check` pass; `pnpm typecheck` pass; `pnpm test` pass (analytics 31 unit cases, architecture 19); `DATABASE_URL=<disposable local PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` pass (database 3, ingestion 13, connectors 2, analytics 9); `pnpm build` pass; `git diff --check` pass. Disposable container `myphisys-step12-review-20261020` was removed.

Local evidence on 20-10-26, cwd `/Users/igorpastin/Developer/phisys`, implementation commit `5aab6751a6f9fafeced69502f6e0e20c7d8cd146`: `pnpm lint` pass; `pnpm format:check` pass; `pnpm typecheck` pass after correcting a type-only window field; `pnpm test` pass (analytics 29 unit cases plus architecture 19); `DATABASE_URL=<disposable local PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db` pass (database 3, ingestion 13, connectors 2, analytics 9); `pnpm build` pass; staged diff check pass. Disposable container was removed. Output evidence: command results in this task and the new `metric-state.test.ts` / extended analytics DB integration test.

Earlier CI evidence: [run #48](https://github.com/ipastin/phisys/actions/runs/39425042478) passed on implementation head `5aab6751a6f9fafeced69502f6e0e20c7d8cd146`, and [run #49](https://github.com/ipastin/phisys/actions/runs/39425512582) passed on pre-review draft PR head `ac33a16ad3c0b2c56b3917956e2e9ab939939825`. Review-fix [run #39430391148](https://github.com/ipastin/phisys/actions/runs/39430391148) passed on exact code-and-plan head `2ed6ae5038ef3719e2f5e63bac199a735b6b7527` on 20-10-26: `validate` passed frozen install, lint, format, typecheck, unit/architecture and disposable-DB tests, build, high-severity audit and full-history secret scan. [Documentation-only head CI](https://github.com/ipastin/phisys/actions/runs/39431157121) passed on `86a8c168cbd7bd03244c85c5f4b177d0b807b1f6` before the standalone P2 fix.

## 9. Progress

- [x] 20-10-26 15-30-45: fresh `main`, PR #10/#12, Step 11, instructions, specs and affected code inspected.
- [x] 20-10-26 15-43-42: contract and implementation; reused one read and Step 11 Quality/comparison.
- [x] 20-10-26 15-43-42: synthetic and disposable-DB evidence passed; container removed.
- [x] 20-10-26 15-49-26: local checks passed; commit `5aab675` and draft [PR #13](https://github.com/ipastin/phisys/pull/13) created; exact implementation-head CI run #48 passed.
- [x] 20-10-26 16-22-02: independent review's three P1/P2 findings reproduced by failing tests, fixed in analytics, and local checks plus disposable DB tests passed.
- [x] 20-10-26 16-29-40: exact code-and-plan head `2ed6ae5` passed [CI run #39430391148](https://github.com/ipastin/phisys/actions/runs/39430391148); PR #13 body updated with base/head, checks and partial coverage. The final documentation-only head receives its own CI check before handoff; its exact SHA/run is tracked in the PR body.
- [x] 20-10-26 17-02-58: repeat-review standalone P2 reproduced and corrected in `0ba233a`; local synthetic/full/disposable-DB checks and exact code-head [CI run #39435500585](https://github.com/ipastin/phisys/actions/runs/39435500585) passed. Final docs head `e569c5f` passed [CI run #39436126547](https://github.com/ipastin/phisys/actions/runs/39436126547); PR body was updated.
- [x] 20-10-26 17-34-44: combined-Quality P2 reproduced, corrected in `7dd1c65`, and checked with local synthetic/unit/architecture/disposable-DB tests plus exact code-head [CI run #39440298730](https://github.com/ipastin/phisys/actions/runs/39440298730). Final docs head CI and PR body remain to be recorded before handoff.

## 10. Decision log

20-10-26: The owner selected Option A over structural Observation/Symptom projection (requires new reader/grants and lifecycle semantics) and full historical state (requires schema/history and broader domain model). T1 and D1 govern this slice. Reuse Step 11 comparison/Quality instead of duplicating median and support logic; this keeps all existing blocker semantics. No Step 12 significance threshold.

20-10-26 review fix: choose a SHA-256 fingerprint of sorted material canonical rows and active support fields. Alternative 1, IDs and Raw references only, fails when a mutable fact value or verification changes in place; alternative 2, embed full canonical rows in identity, makes identity verbose and exposes per-day values wherever identity is logged. Hash input includes canonical value, effective date, verification, epistemic state, conflict flag and support chain. Reuse the existing ingestion stable JSON key-order pattern and Node crypto; no dependency or schema change. Preserve exact numeric comparison semantics.

20-10-26 standalone P2: carry the two existing-style input fingerprints on the Step 11 comparison result and compare them, plus full Quality, with the snapshots. Alternatives: recompute a fresh comparison from snapshots (their individual fact values are intentionally absent), or suppress all standalone numerical diff results (would break the approved public helper). This additive metadata check preserves D1 and rejects mixed recomputations. It does not add a significance threshold or expose Raw payload.

20-10-26 combined-Quality P2: hash comparison-relevant facts and combined Quality into one context fingerprint shared by both snapshot identities. Alternative 1, hash every supplied row, breaks Step 11's out-of-window invariance; alternative 2, rely only on previous/current Quality, misses invalid rows held by combined Quality. On incompatibility, null diff Quality avoids attributing the rejected comparison's fact IDs to the supplied pair. No numeric or clinical semantics change.

## 11. Surprises / Open questions

The current mutable store cannot reconstruct historical `knowledge_as_of`. Exact duplicate receipt count remains `unavailable`. There is no Step 13/14 consumer in this repository; the Step 12.1 diff type carries a literal `promotion` gate and contract comment, while actual future consumer enforcement is `needs_review`. Docker Desktop was initially stopped, then started for disposable DB verification. One type-only field was accidentally applied to the existing baseline type, caught by `pnpm typecheck` and corrected before the final checks.

The independent review found that the initial input identity omitted mutable canonical fields, the request was re-read after an asynchronous boundary, and the diff omitted comparison provenance. Those are corrected in this branch, with regression evidence above. The SHA-256 digest is an input fingerprint, not a substitute for stored historical `knowledge_as_of` or a full clinical-state audit.

The repeat review found a remaining standalone boundary: a comparison from an older input/Quality revision could be mixed with new snapshots and still return `unchanged`. The new guard rejects that case; no known Step 12.1 consumer needs migration. Historical replay and future Step 13 consumer enforcement remain `needs_review`.

The subsequent review found that combined Quality could include a malformed fact absent from both seven-date snapshot inputs. Two separate blocked recomputations could then be mixed and return `unknown` with another set's combined provenance. The new context fingerprint rejects this; the valid out-of-window regression remains unchanged. The publicly exported diff now returns null Quality on incompatibility, and there is no known consumer to migrate.

## 12. Recovery / Idempotence

All work is isolated on this branch. Re-run pure tests without side effects; DB tests require `M1_DISPOSABLE_DB=1`. Do not merge or transplant PR #10/#12. Recheck remote base before PR creation; retain the branch and exact CI SHA for review.

## 13. Outcomes / Retrospective

Option A/T1/D1 slice and P1/P2 review fixes, including both standalone mixed-recomputation guards, pass local synthetic and disposable-DB checks and exact code-head CI at `7dd1c65`. A15 and A16 are partial; A20 has executable per-fact provenance and comparison metadata coverage for the sleep slice only. Full structural state, historical knowledge-as-of, Step 13 Meaningfulness, Step 14 What Changed and real-data outcome are `not_run`/`needs_review`. Future consumer enforcement remains `needs_review`. No schema, grants, Raw payload access, UI, LLM, merge or deploy changes. The draft PR records CI on its final documentation-only head; merge/deploy require separate decisions.
