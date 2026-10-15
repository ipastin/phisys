---
title: MyPhisys — Codex instructions
created: "15-10-26 09-37-26"
updated: "15-10-26 09-37-26"
timezone: Europe/Moscow
version: 0.1.0
commit: "docs(codex): add compact repository instructions"
---

# MyPhisys

MyPhisys — Personal Health Intelligence System. Repository: `ipastin/phisys`.
Product domain: https://phisys.cloud. Не переименовывай бренд в Phisys.
Общение — по-русски, на «ты»; code identifiers и общепринятые технические термины — на английском.

## Начало работы

1. Прочитай [SOURCE_OF_TRUTH](docs/SOURCE_OF_TRUTH.md): доступные источники, их статус и конфликты.
2. Проверь текущую ветку, diff, структуру и scoped instructions. Сохраняй чужие изменения.
3. Читай только документы по задаче. Отсутствующий документ — пробел, а не разрешение придумать требования.
4. Для многошаговых, cross-package, schema, safety/privacy изменений веди ExecPlan по [.agent/PLANS.md](.agent/PLANS.md).

## Ограничения архитектуры

Ниже — рабочие ограничения handoff. Их соответствие полным спецификациям ещё требует сверки;
реестр ADR/INV этим списком не заменяется. Конфликт фиксируй, не ослабляй границы молча.

- Canonical Health Store хранит подтверждённые health facts; AI inference автоматически фактом не становится.
- У каждого факта сохраняются provenance, единицы, временная семантика и epistemic state.
- Missing/unknown не означает ноль, false, норму или отсутствие события.
- Deterministic analytics предшествует generative reasoning; одинаковые входы дают одинаковый результат.
- Connectors пишут в Source/Raw layer; переход к canonical data проходит отдельную validation boundary.
- LLM не пишет напрямую в Canonical Health Store; изменения требуют проверяемого preview/confirmation workflow.
- Product agent получает только scoped, разрешённые tools; generic SQL/network/filesystem capability ему не выдаётся.
  Это ограничение product runtime, а не запрет Codex читать файлы и запускать проверки репозитория.
- Model access проходит через capability alias и Model Gateway; provider memory не заменяет память MyPhisys.
- Fallback не ослабляет privacy; health files не отправляются во внешнее хранилище автоматически.
- Health claims должны опираться на проверяемые данные; uncertainty и недостаток данных должны быть видимыми.
- Surface Strategy распределяет capabilities по задачам surfaces; feature parity не является целью.
  Detailed health disclosure не включается по умолчанию на lock screen, widget или watch.

## Scope и разрешения

- Текущий handoff содержит документацию; onboarding и M0 template не разрешают application implementation.
- Работай в отдельной `codex/*` ветке и через PR. Не создавай и не меняй `main` напрямую.
  Если `main` отсутствует, подготовь локальную ветку и дождись initial commit владельца.
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
