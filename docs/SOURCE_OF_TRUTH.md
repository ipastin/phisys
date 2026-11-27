---
title: Phisys — Source of Truth
created: "15-10-26 09-37-26"
updated: "27-11-26 17-10-14"
timezone: Europe/Moscow
version: "0.2.21"
commit: "docs(stack): record native and web client decisions"
status: proposed
---

# Source of Truth

Этот файл — индекс, не новая product specification. Бренд — **Phisys**;
repository — [ipastin/phisys](https://github.com/ipastin/phisys); выбранный domain —
[phisys.cloud](https://phisys.cloud). Название repository не меняет product brand.
Состояние deployment/DNS этим документом не подтверждается.

## Current releases и provenance

| Источник | Где лежит | Статус / применение |
| --- | --- | --- |
| Project Specification Pack `0.5.0` | [Project README](project-spec/v0.5.0/00_README__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [manifest](project-spec/v0.5.0/manifest.json) | Редакция Phisys на основе 18 документов исходного пакета. Current product/architecture/engineering source. |
| Product Design Specification Pack `0.3.0` | [Design README](product-design/v0.3.0/00_README__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md), [manifest](product-design/v0.3.0/manifest.json) | Редакция Phisys на основе 28 документов исходного пакета. Current design specification. |
| Root AGENTS/PLANS, source index, onboarding и планы M0 | Ссылки ниже | Compact instructions и review artifacts; подчиняются оригинальным sources. |
| Figma | Approved file/node URLs ещё не указаны | `missing` для visual/interaction implementation; не выдумывай design authority. |
| История чатов / старые packs | В Git как current release не импортированы | Только context/history, не замена оригиналов. |

27 ноября 2026 владелец утвердил единое название **Phisys**. Редакции Project Spec 0.4.1 и Product Design Spec 0.2.1 обновляют название, примеры и ссылки. Статусы проектных решений и степень готовности дизайна сохраняются. Оригиналы импорта доступны в [Git на дату до переименования](https://github.com/ipastin/phisys/tree/3679cc0e206c5b6e8ec6e56f0c696e25a6121663/docs). [Индекс оригинального импорта](https://github.com/ipastin/phisys/blob/3679cc0e206c5b6e8ec6e56f0c696e25a6121663/docs/SOURCE_OF_TRUTH.md) содержит имена ZIP, SHA-256, результаты побайтовой проверки и сведения об аномалии исходной даты в Model Strategy.

## Стек клиентов

Решение владельца от 27 ноября 2026 года опубликовано в [ADR-171](project-spec/v0.5.0/13_ADR__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md#adr-171) и [Implementation Blueprint, §1](project-spec/v0.5.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md). Project Spec 0.5.0 и Product Design Spec 0.3.0 задают целевую архитектуру. Предыдущие редакции сохранены в Git: [Project Spec 0.4.1](https://github.com/ipastin/phisys/tree/b5a7cb1bae74dfbbaa8d82423fb14f5516cb3579/docs/project-spec/v0.4.1) и [Design Pack 0.2.1](https://github.com/ipastin/phisys/tree/b5a7cb1bae74dfbbaa8d82423fb14f5516cb3579/docs/product-design/v0.2.1).

| Surface | Целевой стек | Граница |
| --- | --- | --- |
| Android Personal Beta, S0 | Kotlin + Jetpack Compose, Android Health Connect SDK | Разрешения и чтение данных на устройстве. Source records проходят через Fastify и ingestion. |
| Web Companion, S1 | React + TypeScript strict + Next.js | Records, Timeline, графики и контекстный Ask на большом экране. Данные приходят через Fastify HTTP API с OpenAPI-контрактом. Installable PWA опциональна. |
| iOS, S3 | Нативное приложение на Swift, HealthKit | Собственный клиент и системные разрешения Apple. UI toolkit выбирается на этапе iOS. |

Между Web и iOS предусмотрен S2 с Android widgets, уведомлениями и быстрыми действиями. Стек Web относится к клиенту продукта. Источником сведений об уже реализованных возможностях служит карта ниже. [Проверка всех Markdown-файлов при принятии решения](../.agent/plans/client-stack__created-27-11-26_17-05-22__updated-27-11-26_17-10-14__v0.1.0__docs-plan.md).

## Состояние разработки и дизайна

Срез на 27 ноября 2026 года по [проверенному main](https://github.com/ipastin/phisys/commit/3679cc0e206c5b6e8ec6e56f0c696e25a6121663). [Вся карта, шаги 00–39 и платформы](roadmap/phisys-roadmap.svg) · [Редактировать в Excalidraw](roadmap/phisys-roadmap.excalidraw).

| Шаги | Состояние | Ближайший наблюдаемый результат |
| --- | --- | --- |
| 00–07 · M0–M1 | В main в согласованном объёме. CI, PostgreSQL, provenance, ручной ввод и воспроизводимые synthetic fixtures. | Запись проходит от источника до проверенной схемы. |
| 08–11 · M2 | Реализованы для длительности сна. | Оценка качества, личная база сравнения, сравнение недель. |
| 12–13 · M2 | Частично. Сравнение состояния сна и устойчивость отклонения. Все кандидаты остаются `held`. | Определить, когда изменение достойно карточки и почему. |
| 14 · M2 | Впереди. | Сервис What Changed возвращает обоснованный результат без LLM. |
| 15–19 · M3 | Впереди. | Android Today, детали, Timeline и Health Connect замыкают первый сквозной сценарий. |
| 20–30 · M4 | Впереди. | Проверяемый импорт PDF и AI-объяснения с источниками и подтверждением записи. |
| 31–39 · M5 | Впереди. Отдельные базовые проверки уже есть. | Безопасность, аудит, evals, экспорт/удаление и выпуск Personal Beta. |

[PR #18](https://github.com/ipastin/phisys/pull/18) добавляет подтверждение и отзыв версии ручной записи о сне. На дату среза это отдельный draft с успешным CI. Порог показа пользователю и проверка на реальных данных остаются открытыми. Web Companion запланирован после Android Personal Beta, как первая следующая платформа.

| UX/UI | Что описано в Design Pack | Готовность к handoff |
| --- | --- | --- |
| Android | Карта экранов, основные сценарии, состояния Today, детализация, источники, Records, разрешения Health Connect, accessibility. | Draft-for-design. Для приёмки нужны утверждённые frames со ссылками, проверка прототипа и соответствие экранов данным. |
| Web Companion | Компоновки Compact/Medium/Expanded, sidebar, Timeline и Records в двух панелях, график с деталями, контекстный Ask, таблицы и клавиатура. | Draft-for-design. Этап D7 предусматривает desktop-варианты ключевых экранов и проверку сценария P9. |

## Открытые вопросы исходных спецификаций

- **Статус ADR-151–170 в исходном импорте — `needs_review`.** Заголовок оригинала привязывал статус к v0.3.0, а manifest v0.4.0 и записи ADR-151–170 указывали `Accepted`. Перед реализацией, зависящей от этих записей, получи подтверждение владельца. ADR-171 имеет отдельное подтверждение от 27 ноября 2026 года. [Текущий реестр, §Status](project-spec/v0.5.0/13_ADR__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md#status).
- **P2 measurement dates — `needs_review` до production cloud routing.** Project
  [16 MODEL_STRATEGY, §P2](project-spec/v0.5.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md)
  называет контекст de-identified, но пример содержит точные `measurement_dates`;
  P2 указан как основной уровень для cloud reasoning. В source не определены
  достаточное преобразование дат и одобренная конфигурация provider для такого payload.
  До отправки реальных данных нужно отдельное privacy решение: заменить даты
  интервалами там, где это сохраняет задачу, либо применить более строгий routing;
  основание и provider configuration должны быть документированы. Из этого индекса
  нельзя выводить, что точные даты уже безопасны для P2.

## Приоритет решений

Project [00 README, §5](project-spec/v0.5.0/00_README__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md)
и [14 AGENTS, §2](project-spec/v0.5.0/14_AGENTS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md)
задают порядок для engineering decisions:

1. Explicit invariant из Project `14 AGENTS`.
2. Accepted ADR из Project `13 ADR`.
3. Актуальная domain specification.
4. Existing implementation / implementation convenience, если выше нет конфликта.

Для design решений [Design README, §7](product-design/v0.3.0/00_README__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md)
уточняет: safety/privacy invariant → health-data semantics/provenance → product principle
→ screen specification → design-system rule → local visual decision. Approved Figma
будет visual/interaction authority внутри этих границ; его file/node ещё не предоставлены.

Если равноприоритетные sources расходятся, укажи точные пути, разделы и влияние на задачу;
предложи 2–3 варианта и конкретную рекомендацию. Новое прямое решение владельца зафиксируй
в соответствующем source/ADR до implementation. Не определяй смысл по timestamp, если
он противоречив, и не исправляй source bytes ради согласования с handoff.

## Reading path

Перед значимой задачей используй порядок из Project `00 README`, §5:

`00 README → 14 AGENTS → 02 ARCHITECTURE → relevant domain spec → 13 ADR → 11 IMPLEMENTATION → 12 EVALS`.
Дополнительно: `15 BRAND` для naming/copy/UX, `16 MODEL_STRATEGY` для models/prompts/provider/privacy,
`17 SURFACE_STRATEGY` для mobile/web/widget/watch/push/MCP/API. Читай соответствующий design
раздел, когда задача касается UI/interaction; не загружай все документы в каждый chat.

| Задача | Основные документы |
| --- | --- |
| Onboarding / M0 | [Architecture](project-spec/v0.5.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [AGENTS/invariants](project-spec/v0.5.0/14_AGENTS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [ADR](project-spec/v0.5.0/13_ADR__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Implementation](project-spec/v0.5.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) §§1, 5, 8, [Evals](project-spec/v0.5.0/12_EVALS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) |
| M1 data pipeline | [Data Model](project-spec/v0.5.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Connectors](project-spec/v0.5.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), Implementation Steps 03–07, relevant ADR/INV |
| M2 health intelligence | [Analytics](project-spec/v0.5.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), Data Model, Evals, Implementation Steps 08–14 |
| AI / provider / prompts | [Agent Runtime](project-spec/v0.5.0/05_AGENT_RUNTIME__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Safety](project-spec/v0.5.0/08_SAFETY__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Model Strategy](project-spec/v0.5.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), Context/Memory, Evals |
| UI / surfaces | [UX](project-spec/v0.5.0/10_UX__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Project Surface Strategy](project-spec/v0.5.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md), [Design Surface Strategy](product-design/v0.3.0/27_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md), Design IA/Screen Map/State Matrix/Accessibility, approved Figma |

## Согласованные milestones

По Project [11 IMPLEMENTATION, §8](project-spec/v0.5.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md):

```text
M0 Foundation: pnpm/Turborepo, TypeScript strict, Vitest, architecture guardrails, CI
M1 Health Data Pipeline: database → canonical core → synthetic dataset → ingestion/manual connector
M2 Health Intelligence: metric registry → quality/baseline/trend → state diff → What Changed
M3 Product Experience: mobile/Today/details/Timeline → Health Connect
M4 Clinical Data + AI: PDF/Records → Safety/Context/Model Gateway → AI UX/symptom write
M5 Hardening: provenance/audit/security/evals/export/delete → Personal Beta gate
```

Ранний handoff ошибочно сокращал M1 до `Synthetic → What Changed` и называл Turborepo optional.
Оригинал включает database в M1, а `What Changed` — в M2. Handoff `0.2.0` исправляет
эту последовательность. Versioned sources сохраняются без изменений.

## Entry points

- [Root AGENTS](../AGENTS.md) — краткие инструкции Codex и ссылки на полный registry.
- [ExecPlan contract](../.agent/PLANS.md) — lifecycle, metadata и evidence.
- [Onboarding prompt](../prompts/CODEX_ONBOARDING__created-15-10-26_09-37-26__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) — read-only первый chat.
- [M0 Foundation template](../.agent/plans/M0-foundation__created-15-10-26_09-37-26__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) — template для review, не реализованный milestone.
- [M0 onboarding audit](M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md) — checkout/source evidence и открытые решения.
- [M0 Foundation plan](../.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md) — утверждённый scope/toolchain/checks; на момент approval старт был отложен.
- [M0 implementation evidence](../.agent/plans/M0-foundation-implementation__created-15-10-26_15-09-12__updated-27-11-26_17-10-14__v0.2.6__docs-stack.md) — выполнение после отдельной команды владельца; локальные checks, PR CI и принятые владельцем исключения.
- [M1 approved ExecPlan](../.agent/plans/M1-health-data-pipeline__created-15-10-26_18-06-16__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) — утверждённые D1–D3 и Steps 03–07; импортирован из отдельной плановой ветки без изменения исходного approval.
- [M1 implementation evidence](../.agent/plans/M1-implementation__created-15-10-26_18-31-17__updated-27-11-26_17-10-14__v0.2.5__docs-stack.md) — M1.0 schema/contract assertions, локальные проверки, PR review corrections и ограничения; PR CI фиксируется на точном head.
