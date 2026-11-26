---
title: MyPhisys — partial A13 sleep persistence evidence
created: "26-11-26 15-22-04"
updated: "26-11-26 15-28-19"
timezone: Europe/Moscow
version: 0.1.1
commit: "feat(analytics): add partial sleep persistence evidence"
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

## 9. Progress

- [x] 26-11-26 Europe/Moscow: verified remote base and CI, prior review threads and owner scope, then created `codex/m2-a13-sleep-persistence`.
- [x] 26-11-26 15-28-19 Europe/Moscow, repository root: all 17 golden cases in the [meaningfulness suite](../../packages/analytics/test/meaningfulness.test.ts) are exercised, including variants for exact band equality, source transitions and unusable Quality. Focused and full suites passed: 77 analytics unit, 19 architecture and 28 disposable PostgreSQL tests. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build` and `git diff --check` passed. Local Node 24.17.0 and pnpm 12.13.0.
- The draft PR records the published SHA, verification date and CI run. Independent review remains `needs_review`.

## 10. Decision log

26-11-26: owner chose the four-date continuous run over four qualifying dates in any order. Preserve baseline v1's 21-day numeric minimum and require sufficient Quality for A13, currently at least 23 of 28 reference days. Connector continuity is the evidence available from the current reader.

26-11-26: expose one baseline evaluation for every decision because A13 needs its Quality even for a blocked or unchanged diff. Baseline numeric values can still be unavailable. Replace the previous persistence sentinel with an explicit versioned outcome. The held gate's former placeholder now reports `promotion_policy_unavailable` when the descriptive diff and baseline reach that stage, with the analytical outcome carried in `persistence`.

## 11. Surprises / Open questions

A13 may observe a current-week run while adjacent weekly medians agree. The prior D1 and the A13 outcome answer different questions. Rules for any positive promotion remain `needs_review`.

Current ingestion can mark synthetic and connector facts `unverified`. An unverified input makes this strict A13 evidence unavailable even when D1 retains a descriptive delta. The DB test exercises that boundary, and sufficient positive outcomes are tested with synthetic verified facts. No real-data coverage or threshold calibration is claimed.

## 12. Recovery / Idempotence

Re-evaluate with the same scoped facts, policy and instant. Corrections and active support changes update the fingerprints. Keep the existing standalone Step 12.1 entry point.

## 13. Outcomes / Retrospective

Partial A13 for the approved sleep window is implemented with typed outcomes, reason codes, directional counts, dates and traceable baseline inputs. A17 stays suppression-only and A20 coverage is limited to this sleep pipeline. Multiweek persistence, real data, historical replay and Step 14 are `not_run`. Positive promotion and owner acceptance remain `needs_review`.
