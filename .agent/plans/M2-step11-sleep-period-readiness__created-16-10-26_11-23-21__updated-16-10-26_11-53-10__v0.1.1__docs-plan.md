---
title: MyPhisys — M2 Step 11 synthetic sleep period readiness
created: "16-10-26 11-23-21"
updated: "16-10-26 11-53-10"
timezone: Europe/Moscow
version: 0.1.1
commit: "docs(plan): record Step 11 draft PR evidence"
status: draft
---

# M2 Step 11 — daily trend and period comparison readiness

## 1. Goal / Why

Define a reviewable Step 11 contract for synthetic `sleep_duration` after the merged Quality and lagged baseline slices. The planning outcome is an explicit choice of daily and sparse-observation semantics, a Quality gate, negative cases, implementation touchpoints and acceptance evidence. This document does not implement period comparison or claim that Step 11 behavior exists.

## 2. Status / Authorization

`draft`, owner: Igor Pastin. The 16-10-26 request authorizes planning/readiness in a fresh `codex/*` branch and a docs-only [PR #10](https://github.com/ipastin/phisys/pull/10). It does not authorize Step 11 code, merge, deploy or real health data. Review of the three scope options and the recommended contract is the next owner gate. Clinical thresholds, health risk scores, canonical model, accepted ADR, safety/privacy and approved UX changes remain separate decisions.

## 3. Context / Sources

- Repository `ipastin/phisys`; `git fetch origin main` and clean-checkout check on 16-10-26 11-23 Europe/Moscow established `origin/main` = `0b9dc9e84f6b9a3b6bdf863a90efd418b6a5e84c`, merge of [PR #8](https://github.com/ipastin/phisys/pull/8). This branch `codex/m2-step11-readiness` was created at that SHA. [PR #7](https://github.com/ipastin/phisys/pull/7) and PR #8 are merged; their code, rather than earlier plan status text, defines the current runtime.
- Read [root instructions](../../AGENTS.md), [source index](../../docs/SOURCE_OF_TRUTH.md) and [ExecPlan contract](../PLANS.md). Project Spec [00 README](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§1, 5; [14 AGENTS](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) INV-004–008/013; [02 ARCHITECTURE](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–6, 9; [03 DATA MODEL](../../docs/project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–9, 19–20.
- Step 11 sources: [04 ANALYTICS](../../docs/project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–11, 21–22; [11 IMPLEMENTATION](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §8 Steps 08–14; [12 EVALS](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–6; [13 ADR](../../docs/project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) ADR-054–064. Source packs remain unchanged.
- Historical [M2.0 draft PR #6](https://github.com/ipastin/phisys/pull/6) is still open and based on older M1 `main`; its staged order and negative cases inform this plan, while current merged code and v0.4.0 sources govern exact contracts. [M2.1 execution record](M2.1-sleep-registry-quality__created-16-10-26_00-21-10__updated-16-10-26_09-52-46__v0.1.4__docs-plan.md) and [M2.2 execution record](M2.2-sleep-baseline-trend__created-16-10-26_07-07-41__updated-16-10-26_10-37-06__v0.1.6__docs-plan.md) are implementation evidence with historical status fields.
- `sleepDuration` registry version `1.1.0` declares `device_derived`, `daily`, canonical hours, unique local dates, frozen Quality policy (minimum seven observed days, coverage/freshness, nonclinical 0–25 h validity) and lagged baseline parameters `28/7/21`. `evaluateSleepBaselineTrend` already compares current seven-day median with the preceding 28-day reference; it returns a descriptive delta/direction, not a persistent slope. `readCurrentSleepFacts` reads current person-scoped facts and active Raw supports under `BEGIN READ ONLY` and `myphisys_analytics`. No production caller outside analytics tests exists.
- Project `13 ADR` marks ADR-054–064 Accepted. `SOURCE_OF_TRUTH` separately flags an unresolved header/status ambiguity for ADR-151–170; Step 11 here does not depend on those later ADRs.

## 4. Scope / Non-goals and alternatives

| Option | Daily and sparse-observation semantics for synthetic `sleep_duration` | Trade-off |
| --- | --- | --- |
| **A — strict adjacent weeks (recommended)** | Compare median of seven observed local dates in current `[start,end)` with median of the immediately previous seven dates `[start−7,start)`. One missing day in either week makes the numeric comparison unavailable; return explicit Quality and reasons. Sparse sleep remains a `daily` metric with missing dates, never a lab-like sparse metric. | Smallest distinct Step 11 slice beyond the existing 28/7 baseline. It prevents unequal-day medians from looking like comparable weeks, but may suppress a real shift when just one day is missing. Measure that suppression in golden cases. |
| **B — bounded partial weeks** | Permit a descriptive comparison with fewer than seven days per week under a new versioned metric-specific minimum/coverage policy; expose observed-day denominators and `limited`. | More results for imperfect device feeds, but weekday selection and missing-not-at-random can create false shifts. It changes the effective Quality gate; requires an owner-reviewed policy, version bump and false-insight/false-suppression calibration before code. |
| **C — observation-aligned sleep groups** | Compare the latest seven observed sleep dates with the preceding seven observed dates, even when either group spans more than a calendar week. Keep actual date spans and missing dates visible; make no per-day slope or persistence claim. | Recovers a comparison from sparse device feeds, but unequal spans and weekday selection make the two groups easy to misread as adjacent weeks. It needs a new versioned gap/coverage policy and separate false-insight calibration; do not use the existing seven-day Quality status as its gate. |

Recommendation **A** for the first Step 11 implementation slice. The accepted source requires daily *and* sparse semantics in the eventual engine; for this single daily metric, the sparse-input outcome is `insufficient` with visible missingness. This does not claim completion of sparse-lab behavior: M1's sparse `glucose` fixture is not `hba1c`, and `sleep_duration` is not a sparse lab. No interpolation, last-observation carry-forward, zero fill, clinical normal/target, “improving/worsening”, persistent trend, InsightCandidate, UI, LLM, production auth or deploy.

## 5. Proposed period and Quality contract

1. **Windows and interpretation.** Require an exact seven-local-date current `QualityWindow`; previous is the adjacent, nonoverlapping seven dates. Compare medians in hours; `absoluteDeltaHours = currentMedian − previousMedian`, `relativeDelta = null` when previous median is zero, and sign-only direction `increasing/decreasing/stable`. Label the result `period comparison`, not slope, persistence or health benefit/harm. Step 10's separate 28-day lagged reference and `28/7/21` parameters stay intact; the previous week is not renamed “baseline.”
2. **Input and Quality.** Reuse current `SleepFactRow[]` and `evaluateSleepQuality` for previous, current and combined 14-day windows. Previous Quality uses its period end as `asOfDate`; current/combined use the caller's `asOfDate` and fixed `calculatedAt`. This is period-relative freshness metadata, not “what was known then.” For each seven-day window, the existing `minimumDays: 7` requires seven distinct valid local dates. `sampleCount` may exceed observed days because extra same-day facts are counted separately.
3. **Blocking gate.** Return `status: insufficient` and `comparison: null` when either period Quality is `insufficient`; when combined source continuity is not one proven-continuous connector; or when either/combined Quality reports excluded inputs, missing Raw support, unresolved conflict, same-day overlap or invalid point. Valid dated facts outside the combined 14 days do not enter the gate or provenance. No connector-ID equivalence, source-method compatibility or cross-source stitching is inferred.
4. **Qualified result.** A full, single-source, one-fact-per-day comparison may return `limited` with a numeric descriptive delta when Quality's remaining reason is nonblocking, such as `unverified_inputs` or historical staleness. Carry period-prefixed reasons (`previous_*`, `current_*`, `combined_*`); a `limited` result is not an InsightCandidate or a strong claim. Same inputs, versions, parameters, windows and fixed clock must reproduce the same semantic result, independent of row order.
5. **Sparse input.** Zero to six observed days in either week retains expected/observed days and `missingDates` through nested Quality and produces no median comparison; two points never become a trend. Missing is unknown, never zero or normal. A lab-like latest/previous `delta`, interpolation, per-day slope and persistence belong to later metric-specific scopes, not this daily sleep result.
6. **Provenance and privacy.** Proposed output includes metric/profile and algorithm versions, frozen comparison parameters, both windows, `calculatedAt`, nested Quality with `factSupports`/aggregate Raw/source IDs, status and reasons. The DB caller, if approved, reads the 14-day span once through `readCurrentSleepFacts`; it never writes Raw/Canonical or exposes Raw payload. `asOfDate` controls calculation metadata, not historical knowledge-as-of: M1 exposes current projection and cannot reconstruct past database knowledge without a separate lifecycle decision.

If approved, the new comparison policy and algorithm version must be explicit and immutable; adding comparison parameters to `sleepDuration` requires a SemVer increment from `1.1.0`. Do not silently weaken the existing Quality policy to implement Option B.

## 6. Files, callers, fixtures, config and exports

| Locus | Planned Step 11 impact; docs-only PR edits none of these |
| --- | --- |
| [`packages/analytics/src/index.ts`](../../packages/analytics/src/index.ts) | Reuse `sleepDuration`, `QualityWindow`, `evaluateSleepQuality`, median pattern and `SleepBaselineTrendResult` conventions. Add only a typed pure period-comparison result/function and, if consumed, a person-scoped DB wrapper. Keep existing baseline exports and `28/7/21` unchanged. |
| [`packages/database/src/analytics.ts`](../../packages/database/src/analytics.ts), [`packages/database/src/index.ts`](../../packages/database/src/index.ts) | Existing `readCurrentSleepFacts` is the 14-day read boundary; no migration, grants, payload column or new export expected. Change only if an evidenced contract gap appears, with two-person and forbidden-write/Raw-payload DB regressions. |
| [`packages/analytics/test/quality.test.ts`](../../packages/analytics/test/quality.test.ts), [`packages/analytics/test/integration.test.ts`](../../packages/analytics/test/integration.test.ts) | Extend golden and disposable-DB cases. Existing tests cover Quality, 28/7/21, source switch, sparse baseline, per-fact Raw lineage, input aliasing and read-only isolation; preserve all. No production caller currently imports `@myphisys/analytics`. |
| [`packages/ingestion/test/golden.ts`](../../packages/ingestion/test/golden.ts), [`packages/ingestion/test/integration.test.ts`](../../packages/ingestion/test/integration.test.ts) | Derive synthetic complete, missing-day and source-switch variants without changing M1 import expectations. If a fixture changes, preserve ingestion counts/IDs and its tests. No real records. |
| [`packages/analytics/package.json`](../../packages/analytics/package.json), root [`package.json`](../../package.json), `pnpm-lock.yaml`, `tsconfig.tests.json`, `tests/architecture/**`, `.github/workflows/ci.yml` | Existing package export, unit tests, root `test:db` and CI include analytics. No config/dependency change expected. Add a public export only for a real caller; keep architecture guardrails. |

The implementation order is Registry comparison policy/version → pure period and nested Quality contract → optional existing read-only DB wrapper → golden and DB negative cases → exact-head CI/review. This docs-only PR adds only this ExecPlan.

## 7. Concrete future implementation steps

From repository root on a **new** `codex/*` branch based on then-fresh `main`, after owner selects a scope:

1. Lock seven-plus-seven period boundaries, Quality blockers, output names and policy/algorithm version against synthetic golden expectations. Preserve Step 10 results as a separate API.
2. Implement the smallest pure comparator reusing Quality and median logic. No source interpolation, clinical labels, new package or persistence. Confirm result/input isolation and stable ordering.
3. Add a DB caller only if consumed by DB acceptance; use the current read-only person-scoped reader for the complete 14-day span.
4. Run unit, architecture and disposable-PostgreSQL regressions; inspect final PR diff and CI against exact head. Open an implementation PR for review. Merge and deploy need separate authorization.

## 8. Validation / Acceptance

**Planning artifact gate:** link and metadata audit, exactly one new Markdown file, source/ADR traceability, `git diff --cached --check`, public-content scan, PR base/head and exact-head CI. These verify the plan, not Step 11 runtime. Product tests and disposable DB are `not_run` in M2 Step 11 planning.

| Synthetic regression for approved Option A | Expected Step 11 implementation result |
| --- | --- |
| Full adjacent weeks, stable and shifted values | Correct two medians and signed delta; same-value weeks yield `stable`; shifted complete weeks yield descriptive direction without persistence or clinical judgement. Step 10's 28-day baseline is unchanged by current-week shift. |
| One missing date in either week; a whole missing week; only two observations | Expected seven dates per week remain visible; missing is not zero. `insufficient`, null comparison; no fabricated slope, latest/previous sleep trend or InsightCandidate. |
| One excluded 26 h point, malformed date, unresolved conflict, absent active Raw support, or two facts on one date | Exclusion/overlap reason and provenance visible; no numeric comparison despite apparent seven-day coverage elsewhere. Pure and DB behavior are tested where each input can occur. |
| Connector/source switch on the boundary or within a week; two connectors on one date | Both per-period and combined Quality inspected; unproven continuity suppresses the comparison even when each separate week appears internally continuous. |
| Valid dated fact before/after 14-day span; same facts reversed | Outside fact changes neither combined Quality nor result; row order changes neither status nor numeric/provenance payload. |
| Unverified but complete single-source weeks; old `asOfDate` | Qualified `limited` descriptive result with period-specific reasons, never a strong insight. Invalid future/end-before-start windows fail before DB read. |
| Duplicate delivery, Raw support swap, tombstone/correction | Duplicate receipt does not inflate sample/coverage; count remains `unavailable`. Per-fact Raw lineage changes under support swap; changed active supports/current facts recompute rather than reuse stale output. |
| Two persons and attempted Raw/Canonical writes or Raw payload read | DB result and provenance isolated by person; analytics role cannot write or access Raw payload. |
| Eligible complete shift vs isolated noise/missing/source switch | Label expected displayed descriptive comparisons and deliberate suppressions separately; report false comparisons and erroneous suppression, rather than making all cases `insufficient`. No numeric release target invented from EVALS. |

Map to EVALS A02–A03, A06–A12, A14 and A20; A07's sparse-lab latest/previous interpretation remains `not_run` here. Required future commands: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `git diff --check`, and `DATABASE_URL=<disposable PostgreSQL 16> M1_DISPOSABLE_DB=1 pnpm test:db`; then inspect PR CI on the final head. Run only with synthetic data.

## 9. Progress and evidence

- [x] 16-10-26 11-23 Europe/Moscow: fetched `origin/main`, verified clean predecessor checkout and created `codex/m2-step11-readiness` from `0b9dc9e84f6b9a3b6bdf863a90efd418b6a5e84c`.
- [x] Read source index, ExecPlan contract, Project Spec v0.4.0, PR #6 historical draft, merged M2 code, readers, callers/tests/fixtures/config/exports.
- [x] 16-10-26 11-33 Europe/Moscow: validated all 22 relative links, Markdown metadata and 13 required sections; public-content scan found no records, credentials or local paths.
- [x] 16-10-26 11-50 Europe/Moscow: opened docs-only [draft PR #10](https://github.com/ipastin/phisys/pull/10) against `main`; initial head `cd05f25954d9c5e78c9d99faae65d338e4478d7e` passed `validate` ([run 38876243345](https://github.com/ipastin/phisys/actions/runs/38876243345)). Final head must be checked again after this evidence update.
- [ ] Owner decision on Option A/B/C and separate implementation start.
- [ ] Step 11 runtime and disposable-DB checks: `not_run`.

| Action / cwd / SHA | Result at draft time | Evidence |
| --- | --- | --- |
| `git fetch origin main`; `git status --short --branch`; `git rev-parse origin/main`, repository root, base `0b9dc9e84f6b9a3b6bdf863a90efd418b6a5e84c` | `pass` | Fresh main, clean checkout, new branch from exact SHA. |
| Python link/structure check and `rg` public-content scan; repository root, precommit branch at `0b9dc9e84f6b9a3b6bdf863a90efd418b6a5e84c`, 16-10-26 11-33 MSK | `pass` | 22 relative links resolved, sections 1–13 present; no records, credentials or local paths found in plan. Staged diff check follows before commit. |
| `git diff --cached --check`; repository root, `cd05f25954d9c5e78c9d99faae65d338e4478d7e`, 16-10-26 11-33 MSK | `pass` | One new Markdown file, no whitespace errors; PR #10 initial diff confirms one file. |
| PR #10 initial head `cd05f25954d9c5e78c9d99faae65d338e4478d7e` [run 38876243345](https://github.com/ipastin/phisys/actions/runs/38876243345), 16-10-26 11-50 MSK | `pass` | GitHub `validate` success. CodeRabbit reports “Review skipped: draft pull request,” so no substantive automated review evidence. |
| PR #10 final-head CI after this evidence update | `needs_review` | Inspect after push; the initial run does not validate the later commit. |
| Runtime pnpm and disposable-DB Step 11 behavior | `not_run` | Planning only; merged Step 10 CI does not prove proposed Step 11. |

## 10. Decision log

| Decision | Reason and trade-off | Status |
| --- | --- | --- |
| D-11-1 scope: A strict adjacent weeks; B partial weeks; C observed-date groups | A reuses `daily`, current Quality and read-only M1 facts with the smallest new API. B increases coverage but changes Quality/version and missingness bias. C compares unequal calendar spans and needs its own gap policy. | **16-10-26: Recommend A; owner review required before code.** |
| D-11-2 incomplete daily periods | A returns `insufficient`/null; B returns a qualified median from selected observed days. The existing `minimumDays: 7` makes A consistent and auditable; B needs explicit versioned policy/eval evidence. | **16-10-26: Recommend A.** Revisit only with labeled false-suppression evidence. |
| D-11-3 source transitions | A suppresses comparison across unproven connector/method change; B merges connectors without compatibility proof. A preserves false-insight control at the cost of coverage. | **16-10-26: Recommend A**, consistent with ADR-063 and Step 10. |
| D-11-4 output claim | A calls the result descriptive period delta; B calls two weekly points a persistent trend/slope. ADR-060–061 and ANALYTICS §8 support A. | **16-10-26: Recommend A**; no clinical direction or “improving/worsening.” |

These recommendations define a reviewable implementation scope, not a change to accepted ADR or a clinical threshold.

## 11. Surprises / Open questions and owner decisions

1. `sleep_duration` is registered as `daily`. “Sparse” in this first slice means missing daily observations; it does not authorize a new sparse sleep temporal class. Option C needs a new gap/coverage policy; sparse lab latest/previous and `hba1c` require a separate metric/canonical decision.
2. The existing 7-day Quality `minimumDays: 7` intentionally makes even 6/7 insufficient for a seven-day comparison. Owner should decide whether that false-suppression trade-off is acceptable for the first slice (recommend yes), using labeled synthetic cases before any relaxation.
3. The current reader exposes current facts and active Raw support, not a historical database knowledge snapshot. `asOfDate` cannot claim “what MyPhisys knew then.” Step 12's historical semantics remain separate. If source/method equivalence, persistence/cache, new privacy flow, clinical interpretation or approved UX changes are needed, stop and present a separate decision with trade-offs.
4. `SOURCE_OF_TRUTH` notes ADR-151–170 status ambiguity. This plan uses ADR-054–064 only; do not silently treat the later set as resolved.

## 12. Recovery / Idempotence

This planning branch changes only one Markdown file. Re-run metadata, link, public-content and diff checks after any edit, then check the final PR head and CI. Do not reset another contributor's work. The future pure calculation is retryable for fixed current facts, windows, versions and clock; corrections or active Raw support changes require recalculation. If a future step introduces persistence, design invalidation and rollback separately before use.

## 13. Outcomes / Retrospective

The intended M2 Step 11 planning deliverable is a standalone draft ExecPlan and docs-only PR. Option A gives the next implementation task a bounded daily comparison with explicit sparse-input suppression, existing Quality and read-only provenance. At this stage the contract is proposed, owner review and implementation authorization remain open, and product behavior is `not_run`. Next action after approval: implement Option A on a fresh `codex/*` branch with golden and disposable-DB regressions; do not merge or deploy without a separate request.
