---
title: MyPhisys — onboarding audit для review M0 plan
created: "15-10-26 12-28-44"
updated: "15-10-26 13-00-59"
timezone: Europe/Moscow
version: 0.2.1
commit: "docs(audit): record approved M0 package graph"
status: draft
---

# M0 onboarding audit

## Назначение и scope

Это read-only audit как доказательная база для отдельного review M0 plan. Он не даёт разрешения на реализацию, установку dependencies, merge или deploy. Ниже сначала перечислены проверенные границы, затем открытые решения и условия перехода к M0.

Отдельный [review draft M0 Foundation](../.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_13-00-59__v0.2.1__docs-plan.md) использует этот audit как вход. Импортированные source packs остаются без изменений.

## Checkout и источники

| Проверка | Результат | Ограничение |
| --- | --- | --- |
| `git status --short --branch`, `git rev-parse HEAD` | При создании `codex/m0-plan-review` checkout был чистым; base `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a`. | Перед implementation PR повторить проверку: документация меняет HEAD review-ветки. |
| `git remote -v`, GitHub compare | `origin` указывает на `https://github.com/ipastin/phisys.git`; connector подтвердил `main` = base SHA (`identical`). | `git ls-remote` из shell не прошёл из-за DNS; branch protection не проверена. |
| Состав manifest | Project `0.4.0`: 18/18 Markdown; Design `0.2.0`: 28/28. | Проверено наличие. Предыдущая проверка ZIP byte/CRC описана в [SOURCE_OF_TRUTH, Current releases](SOURCE_OF_TRUTH.md#current-releases-и-provenance); здесь не повторялась. |
| Состав checkout | Нет `package.json`, workspace/lockfile, `apps/`, `packages/`, test runner и `.github/workflows/`. | Application и CI checks пока невозможно считать пройденными. |
| `node --version`, `pnpm --version` | Локально `v24.17.0` и `12.13.0`. | Предложенный Node pin для M0 — `24.22.0`; local/CI parity не проверена. |

Иерархия источников: [Project `00 README`, §5](project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md),
[Project `14 AGENTS`, §2](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md),
и [Design `00 README`, §7](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).
[Source index](SOURCE_OF_TRUTH.md) — реестр, а не замена спецификаций.

## Architecture boundaries и критичные invariants

Путь данных: Source/Connector → Raw → validation/identity/dedupe → Canonical →
deterministic state/analytics → InsightCandidate → safety/context → bounded agent/claims → UX.
Raw, Canonical, Derived и Inferred — разные planes. Архитектурный стиль — modular monolith
и workers; PostgreSQL — system of record. [Project `02 ARCHITECTURE`, §§1–5, 10](project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
[Project `03 DATA_MODEL`, §§1–4](project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

Boundary checker M0 должен проверять следующие правила на synthetic graph; правила применяются и к текущему repository graph. Пока domain packages отсутствуют, он не доказывает их runtime isolation:

1. `health-core` не импортирует provider, UI, connector/FHIR или infrastructure implementations; analytics не пишет Raw/Canonical. [Project `02 ARCHITECTURE`, §9](project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
2. Connectors пишут только Source/Raw; validation/mapping в canonical выполняется ingestion.
   [Project `09 CONNECTORS`, §1](project-spec/v0.4.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `14 AGENTS`, INV-002](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
3. LLM не пишет canonical state и не превращает inference в fact; runtime authorization и Tool Gateway validation выполняются вне модели. [Project `14 AGENTS`, INV-001/003/006/009/014](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `05 AGENT_RUNTIME`, §§8–9, 15](project-spec/v0.4.0/05_AGENT_RUNTIME__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
4. Сохранённые clinical facts требуют provenance и temporal/epistemic semantics; missing не означает zero, normal или negative. [Project `14 AGENTS`, INV-004/007/008](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `03 DATA_MODEL`, §§3–4, 8–9](project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
5. Derived analytics воспроизводимы и проходят quality gate; Records/Timeline/What Changed сохраняют пользу без LLM. [Project `14 AGENTS`, INV-005/013/024](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `04 ANALYTICS`, §§1, 4–5, 15](project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
6. Model requests используют capability aliases; fallback не ослабляет privacy. Ambient surfaces имеют ограниченные роли и отдельное disclosure permission. [Project `14 AGENTS`, INV-016/017/026–030](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
   [Project `17 SURFACE_STRATEGY`, §§3–4](project-spec/v0.4.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-10-10-26_04-03-47__v0.4.0.md).

Design `0.2.0` закрепляет факт до интерпретации, отдельные состояния unknown/stale/conflict, различие personal baseline и clinical normal, доступность provenance. Это будущие UX gates, не UI scope M0. [Design `00 README`, §§2, 8](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md);
[Design `12 STATE_MATRIX`, §§2–3](product-design/v0.2.0/12_STATE_MATRIX_EDGE_CASES__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md);
[Design `17 TRUST`, §§3–6](product-design/v0.2.0/17_TRUST_PROVENANCE_SAFETY_UX__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).

## Последовательность milestones и gates

| Milestone | Результат | Следующий gate |
| --- | --- | --- |
| M0 Foundation | pnpm/Turborepo, strict TS, Vitest, boundary checks, CI. | Fresh checkout и содержательные local/PR checks. [Project `11 IMPLEMENTATION`, §8 Steps 00–02](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M1 Health Data Pipeline | Database, canonical core, deterministic synthetic profile, idempotent ingestion, manual connector. | Проверки provenance, temporal, missingness, conflict и connector contract. [Project `11 IMPLEMENTATION`, §8 Steps 03–07](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§3, 6, 11](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M2 Health Intelligence | Metric registry, quality/baseline/trend, state diff, meaningfulness, deterministic `What Changed`. | Golden analytics cases и JSON contract до M3 Today/Health Connect. [Project `11 IMPLEMENTATION`, §8 Steps 08–19](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§4–5](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |
| M4 Clinical Data + AI | PDF/extraction review, Safety, Context, Model Gateway, claims и AI UX. | Policy/privacy и capability evals до provider use или symptom write. [Project `11 IMPLEMENTATION`, §8 Steps 20–30](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md); [Project `12 EVALS`, §§15–17](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md). |

Design D0–D1 может исследовать core flow на synthetic content до кода M3. Это не переносит реализацию `What Changed` в M0/M1. [Design `25 DESIGN_ROADMAP`, D0–D1](product-design/v0.2.0/25_DESIGN_ROADMAP__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).

## Противоречия и решения

| Статус | Находка | Решение для review |
| --- | --- | --- |
| `conflicting` | В [Project `13 ADR`, §Status](project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) Accepted указан для v0.3.0, хотя manifest v0.4.0 и ADR-151–170 обозначены Accepted. | Перед реализацией, зависящей от этих ADR, нужен owner addendum или новый source pack; исходный pack сохранить. |
| `needs_review` | [Project `16 MODEL_STRATEGY`, §§7–8](project-spec/v0.4.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-10-10-26_04-03-47__v0.4.0.md) называет P2 de-identified, но пример содержит точные даты измерений. | Решить преобразование дат и provider policy до real cloud routing; вне M0. |
| `stale_handoff` | [M0 template, Context/Sources](../.agent/plans/M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-plan.md) ожидает будущий docs PR; текущий `main` уже содержит source packs. | Использовать актуальный base SHA в draft; исторический template сохранить. |
| `missing` | В [SOURCE_OF_TRUTH, Current releases](SOURCE_OF_TRUTH.md#current-releases-и-provenance) нет approved Figma file/node. | Визуальная и interaction реализация остаётся без источника; M0 tooling это не блокирует. |

## Рекомендация и статус

Owner выбрал root workspace, один реальный M0 package `architecture-guardrails` и synthetic test corpus в ответе на отдельный вопрос о package graph в текущем Codex chat; решение записано 15-10-26 12-59-48 (Europe/Moscow). Это согласует узкое прочтение `base apps/packages` из Project `11 IMPLEMENTATION`, Step 00; отдельного разрешения на implementation ответ не содержит. Root-only graph не даёт содержательного package build; полный scaffold создаёт пустые packages, запрещённые текущим [AGENTS, Scope](../AGENTS.md#scope-и-разрешения). M1 domain packages должны появляться вместе с реальными contracts.

Подробный scope и альтернативы — в [review draft, «Журнал решений»](../.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_13-00-59__v0.2.1__docs-plan.md#журнал-решений).

- Сверка onboarding и источников: `go` для планирования.
- Package graph: `approved` владельцем для scope M0 plan; exact pins/checks остаются предложением.
- M0 implementation: `blocked` отсутствием отдельного разрешения на executable plan и implementation.
- Install/build/tests/CI и runtime outcomes: `not_run`.
