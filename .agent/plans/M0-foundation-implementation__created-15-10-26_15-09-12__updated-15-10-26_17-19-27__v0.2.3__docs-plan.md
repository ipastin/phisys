---
title: MyPhisys — M0 Foundation implementation evidence
created: "15-10-26 15-09-12"
updated: "15-10-26 17-19-27"
timezone: Europe/Moscow
version: 0.2.3
commit: "docs(plan): record reviewed M0 checks"
status: needs_review
---

# M0 Foundation implementation

## Goal / Why

Сделать воспроизводимый pnpm/Turborepo foundation и исполняемые import boundaries как вход в M1. Наблюдаемый результат: fresh install, непустой package build, allowed/forbidden architecture tests и PR CI на том же commit SHA.

## Status / Authorization

Владелец отдельно запустил implementation 15-10-26. Утверждённый [M0 scope](M0-foundation-review__created-15-10-26_12-28-44__updated-15-10-26_14-16-46__v0.3.2__docs-plan.md) остаётся authority; этот файл хранит progress и evidence реализации. Base `origin/main`: `35832a4680db46879962278b4ff1e94eb7a93d1c`; implementation branch: `codex/m0-foundation`; первый code commit: `afe9ba3`. Merge, deploy, secrets и shared-system writes не разрешены.

## Context / Sources

- [SOURCE_OF_TRUTH](../../docs/SOURCE_OF_TRUTH.md), [root AGENTS](../../AGENTS.md), [ExecPlan contract](../PLANS.md), [onboarding audit](../../docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-15-10-26_14-16-46__v0.3.2__docs-audit.md).
- Project Spec `0.4.0`: `00 README`, `14 AGENTS`, `02 ARCHITECTURE`, `13 ADR`, `11 IMPLEMENTATION` Steps 00–02 и `12 EVALS` §16. Imported packs сохранены без изменений.
- Проверка `origin/main` после fetch: PR #2 уже включён, содержимое прежней review branch совпадало с `main`, рабочее дерево перед стартом было чистым. Scoped `AGENTS.md` внутри repository не обнаружены.

## Scope / Non-goals

Root workspace, один `packages/architecture-guardrails`, synthetic import graph, точные pins, local checks и read-only PR CI. Не входят domain packages, health schemas/data, database, UI, Model Gateway, deploy и DNS.

## Invariants / Architecture impact

Checker разрешает `health-core` импортировать только собственный package и `contracts`; другие first-party packages, внешние SDK и Node runtime отклоняются. Остальные правила отклоняют `connectors` → analytics/agent, `agent-runtime` → database implementation, `skills` → provider SDK. Allowed и forbidden fixtures охватывают workspace, tsconfig alias, relative, установленный provider package, новый adapter, `pg` и `node:fs`. Это проверка import graph, не runtime isolation и не проверка записи Raw/Canonical или SQL execution. Будущие package-specific tsconfig aliases и новые provider families потребуют расширения checker; M0 fixture checker принимает явный tsconfig.

## Files / Dependencies / Consumers

| Файлы | Consumer / effect |
| --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, `turbo.json` | exact install, root scripts, один package build |
| `tsconfig.json`, `tsconfig.tests.json`, `eslint.config.mjs`, `.prettierrc.json`, `.gitignore` | strict source/test-harness typecheck, first-party lint/format, generated output exclusion |
| `packages/architecture-guardrails/src/**`, package config/tests | built CLI и rules для root `test:architecture` |
| `tests/architecture/**` | synthetic allowed/forbidden corpus и current source graph check |
| `.github/workflows/ci.yml` | `pull_request`/`main` checks, read-only token, exact runtime/action SHAs, full history scan |
| Этот план и `docs/SOURCE_OF_TRUTH.md` | progress и discoverability; imported packs не редактируются |

Callers до M0 отсутствовали. Новый root `test:architecture` вызывает built CLI; `pnpm test` вызывает unit и architecture suites. Fixture names моделируют будущие packages и не являются production packages.

## Milestones / Progress

