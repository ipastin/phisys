---
title: MyPhisys — M2 Health Intelligence ExecPlan
created: "15-10-26 23-33-44"
updated: "15-10-26 23-43-32"
timezone: Europe/Moscow
version: 0.1.3
commit: "docs(plan): record M2 draft PR"
status: draft
---

# M2 Health Intelligence — planning/readiness

## Goal / Why

Подготовить проверяемый путь от подтверждённых M1 canonical facts к детерминированным, воспроизводимым `InsightCandidate` для `What Changed`, без LLM и clinical interpretation. Наблюдаемый результат **M2.0** — самостоятельный draft ExecPlan и docs-only PR для review. Ниже Steps 08–14 — **план будущей implementation**, а не выполненные возможности.

## Status / Authorization

`draft`, owner: Igor Pastin. Запрос 15-10-26 разрешает M2.0 planning/readiness, новую `codex/*` ветку и docs-only draft PR. Он не разрешает M2 implementation, merge или deploy. После review владелец выбирает scope и отдельно запускает первый slice. Изменения canonical model, clinical semantics, safety/privacy, accepted ADR или утверждённого UX требуют отдельного решения с trade-offs до соответствующего кода.

## Context / Sources

- Repository `ipastin/phisys`; `git fetch origin main` выполнен 15-10-26. `origin/main` = `ade7b91548c7a038c264681070ab9ee87d819a13`, merge M1 PR #5. Предыдущий checkout `codex/m1-health-data-pipeline` был чистым и имел то же дерево, что `origin/main`; ветка `codex/m2-health-intelligence-planning` создана **от `origin/main`**, HEAD до этого документа = тот же merge SHA. Это проверка текущего состояния, а не предположение из запроса.
- Прочитаны [root AGENTS](../../AGENTS.md), [SOURCE_OF_TRUTH](../../docs/SOURCE_OF_TRUTH.md) и [ExecPlan contract](../PLANS.md). Current Project Spec Pack `0.4.0`: [00 README](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§5–7; [14 AGENTS](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–4, 7–10, 17–18, 21, 24; [02 ARCHITECTURE](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–6, 9–12; [03 DATA MODEL](../../docs/project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–9, 13–21; [04 ANALYTICS](../../docs/project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§1–22; [13 ADR](../../docs/project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) ADR-005–011, 054–074; [11 IMPLEMENTATION](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §8 Steps 08–14; [12 EVALS](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–6, 16–17. Pack files are read-only sources.
- [M1 approved plan](M1-health-data-pipeline__created-15-10-26_18-06-16__updated-15-10-26_18-20-16__v0.2.0__docs-plan.md) explains approved D1–D3; [M1 implementation evidence](M1-implementation__created-15-10-26_18-31-17__updated-15-10-26_20-42-43__v0.2.3__docs-plan.md) is historical and still says `in_progress`; the merged code and current Git ref decide what exists now. `SOURCE_OF_TRUTH.md` also retains pre-merge language about absent application code. Treat these as documentation drift, not authority to change source packs in M2.0.
- Relevant ADRs 054–074 are individually marked `Accepted` and predate ADR-151; `SOURCE_OF_TRUTH` still records an **unresolved status-header ambiguity** for ADR-151–170. M2 should not depend on the latter until owner confirms their status.

## Scope / Non-goals and alternatives

| Option | M2 implementation scope after approval | Trade-off |
| --- | --- | --- |
| **A — staged, one dense metric first (recommended)** | First slice reads synthetic `sleep_duration` current facts and produces typed Metric Registry + Quality output; then complete the same metric through baseline/trend, supported-state diff, meaningfulness and `What Changed`, adding other initial metrics only when their metric-specific golden cases pass. | Fastest proof of M1→M2 boundary, small review surface and honest insufficient-data behavior; initial coverage is intentionally narrow. |
| **B — all five initial metrics in parallel** | Define `sleep_duration`, `resting_heart_rate`, `steps`, `weight`, `hba1c` profiles, quality and later Steps 10–14 together. | Closer to ANALYTICS §20 MVP breadth; more simultaneous temporal/unit/source policy decisions. M1 has neither `hba1c` nor `resting_heart_rate` canonical concept: both require a separate model/semantic decision before implementation. Generic `heart_rate` cannot be relabelled resting HR. Higher false-insight/rework risk. |
| **C — full clinical-state slice now** | Add conditions/medications/allergies/goals plus complete point-in-time state and diff before Step 14. | Broader `What Changed`; M1 lacks these canonical entities, so this requires new canonical model, ingestion and clinical semantics decisions outside M2's allowed boundary. Do not start without a separate decision/plan. |

Recommendation: **A**, with a first vertical slice `M1 persisted synthetic sleep facts → person-scoped read → metric definition → quality result with evidence/provenance`. It must return `insufficient` or `limited` with explicit reasons when coverage/source continuity fails; it does not emit an insight yet. Continue down Steps 10–14 only after the upstream contract is verified. No production auth, real health records, UI, cloud provisioning, deploy, LLM, clinical thresholds or health risk score in M2.0 or the recommended implementation scope. Correlation/association, forecasting, notifications and free-form clinical prose are also excluded by ANALYTICS §§12, 15–17 and ADR-065/073.

## Invariants / Architecture and data boundary

```text
M1 Source/Raw (immutable) → validated Canonical health.fact + health.provenance
  → person-scoped current-fact read (never a client/agent SQL capability)
  → typed metric profile → quality gate → deterministic Derived result
  → state diff + metric change candidates → reason-coded InsightCandidate
```

- Canonical records are inputs, never overwritten by analytics. Derived results are calculated facts, not verified clinical facts or AI inference (INV-005–008, 013; ADR-005/006/009/067–071). Each output includes quality and deterministic lineage: algorithm/version/parameters, metric-definition version, input fact IDs **and versions/supporting source IDs when relevant**, evaluation window and `calculated_at` as metadata. Repeated runs compare semantic payloads under a fixed clock; a changed input/version invalidates or recomputes a cached result. First slice can compute on demand and avoid an `analytics` schema until persistence has a consumer.
- Read only person-scoped, current, valid canonical facts for the first analytics slice. Respect `effective` precision and period versus point time; `recorded_at` and `ingested_at` are separate and cannot be substituted for measurement time. `unknown`, invalid/quarantined, superseded and unresolved-conflict cases cannot silently become measurements. Never infer zero, normal or absence from missing dates (INV-007; ADR-009/057/062). Person-scoped RLS does not itself make access read-only: the analytics query must use an explicitly read-only DB boundary with a forbidden-write test (D-M2-5).
- Preserve `original` and optional `canonical` quantity/unit, source, method/measurement class, provenance and verification. `health-core` currently has a concept allowlist, **not** a Metric Registry. Device/source transitions must be segmented, qualified or suppressed until compatibility is proven; mere connector-ID change in the M1 fixture does not prove method equivalence (ADR-054–056/063). No generic clinical normal range, clinical target or goal is inferred from a personal baseline (ADR-058–061).
- `Health State Snapshot` starts as an effective-time projection **under current knowledge** from facts/events actually present. M1 mutates fact `state` on supersession and has no conflict lifecycle timestamps, so it cannot prove a historical "what was known at time T" snapshot or conflict history. Step 12 must specify these two temporal axes before code; historical knowledge-as-of is `needs_review` and requires a separate lifecycle decision. M1 currently supports observations, symptoms, events and unresolved conflicts; conditions, medications, allergies and goals are not implemented. Their absence is `unsupported/unknown`, not an empty healthy state. A richer snapshot awaits a separate canonical model decision. Analytics remains read-only over Raw/Canonical; no LLM, generic agent SQL, UI or outbound health-data flow (ARCHITECTURE §§3–6, 9).
- `Meaningfulness` is descriptive rule-based ranking with reason codes; no clinical severity, risk scoring, diagnostic/treatment advice, or push trigger. A candidate and a notification are separate decisions (INV-029; ADR-069/070).

## Files and dependencies (implementation map, **not** M2.0 edits)

| Locus | Existing input / prospective change and dependent callers/checks |
| --- | --- |
| `packages/health-core/src/index.ts`, `packages/health-core/test/core.test.ts` | Existing `conceptIds`, `TemporalValue`, `Quantity`, `FactValue`, `CanonicalInput`, validation. Reuse contracts; add a domain type only if analytics cannot express it locally without changing canonical semantics. `packages/ingestion/src/index.ts` and `packages/connectors/src/index.ts` are current callers of core; any changed export must preserve them and their tests. |
| `packages/database/migrations/0001_up.sql`, `packages/database/src/index.ts`, `packages/database/test/integration.test.ts` | Existing `health.fact`, `health.provenance`, `health.event`, `health.conflict`, `source.raw_record`, `withPerson` and RLS. `withPerson` returns a domain `PoolClient` with write grants, so it is **not** a read-only boundary. First slice needs a scoped read mapping that joins source support and filters current state, plus two-person/forbidden-row/**forbidden-write** tests after D-M2-5. Do not edit M1 migration in place; if a new read role or later derived store is justified, add forward/down migration and lifecycle tests. Existing ingestion/connector DB tests remain callers of the schema. |
| `packages/ingestion/src/index.ts`, `packages/ingestion/test/golden.ts`, `golden.test.ts`, `integration.test.ts`; `packages/connectors/test/integration.test.ts` | Existing `ingest(pool, SourceRecord)` and deterministic 90-day M1 synthetic fixture. M2 can derive extra synthetic eval variants from it without changing import expectations; if fixture changes, update record counts/IDs and integration expectations together. No production analytics caller exists. |
| **Proposed** `packages/analytics/package.json`, `src/index.ts`, `test/*.test.ts` | Create only for first approved slice; typed metric profiles, quality, then pure baseline/trend/meaningfulness/What Changed functions in dependency order. Export only consumed public APIs. Use no new runtime dependency for basic calculations. |
| **Conditional Step 12** `packages/clinical-state/**` | Architecture assigns point-in-time projection to `clinical-state`. Create when supported snapshot/diff has a real consumer and scoped read contract; no empty package in Step 08. Coordinate exports/dependencies with `analytics`, avoid cyclic imports. |
| Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig.tests.json`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `tests/architecture/boundaries.test.ts`, `packages/architecture-guardrails/**` | Existing package glob and gates must include new source/tests/exports. Extend allowed/forbidden dependency graph without weakening guardrails. Only modify config that the new package actually requires; inspect scripts before changing. |

No `apps/` directory or production API/UI consumer exists on the merged M1 tree. A `What Changed` service in Step 14 is a domain entry point for later M3 UI, not a public endpoint. First slice needs person scope **and** a read-only database contract selected in D-M2-5; never pass an unscoped pool query or a domain write-capable client to analytics.

## Milestones / Concrete steps

Working directory for future commands: repository root. Dependency DAG:

```text
M2.0 plan/review
→ M2.1 Step 08 Metric Registry → Step 09 Quality
→ M2.2 Step 10 Baseline → Step 11 Trend/period comparison
→ M2.3 Step 12 State Snapshot/Diff
→ M2.4 Step 13 Meaningfulness
→ M2.5 Step 14 deterministic What Changed
```

| Step | Work after owner approval | Observable handoff |
| --- | --- | --- |
| 08 | Define versioned metric profile for `sleep_duration`: canonical concept/unit, measurement + temporal class, aggregation, source segmentation, quality and baseline/trend policies. Map M1 supported concept; do not invent source reliability scores. | Registry lookup accepts the supported metric and rejects unknown/mismatched concept/unit/method with typed reason; golden profile version is visible in output. |
| 09 | Read current M1 facts under person scope and D-M2-5 read-only boundary; compute coverage denominator from expected daily cadence, canonical sample count, freshness, missing periods, available invalid/quarantine evidence, source continuity/transitions and `sufficient/limited/insufficient`. Exact duplicate delivery receipts are not persisted by M1: report their count as `unavailable`, not zero. Define engineering quality cutoffs as versioned parameters and evaluate them on synthetic cases before an insight policy uses them. | First vertical slice: deterministic quality report and trace to fact/source IDs; no trend or candidate when insufficient. Two-person RLS and forbidden-write tests; duplicate ingestion must not inflate canonical sample count. |
| 10 | For eligible dense daily series, compute lagged rolling median plus MAD/IQR; evaluation window excluded from reference window. No clinical range; record windows and parameters. | Stable, step-change and contamination golden cases; sparse/insufficient returns typed insufficient, never a fabricated baseline. |
| 11 | Add daily aggregation, absolute/relative delta, descriptive direction and period comparison; sparse laboratory path reports latest/previous **delta** only until enough temporally relevant points. `hba1c` and `resting_heart_rate` need separate canonical concept/semantic approval, migration/allowlist support and synthetic cases before five-metric coverage is claimed; never rename M1 `glucose` or generic `heart_rate`. | Direction, outlier, two-point, timezone/DST and sparse cases; no `improving/worsening` default. |
| 12 | Build effective-time projection **under current knowledge** and deterministic diff over supported current facts/events. Explicitly mark unsupported structural domains; document how correction/supersession changes later recomputation. Do not claim historical knowledge-as-of or conflict change timing without a lifecycle decision and persisted timestamps. | Same inputs/effective cutoff produce same limited snapshot/diff; added/changed metric cases and current unresolved conflicts are surfaced without inventing their historical transition time; no false removal from missing data. |
| 13 | Apply persistent-change, quality, novelty and source-continuity rules; rank with stable tie-break and reason codes. Preserve a rejected-candidate audit in test/output so false suppression is measurable. | Isolated outlier and source switch suppressed/qualified; genuine sustained change survives; no risk score or clinical advice. |
| 14 | Compose `What Changed` from diff + eligible metric results into `InsightCandidate` fields (type, subject, period, derived facts, reason codes, nearby events, quality); deterministic ordering and bounded result. Safety boundary here means **no clinical interpretation** and no push, not a newly invented policy engine. | Golden output references evidence and says insufficient when appropriate; same inputs/version/clock give identical semantic candidates without model/network access. |

At each implementation step, inspect live callers/config, work on a new `codex/*` branch from then-current `main`, add the smallest meaningful tests, record actual checks against the exact head and open a reviewable PR. A later step cannot claim readiness because an earlier planned test exists.

## Validation / Acceptance

**M2.0 artifact checks:** source-to-plan mapping for every Step 08–14, links and required metadata/filename, docs-only diff, `git diff --check`, public-repository content scan, PR base/head and CI on exact head. These validate the plan artifact; product behavior remains `not_run`.

**Future implementation commands** (run only after explicit start, on a disposable synthetic DB where applicable): `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:architecture`, `pnpm build`; with a disposable PostgreSQL 16 and explicit `M1_DISPOSABLE_DB=1`, `pnpm test:db` plus targeted M2 DB integration/golden tests; `pnpm audit --audit-level high`, `git diff --check`. Use exact installed Node/pnpm or CI-pinned Node 24.22.0 / pnpm 12.13.0; do not label unavailable DB or unmatched runtime a pass. PR CI and review evidence must refer to the final implementation head.

| Acceptance / negative case | Synthetic proof required before Step 14 handoff |
| --- | --- |
| Insufficient coverage and missing week | Expected daily denominator and observed days explicit; missing ≠ zero; strong trend/insight suppressed with `insufficient` or qualified `limited`, not silent omission. |
| Source/device or method change | Segment/qualify/suppress unproven transition; preserve both provenance chains; compatible merge only with approved metric-specific evidence. |
| Sparse series and two points | Latest/previous delta allowed, persistent trend and interpolation disallowed; partial date/time cannot be invented. |
| Baseline contamination/outlier | Current 7-day example excluded from preceding 28-day reference; robust median/MAD/IQR resists isolated outlier. Windows are engineering defaults, not clinical thresholds. |
| Reproducibility and invalidation | Identical sorted inputs + profile/algorithm versions + parameters + fixed as-of produce identical semantic result; correction/tombstone/source support change recomputes or marks stale, never leaves a current false insight. |
| False insight and erroneous suppression | Versioned labeled golden cases include noise, source switch, persistent change and conflict. Measure false positives and missed meaningful changes separately; inspect each failure, do not minimize one metric by hiding all candidates. EVALS §5 gives no numeric release threshold, so set any threshold via owner-reviewed eval evidence rather than inventing a pass claim. |
| Provenance, person isolation and boundary | Each derived fact resolves to canonical input IDs/versions and supporting source/raw IDs; unknown/conflicting/quarantined/superseded records excluded or qualified; person B cannot read person A; analytics cannot write Canonical/Raw. |
| Snapshot/diff and What Changed | Fixed **effective cutoff under current knowledge**, reordered input and boundary timestamps produce stable limited output; corrections recompute past results. Historical knowledge-as-of and conflict transition time remain `needs_review`; no unsupported medication/condition treated as absent; candidate has quality/reason/evidence, no LLM/clinical claim/push. |

EVALS §4 golden cases A01–A17 and A20 are the mapping target where applicable to implemented scope; A18–A19 association/lag are later. M1's import golden tests do **not** prove M2 calculation accuracy. Future evidence must record command/action, cwd, exact commit SHA, Moscow timestamp, result (`pass`, `fail`, `not_run`, `needs_review`) and pointer to output/CI.

## Progress

- [x] 15-10-26 23-33 Europe/Moscow — fetched `origin/main`, verified `ade7b91548c7a038c264681070ab9ee87d819a13`, clean checkout and new branch from that SHA.
- [x] 15-10-26 23-33 — read root rules, ExecPlan contract, current Project Spec sections and merged M1 packages/tests/fixture; mapped M1 inputs and missing M2 consumer.
- [x] 15-10-26 23-40 — plan structure, metadata, links, scope-only status and requested negative-case coverage checked on working tree after independent review corrections.
- [x] 15-10-26 23-43 — docs-only draft [PR #6](https://github.com/ipastin/phisys/pull/6) opened against `main`; exact final head/CI is tracked in PR review evidence after this status update.
- [ ] Owner review of options/open decisions and separate start of first implementation slice.
- [ ] Steps 08–14 behavior checks: `not_run` (planning stage).

| Time, Europe/Moscow | Action / cwd / SHA | Result | Evidence |
| --- | --- | --- | --- |
| 15-10-26 23-32 | `git fetch origin main`; `git status --porcelain`; `git rev-parse origin/main`; repository root, base `ade7b91548c7a038c264681070ab9ee87d819a13` | `pass` | Fetch succeeded; clean original checkout; new branch created at exact merge SHA. |
| 15-10-26 23-40 | Python plan audit for 13 sections, six metadata keys, 13 resolving local links, trailing whitespace, local-path scan, requested cases, and single new file; repository root, working tree based on `ade7b91548c7a038c264681070ab9ee87d819a13` | `pass` | Command output: `PASS: 13 sections; metadata; local links; trailing whitespace; public-path scan; docs-only status; requested coverage`. Re-run after final metadata edit. |
| 15-10-26 23-39 | Independent read-only review of draft against M1 code and Project Spec; same base | `pass` for review process; findings corrected | Four findings: concept gaps, historical snapshot limit, duplicate receipt count, read-only DB boundary. No runtime test. |
| 15-10-26 23-43 | GitHub draft [PR #6](https://github.com/ipastin/phisys/pull/6), base `ade7b91548c7a038c264681070ab9ee87d819a13`, creation head `01d0f6c804d27cfe7784ccb7c9ccf3193c506411` | `pass` for PR creation | GitHub response: open, draft, one Markdown file; final head after this metadata commit must be verified separately. |
| Future implementation | `pnpm` gates and synthetic DB/evals on implementation head | `not_run` | M2.0 is documentation only. |

## Decision log

| Decision | Options / why | Status |
| --- | --- | --- |
| D-M2-1 scope, 15-10-26 | A staged single dense metric; B all five initial metrics; C full clinical state. A minimizes unverified semantics and still reaches a persisted-M1-to-quality vertical slice. Source: ANALYTICS §§20–22, IMPLEMENTATION §8, M1 code. | **Recommendation A; owner review required** before implementation. |
| D-M2-2 derived persistence, 15-10-26 | A compute on demand with provenance metadata; B introduce `analytics` tables now. A avoids stale/cache policy and schema migration before a consumer; B helps reuse but needs invalidation, RLS and lifecycle semantics. Source: DATA MODEL §§2, 20–21; ADR-071; M1 schema. | Recommend A for Step 08–09; revisit at first measured persistence consumer. |
| D-M2-3 source transition, 15-10-26 | A conservative segment/qualify unknown compatibility; B merge all connectors. A avoids false shifts; B gives more coverage but may fabricate change. Source: ANALYTICS §3, ADR-063, M1 fixture. | Recommend A. Any method/source equivalence rule needs metric-specific evidence and review. |
| D-M2-4 snapshot breadth, 15-10-26 | A M1-supported facts/events with current conflicts explicitly qualified; B add full structural domains now. A is honest and small; B crosses canonical/clinical boundary. Source: DATA MODEL §§5, 17–18; M1 schema. | Recommend A. B requires separate owner decision and model/ADR plan. |
| D-M2-5 analytics DB rights, 15-10-26 | A dedicated person-scoped read-only DB role and query adapter; B transaction-level `READ ONLY` through a restricted helper using the current role. A enforces least privilege in DB but requires an additive migration/grants/RLS test; B has a smaller diff but relies on every caller using the helper. Source: ARCHITECTURE §9; M1 `withPerson` and DB grants. | Recommend A. **Safety/access decision required before persisted-M1-to-M2 slice**; either option needs forbidden-write and cross-person tests. |

Accepted ADR/invariant choices are constraints, not new votes. Exact engineering parameters for coverage, freshness, persistence and magnitude are **unapproved** until synthetic eval calibration; they cannot be smuggled into clinical thresholds or treated as health risk scoring.

## Surprises / Open questions / owner decisions

1. **Canonical model / clinical semantics:** Decide separately whether and when to add conditions, medications, allergies and goals to M1's model. Until then Step 12 marks them unsupported; no empty/healthy inference. `resting_heart_rate` and `hba1c` are absent from M1 concept allowlist/seed; adding them needs explicit concept, measurement-context, unit and validation decision. Generic `heart_rate` and `glucose` are not substitutes. Changing `FactValue`, temporal semantics, identity or clinical interpretation also needs separate decision with 2–3 options and eval impact.
2. **Safety/privacy and UX:** Any risk classification, clinical thresholds, treatment/diagnosis wording, auto-notification, new health-data egress, user-facing IA or approved UX change requires separate decision. M2 candidate output alone does not authorize any of these.
3. **Accepted ADR:** `SOURCE_OF_TRUTH` §Open questions flags status ambiguity for ADR-151–170. This plan relies on earlier ADR-054–074 and does not reinterpret the later set. If implementation needs a later ADR, obtain explicit owner clarification/addendum first.
4. **Measurement mapping and temporal history:** M1 golden fixture contains sparse `glucose` and generic `heart_rate`; neither proves the §20 `hba1c` or `resting_heart_rate` semantics. Before claiming five-metric coverage, resolve the canonical gates above, then add synthetic inputs/expected outputs; no lab trend from two values. M1 source transition uses connector change, with no verified method-compatibility metadata. Quality should report that uncertainty rather than claim a device-calibrated continuity score. M1 mutates current/superseded fact state and does not timestamp conflict lifecycle; full historical knowledge-as-of requires a separate model/lifecycle decision.
5. **Status drift:** `SOURCE_OF_TRUTH` and M1 implementation evidence predate PR #5 merge. Reconcile them in a separate narrow documentation update if useful; do not change source packs or expand this docs-only PR without review.

## Recovery / Idempotence

Plan is a single new Markdown file; rerun links/metadata checks before pushing. Do not reset or clean another contributor's checkout. Future read-only M2 computation can be retried with fixed input IDs/version/as-of; if it later persists Derived data, stale/invalidation and migration rollback must be tested on a disposable synthetic database before use. Preserve original Raw/Canonical data and existing M1 validation paths. A failed step remains `fail`/`not_run`, not an inferred pass.

## Outcomes / Retrospective

M2.0 deliverable is the standalone draft and docs-only [PR #6](https://github.com/ipastin/phisys/pull/6), reviewable after the final head/CI check. Source map and artifact checks are recorded above; M2 runtime behavior remains `not_run`. Next authorized work, after owner selects D-M2-1/D-M2-5 and starts implementation, is the Step 08–09 vertical slice with one synthetic `sleep_duration` metric and quality gate.
