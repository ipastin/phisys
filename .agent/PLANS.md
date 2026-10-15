---
title: MyPhisys — ExecPlan contract
created: "15-10-26 09-37-26"
updated: "15-10-26 09-37-26"
timezone: Europe/Moscow
version: 0.1.0
commit: "docs(plans): define execution and evidence contract"
---

# ExecPlans

ExecPlan — living document для одной проверяемой задачи. Он позволяет продолжить работу
в новом Codex chat по repository и plan, без доступа к истории разговоров.
Source index: [SOURCE_OF_TRUTH](../docs/SOURCE_OF_TRUTH.md). Root rules: [AGENTS](../AGENTS.md).

## Когда нужен план

Используй план для многошаговой feature, cross-package refactor, schema/data migration,
safety/privacy change и milestone. Для небольшой локальной правки достаточно короткого scope и проверки.
Один plan не означает обязательные subagents, новый worktree или новые dependencies.

## Lifecycle

`template` → `draft` → `approved` → `in_progress` → `complete`.
`blocked` означает конкретную зависимость, `needs_review` — недоказанный результат или нерешённый вопрос.

- Template задаёт структуру и candidate decisions; он не является разрешением реализации.
- В draft заполни scope, sources, точные файлы/версии, validation и acceptance. Не оставляй значимых TBD перед implementation.
- Зафиксируй существующее разрешение пользователя, его scope и ссылку на review/PR; повторное разрешение не требуй.
- Если изменились clinical semantics, safety/privacy, accepted architecture или scope, согласуй именно эту часть.
- Обновляй Progress, Decisions, Surprises и Validation после каждого milestone; продолжай независимую разрешённую работу.
- `complete` допустим только при evidence для всех acceptance criteria. Merge/deploy — отдельные действия.

## Обязательная структура

1. **Goal / Why:** observable outcome и причина, по которой он нужен.
2. **Status / Authorization:** стадия плана, owner, границы разрешённой работы.
3. **Context / Sources:** фактическое состояние checkout, source versions, пути/разделы, status каждого источника.
4. **Scope / Non-goals:** что меняется и что не входит в эту задачу.
5. **Invariants / Architecture impact:** какие границы затрагиваются, что сохраняется, какие решения требуют review.
6. **Files and dependencies:** конкретные пути, callers, tests, fixtures, config, exports; порядок зависимых задач.
7. **Milestones / Concrete steps:** cwd, действия, ожидаемый результат каждого шага; значения без скрытого chat context.
8. **Validation / Acceptance:** команды, expected outcomes, негативные сценарии, связь каждого критерия с evidence.
9. **Progress:** checkbox, дата/время, результат; отдельно выполнено, осталось, заблокировано.
10. **Decision log:** дата, решение, причина, 2–3 альтернативы при существенном trade-off, источник и approval.
11. **Surprises / Open questions:** неизвестное, влияние, следующий способ проверки.
12. **Recovery / Idempotence:** как безопасно повторить шаг или восстановиться без потери чужих данных.
13. **Outcomes / Retrospective:** достигнутый результат, проверки, отклонения, остаточные риски и next step.

Определяй неоднозначные термины, включай важные ограничения прямо в plan. Ссылки дают глубину,
но не должны скрывать scope, prerequisites и критерии завершения.

## Evidence

Для каждого check записывай command/action, cwd, commit SHA, result, timestamp и короткий evidence pointer.
Допустимые результаты: `pass`, `fail`, `not_run`, `needs_review`.
Запланированная команда, пустой test suite и отсутствие CI run не являются `pass`.

- Process: scope, permissions, relevant sources и Skills соблюдены.
- Artifact: файлы, ссылки, metadata и заявленные контракты корректны.
- Outcome: наблюдаемое поведение доказано, а не только описано.
- Для документации используй source review, link/metadata checks и diff review; product tests не подменяют проверку текста.
- Для code changes выбирай checks по риску; при boundary rule проверь allowed и forbidden cases.
- Сначала исправляй critical/correctness findings, затем улучшения. Не скрывай missing sources под общим «всё проверено».

## Файлы и версии

Handoff version `0.1.0` независима от Project Spec `0.4.0` и Product Design Spec `0.2.0`.
В теле каждого нового Markdown-документа указывай `created`, `updated`, `timezone`, `version`, `commit`.
Commit field содержит Conventional Commit, например `docs(plan): add foundation template`.
Дата: `dd-mm-yy`; время: `hh-mm-ss`; рабочая timezone: `Europe/Moscow`.

Обычное имя: `<name>__created-<date>_<time>__updated-<date>_<time>__v<semver>__<type>-<scope>.md`.
При изменении сохраняй created, обновляй updated, версию по SemVer и commit;
если меняется имя, обнови все входящие ссылки. Имя содержит Conventional Commit type/scope,
полное сообщение — в metadata. Не создавай рядом дубликат «current».

Исключения по явному запросу владельца: `AGENTS.md`, `.agent/PLANS.md`, `docs/SOURCE_OF_TRUTH.md`
сохраняют стабильные имена; даты и версия находятся в их теле. Это единственные entry points этого pack.
Импортируемые source packs сохраняются без переписывания их исходных metadata/имён.

## Стартовый шаблон

[M0 Foundation template](plans/M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_09-37-26__v0.1.0__docs-plan.md).
Сначала onboarding audit, затем review и заполнение M0; implementation запускается отдельной задачей.