- [x] M0.0: `origin/main`, branch, diff, scoped instructions и exact pins перепроверены.
- [x] M0.1: workspace, lockfile и реальный package build созданы; frozen install из fresh clone пройден.
- [x] M0.2: checker и negative corpus проходят, включая installed provider; current first-party graph проверен.
- [x] M0.3a: PR CI `validate` прошёл на code SHA `87f3556`.
- [ ] M0.3b: fork PR runtime `not_run`: нет второго GitHub account или готового fork для пробного PR.
- [x] M0.4: [implementation PR #3](https://github.com/ipastin/phisys/pull/3) открыт; diff и local evidence проверены.

## Validation / Acceptance

Local evidence записано 15-10-26 15-09-12, 15-27-42, 15-39-48 и 17-16-32 (Europe/Moscow). CWD для local checks: repository root, кроме fresh clone. Первоначальный code SHA: `afe9ba3`; расширенный test-harness typecheck/test/build — `dacef1f`; provider-boundary regression — `2bcb695`; independent-review fix — `87f3556cbfee4ccba61eb3785cbf261b5858859b`. Evidence pointers: output команд Codex task, [первый PR CI run 38735200223](https://github.com/ipastin/phisys/actions/runs/38735200223) и [CI run после review fix 38750018899](https://github.com/ipastin/phisys/actions/runs/38750018899). Последний PR head проверяется в PR Checks.

| Check / action | Result | Evidence / limit |
| --- | --- | --- |
| `node --version`, `pnpm --version` под временной Node 24.22.0 | `pass` | `v24.22.0`, `12.13.0`; системный default Node остаётся `24.17.0` |
| Fresh clone `pnpm install --frozen-lockfile`, `pnpm build` | `pass` | изолированный временный clone; lock SHA-256 до/после `0f3e8dd8fb99f9f83ded1837b09bce04d7ed00588d9e6331761990376d85b03d`; build 1/1 |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | `pass` | exact Node command, zero exit на `2bcb695`; strict TS охватывает source и test harness, fixtures исключены намеренно |
| `pnpm test:unit`, `pnpm test:architecture`, `pnpm test`, `pnpm build` | `pass` | на `2bcb695`: 2 unit assertions; 16 architecture cases; installed provider и другие negative cases exit nonzero; 1 real build target |
| Review fix: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:architecture`, `pnpm build`, `git diff --check` | `pass` | на `87f3556`: 2 unit assertions, 19 architecture cases; local Node `24.17.0`, pnpm `12.13.0`; exact Node подтверждён CI |
| `pnpm audit --audit-level high` | `pass` | registry response: no known vulnerabilities |
| `gitleaks git . --redact` | `pass` | Gitleaks `8.30.1`, checked Darwin asset SHA-256, 14 commits scanned, no findings |
| `git diff --cached --check` | `pass` | implementation code commit had no whitespace errors |
| PR CI `validate` на `f15af71` | `pass` | исторический `pull_request` run 38735200223: exact runtime, frozen install, lint, format, typecheck, tests, build, audit и Gitleaks — все steps success |
| PR CI `validate` на code SHA `87f3556` | `pass` | `pull_request` run 38750018899: тот же полный набор steps, включая 19 architecture cases; `v24.22.0` и pnpm `12.13.0` |
| Fork PR runtime | `not_run` | workflow uses `pull_request`, `contents: read`, no secrets/deploy; нет второго GitHub account или готового fork, поэтому реальный fork run не выполнен |

## Decisions

- Одобренный graph из одного real package оставлен. Root-only вариант не доказывает build; полный scaffold дал бы пустые packages.
- Exact Node запущен временно через `npm exec`; изменение системного runtime затронуло бы другие проекты. CI pin фиксирует Node `24.22.0`.
- Approved scope document сохранён как историческое решение; implementation evidence вынесено сюда, чтобы не переименовывать утверждённый документ и все его ссылки.
- `health-core` по умолчанию ограничен собственным package и `contracts`; новая допустимая внешняя зависимость потребует явного review и изменения правила в M1.

## Surprises / Open questions

- Первый architecture test обнаружил пропуск tsconfig aliases. `extractTSConfig` + fixture `baseUrl` закрыли его; затем все 15 cases прошли.
- Финальная проверка нашла, что первый `typecheck` не охватывал test harness. Добавлен отдельный strict `tsconfig.tests.json`; fixture modules исключены, поскольку содержат намеренно запрещённые imports.
- PR review нашёл bypass: `exclude node_modules` удалял edge установленного provider SDK. Synthetic installed package сначала воспроизвёл ошибочный pass; после удаления этого exclude, сохранения `doNotFollow` и расширения patterns на Azure/Bedrock/Vertex все 16 architecture cases прошли.
- Следующий review обнаружил, что новый adapter package может обойти `health-core` rule; independent review затем подтвердил тот же пробел для `pg` и `node:fs`. Default-deny rule и negative fixtures закрыли эти случаи; теперь 19 architecture cases проходят.
- CodeRabbit отметил устаревший статус CI на code SHA `034992a`; замечание подтверждено и исправлено этим обновлением. Для code SHA `87f3556` CodeRabbit вернул `Review rate limited`; это не substantive review финального кода.
- Для `main` действует [ruleset 25165088](https://github.com/ipastin/phisys/rules/25165088): обязательный `validate` от GitHub Actions, без bypass, `strict=false`. Legacy branch protection endpoint всё ещё может отвечать 404, потому что защита реализована ruleset.
- Fork PR с read-only token не запускался: владелец подтвердил отсутствие второго account/fork. Статическая конфигурация не равна runtime evidence.
- Системный Node остаётся `24.17.0`; локальные проверки проводились под временным exact runtime.

## Recovery / Idempotence

Повторный `pnpm install --frozen-lockfile` не меняет lockfile. `pnpm build` воспроизводит `dist` из source; `dist` игнорируется Git. Не запускать bootstrap generator и не делать reset/clean занятого checkout. Rollback — отдельный revert PR.

## Outcome / Next step

Локальные M0 gates и CI `validate` на code SHA `87f3556` выполнены, [implementation PR #3](https://github.com/ipastin/phisys/pull/3) открыт, обязательный `validate` для `main` настроен. Independent AI review завершён, его finding исправлен. Fork PR runtime — `not_run`, CodeRabbit на последнем code SHA — `rate limited` без substantive review; оба ограничения остаются видимыми до решения о merge. Merge и deploy остаются отдельными решениями.
