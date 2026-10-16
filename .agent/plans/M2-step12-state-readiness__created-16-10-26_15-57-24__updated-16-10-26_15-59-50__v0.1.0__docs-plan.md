---
title: MyPhisys — M2 Step 12 State Snapshot/Diff readiness
created: "16-10-26 15-57-24"
updated: "16-10-26 15-59-50"
timezone: Europe/Moscow
version: 0.1.0
commit: "docs(plan): draft M2 Step 12 state readiness"
status: draft
---

# M2 Step 12 — State Snapshot/Diff readiness

## 1. Goal / Why

Choose a first, verifiable Step 12 slice before implementation. A snapshot must state *whose* state, *which* domains and effective time it represents, what the system knew at calculation, and which source facts support it. A diff must distinguish a supported change from missing data, correction of an earlier claim, and a source transition. The first slice is not completion of Step 12.

## 2. Status / Authorization

`draft`, owner: Igor Pastin. The owner authorized this docs-only readiness branch and PR. This plan proposes options; none is approved for code. No Step 12 implementation, schema change, source-pack rewrite, PR #10 merge/closure, merge of this PR, or deploy is authorized by this task. The next implementation PR needs the owner's chosen slice and any required data-model/security decisions. The existing Step 11 authorization in [PR #10](https://github.com/ipastin/phisys/pull/10) does not extend to Step 12.

## 3. Context / Sources

Read-only check on 16-10-26: checkout was clean on `codex/m2-step11-sleep-period` at `c29535997f1b6e121685546efe0361920d55ea4c`. GitHub's `main` branch API and local `origin/main` both identified `c266de4d61b50caef3a59abdbd65ca73126b3928`; [PR #11](https://github.com/ipastin/phisys/pull/11) was merged at that commit. [PR #10](https://github.com/ipastin/phisys/pull/10) remains open/draft at `1142bda011fae5fd9c8af350ff15b20eb61c1126`. This branch starts at `c266de4`. Local `main` itself was behind; it was not edited. A local `git fetch` could not write `.git/FETCH_HEAD` in the initial sandbox; remote state was checked through the GitHub connector before branching.

