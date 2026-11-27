---
title: Phisys — partial A13 sleep persistence evidence
created: "26-11-26 15-22-04"
updated: "27-11-26 14-41-45"
timezone: Europe/Moscow
version: "0.1.4"
commit: "docs(brand): adopt Phisys project naming"
status: in_progress
---

# Partial A13 — sleep persistence evidence

## 1. Goal / Why

Distinguish a sustained same-direction sequence from alternating days, an isolated anomaly, and insufficient evidence within one seven-date sleep window.

## 2. Status / Authorization

On 26-11-26 the owner approved proposal v0.1.0: four consecutive days, full 7/7 current coverage, sufficient Quality, and a band of max(0.5 hours, 2 × MAD). Authorization covers implementation and a draft PR. Positive promotion, merge and deploy need separate authorization.

## 3. Context / Sources

Verified base `effdd6e916b1d91c3d5c90b39646577a73ea2103` includes [PR #16](https://github.com/ipastin/phisys/pull/16), with [passing main CI](https://github.com/ipastin/phisys/actions/runs/45805318266). No late review threads were found. Sources: [SOURCE_OF_TRUTH](../../docs/SOURCE_OF_TRUTH.md), [ExecPlan contract](../PLANS.md), Project Spec v0.4.0 Analytics §§6–11, 16, 18, 22, Evals A13/A17/A20, ADR-060/062/063/064/069/071.

## 4. Scope / Non-goals

Evidence for one closed current week of `sleep_duration` only. The decision remains `held`. Ranking, candidate promotion, Step 14, clinical claims and historical knowledge-as-of stay outside this slice.

## 5. Invariants / Architecture impact

Use one person-scoped, read-only 35-date read and one trusted UTC instant after it. Keep the 14-date D1 input and the reference-date guard from PR #16. A13 evaluates ordered current dates against the existing 28-date baseline, even when D1 is unchanged. Separate unavailable evidence from an evaluated window with no qualifying run. Return directional counts and earliest longest runs, together with the baseline's Quality and sorted Canonical → Raw → Source provenance and a deterministic input fingerprint. Do not alter DB grants, RLS or schema.

## 6. Files and dependencies

Compose the pure rule in `packages/analytics/src/index.ts`, using the existing baseline evaluator once. The internal held decision carries the versioned persistence outcome and the baseline evaluation it used, including blocked outcomes. Tests live in the existing meaningfulness and integration suites. Search found no production consumer of the prior persistence sentinel outside the module.

## 7. Milestones / Concrete steps

Implement evaluation and gate diagnostics → verify approved synthetic cases and existing Step 12/13 regressions → run local and disposable-DB checks → publish a draft PR and verify GitHub CI on its head.

## 8. Validation / Acceptance

Approved matrix A13-01–17: run versus alternating and interrupted days with equal medians, isolated outlier, signed directions, 6/7 missing, 23 versus 22 reference days, both source transition variants, unverified and structural blockers, MAD zero and nonzero, equal weekly medians, value and support revisions, and malformed reference-only date. Assert outcomes and reason codes. Retain tests for one read, shared T1, caller override rejection, person isolation, D1 and input provenance. Run lint, format, typecheck, unit/architecture, disposable PostgreSQL, build and exact PR-head CI.

P2 follow-up checks decimal-hour equality for the 0.5 h floor and a band derived from 2 × MAD, above and below baseline. Near-threshold cases on each side of the floor confirm the comparison still rejects values inside and counts values outside.

The second P2 check adds six cases at a 0.6 h band derived from MAD = 0.3 h. Repeat each of `[8.2, 8.4, 8.8, 9.1]` and `[4.5, 8.7, 9.1, 9.3]` seven times per value in the reference. Four current days at 9.2 h and 8.3 h respectively are exactly on the upper and lower boundaries. Values 0.000001 h closer to the median do not qualify, and values 0.000001 h farther away do. Each case checks the standalone D1 result, sufficient baseline Quality, and the held decision.

## 9. Progress

- [x] 26-11-26 Europe/Moscow: verified remote base and CI, prior review threads and owner scope, then created `codex/m2-a13-sleep-persistence`.
- [x] 26-11-26 15-28-19 Europe/Moscow, repository root: all 17 golden cases in the [meaningfulness suite](../../packages/analytics/test/meaningfulness.test.ts) are exercised, including variants for exact band equality, source transitions and unusable Quality. Focused and full suites passed: 77 analytics unit, 19 architecture and 28 disposable PostgreSQL tests. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build` and `git diff --check` passed. Local Node 24.17.0 and pnpm 12.13.0.
- [x] 26-11-26 15-53-14 Europe/Moscow, repository root: four equality cases failed against reviewed head `154d7f2db30cd58aaa4da41897fa46ce75ec9120` before the correction. All eight focused boundary cases passed after the fix. Full local checks passed: 85 analytics unit, 19 architecture and 28 disposable PostgreSQL tests, lint, format, typecheck, build and diff check. The [draft PR](https://github.com/ipastin/phisys/pull/17) records the published SHA and CI run. Follow-up review remains `needs_review`.
- [x] 26-11-26 16-49-20 Europe/Moscow, repository root: two combined-rounding equality cases failed on reviewed head `d5ddbaa0eae91a3410747fe6c23290043006016c` before the bound was corrected. All 14 focused comparison cases then passed. Full local checks passed: 91 analytics unit, 19 architecture and 28 disposable PostgreSQL tests, lint, format, typecheck, build and diff check.

## 10. Decision log

26-11-26: owner chose the four-date continuous run over four qualifying dates in any order. Preserve baseline v1's 21-day numeric minimum and require sufficient Quality for A13, currently at least 23 of 28 reference days. Connector continuity is the evidence available from the current reader.

26-11-26: expose one baseline evaluation for every decision because A13 needs its Quality even for a blocked or unchanged diff. Baseline numeric values can still be unavailable. Replace the previous persistence sentinel with an explicit versioned outcome. The held gate's former placeholder now reports `promotion_policy_unavailable` when the descriptive diff and baseline reach that stage, with the analytical outcome carried in `persistence`.

26-11-26: the owner authorized the P2 correction. Apply a scale-aware `Number.EPSILON` tolerance only when comparing the absolute daily deviation with the inclusive A13 band. Keep the computed band, D1, Quality and held decision policy.

26-11-26: replace the first tolerance with a bound for the whole binary64 calculation. Let `u = Number.EPSILON / 2` and `M = maximumDurationHours`. Quality restricts canonical sleep durations to `[0, M]` (M = 25 h).

| Operation | Maximum absolute error vs the corresponding decimal calculation |
| --- | ---: |
| Convert a canonical duration to Number | uM |
| Reference median | 2uM. Sorting and selection preserve the maximum input error. Averaging two middle values contributes at most uM after halving. |
| Absolute deviation from the median | 4uM. Add duration (uM), median (2uM) and the subtraction (uM). Absolute value is exact. |
| MAD | 5uM. The deviations already carry up to 4uM and median averaging contributes up to uM. |
| Band | 10uM. Binary doubling is exact in this range. The fixed 0.5 h floor is exact and max does not amplify error. |
| Band minus absolute daily deviation | 16uM. Add 10uM for band, 4uM for deviation and a conservative 2uM for subtracting operands in [0, 2M]. |

The inclusive comparison therefore treats a computed gap of at most `16uM = 8 × Number.EPSILON × M` as on the boundary or outside. That is about 4.44e-14 h at M = 25 h. This is an arithmetic bound, not a change to the persisted band or the D1 delta, and does not define a rounding policy for canonical measurements.

## 11. Surprises / Open questions

A13 may observe a current-week run while adjacent weekly medians agree. The prior D1 and the A13 outcome answer different questions. Rules for any positive promotion remain `needs_review`.

Current ingestion can mark synthetic and connector facts `unverified`. An unverified input makes this strict A13 evidence unavailable even when D1 retains a descriptive delta. The DB test exercises that boundary, and sufficient positive outcomes are tested with synthetic verified facts. No real-data coverage or threshold calibration is claimed.

## 12. Recovery / Idempotence

Re-evaluate with the same scoped facts, policy and instant. Corrections and active support changes update the fingerprints. Keep the existing standalone Step 12.1 entry point.

## 13. Outcomes / Retrospective

Partial A13 for the approved sleep window is implemented with typed outcomes, reason codes, directional counts, dates and traceable baseline inputs. A17 stays suppression-only and A20 coverage is limited to this sleep pipeline. Multiweek persistence, real data, historical replay and Step 14 are `not_run`. Positive promotion and owner acceptance remain `needs_review`.
