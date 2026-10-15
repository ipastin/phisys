---
title: MyPhisys — Source of Truth
created: "15-10-26 09-37-26"
updated: "15-10-26 11-09-37"
timezone: Europe/Moscow
version: 0.2.0
commit: "docs(sources): reconcile source index with owner-provided packs"
status: proposed
---

# Source of Truth

Этот файл — индекс, не новая product specification. Бренд — **MyPhisys**;
repository — [ipastin/phisys](https://github.com/ipastin/phisys); выбранный domain —
[phisys.cloud](https://phisys.cloud). Название repository не меняет product brand.
Состояние deployment/DNS этим документом не подтверждается.

## Current releases и provenance

| Источник | Где лежит | Статус / применение |
| --- | --- | --- |
| Project Specification Pack `0.4.0` | [Project README](project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [manifest](project-spec/v0.4.0/manifest.json) | Предоставлен владельцем; 18 Markdown-документов. Current product/architecture/engineering source. |
| Product Design Specification Pack `0.2.0` | [Design README](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md), [manifest](product-design/v0.2.0/manifest.json) | Предоставлен владельцем; 28 Markdown-документов. Current design specification. |
| Root handoff `0.2.0` | Ссылки ниже | Compact Codex instructions, plan contract и onboarding; подчиняется оригинальным sources. |
| Figma | Approved file/node URLs ещё не указаны | `missing` для visual/interaction implementation; не выдумывай design authority. |
| История чатов / старые packs | В Git как current release не импортированы | Только context/history, не замена оригиналов. |

Входные файлы от владельца:

```text
myphisys-project-spec-pack-v0.4.0.zip
SHA-256 2b20c0a3d09ece2b82fc758f351985229307f290454d4d28b1c3773e959a9447

myphisys-product-design-spec-pack-v0.2.0.zip
SHA-256 a995428f7e59664a66b8205541be66f1880231ad7f2a5a7f023e6645912d9525
```

На 15-10-26 оба ZIP прошли CRC; абсолютных/traversal paths, symlinks и non-UTF-8 assets нет.
Imported files, включая manifests, побайтово совпадают с содержимым ZIP. Проверены counts,
versions, уникальность 170 ADR IDs и 31 INV IDs. Это scoped integrity/source review,
не доказательство полноты clinical, security или design QA. Поиск типовых key/email/local-path
patterns ничего не выявил; перед дальнейшим public import нужна отдельная проверка нового содержимого.

Исходный Project `16 MODEL_STRATEGY` содержит аномалию metadata: `created` 10-10-26 11-38-32,
`updated` 10-10-26 04-03-47. Оригинал сохранён без silent исправления; исторически правильное
время неизвестно. Она не меняет указанную в manifest версию pack, но остаётся `needs_review`.
Общая `git diff --check` сообщает 15 trailing-whitespace warnings в оригинальных
`16 MODEL_STRATEGY` и Design `23 PROTOTYPING_VALIDATION` (в том числе Markdown line breaks).
Исходные bytes сохранены; проверка handoff-файлов отдельно проходит без warnings.

## Приоритет решений

Project [00 README, §5](project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
и [14 AGENTS, §2](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
задают порядок для engineering decisions:

1. Explicit invariant из Project `14 AGENTS`.
2. Accepted ADR из Project `13 ADR`.
3. Актуальная domain specification.
4. Existing implementation / implementation convenience, если выше нет конфликта.

Для design решений [Design README, §7](product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md)
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
| Onboarding / M0 | [Architecture](project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [AGENTS/invariants](project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [ADR](project-spec/v0.4.0/13_ADR__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [Implementation](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) §§1, 5, 8, [Evals](project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) |
| M1 data pipeline | [Data Model](project-spec/v0.4.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [Connectors](project-spec/v0.4.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), Implementation Steps 03–07, relevant ADR/INV |
| M2 health intelligence | [Analytics](project-spec/v0.4.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), Data Model, Evals, Implementation Steps 08–14 |
| AI / provider / prompts | [Agent Runtime](project-spec/v0.4.0/05_AGENT_RUNTIME__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [Safety](project-spec/v0.4.0/08_SAFETY__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [Model Strategy](project-spec/v0.4.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-10-10-26_04-03-47__v0.4.0.md), Context/Memory, Evals |
| UI / surfaces | [UX](project-spec/v0.4.0/10_UX__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md), [Project Surface Strategy](project-spec/v0.4.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-10-10-26_04-03-47__v0.4.0.md), [Design Surface Strategy](product-design/v0.2.0/27_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-10-10-26_04-03-47__v0.2.0.md), Design IA/Screen Map/State Matrix/Accessibility, approved Figma |

## Согласованные milestones

По Project [11 IMPLEMENTATION, §8](project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md):

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
- [Onboarding prompt](../prompts/CODEX_ONBOARDING__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-prompt.md) — read-only первый chat.
- [M0 Foundation template](../.agent/plans/M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-plan.md) — template для review, не реализованный milestone.
