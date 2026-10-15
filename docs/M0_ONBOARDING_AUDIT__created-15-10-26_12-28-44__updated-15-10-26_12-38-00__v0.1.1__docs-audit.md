---
title: MyPhisys — onboarding audit для review M0 plan
created: "15-10-26 12-28-44"
updated: "15-10-26 12-38-00"
timezone: Europe/Moscow
version: 0.1.1
commit: "docs(audit): localize M0 onboarding review"
status: draft
---

# M0 onboarding audit

## Назначение и scope

Это read-only audit как доказательная база для отдельного review M0 plan. Он не даёт разрешения на реализацию, установку dependencies, merge или deploy. Ниже сначала перечислены проверенные границы, затем открытые решения и условия перехода к M0.

This is the read-only onboarding result and the evidence input to the separate
[M0 Foundation review draft](../.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_12-38-00__v0.1.1__docs-plan.md).
It does not authorize implementation, install, merge, deploy, or a change to the imported source packs.

## Checkout и источники

| Check | Result | Limit |
| --- | --- | --- |
| `git status --short --branch`, `git rev-parse HEAD` | `codex/m0-plan-review`, clean at branch creation; base `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a` | Recheck before an implementation PR; this audit branch will acquire documentation changes. |
| `git remote -v`, GitHub compare | `origin` points to `https://github.com/ipastin/phisys.git`; GitHub connector подтвердил `main` = `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a` (`identical`). | `git ls-remote` из shell не прошёл из-за DNS; branch protection не проверена. |
| Manifest membership | Project `0.4.0`: 18/18 Markdown documents; Design `0.2.0`: 28/28 | Presence check only. Previous ZIP byte/CRC review is reported by [SOURCE_OF_TRUTH, Current releases](SOURCE_OF_TRUTH.md#current-releases-и-provenance), not repeated here. |
| Repository inventory | No `package.json`, workspace/lockfile, `apps/`, `packages/`, test runner, or `.github/workflows/` in the tracked checkout | No application or CI check can be called passed. |
| `node --version`, `pnpm --version` | Local `v24.17.0`, `12.13.0` | The proposed M0 Node pin is `24.22.0`; local/CI parity remains untested. |

Source authority: [Project `00 README`, §5](project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md),
[Project `14 AGENTS`, §2](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md),
and [Design `00 README`, §7](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).
The [source index](SOURCE_OF_TRUTH.md) is a registry, not a replacement specification.

## Architecture boundaries и критичные invariants

The system path is Source/Connector → Raw → validation/identity/dedupe → Canonical →
deterministic state/analytics → InsightCandidate → safety/context → bounded agent/claims → UX.
Raw, Canonical, Derived, and Inferred are distinct planes. The intended system style is
modular monolith plus workers, with PostgreSQL as system of record.
See [Project `02 ARCHITECTURE`, §§1–5, 10](project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
and [Project `03 DATA_MODEL`, §§1–4](project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

The M0 boundary checker must begin with the following source-backed edges:

1. `health-core` cannot import provider, UI, connector/FHIR, or infrastructure implementations;
   analytics cannot write Raw/Canonical data. [Project `02 ARCHITECTURE`, §9](project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
2. Connectors write only Source/Raw; ingestion owns validation/mapping into canonical.
   [Project `09 CONNECTORS`, §1](project-spec/v0.4.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `14 AGENTS`, INV-002](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
3. LLM cannot write canonical state or promote inference to fact; runtime authorization and
   Tool Gateway validation happen outside the model. [Project `14 AGENTS`, INV-001/003/006/009/014](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `05 AGENT_RUNTIME`, §§8–9, 15](project-spec/v0.4.0/05_AGENT_RUNTIME__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
4. Persistent clinical facts require provenance and temporal/epistemic semantics; missing
   is not zero, normal, or negative. [Project `14 AGENTS`, INV-004/007/008](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `03 DATA_MODEL`, §§3–4, 8–9](project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
5. Derived analytics are reproducible and quality-gated; core Records/Timeline/What Changed
   remain useful without LLM. [Project `14 AGENTS`, INV-005/013/024](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `04 ANALYTICS`, §§1, 4–5, 15](project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
6. Model requests use capability aliases; fallback cannot weaken privacy. Ambient surfaces
   have restricted roles and independent disclosure permission. [Project `14 AGENTS`, INV-016/017/026–030](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `17 SURFACE_STRATEGY`, §§3–4](project-spec/v0.4.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-10-10-26_04-03-47__v0.4.0.md).

Design `0.2.0` reinforces facts before interpretation, unknown/stale/conflict as distinct
states, personal baseline versus clinical normal, and reachable provenance. These are
future UX gates, not M0 UI work. [Design `00 README`, §§2, 8](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md);
[Design `12 STATE_MATRIX`, §§2–3](product-design/v0.2.0/12_STATE_MATRIX_EDGE_CASES__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md);
[Design `17 TRUST`, §§3–6](product-design/v0.2.0/17_TRUST_PROVENANCE_SAFETY_UX__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).

## Последовательность milestones и gates

| Milestone | Required output | Next gate |
| --- | --- | --- |
| M0 Foundation | pnpm/Turborepo, strict TS, Vitest, boundary checks, CI | Fresh checkout + meaningful local/PR checks. [Project `11 IMPLEMENTATION`, §8 Steps 00–02](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M1 Health Data Pipeline | Database, canonical core, deterministic synthetic profile, idempotent ingestion, manual connector | Provenance, temporal, missingness, conflict and connector contract checks. [Project `11 IMPLEMENTATION`, §8 Steps 03–07](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§3, 6, 11](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M2 Health Intelligence | Metric registry, quality/baseline/trend, state diff, meaningfulness, deterministic `What Changed` | Golden analytics cases and JSON contract before M3 Today/Health Connect. [Project `11 IMPLEMENTATION`, §8 Steps 08–19](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§4–5](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M4 Clinical Data + AI | PDF/extraction review, Safety, Context, Model Gateway, claims and AI UX | Policy/privacy and capability evals before provider use or symptom write. [Project `11 IMPLEMENTATION`, §8 Steps 20–30](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§15–17](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |

Design D0–D1 may explore the core flow with synthetic content before M3 code, but it does
not move `What Changed` implementation into M0/M1. [Design `25 DESIGN_ROADMAP`, D0–D1](product-design/v0.2.0/25_DESIGN_ROADMAP__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).

## Противоречия и решения

| Status | Finding | Review consequence |
| --- | --- | --- |
| `conflicting` | [Project `13 ADR`, §Status](project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) says Accepted for v0.3.0, while v0.4.0 manifest and ADR-151–170 say Accepted. | Owner addendum or new source pack before implementation depending on those ADRs; original pack stays unchanged. |
| `needs_review` | [Project `16 MODEL_STRATEGY`, §§7–8](project-spec/v0.4.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-10-10-26_04-03-47__v0.4.0.md) calls P2 de-identified while its example has exact measurement dates. | Decide date transformation/provider policy before real cloud routing, outside M0. |
| `stale_handoff` | [M0 template, Context/Sources](../.agent/plans/M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-plan.md) expects a future docs PR; current `main` already contains the merged source packs. | Use current base SHA in the new draft; do not rewrite historical template. |
| `missing` | Approved Figma file/node is absent per [SOURCE_OF_TRUTH, Current releases](SOURCE_OF_TRUTH.md#current-releases-и-provenance). | Visual/interaction implementation remains ungrounded; does not block M0 tooling. |

## Рекомендация и статус

Предлагаю root workspace, один реальный M0 package `architecture-guardrails` и synthetic test corpus. Это узкое прочтение `base apps/packages` из Project `11 IMPLEMENTATION`, Step 00, поэтому оно требует owner review. Root-only graph не даёт содержательного package build; полный scaffold создаёт пустые packages, запрещённые текущим [AGENTS, Scope](../AGENTS.md#scope-и-разрешения). M1 domain packages должны появляться вместе с реальными contracts.

Use one real, M0-specific architecture guardrails package plus root workspace and synthetic
test corpus; defer empty product app/domain packages. Alternatives: root-only graph has no
meaningful package build, while scaffolding the full target map creates placeholders. The
selected graph is a proposal because Project `11 IMPLEMENTATION`, Step 00 says `base apps/packages`;
owner review must explicitly accept this narrow interpretation. See the [review draft](../.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_12-38-00__v0.1.1__docs-plan.md#журнал-решений).

- Onboarding/source reconciliation: `go` for planning.
- M0 plan: `needs_review` for package-graph scope and owner approval.
- M0 implementation: `blocked` by this documentation-only authorization and absence of an approved executable plan.
- Install/build/tests/CI and runtime outcomes: `not_run`.