Authority: [source index](../../docs/SOURCE_OF_TRUTH.md), [ExecPlan contract](../PLANS.md), root [AGENTS](../../AGENTS.md), Project Spec v0.4.0 [00 README](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [14 AGENTS](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [02 ARCHITECTURE](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [03 DATA MODEL](../../docs/project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–5, 9, 13–20, [04 ANALYTICS](../../docs/project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–5, 13–18, 21–22, [13 ADR](../../docs/project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) ADR-056/057/062–064/067/068/071, [11 IMPLEMENTATION](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) Steps 08–14, and [12 EVALS](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) A15/A16/A20. The source index notes unresolved normative status wording for ADR-151–170; this proposal does not rely on them.

The actual source of behavior is [M1 schema](../../packages/database/migrations/0001_up.sql), [analytics role grants](../../packages/database/migrations/0002_up.sql), [sleep reader](../../packages/database/src/analytics.ts), [ingestion](../../packages/ingestion/src/index.ts), [M2 analytics](../../packages/analytics/src/index.ts), and their [DB](../../packages/analytics/test/integration.test.ts) and [golden](../../packages/analytics/test/quality.test.ts) tests. The [Step 11 implementation plan](M2-step11-sleep-period-implementation__created-16-10-26_13-23-43__updated-16-10-26_13-59-10__v0.1.3__docs-plan.md) records its narrower contract and limits.

## 4. Scope / Non-goals

This PR changes this ExecPlan only. It defines the first-slice decision, semantic contracts, dependencies, negative cases, and acceptance evidence. It does not add a snapshot table, change permissions, create a `clinical-state` package, expose a product API, or assert that existing sleep period comparison is a State Diff. No LLM, clinical interpretation, risk score, UI, or real health data is involved.

Step 12 as specified is broader than any narrow initial slice: `conditions`, `medications`, `allergies`, `goals`, `metric states`, `recent events`, `conflicts`, `data quality`; its diff includes structural added/removed/changed state, new events, medication and metric changes, and conflicts. A sleep-only slice must be labelled **partial Step 12**, with A15/A16 full-contract coverage still `needs_review`.

## 5. Invariants / Architecture impact

### Time and identity contract common to every option

- Snapshot identity: `personId` + explicit domain scope + effective cutoff/window + algorithm/profile version + input revision/identity. Two snapshots with the same period but different input revisions are distinct calculations. Diff requires same person and compatible scope/profile; otherwise return `incompatible`, never compare them silently.
- `observed_at` belongs to each underlying fact: preserve its original `effective` temporal kind/precision (`LocalDate` is not an invented UTC midnight). For a snapshot, name its logical effective boundary `state_at` or a dated window; do not overload source observation time as calculation time.
- `calculated_at` is the actual computation instant, recorded separately with algorithm, version, parameters and sorted input fact IDs. It is not a historical knowledge cutoff. Recalculation after a correction can yield a different retrospective result for the same `state_at`.
- `knowledge_as_of` means what Canonical/Raw state the system knew at a past transaction instant. It is **unavailable today**: `health.fact.state` is updated in place on correction/invalidation, conflict resolution has no transition timestamp, and `readCurrentSleepFacts` reads only current facts. `QualityWindow.asOfDate` is a local-date evaluation/freshness parameter, not `knowledge_as_of`. None of A/B may advertise historical as-of. Option C requires a versioned history/ledger decision and tests before that claim.
- Missing or unimplemented domain is `unknown`/`unavailable`, not an empty set or `removed`. Only an explicit, validated lifecycle event with no remaining active support can justify `removed`; correction is a revised assertion, not automatically a health-state event. Diff compares semantic value/state by stable event identity, not raw ID, ingest order or `calculated_at` alone.
- Each output, including a suppressed diff, carries Quality (`sufficient / limited / insufficient`, reasons, coverage/freshness where applicable, conflict and source continuity), per-fact Canonical→Raw→Source lineage, input IDs, algorithm/profile versions, parameters and calculation time. No unsupported numerical or structural claim is emitted when provenance, identity or continuity is uncertain.
- DB reads stay person-scoped under RLS, `SET LOCAL ROLE myphisys_analytics`, `BEGIN READ ONLY`, and column-level grants. Raw payload, cross-person rows and Canonical/Raw writes remain forbidden. Existing `withPerson` is a write-capable domain transaction helper and is not a substitute for this analytics boundary.

### What exists and what is a dependency

| Capability | Verified current state | Step 12 implication |
| --- | --- | --- |
| Canonical facts | `health.fact` holds Observation/Symptom, `event_key`, `effective`, `recorded_at`, `ingested_at`, epistemic/verification, state, `supersedes_id`, `origin_raw_id`; `health.event` is an index. | Fact/event identity exists in schema, but not a full Condition/Medication/Allergy/Goal state model. `health.event` has no analytics SELECT grant. |
| Corrections/deletes | M1 retains superseded fact rows and immutable Raw; tombstones can invalidate current facts, with other live support preserving them. | Current status is mutable, so past knowledge cannot be reconstructed from `state='current'`; explicit event lifecycle and transition history need design for true historical snapshots. |
| Conflicts | `health.conflict` records unresolved claims; sleep reader returns an unresolved-conflict flag for a current fact. | Analytics role cannot currently read `event_key`, conflict ID/type/time, fact `recorded_at`/`ingested_at`/`supersedes_id`, or `health.event`; structured diff needs scoped grant/reader changes and a decision on conflict identity. |
| Sleep metric | Step 11 yields adjacent seven-date median comparison, nested Quality and per-fact Raw support, algorithm/profile versions and `calculatedAt`. | Reuse as one metric-state input, not as the whole snapshot or a persistence/meaningfulness signal. Exact duplicate receipt count is `unavailable`, never zero. |
| Read boundary | `readCurrentSleepFacts` validates UUIDv7, runs a read-only person-scoped transaction, filters active Raw support and excludes quarantined tombstones; DB tests cover isolation/write/payload denial. | Reuse the boundary pattern. Any broader reader must get minimum columns only, with allowed/forbidden DB regressions. |

## 6. First-slice alternatives and decision

All options preserve the common contract above. They vary in scope and what can honestly be proven first.

| Option | Snapshot, identity and time | Diff, Quality and Raw lineage | Trade-off |
| --- | --- | --- | --- |
| **A — sleep metric-state pair (recommended first)** | Two retrospective, current-knowledge snapshots for the previous and current closed seven-local-date windows. Identity is person + `sleep_duration` + window + metric profile/input IDs. `observed_at` is each fact's LocalDate; `calculated_at` is the comparison instant; `knowledge_as_of` stays unavailable. Structural fields are explicitly `unavailable`, not empty. | Reuse Step 11 Quality and per-fact fact→Raw→Source mapping. Emit a descriptive metric-state `changed` only for qualified pairwise median delta; unchanged when equal; otherwise `insufficient/unknown` with reason. A correction/retry/support swap changes provenance and can trigger recomputation, but an unchanged median is not a physiological change. | Smallest safe vertical slice and existing tests/reader. A15/A16 only partial; no added/removed structural state, medication or event diff. A later full Step 12 dependency remains explicit. |
| **B — Observation/Symptom current-knowledge state** | Snapshot current Canonical Observation/Symptom identities at an effective boundary. Stable identity must use person + scoped `event_key`/canonical concept and explicit period; fact ID alone makes correction look like add/remove. `observed_at` preserves each fact's temporal kind; `calculated_at` is distinct; historical `knowledge_as_of` remains unavailable. Conditions/medications/allergies/goals stay `unavailable`. | Added/changed/new event and explicit invalidation can be compared only between two captured input sets; absent-from-query is `unknown`, not removed. Conflicts yield a qualified/blocked item. Every included fact resolves to active Raw support. Introduce a scoped reader/grants and domain Quality; test missing-vs-removed and false suppression. | Closer to structural A15/A16, but requires DB migration, stable identity rules, read permissions and lifecycle semantics before code. It still cannot claim full clinical state or historical as-of. |
| **C — full structural and historical state foundation** | Full specified domains plus effective-time state and separately versioned `knowledge_as_of`; each snapshot is person + scope + effective cutoff + knowledge revision/instant + algorithm version. `observed_at` stays per source fact; `calculated_at` is audit metadata. | Deterministic added/removed/changed/new-event/medication/metric/conflict diff with domain Quality and per-fact Raw lineage. Explicit transition history, correction/tombstone policy and replay are prerequisites; tests compare what was knowable before/after late imports. | Most faithful to full Step 12 and A15/A16/A20, but it is a cross-domain schema/security project and waits for near-term domain entities and an owner decision on historical representation. Highest implementation and migration risk. |

**Recommendation:** approve A only as `Step 12.1 metric-state slice`, then decide B/C separately. A validates a snapshot/diff envelope and Quality/provenance composition without pretending that a period comparison already supplies clinical state. Do not introduce a generic framework merely to fill unknown fields. If the owner needs medication/condition changes in the *first* release, choose B only after defining those domain models; otherwise C is the coherent full-contract path. A broader claim from a sleep-only implementation would fail A15/A16.

## 7. Files and dependencies

No implementation file changes in this PR. For A after approval: [analytics implementation](../../packages/analytics/src/index.ts) and [golden tests](../../packages/analytics/test/quality.test.ts) own pure snapshot/diff composition; [DB tests](../../packages/analytics/test/integration.test.ts) verify person isolation, source lifecycle and stable repeated reads. Reuse [sleep reader](../../packages/database/src/analytics.ts) and existing package exports/scripts, synthetic fixtures, CI. Search new and existing callers/exports again at implementation time. No new dependency or migration is expected for A.

B depends on a scoped change to [analytics DB role](../../packages/database/migrations/0002_up.sql) with matching down migration, a new minimum-column person-scoped reader, tests for grants/RLS, stable event identity, and an explicit snapshot capture/compare boundary. `event_key` is present physically but not exposed to analytics today. C further depends on canonical domain tables/models, transition history or immutable snapshot ledger, backfill/migration/recovery strategy, and privacy/security review. No existing caller outside analytics tests imports the current sleep functions; changing their result shape would still require checking all callers/tests/exports.

Dependency order: owner selects A/B/C and temporal/identity semantics → if B/C, approve affected canonical/security design → implement schema/reader boundary (if needed) → pure projection and diff → golden A15/A16/A20 cases and negative cases → disposable-DB regressions → exact-head PR CI → owner review. M2 Step 13 Meaningfulness and Step 14 What Changed may consume only qualified Step 12 output, not inferred completeness.

## 8. Validation / Acceptance

The [EVALS](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) names A15 snapshot, A16 diff and A20 derived provenance, but does not supply executable fixtures. Add synthetic fixtures with expected outputs rather than mark the labels passed by association. For A, record **partial** A15/A16; full A15/A16 needs structural cases, while A20 requires algorithm/version/parameters/input IDs and per-fact Raw support for every derived item.

Required implementation cases after decision:

1. Determinism: same person, scope, inputs, algorithm/version/parameters and calculation instant yields equal sorted output regardless of input order. Cross-person or incompatible scope/profile is rejected.
2. Stable complete/shifted sleep periods produce unchanged/changed metric state; a valid isolated outlier or support-only change does not invent a meaningful physiological change. Do not suppress a qualified shifted comparison merely because inputs are unverified or stale when Quality policy permits a limited descriptive result.
3. Missing date/whole period, overlap, invalid fact, unresolved conflict, no active Raw support and unproven connector continuity return qualified/insufficient output without a false change. `missing`/`unknown` cannot become `removed` or zero.
4. Exact retry cannot inflate facts/lineage; same-value additional support changes provenance but not semantic value; correction updates the current projection and must not be mislabelled as an observed health event; a tombstone with other support preserves the fact; final support removal makes it unavailable or explicitly removed only where lifecycle evidence proves removal.
5. Temporal cases include timezone/DST LocalDate, late import, corrected old effective date, `observed_at` versus `calculated_at`, and a negative test proving `QualityWindow.asOfDate` does **not** implement historical `knowledge_as_of`.
6. DB boundary: second person's facts and Raw payload are unreadable; writes to Raw/Canonical are denied; read role and transaction remain read-only. New columns, if any, have least-privilege grants and matching down migration.
7. Full Step 12 future gate: conditions, medications/regimens, allergies, goals, metric states, recent events and conflicts are represented; structural added/removed/changed, new events and medication changes are deterministic; A15/A16/A20 pass with real executable expected outputs.

For this docs-only PR, verify all 13 ExecPlan sections, metadata/relative links, one-file scope and `git diff --check`; inspect the exact PR diff/head and CI for that head. Product behavioral checks are `not_run` by design. A green docs PR CI does not prove A15/A16/A20.

## 9. Progress

- [x] 16-10-26 15-57 Europe/Moscow: read-only branch/status/source/code/tests inventory and live PR/main checks.
- [x] 16-10-26 15-57 Europe/Moscow: fresh `codex/m2-step12-state-readiness` branch from verified `origin/main` `c266de4`.
- [x] 16-10-26 15-57 Europe/Moscow: draft alternatives and acceptance matrix in this plan.
- [x] 16-10-26 15-59 Europe/Moscow: all 13 sections, metadata, 25 relative links, trailing whitespace, final newline and absence of local absolute paths checked. Final Git diff review follows staging.
- [ ] Commit, push, open docs-only PR, then check exact-head CI.
- [ ] Owner selects first slice and resolves any domain/time/identity decision before implementation.

## 10. Decision log

16-10-26: A/B/C compared above; **A is recommended, not approved**. Reason: A can use the verified current sleep reader and Quality/provenance without new Canonical schema or unsupported historical claims. B advances structural semantics but needs identity and role changes. C addresses full historical state but needs additional domain models and an immutable transition strategy. Owner decisions requested: (1) A, B or C first; (2) whether the product requires historical `knowledge_as_of` in the first delivered slice; (3) for B/C, stable event identity and explicit removal evidence policy. The full source-pack/ADR status question remains separate.

## 11. Surprises / Open questions

- `asOfDate` in sleep Quality is a local-date freshness/evaluation control, not historical transaction-as-of. Naming it `knowledge_as_of` would falsely certify past state.
- `health.fact` retains old rows, but mutable `state` and untimed conflict resolution prevent reconstruction of what was known at a past transaction instant. Ingestion `recorded_at`/`ingested_at` alone do not fix this.
- The source pack describes near-term Condition/Medication/Allergy/Goal entities; physical M1 schema implements Observation/Symptom only. `health.event` is an index, not a complete clinical-state model.
- Connector identity is available for sleep Quality; physical device/method continuity within a connector is not proven. Exact duplicate receipt count is unavailable after deduplication.
- PR #10 remains draft/open while PR #11 is merged. The accepted Step 11 behavior is evidenced by merged code, but its planning PR is not an approval for new Step 12 semantics.

## 12. Recovery / Idempotence

This PR adds one Markdown file. Re-run link/metadata checks without touching source packs or `main`. If `main` advances before implementation, re-check remote SHA and the actual readers/grants; do not transplant stale assumptions. A later implementation gets its own fresh branch/PR. If docs change, update `updated`, SemVer, Conventional Commit metadata and filename together, then update incoming links.

## 13. Outcomes / Retrospective

Readiness outcome: a reviewable first-slice choice, exact dependencies and negative acceptance cases. Step 12 behavior, A15/A16/A20 executable results, and product outcome are `not_run`/`needs_review` until implementation. PR URL/head/CI evidence will be added to the PR handoff after creation; this draft's merge and deploy remain separate decisions.
