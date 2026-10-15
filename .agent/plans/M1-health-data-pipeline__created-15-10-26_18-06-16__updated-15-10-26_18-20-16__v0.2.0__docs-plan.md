---
title: MyPhisys — M1 Health Data Pipeline ExecPlan
created: "15-10-26 18-06-16"
updated: "15-10-26 18-20-16"
timezone: Europe/Moscow
version: 0.2.0
commit: "docs(plan): record approved M1 decisions"
status: approved
---

# M1 Health Data Pipeline

## Goal / Why

Создать проверяемый путь от synthetic или manual source record до canonical health fact: Raw evidence сохраняется, validation решает, можно ли создать или изменить факт, а каждый canonical result сохраняет provenance, temporal и epistemic semantics. Наблюдаемый результат M1 — воспроизводимые миграции и contract tests для ingestion/manual connector. Это основа для M2 analytics, а не реализация `What Changed`.

## Status / Authorization

`approved` для scope и вариантов D1–D3, owner: Igor Pastin. В сообщении 15-10-26 «По D1-D3 рекомендуемые тобой варианты» владелец выбрал вариант A для каждого решения. Это утверждает описанные ниже границы, но не запускает implementation: исходный запрет начинать implementation, merge и deploy остаётся в силе. Точные schema/contract assertions подготовить при следующем старте M1; если они меняют accepted semantics, сначала показать решение и оформить ADR/addendum. PR с планом — средство review; его merge требует отдельного действия владельца.

## Context / Sources

