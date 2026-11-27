---
title: Phisys — Codex instructions
created: "15-10-26 09-37-26"
updated: "27-11-26 17-10-14"
timezone: Europe/Moscow
version: "0.2.11"
commit: "docs(stack): record native and web client decisions"
---

# Phisys

Phisys — Personal Health Intelligence System. Repository: `ipastin/phisys`.
Product domain: https://phisys.cloud. Используй написание **Phisys** на всех платформах и в материалах проекта.
Общение — по-русски, на «ты»; code identifiers и общепринятые технические термины — на английском.

## Начало работы

1. Прочитай [SOURCE_OF_TRUTH](docs/SOURCE_OF_TRUTH.md): доступные источники, их статус и конфликты.
2. Проверь текущую ветку, diff, структуру и scoped instructions. Сохраняй чужие изменения.
3. Из текущих source packs прочитай `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, релевантный domain spec, `13 ADR`, `11 IMPLEMENTATION` и `12 EVALS`; `15–17` — когда задача затрагивает бренд, models или surfaces. Точные ссылки в source index.
4. Для многошаговых, cross-package, schema, safety/privacy изменений веди ExecPlan по [.agent/PLANS.md](.agent/PLANS.md).

## Ограничения архитектуры

Ниже — компактная выборка из Project Spec `14 AGENTS`, `02 ARCHITECTURE` и accepted ADR.
Текущий registry содержит 31 invariant и 171 запись ADR. Владелец утвердил ADR-171 для клиентского стека 27 ноября 2026 года.
Для ADR-151–170 сохраняется [неоднозначность статуса в исходном импорте](docs/SOURCE_OF_TRUTH.md#открытые-вопросы-исходных-спецификаций). При конфликте:
explicit invariant → accepted ADR → domain specification → implementation convenience.
Конфликт фиксируй; source documents не переписывай молча.

- Canonical Health Store хранит подтверждённые health facts; AI inference автоматически фактом не становится.
- У каждого факта сохраняются provenance, временная семантика и epistemic state.
  Для количественных значений сохраняй original value/unit; canonical value/unit — при нормализации.
- Missing/unknown не означает ноль, false, норму или отсутствие события.
- Deterministic analytics предшествует generative reasoning; одинаковые входы дают одинаковый результат.
- Connectors пишут в Source/Raw layer; переход к canonical data проходит отдельную validation boundary.
- LLM не пишет напрямую в Canonical Health Store. Natural-language writes через product agent
  проходят structured preview и explicit confirmation when required (INV-014).
  Connector ingestion проходит Raw → validation → canonical без общего требования подтверждать каждый факт.
- Product agent получает только scoped, разрешённые tools; generic SQL/network/filesystem capability ему не выдаётся.
  Это ограничение product runtime, а не запрет Codex читать файлы и запускать проверки репозитория.
- Model access проходит через capability alias и Model Gateway; provider memory не заменяет память Phisys.
- Fallback не ослабляет privacy; health files не отправляются во внешнее хранилище автоматически.
- Health claims должны опираться на проверяемые данные; uncertainty и недостаток данных должны быть видимыми.
- Surface Strategy распределяет capabilities по задачам surfaces; feature parity не является целью.
  Detailed health disclosure не включается по умолчанию на lock screen, widget или watch.

### Клиенты и общий API

- Android Personal Beta — нативное приложение на Kotlin и Jetpack Compose. Тонкий адаптер Android Health Connect SDK передаёт исходные записи в ingestion через Fastify.
- Web Companion после Android Beta — React, TypeScript strict и Next.js. Web обращается к Fastify по HTTP/OpenAPI. PostgreSQL и детерминированная аналитика остаются в backend.
- iOS — отдельное нативное приложение на Swift с HealthKit, позже по Surface Strategy. Выбор UI toolkit для iOS относится к этапу S3.
- Общий контракт задаёт типы данных на границе API, семантику состояния, provenance и роли design tokens. Реализация интерфейсов и сборка зависят от платформы. См. [решение ADR-171](docs/SOURCE_OF_TRUTH.md#стек-клиентов).

Текущий build order по Project Spec `11 IMPLEMENTATION`: M0 Foundation → M1 Health Data Pipeline
→ M2 Health Intelligence (`What Changed`) → M3 Product Experience → M4 Clinical Data + AI → M5 Hardening.

## Scope и разрешения

- Состояние реализации и ссылки на проверки приведены в [карте проекта](docs/SOURCE_OF_TRUTH.md#состояние-разработки-и-дизайна). [Onboarding audit](docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md)
  и [утверждённый M0 scope](.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md) фиксируют исходные решения M0. Для новой реализации сверяй затронутый milestone и актуальный scope.
- Работай в отдельной `codex/*` ветке и через PR. Не создавай и не меняй `main` напрямую.
- Merge, deploy, DNS/domain changes, secrets, Figma/shared-system writes требуют отдельного разрешения.
- Для изменения canonical model, safety/privacy, accepted ADR, IA или утверждённого UX сначала покажи decision и trade-offs.
  Обычные implementation details внутри уже разрешённого scope выполняй без повторного согласования.
- Repository публичный: только synthetic fixtures; никаких реальных health records, токенов, private transcripts или local paths в fixtures/logs.
- Не добавляй frameworks, empty packages, agents или абстракции без необходимости текущего milestone.

## Проверка и handoff

- До редактирования найди затронутые callers, tests, fixtures, config и exports; сохрани validation/error handling.
- Запускай существующие проверки, подходящие изменению. Для новой нетривиальной логики нужен meaningful test.
- Проверяй доступные scripts в `package.json` и фактический результат CI на нужном commit.
- В финале укажи изменения, фактически выполненные checks, `not_run` / `needs_review`, оставшиеся риски и следующий шаг.
- Commit messages: Conventional Commits. Документы: SemVer, created/updated в `dd-mm-yy hh-mm-ss`, timezone.
  Правило стабильных имён и формат остальных Markdown-файлов описаны в [.agent/PLANS.md](.agent/PLANS.md).
