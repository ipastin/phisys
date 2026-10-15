---
title: MyPhisys — Source of Truth
created: "15-10-26 09-37-26"
updated: "15-10-26 09-48-08"
timezone: Europe/Moscow
version: 0.1.0
commit: "docs(sources): record source authority and missing specifications"
status: needs_review
---

# Source of Truth

Этот файл — индекс и статус источников, не новая product specification.
Бренд: **MyPhisys**. Repository: [ipastin/phisys](https://github.com/ipastin/phisys).
Product domain: [phisys.cloud](https://phisys.cloud). Состояние DNS/deployment здесь не подтверждается.

## Проверенное состояние на 15-10-26 09-37-26 Europe/Moscow

- GitHub repository существует и публичный. В настройках default branch — `main`.
- Inspection: список branches пуст, `git ls-remote` не вернул refs, commits API вернул `409: Git Repository is empty`.
- До handoff нет tracked files, application code, package manifests, lockfile, tests или CI.
- Владелец выбрал: подготовить локальную ветку; PR в `main` открыть после его initial commit.
- Этот pack добавляет пять Markdown-файлов. M0 implementation и импорт спецификаций не выполнены.

Это snapshot inspection, а не обещание актуального состояния. Перед новой задачей повторно проверь checkout и remote.

## Реестр источников

| Источник | Версия / место | Статус | Для чего использовать |
| --- | --- | --- | --- |
| Текущий запрос владельца | MyPhisys, `ipastin/phisys`, `https://phisys.cloud`, отдельная ветка + PR | confirmed | Scope handoff и Git permissions |
| Project Specification Pack | `0.4.0`; ожидается `docs/project-spec/v0.4.0/` | missing | Product, architecture, data, analytics, safety, runtime, ADR, Model/Surface Strategy |
| Product Design Specification Pack | `0.2.0`; ожидается `docs/product-design/v0.2.0/` | missing | IA, screens, states, components, privacy, accessibility, platform adaptations |
| Figma | Approved file/node URLs ещё не указаны | missing | Approved visuals и interaction details для будущего UI |
| Handoff documents | `0.1.0`; ссылки ниже | present, proposed in branch | Instructions, planning workflow, source gaps |
| Прошлый чат | «Варианты Health AI Agent», conversation `6ac3bc2a-e47c-83e9-ac5b-00350cf5b5eb` | context_only | Восстановление намерений; не подтверждение содержимого ZIP |

На момент подготовки ни один specification pack не доступен для проверки. В прочитанном чате есть ссылки
на `myphisys-project-spec-pack-v0.4.0.zip` и `myphisys-product-design-spec-pack-v0.2.0.zip`,
но attachments не предоставлены. Поиск по именам в локальных Downloads, Documents и PDP их не обнаружил.
Счётчики документов/ADR/INV, заявленные в чате, не подтверждены. Придумывать содержимое или ID запрещено.

## Приоритет и конфликты

После получения и review оригиналов используй такую proposed иерархию:

1. Явно принятые ADR и mandatory architecture/safety/privacy invariants, вместе.
2. Актуальные domain specifications по вопросу: product, data model, analytics, runtime, connectors и т. д.
3. Актуальная Product Design specification и approved Figma — внутри их UX/UI scope и архитектурных границ.
4. Approved ExecPlan и implementation details, подчинённые источникам выше.
5. Неподтверждённые chat summaries, experiments, старые версии — только context/history.

Это правило handoff, а не проверенная цитата из отсутствующего pack. Подтверди его при source reconciliation.
ADR не отменяет safety invariant автоматически. Если источники одного уровня конфликтуют,
запиши оба пути/раздела, последствия и предложенное решение; запроси точечное решение владельца.
Если текст design spec и Figma расходится, не выбирай молча более новый timestamp: нужен approved design decision.
Прямое новое решение владельца сначала фиксируется в соответствующем source document/ADR.

## Reading paths

Пока paths отсутствуют, названия ниже обозначают требуемые разделы, а не существующие файлы.
При импорте замени их проверенными относительными ссылками на оригиналы.

| Задача | Что читать |
| --- | --- |
| Onboarding / M0 | Product, Architecture, Implementation, ADR, invariants, Safety, Data Model; обзор Model и Surface Strategy |
| Health core / analytics | Data Model, Analytics, Context & Memory, Safety, Evals и соответствующие ADR |
| Agent / provider / prompts | Agent Runtime, Model Strategy, Privacy/Safety, Context & Memory, Evals; capability routing |
| Connectors / ingestion | Connectors, Data Model, provenance/temporal semantics, validation и permissions |
| UI / surfaces | UX, Surface Strategy из обоих packs, IA, Navigation, Screen/State specs, Accessibility и approved Figma |

## Контекст, восстановленный из чата — needs_review

Это ориентиры для onboarding, не замена отсутствующих source documents:

- Один monorepo; deterministic health core отделён от UI, providers и storage adapters.
- Engineering sequence: **M0 Foundation → M1 Synthetic Health Profile → Deterministic Analytics → What Changed JSON**.
- M0: tooling, minimal package boundaries, meaningful test harness, CI. M1: первая исполняемая domain slice.
- Не начинать с chat/mobile UI, Supabase, Health Connect, PDF/FHIR или LLM integration.
- Canonical facts, provenance, epistemic state, explicit missing data, guarded writes и privacy boundaries — критичны.
- Product runtime model routing: capability alias → Model Gateway → eligible deployment.
  Конкретные model IDs, цены и provider policies из чата сюда не переносятся; они требуют актуальной проверки и evals.
- Phone — Understand + Act; Web — Investigate + Organize; Widget — Glance; Push — Notice;
  Watch — Glance + Capture; Voice — Capture modality; MCP/API — Integrate.
- Ambient disclosure: Private / Balanced / Detailed. Detailed не является default.

## Как подключить оригиналы

1. Получи оба ZIP от владельца или доступную авторитетную ссылку; зафиксируй источник получения.
2. До распаковки проверь список файлов, абсолютные/traversal paths, symlinks и неожиданные executable assets.
3. Проверь, можно ли публиковать содержимое в этом публичном repo: реальные health data, secrets и private notes не импортируй.
4. Импортируй только нужные релизы в ожидаемые versioned directories, сохраняя исходные документы и metadata.
5. Запиши SHA-256 архивов и manifest файлов с hashes; проверь версии, integrity, ссылки и ADR/INV references.
   Hash фиксирует полученные bytes, но сам по себе не доказывает подлинность или одобрение.
6. Сопоставь handoff с оригиналами; перечисли расхождения, не подгоняй оригиналы под этот пересказ.
7. Обнови source registry на `verified` только с evidence. Старые релизы не подключай как current.

Чего достаточно сейчас: docs-only handoff и read-only onboarding с missing-source report.
Для запуска M0 нужны source reconciliation и approved plan либо явное разрешение владельца на узкий
tooling-only scope с перечисленными исключениями. Для clinical/domain implementation пробелы требований остаются blocking.

## Entry points

- [Root AGENTS](../AGENTS.md) — компактные правила Codex.
- [ExecPlan contract](../.agent/PLANS.md) — lifecycle, evidence, metadata.
- [Onboarding prompt](../prompts/CODEX_ONBOARDING__created-15-10-26_09-37-26__updated-15-10-26_09-48-08__v0.1.0__docs-prompt.md) — read-only первый chat.
- [M0 Foundation template](../.agent/plans/M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_09-37-26__v0.1.0__docs-plan.md) — следующий план, не выполненный milestone.
