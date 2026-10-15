---
title: MyPhisys — утверждённый scope M0 Foundation
created: "15-10-26 12-28-44"
updated: "15-10-26 13-34-06"
timezone: Europe/Moscow
version: 0.3.1
commit: "docs(plan): specify executable M0 acceptance checks"
status: approved
---

# Утверждённый scope M0 Foundation

## Цель

Результат M0 — воспроизводимый pnpm/Turborepo foundation, реальный package build и проверки import boundaries как вход в M1 Health Data Pipeline. Health schemas, database, analytics, UI, Model Gateway и integration с реальными данными относятся к последующим milestones.
[Project `11 IMPLEMENTATION`, §8 Steps 00–02](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Статус и разрешение

- Статус: `approved` для описанного M0 scope; владелец выбрал «Утвердить scope, старт позже» в текущем Codex chat. Реализация не начата и отложена до отдельной команды на старт.
- Base на момент onboarding: `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a` (`main`/`origin/main`).
- Ветка документации: `codex/m0-plan-review`; будущая ветка реализации: `codex/m0-foundation` от актуального `origin/main` после review документации.
- Scope approval: `approved` для root workspace, одного `architecture-guardrails` package, указанных pins/checks и границ реализации. Выбор записан 15-10-26 13-13-12 (Europe/Moscow); это время записи, не timestamp ответа. Старт implementation отложен владельцем. Merge, deploy, production services, secrets и shared-system writes остаются отдельными решениями по [root AGENTS, «Scope»](../../AGENTS.md#scope-и-разрешения).
- Перед реализацией повторно проверить HEAD, diff, remote и scoped instructions. Этот base SHA — snapshot планирования, не разрешение на reset или перезапись изменений.

## Контекст и источники

- [Onboarding audit](../../docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-15-10-26_13-34-06__v0.3.1__docs-audit.md) — входная доказательная база.
- Актуальные packs: [Project Spec 0.4.0](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
  и [Design Spec 0.2.0](../../docs/product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).
- Plan contract: [.agent/PLANS.md](../PLANS.md). Прежний [M0 template](M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-plan.md) остаётся историческим; его ожидание ещё не слитого docs PR опровергнуто текущим checkout.
- Приоритет источников: [Project `00 README`, §5](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
  [Project `14 AGENTS`, §§2–4](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Scope и границы

**Утверждённый package graph:** root workspace плюс один реальный `packages/architecture-guardrails`, который содержит import rules, исполняемую проверку и тесты; `tests/architecture` хранит synthetic allowed/forbidden graphs. Пустые `apps/*` и domain packages в M0 не создавать. Утверждённый scope не запускает реализацию до отдельной команды владельца.

Package содержит реальную import-rule configuration, исполняемую проверку/build target и tests. Synthetic graph моделирует будущие имена packages; M1 добавляет production domain packages вместе с их реальными contracts. Владелец утвердил это минимальное прочтение `base apps/packages` из [Project `11 IMPLEMENTATION`, §8 Step 00](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

В scope: pinned runtime/tooling, lockfile, strict TS, lint/format, содержательные Vitest assertions, dependency-cruiser rules, PR CI, dependency audit и secret scan. Вне scope: application/domain features, clinical schemas/fixtures, database/RLS, analytics/What Changed, mobile/web UI, Health Connect/HealthKit, LLM/Model Gateway, provider calls, deploy и DNS.

## Invariants и влияние на архитектуру

Правила должны отклонять будущие forbidden imports `health-core` → model/vendor/UI/infrastructure, `connectors` → analytics/agent и `skills` → provider SDK; проверять workspace imports, tsconfig aliases и относительные межпакетные пути. Для этих правил нужны allowed и forbidden fixtures. Ограничения вроде «analytics не пишет Raw/Canonical» нельзя доказать одним import checker: их M1/M2 реализация требует отдельного API/data-flow test. До появления domain packages M0 доказывает поведение checker на synthetic graph и проверяет фактический repository graph, но не runtime isolation будущих modules. Источники:
[Project `02 ARCHITECTURE`, §9](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
и [Project `14 AGENTS`, §4](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
M0 fixture graph содержит только искусственные технические данные, не health records или clinical entities.

## Точные версии в утверждённом scope, сверены 15-10-26

Версии ниже входят в утверждённый scope, но их совместимость ещё не подтверждена install или integration test. Перед стартом M0 нужно повторно проверить доступность и совместимость; при несовместимости вернуться к owner review, а не менять pins молча. В `packageManager`, `devDependencies`, runtime file и CI нужны точные версии без caret ranges.

| Инструмент | Pin | Источник и причина |
| --- | --- | --- |
| Node.js | `24.22.0` | [Официальный LTS release, 14-10-26](https://nodejs.org/en/blog/release/v24.22.0). Локально `24.17.0`, parity ещё `not_run`. |
| pnpm | `12.13.0` | [Официальный release, 13-10-26](https://pnpm.io/blog/releases/12.13.0) и [совместимость с Node 24](https://pnpm.io/installation/). Локальная версия совпадает. |
| Turborepo | `2.11.8` | [npm metadata](https://registry.npmjs.org/turbo/2.11.8); stack задан в Project `11 IMPLEMENTATION`, §§1, 8. |
| TypeScript | `6.0.3` | [npm metadata](https://registry.npmjs.org/typescript/6.0.3); версия 7.0 вне peer range `<6.1.0` для `typescript-eslint@8.71.2`. |
| `@types/node` | `24.19.2` | [npm metadata](https://registry.npmjs.org/%40types%2Fnode/24.19.2); совпадает major Node. |
| Vitest / Vite | `5.0.4` / `8.3.4` | [Vitest metadata](https://registry.npmjs.org/vitest/5.0.4) и [Vite/Node requirements](https://vitest.dev/guide/migration/). Vite — явный peer pin. |
| ESLint / `@eslint/js` / `typescript-eslint` | `10.12.0` / `10.0.1` / `8.71.2` | [ESLint](https://registry.npmjs.org/eslint/10.12.0), [ESLint JS](https://registry.npmjs.org/%40eslint%2Fjs/10.0.1), [typescript-eslint peer range](https://registry.npmjs.org/typescript-eslint/8.71.2). |
| Prettier | `3.9.10` | [npm metadata](https://registry.npmjs.org/prettier/3.9.10); форматировать только новый first-party code/config/docs, исходные packs сохранить. |
| dependency-cruiser | `18.6.0` | [npm metadata](https://registry.npmjs.org/dependency-cruiser/18.6.0) и [документация правил/alias](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md); заявлена совместимость с Node 24. |
| Gitleaks CLI | `8.30.1` | [Официальный release и binary checksums](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1); checksum для CI platform закрепить при workflow implementation. |

Для CI в scope входят [actions/checkout `v7.0.1`](https://github.com/actions/checkout/releases/tag/v7.0.1), [pnpm/setup `v3.1.1`](https://github.com/pnpm/setup/releases/tag/v3.1.1), точные Node `24.22.0` и pnpm `12.13.0`. `pnpm/setup` устанавливает оба runtime; задать `runtime: node@24.22.0`, `version: 12.13.0`, `install: false`, затем явно выполнить frozen install. Для полного Git history scan checkout должен использовать `fetch-depth: 0`. При создании workflow закрепить immutable action SHAs и проверить release commits. CI runner и fork-PR behavior — `not_run`.

## Файлы и зависимости

| Предложенный путь | Назначение / consumer |
| --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, runtime-version file | Точные scripts, workspace membership, frozen dependency graph и local/CI runtime. |
| `turbo.json`, root `tsconfig*.json`, ESLint/Prettier config, `.gitignore` | Реальный task graph, strict checks, scope форматирования, исключение generated output. |
| `packages/architecture-guardrails/**` | Реальный internal package: import rules, executable/build entry и tests для root scripts/CI. |
| `tests/architecture/**` | Synthetic allowed/forbidden import graphs вне production graph. |
| `.github/workflows/ci.yml` | PR/push checks с pinned Node/pnpm и read-only permissions; без deploy/secrets. |
| Этот plan и source index | Progress/evidence и корректные ссылки. |

Перед реализацией повторить `git ls-files`, `git status`, поиск scoped AGENTS и инвентаризацию callers/config/exports. Если появился application code, обновить этот graph до редактирования.

## Этапы

1. **M0.0 — ожидание старта:** полный scope согласован; M0.1 не начинать до отдельной команды владельца. При старте перепроверить `origin/main` SHA, branch protection и совместимость pins.
2. **M0.1 — workspace:** pin Node/pnpm/dependencies, создать lockfile и непустой guardrails package. `pnpm install --frozen-lockfile` не должен менять lockfile.
3. **M0.2 — graph:** реализовать import rules через dependency-cruiser, strict TypeScript, Vitest allowed/forbidden cases и реальный build output. Forbidden edge в negative corpus должен давать ненулевой exit; тот же checker должен проверить first-party source graph текущего checkout.
4. **M0.3 — CI:** запустить те же checks на SHA PR; проверить fork PR с read-only permissions, без deploy и product secrets.
5. **M0.4 — review:** проверить diff, evidence и отсутствие out-of-scope изменений; открыть reviewable PR. Merge — отдельное действие. Для M1 нужен собственный plan после принятия M0.

## Проверки и критерии принятия

Команды ниже — **утверждённый executable contract**, сейчас `not_run`: M0 files/dependencies отсутствуют. Implementation PR должен указать command, cwd, SHA, timestamp, result и evidence pointer для каждого check. `pnpm test` должен выполнять assertions, а не проходить с нулём тестов. Imported source packs исключены из formatter rewrites.

| Check | Ожидаемый результат | Статус |
| --- | --- | --- |
| `node --version`, `pnpm --version` | `v24.22.0`, `12.13.0` локально и в CI. | `not_run` для пары |
| `pnpm install --frozen-lockfile` | Fresh install без lockfile diff. | `not_run` |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | Scoped first-party source/config проходят; TS strict. | `not_run` |
| `pnpm test:unit` | Реальные assertions для guardrails logic. | `not_run` |
| `pnpm test:architecture` | Allowed graph проходит, forbidden workspace/alias/relative edges отклоняются; тот же checker проверяет текущий first-party source graph; тест не зависит от наличия будущих domain packages. | `not_run` |
| `pnpm test`, `pnpm build` | Запускают непустые targets; build artifact используется checker. | `not_run` |
| `pnpm audit --audit-level high` | Нет неразобранных high/critical advisories; ошибка registry не считается pass. | `not_run` |
| `gitleaks git . --redact` | Нет secret findings в полном Git history; CLI `8.30.1`, CI checkout с `fetch-depth: 0`. | `not_run` |
| `git diff --check` | Нет whitespace errors в изменённых first-party files. | `not_run` для implementation diff |
| PR CI на том же SHA | Local и CI checks совпадают, read-only token, без deploy. | `not_run` |

Acceptance: воспроизводимый install; реальный internal package build и entry, используемый root checks; strict/lint/format checks; negative architecture tests; dependency/secret checks; CI evidence на SHA PR; отсутствие application features и real health data. M0 доказывает корректность checker и текущего graph, а не runtime isolation ещё не созданных packages. Test/eval intent следует из
[Project `12 EVALS`, §§1–2, 16](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Прогресс

- [x] Onboarding/source reconciliation документированы; наличие packs проверено.
- [x] Planning base SHA, выбранный graph, exact versions/check names записаны.
- [x] Owner выбрал узкое толкование Step 00: один реальный guardrails package.
- [x] Полный executable scope согласован владельцем; старт выбран «позже».
- [ ] Отдельная команда владельца на старт implementation.
- [ ] Повторная проверка доступности/совместимости точных версий при старте реализации.
- [ ] Toolchain, guardrails, tests, build, CI и outcome implementation PR: `not_run`.

## Журнал решений

| Дата/время (Europe/Moscow) | Решение и альтернативы | Статус / причина |
| --- | --- | --- |
| 15-10-26 12-28-44 | **Рекомендован один реальный guardrails package.** Root-only graph меньше, но не доказывает package build; полный target scaffold создаёт пустые shells. | Owner выбрал рекомендацию в текущем Codex chat; implementation требует отдельного решения. |
| 15-10-26 12-59-48 | Записан выбор owner: «Рекомендованный: один package» в текущем Codex chat. | `approved` для package graph M0. |
| 15-10-26 13-13-12 | Записан ответ owner «Утвердить scope, старт позже» на отдельный вопрос о полном M0 scope. | `approved` для scope, pins/checks и non-goals; implementation остаётся `not_started`. |
| 15-10-26 12-28-44 | Node 24 LTS + pnpm 12 + TS 6.0; TS 7 вне текущего peer range `typescript-eslint`, более старый TS не даёт M0 выгоды. | Exact pins выше предложены; install/CI compatibility — `not_run`. |
| 15-10-26 12-28-44 | dependency-cruiser вместо custom parser или import-string grep: одна целевая dependency, которая разрешает graph/aliases; grep пропускает relative/alias edges. | Proposal; negative fixtures обязательны. |
| 15-10-26 12-28-44 | `pnpm audit` + pinned Gitleaks CLI вместо дополнительных action scanners: одинаковые local/CI commands, отдельные gates для registry и binary checksum. | Proposal; scans не запускались. |

## Открытые вопросы

| `pending` из onboarding | Решение для M0 review | Следующий gate |
| --- | --- | --- |
| Base SHA и статус source packs | `resolved`: GitHub compare подтвердил `origin/main` = `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a`; packs уже в `main`. | Перед implementation branch проверить SHA повторно. |
| Минимальный package graph | `resolved`: owner выбрал root workspace + один реальный guardrails package + synthetic fixtures. | При старте проверить фактический graph checkout. |
| Точные версии и checks | `approved_scope`: pins и команды включены в согласованный plan; совместимость local install/CI не доказана. | Повторно сверить версии и проверить на свежем checkout после команды на старт. |
| ADR-151–170, P2 dates, approved Figma | `deferred`: это не зависимости M0 Foundation; источники остаются с исходным статусом. | Отдельные решения до затрагивающих их M3/M4 работ. |
| Branch protection, action SHAs и GitHub CI | `not_run`: M0 workflow отсутствует; shell remote check не прошёл из-за DNS. | Проверка при implementation PR; не объявлять их готовыми заранее. |

- Локальный Node `24.17.0` ниже предложенного `24.22.0`; local/CI parity не подтверждена.
- Конфликт статуса Project ADR-151–170 и решение по privacy точных P2 measurement dates остаются `needs_review` для зависящих от них features; M0 code их не решает.
  [SOURCE_OF_TRUTH, Open questions](../../docs/SOURCE_OF_TRUTH.md#открытые-вопросы-исходных-спецификаций).
- Approved Figma file/node отсутствует для будущей visual implementation; M0 tooling не зависит от него.
- Branch protection, CI run, frozen install, action SHAs и package build не проверены.

## Восстановление и повторный запуск

Не запускай bootstrap generator поверх существующего workspace и не делай reset/clean занятого checkout. Перед шагом проверяй файлы и сохраняй чужие изменения. Ошибку frozen install диагностируй, не подгоняя lockfile. Negative fixtures держи вне production graph. Rollback — отдельный revert PR.

## Результат

Текущий outcome — **approved scope**, а не выполненный Foundation. Старт implementation отложен владельцем. После отдельной команды на старт нужно обновить base SHA и проверить доступность точных версий, затем выполнять M0 в отдельной ветке. M1 начинается с database/canonical pipeline; deterministic analytics и `What Changed` остаются M2.
