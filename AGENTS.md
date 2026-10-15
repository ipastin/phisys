---
title: MyPhisys — Codex instructions
created: "15-10-26 09-37-26"
updated: "15-10-26 13-52-35"
timezone: Europe/Moscow
version: 0.2.8
commit: "docs(codex): synchronize root guidance version"
---

# MyPhisys

MyPhisys — Personal Health Intelligence System. Repository: `ipastin/phisys`.
Product domain: https://phisys.cloud. Не переименовывай бренд в Phisys.
Общение — по-русски, на «ты»; code identifiers и общепринятые технические термины — на английском.

## Начало работы

1. Прочитай [SOURCE_OF_TRUTH](docs/SOURCE_OF_TRUTH.md): доступные источники, их статус и конфликты.
2. Проверь текущую ветку, diff, структуру и scoped instructions. Сохраняй чужие изменения.
3. Из текущих source packs прочитай `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, релевантный domain spec, `13 ADR`, `11 IMPLEMENTATION` и `12 EVALS`; `15–17` — когда задача затрагивает бренд, models или surfaces. Точные ссылки в source index.
4. Для многошаговых, cross-package, schema, safety/privacy изменений веди ExecPlan по [.agent/PLANS.md](.agent/PLANS.md).

## Ограничения архитектуры

Ниже — компактная выборка из Project Spec `14 AGENTS`, `02 ARCHITECTURE` и accepted ADR.
Полный registry — 31 invariant и 170 ADR в импортированном Project Spec. В заголовке
`13 ADR` статус привязан к v0.3.0, хотя manifest v0.4.0 и записи ADR указывают `Accepted`;
перед опорой на новые ADR учти [неоднозначность статуса](docs/SOURCE_OF_TRUTH.md#открытые-вопросы-исходных-спецификаций). При конфликте:
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
- Model access проходит через capability alias и Model Gateway; provider memory не заменяет память MyPhisys.
- Fallback не ослабляет privacy; health files не отправляются во внешнее хранилище автоматически.
- Health claims должны опираться на проверяемые данные; uncertainty и недостаток данных должны быть видимыми.
- Surface Strategy распределяет capabilities по задачам surfaces; feature parity не является целью.
  Detailed health disclosure не включается по умолчанию на lock screen, widget или watch.

Текущий build order по Project Spec `11 IMPLEMENTATION`: M0 Foundation → M1 Health Data Pipeline
→ M2 Health Intelligence (`What Changed`) → M3 Product Experience → M4 Clinical Data + AI → M5 Hardening.

## Scope и разрешения

- Текущий `main` содержит merged documentation и source packs. [Onboarding audit](docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-15-10-26_13-34-06__v0.3.1__docs-audit.md)
  и [утверждённый M0 scope](.agent/plans/M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_13-34-06__v0.3.1__docs-plan.md) не означают немедленного старта application implementation: владелец выбрал «старт позже».
- Работай в отдельной `codex/*` ветке и через PR. Не создавай и не меняй `main` напрямую.
- Merge, deploy, DNS/domain changes, secrets, Figma/shared-system writes требуют отдельного разрешения.
- Для изменения canonical model, safety/privacy, accepted ADR, IA или утверждённого UX сначала покажи decision и trade-offs.
  Обычные implementation details внутри уже разрешённого scope выполняй без повторного согласования.
- Repository публичный: только synthetic fixtures; никаких реальных health records, токенов, private transcripts или local paths в fixtures/logs.
- Не добавляй frameworks, empty packages, agents или абстракции без необходимости текущего milestone.

## Проверка и handoff

- До редактирования найди затронутые callers, tests, fixtures, config и exports; сохрани validation/error handling.
- Запускай существующие проверки, подходящие изменению. Для новой нетривиальной логики нужен meaningful test.
- Не объявляй планируемый script работающим: сейчас package scripts, application code и CI отсутствуют.
- В финале укажи изменения, фактически выполненные checks, `not_run` / `needs_review`, оставшиеся риски и следующий шаг.
- Commit messages: Conventional Commits. Документы: SemVer, created/updated в `dd-mm-yy hh-mm-ss`, timezone.
  Правило стабильных имён и формат остальных Markdown-файлов описаны в [.agent/PLANS.md](.agent/PLANS.md).