- На 15-10-26 local `main`/`origin/main` = `12bd8dfc274c6bb8dccfddf9c83d335195b11352`; GitHub compare этого SHA с `main` вернул `identical`, ahead/behind `0`. [M0 PR #3](https://github.com/ipastin/phisys/pull/3) = `MERGED`, merge commit тот же. Плановая ветка `codex/m1-health-data-pipeline-plan` создана от `main`; исходное рабочее дерево было чистым. Перед implementation снова сравнить remote `main` и diff.
- [Root AGENTS](../../AGENTS.md) `0.2.9`, [SOURCE_OF_TRUTH](../../docs/SOURCE_OF_TRUTH.md) `0.2.16`, [ExecPlan contract](../PLANS.md) `0.2.9`. Current Project Spec Pack `0.4.0`: [00 README](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §5; [14 AGENTS](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–4, 7–9, 17–18, 24; [02 ARCHITECTURE](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§1, 3–6, 9–12; [03 DATA_MODEL](../../docs/project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–9, 11, 13–16, 19–21; [09 CONNECTORS](../../docs/project-spec/v0.4.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§1–2, 7–8, 14, 22; [13 ADR](../../docs/project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) ADR-001, 003–011, 077–078, 100, 129–132, 137–138; [11 IMPLEMENTATION](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§3–5, 8 Steps 03–07, 11; [12 EVALS](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§2–3, 6, 11, 16–17.
- [M0 implementation evidence](M0-foundation-implementation__created-15-10-26_15-09-12__updated-15-10-26_17-32-04__v0.2.4__docs-plan.md) — исторический handoff, написанный до merge. Реально присутствуют pnpm/Turborepo, TypeScript strict, Vitest, CI и `packages/architecture-guardrails`; production `database`, `health-core`, `ingestion`, `connectors` и health tables ещё отсутствуют. Имена в `tests/architecture/fixtures/packages/*` — synthetic graph, не production packages.
- `13 ADR` §Status ссылается на v0.3.0 при manifest v0.4.0. Этот план опирается на ADR ≤138; статус ADR-151–170 остаётся `needs_review` по SOURCE_OF_TRUTH. Никакое решение из 151–170 не принимается здесь молча.

## Scope / Non-goals

**В M1 по Project Spec Step 03–07:**

1. PostgreSQL foundation: только таблицы и schema, реально нужные M1 vertical slice, с migration, person isolation/RLS, UUIDv7 и transactional outbox для затронутых mutations. Supabase/Drizzle указаны в target stack; production cloud provisioning и secrets вне этого плана.
2. FHIR/vendor-independent canonical core для Observation, Symptom, Source, Provenance, HealthEvent, Concept, Quantity и TemporalValue. Persisted fact имеет person binding, concept, value/status, source, epistemic и verification status. Для numeric facts исходные value/unit обязательны; canonical value/unit заполняются только при валидной context-aware normalization.
3. Детерминированный, versioned synthetic dataset: 90 дней sleep/HR, steps, weight, sparse labs, symptoms, missing week, source transition, outlier и конфликт. Только вымышленные данные. Это M1 subset golden profile из EVALS §3; medication/document ambiguity остаются позднейшим расширением fixture, поскольку соответствующие connectors и semantics не входят в Steps 03–07.
4. Ingestion: insert/update/duplicate/delete/quarantine, identity/dedupe, повторная доставка и mapping через validation boundary. Manual connector подаёт weight, BP, generic observation и symptom в тот же Raw/Source pipeline. По D3 M1 demonstrable entry point — domain/connector contract и tests; runtime API/UX остаётся вне M1.

**За пределами M1:** M2 registry/quality/baseline/trend/state diff/`What Changed`, M3 mobile/Today/Health Connect, M4 PDF/Records/Model Gateway/AI, full document or medication ingestion, cloud deploy, реальные health records, Figma/shared-system writes. M1 не строит пустые future packages, UI и generic connector platform. M5 hardening не отменяет обязательные уже в M1 provenance, RLS и tests.

## Invariants / Architecture impact

```text
manual/synthetic connector → immutable Raw + SourceRecord
                         → ingestion validation (person, identity, schema, concept,
                           unit, time, provenance, version/conflict policy)
                         → canonical write via domain boundary + outbox
                         → Observation/Symptom/HealthEvent + Provenance
```

- Connector пишет только Raw/Source; он не выбирает clinical truth и не пишет canonical напрямую (`INV-002`, ADR-077). Ingestion владеет validation/mapping; domain layer владеет canonical invariants. LLM и client не получают direct canonical write (`INV-001`, architecture §§3, 9). Import graph guardrails M0 проверяют зависимости, но не доказывают runtime write isolation: M1 нужны реальные boundary tests.
- Raw immutable. Update = новая version/supersession; delete = tombstone source representation и пересмотр supporting sources, без уничтожения истории. Connector delivery at-least-once, а эффект ingestion idempotent (`ADR-004`, 010, 078; Connectors §§7–8). Duplicate одного события и conflicting claims — разные состояния; unresolved conflict нельзя silently source-resolve (`ADR-011`).
- Canonical persistent fact без provenance запрещён (`INV-004`). `effective`, `recorded`, `ingested` и точность даты сохраняются отдельно; unknown/missing не превращаются в `0`, `false`, `normal` или выдуманный день/час (`INV-007`). Epistemic state и verification status — разные оси; `inferred` не становится clinical fact (`INV-006`).
- Backend domain layer — primary access boundary, RLS — defense in depth; тестировать изоляцию между двумя synthetic persons (`ADR-131`). Реальные credentials, personal data и raw health payload не выводить в logs/fixtures. Outbox обязателен для затронутых DB mutations (`ADR-137`); retry jobs idempotent (`ADR-138`).
- INV-014 относится к natural-language write через product agent; для connector ingestion нет blanket requirement подтверждать каждый факт. По утверждённому D2 случаи без надёжной identity/provenance/meaning идут в quarantine или `Needs Review`, а не в verified canonical record.

## Files / Dependencies / Consumers

Ниже planned paths, **не созданные production files**. Перед implementation уточнить по фактическому diff и не добавлять package без потребителя.

| Planned locus | Consumer / required checks |
| --- | --- |
| `packages/database/**` + migrations | По D1 только M1 tables в PostgreSQL schemas `identity`, `source`, `health`, минимальные `jobs`/outbox и необходимые RLS policies; migration/rollback и person-isolation tests. Точные relationships определить перед Step 03. |
| `packages/health-core/**` | Pure canonical types/invariants; ingestion imports these contracts, core не импортирует database, connector или SDK. Unit tests для quantity, time, epistemic/provenance. |
| `packages/ingestion/**` | SourceRecord validation, mapping, idempotent versioning/quarantine; integration tests на DB boundary и negative cases. |
| `packages/connectors/**` | Manual adapter только Raw/Source; contract tests incl. update/delete/retry/revocation semantics применительно к manual source. |
| `tests/**` и synthetic fixtures (точный каталог определить при implementation) | Golden import expectations, двух person isolation, provenance trace, duplicate/conflict/update/delete/quarantine. Не менять существующие architecture fixtures так, чтобы они перестали проверять forbidden imports. |
| Root `package.json`, `pnpm-workspace.yaml`, lockfile, TS/ESLint/Prettier config, `turbo.json`, `.github/workflows/ci.yml`, `packages/architecture-guardrails/**` | Подключить только реально созданные packages к lint/typecheck/test/build/CI, расширить allowed/forbidden import cases, если новые пути требуют этого. Новые exports и aliases проверять на всех consumers. |

На текущем `main` production callers для новых domain packages отсутствуют; существующие callers — root scripts, CI и M0 architecture checker. Изменение schema/contract затронет будущие ingestion/manual consumers, поэтому contracts и миграции должны проверяться совместно. Никаких реальных fixtures или секретов в публичном repository.

## Milestones / Concrete steps

CWD для всех шагов: repository root. DAG: `M1.0 → M1.1 → M1.2 → M1.3 → M1.4 → M1.5`; независимые tests идут в том же шаге, что их implementation. Один PR на milestone допустим, если review остаётся предметным; merge каждого PR отдельно.

| ID | Work after authorization | Observable handoff |
| --- | --- | --- |
| M1.0 | Утверждённые D1–D3 зафиксированы; после отдельного старта implementation обновить ветку от свежего `main`, проверить scoped instructions, diff, Node/pnpm, callers/config и уточнить schema/contract assertions. При изменении accepted semantics сначала ADR/addendum. | Точные schema/contract assertions до кода без повторного согласования уже принятых D1–D3. |
| M1.1 / Step 03 | Разработать M1 physical schema и миграции с RLS, UUIDv7, provenance links и outbox. Запуск только на throwaway local PostgreSQL, без production cloud. | Migration up/down/reapply, cross-person deny и atomic mutation/outbox evidence. |
| M1.2 / Step 04 | Реализовать pure canonical core и явные validation errors; сопоставить persisted schema с contract. | Unit/domain tests для supported values, unknown, temporal precision, original/canonical units, provenance и conflict state. |
| M1.3 / Step 05 | Добавить deterministic synthetic M1 profile и expected records/relationships. | Повторный seed даёт одинаковые IDs/content; отсутствуют реальные данные; golden inputs закрывают перечисленные M1 edge cases. |
| M1.4 / Step 06 | Реализовать Raw → validation → canonical pipeline, versioning, idempotency, quarantine, conflict/deletion handling и outbox integration. | DB-backed contract tests: retries/duplicates, updates, delete with another supporting source, malformed/unknown, conflict, provenance trace. |
| M1.5 / Step 07 | Manual connector через тот же вход; включить affected package checks в root CI. | Weight/BP/generic observation/symptom проходят общий pipeline; boundary и CI checks на точном PR head. |

## Validation / Acceptance

Ниже **planned checks**, сейчас `not_run` для M1 implementation. Каждому `pass` в будущем записать command/action, cwd, commit SHA, время Europe/Moscow и evidence pointer. Existing M0 CI evidence не считается M1 outcome.

| Criterion | Required proof at M1 handoff | Current |
| --- | --- | --- |
| Schema и isolation | Migration up/down/reapply на disposable PostgreSQL; RLS запрещает person B читать/писать person A; backend path не обходит domain validation. | `not_run` |
| Plane boundary | Connector attempt to write canonical rejected by API/package boundary and integration test; Raw payload stays immutable after update. | `not_run` |
| Canonical semantics | Unit tests: provenance required, original quantity retained, concept-aware conversion only, partial date not completed, missing/unknown not normalized to zero/negative, epistemic distinct from verification. | `not_run` |
| Lifecycle и retry | Same delivery twice → no duplicate canonical effect; update → supersession; delete → source tombstone and correct support reassessment; conflict remains unresolved; malformed input quarantined with reason. | `not_run` |
| Traceability и atomicity | Каждый imported fact resolves fact → provenance → source representation → Raw; failed transaction leaves neither partial canonical mutation nor orphaned outbox event. | `not_run` |
| Manual connector | Weight/BP/generic observation/symptom use same Raw/validation route; unsupported or ambiguous input returns typed error/review state. | `not_run` |
| Synthetic fixture | Versioned deterministic seed + expected outputs, missing week/source transition/conflict; no personal records/tokens/local paths. | `not_run` |
| Repository gates | Exact pinned runtime; `pnpm install --frozen-lockfile`, lint, format, typecheck, unit, architecture, DB/connector suites and build; PR CI on exact head. No empty test suite called `pass`. | `not_run` |

Plan artifact check before review: Markdown metadata/name, relative links, `git diff --check`, source mapping and diff inspection. Это process/artifact evidence, не доказательство работающего pipeline.

## Progress

- [x] 15-10-26 18-06-16 Europe/Moscow — PR #3 merge и `main` SHA сопоставлены; чистый checkout и M0 package map просмотрены.
- [x] 15-10-26 18-06-16 — прочитаны current source index, root instructions, M1 sections Project Spec и M0 handoff; составлен draft ExecPlan.
- [x] 15-10-26 18-20-16 — владелец выбрал рекомендованный вариант A для D1–D3; plan/status обновлён до `approved`.
- [ ] M1 implementation authorized отдельной задачей.
- [ ] Steps 03–07 и acceptance evidence выполнены.

## Decision log — approved scope choices

| ID | Options and trade-off | Recommendation / gate |
| --- | --- | --- |
| D1 — physical schema и canonical slice | **A:** M1-only tables для Person/Source/Raw/Provenance/Concept/Observation/Symptom/HealthEvent/Conflict плюс нужные RLS/outbox: меньше миграций без consumers, но M2/M4 добавят свои таблицы. **B:** сразу весь перечень DATA_MODEL §21, включая documents/derived/baselines: меньше поздних migrations, но неиспользуемая clinical schema повышает риск неверных semantics. | **A approved владельцем 15-10-26.** Точные relationships и versioning assertions подготовить до Step 03; изменение accepted clinical semantics потребует отдельного review. |
| D2 — auto-promotion после validation | **A:** deterministic allowlist поддерживаемых concept/unit/time и однозначной person/source identity; unsupported → quarantine, conflicting claims → `Needs Review`: безопаснее, но больше review backlog. **B:** широкий auto-map и fuzzy dedupe: выше coverage, но ложный verified fact и silent merge опаснее. | **A approved владельцем 15-10-26.** Для Step 06 определить supported inputs и typed reasons quarantine/review; thresholds подтверждать eval evidence, а не объявлять clinical truth. |
| D3 — manual connector handoff | **A:** рабочий adapter + domain entry point + tests, UI/API delivery в M3: малый M1 slice, но ручной ввод пока не доступен пользователю. **B:** добавить Fastify endpoint в M1: end-to-end runtime proof, но раньше срока открывает auth/permission и API surface. | **A approved владельцем 15-10-26.** UI/API вне M1; ни один input не пишет canonical напрямую. |

Accepted source choices не выносятся на повторное голосование: PostgreSQL, Raw immutability, provenance, connector isolation, idempotent ingestion, backend domain access + RLS. Детали identity binding для production auth и DB credentials уточняются при M1.0; никаких secret/cloud actions этим планом не разрешено.

## Surprises / Open questions / Risks

- EVALS §3 описывает полный synthetic golden profile с medication/source conflict и document ambiguity; IMPLEMENTATION Step 05 задаёт более узкий M1 profile. Рекомендация: versioned M1 subset сейчас, расширение fixture перед соответствующими M4 capabilities и beta gate. Не заявлять full EVALS §3 `pass` после M1.
- DATA_MODEL §21 — пример MVP physical schema, а не обязательство создать все таблицы в M1. D1 определяет раннюю границу без изменения четырёх data planes. Если schema потребует новой clinical semantics, нужен отдельный ADR.
- M0 architecture checker ограничивает import graph; DB roles/RLS и право connector писать только Raw им не доказаны. Компенсация — M1 integration tests с разными DB roles и negative writes. Новые aliases/packages могут потребовать явной корректировки checker, а не его отключения.
- Dedupe false positive может слить разные события; false negative создаёт дубли. Начать с deterministic identity, не auto-merge конфликт. Калибровку thresholds провести на synthetic cases, результаты записать.
- Raw immutability и source deletion/tombstone требуют продуманной retention/privacy policy. M1 проверяет semantics на synthetic данных; production retention/delete/export относятся к отдельному privacy review и поздним milestones. Не допускать реального PHI до этого review.
- M0 exception: fork PR runtime не проверялся, финальный CodeRabbit review был rate-limited; владелец принял их для M0, но M1 не наследует статус `pass`. Перед M1 merge предъявить фактические CI/review evidence либо явно согласовать новые исключения.

## Recovery / Idempotence

Повторный seed должен воспроизводить fixture, а повторный import не создавать новые canonical facts. Миграции и rollback проверять только на disposable DB с synthetic data; destructive operations на user/production DB не входят в разрешение. При ошибке Step 06 Raw остаётся доступным для безопасного replay, карантин не теряется, canonical/outbox не сохраняются частично. Не делать reset/clean занятого checkout; конфликт с чужими изменениями разрешать по diff.

## Outcomes / Retrospective

Scope и варианты D1–D3 утверждены владельцем; implementation ещё не начат. Artifact/source checks записываются в PR; behavior checks M1 — `not_run`. Следующий шаг после отдельного старта implementation: M1.0 с точными schema/contract assertions, затем Steps 03–07. Ни одна строка этого документа не подтверждает выполненную миграцию, ingestion или production readiness.
