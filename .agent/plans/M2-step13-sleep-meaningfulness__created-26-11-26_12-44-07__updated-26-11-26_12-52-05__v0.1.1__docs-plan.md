---
title: MyPhisys — M2 Step 13 sleep Meaningfulness gate
created: "26-11-26 12-44-07"
updated: "26-11-26 12-52-05"
timezone: Europe/Moscow
version: 0.1.1
commit: "docs(plan): record partial sleep meaningfulness implementation"
status: in_progress
---

# M2 Step 13 — sleep evidence gate

## 1. Goal / Why

Return a reproducible internal hold decision for a Step 12.1 sleep diff, with a reason that identifies the missing evidence and provenance for the inputs inspected.

## 2. Status / Authorization

The owner authorized the sleep evidence gate and a separate draft PR on 26-11-26. Positive promotion policy, Step 14, user-facing claims, merge and deploy require separate decisions.

## 3. Context / Sources

Branch `codex/m2-step13-sleep-meaningfulness` starts at verified remote main `e1884484ff40d6ae0df08f7e73bc62691dd07b9f` ([CI](https://github.com/ipastin/phisys/actions/runs/39733379736)). It contains [PR #13](https://github.com/ipastin/phisys/pull/13) merge `ef41f66e21041910506a66515f8139c2657d8c44` ([post-merge CI](https://github.com/ipastin/phisys/actions/runs/39727205542)). No later P1/P2 were published as of preflight. [PR #12](https://github.com/ipastin/phisys/pull/12) at `04ba5229e1e6be7229d1822bb75867ff8c68c1a6` is decision context alongside [PR #10](https://github.com/ipastin/phisys/pull/10).

Authorities: [SOURCE_OF_TRUTH](../../docs/SOURCE_OF_TRUTH.md), [PLANS](../PLANS.md), Project Spec v0.4.0 Analytics §§6–11, 13–18, 22, ADR-060/064/067–071, Implementation Steps 12–14 and Evals A13/A17/A20. PR #12 records T1, D1 and the consumer boundary.

## 4. Scope / Non-goals

One internal decision for `sleep_duration`. Partial A17 and slice-specific A20 evidence. Ranking, positive promotion, clinical claims, history replay and structural domains remain future scope.

## 5. Invariants / Architecture impact

One person-scoped read covers 28 reference and 7 current local dates. The runtime validates and copies the request before awaiting the read, captures the trusted UTC instant once after it, and derives both analyses from those rows. Step 12.1 keeps its 14-date query and exact D1 behavior. `knowledgeAsOf` remains `unavailable`. Reader, RLS, grants, read-only transaction and Raw payload denial are inherited. The pure fixture path assumes rows already scoped by the trusted caller.

## 6. Files and dependencies

`packages/analytics/src/index.ts` reuses the sleep diff, baseline v1, Quality, input fingerprint and scoped reader. `packages/analytics/test/meaningfulness.test.ts` covers the pure gate and runtime. `packages/analytics/test/integration.test.ts` verifies the real reader and lineage against a disposable database.

## 7. Milestones / Concrete steps

Verify remote main and review → define hold reasons and implement → test pure decisions and one-read composition → run local checks and DB suite → publish a draft PR and verify CI on its head.

## 8. Validation / Acceptance

Synthetic cases cover zero, tiny delta with usable baseline, isolated outlier, source transition, limited and insufficient Quality, inadequate or blocked baseline, missing persistence, rejected caller substitution, and correction/support revisions. Check exact reason codes and deterministic lineage. Verify one runtime read, one trusted timestamp, current and reference bounds, and second-person isolation. Run lint, format, typecheck, tests including architecture, disposable PostgreSQL tests and build. Record the draft PR head and CI in the PR.

## 9. Progress

- [x] 26-11-26 Europe/Moscow: verified remote base, CI and PR #13 findings, checked sources and created implementation branch.
- [x] 26-11-26 Europe/Moscow: implemented the hold policy, shared-input calculation and synthetic acceptance cases.
- [x] 26-11-26 Europe/Moscow, cwd repository root: lint, format, typecheck, full tests (58 analytics unit, 19 architecture), build and disposable PostgreSQL 16 suite (28 tests across database, ingestion, connectors and analytics) passed against the implementation in this revision. Local Node 24.17.0 and pnpm 12.13.0. Fixed a test-only lint error before the successful full run.
- Draft PR body records exact head and CI evidence for the published revision.

## 10. Decision log

26-11-26: compose from one scoped read. Joining separately retrieved analyses by time or identity labels cannot prove they observed the same revision. Positive promotion would require approved Quality and magnitude policy, evidence for persistence, baseline and source handling, and an explicit owner decision.

## 11. Surprises / Open questions

The existing lagged baseline includes the previous comparison week. Its direction and delta do not independently establish persistence. A13, full A15/A16/A20 and the rest of Step 13 remain open.

## 12. Recovery / Idempotence

Recompute from the same scoped input set and calculation instant for repeatable tests. Keep the legacy Step 12.1 endpoint and compare its fixture results during regression checks.

## 13. Outcomes / Retrospective

The runtime returns `held` with versioned reasons. Unchanged, blocked, insufficient and incompatible diffs skip the baseline calculation. A numeric diff retains its signed delta and limitations, with checked reference coverage and baseline evidence or a reason explaining its absence. A usable baseline leaves persistence unavailable. The input contract accepts dates only and composes fresh evidence from the same read.

Partial A17 and decision-level A20 have synthetic coverage. Structural Step 12, positive promotion, ranking, persistence (A13) and Step 14 remain `needs_review`. Real-data evaluation, historical replay and deployed behavior are `not_run`.
