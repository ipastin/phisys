---
title: MyPhisys — M0 Foundation implementation evidence
created: "15-10-26 15-09-12"
updated: "15-10-26 15-27-42"
timezone: Europe/Moscow
version: 0.2.1
commit: "docs(plan): include test harness typecheck evidence"
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

Checker отклоняет `health-core` → model/vendor/UI/infrastructure, `connectors` → analytics/agent, `agent-runtime` → database implementation, `skills` → provider SDK. Allowed и forbidden fixtures охватывают workspace, tsconfig alias и relative imports. Это проверка import graph, не runtime isolation и не проверка записи Raw/Canonical или SQL execution. Будущие package-specific tsconfig aliases потребуют расширения default repository scan; M0 fixture checker принимает явный tsconfig.

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
- [x] M0.2: checker и negative corpus проходят; current first-party graph проверен.
- [x] M0.3: PR CI `validate` прошёл на `92cafce`; fork PR runtime остаётся `needs_review`.
- [x] M0.4: [implementation PR #3](https://github.com/ipastin/phisys/pull/3) открыт; diff и local evidence проверены.

## Validation / Acceptance

Local evidence записано 15-10-26 15-09-12 и 15-27-42, CI result — 15-18-32 (Europe/Moscow). CWD для local checks: repository root, кроме fresh clone. Первоначальный code SHA: `afe9ba3`; расширенный test-harness typecheck/test/build проверен на `dacef1f`; предыдущий PR CI SHA: `92cafce4138eeb8f19454576a0b239ff7b8acb3f`. Evidence pointers: output команд текущего Codex task и [GitHub Actions run 38733974840](https://github.com/ipastin/phisys/actions/runs/38733974840). CI для текущего PR head проверяется в PR Checks.

| Check / action | Result | Evidence / limit |
| --- | --- | --- |
| `node --version`, `pnpm --version` под временной Node 24.22.0 | `pass` | `v24.22.0`, `12.13.0`; системный default Node остаётся `24.17.0` |
| Fresh clone `pnpm install --frozen-lockfile`, `pnpm build` | `pass` | изолированный временный clone; lock SHA-256 до/после `0f3e8dd8fb99f9f83ded1837b09bce04d7ed00588d9e6331761990376d85b03d`; build 1/1 |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | `pass` | exact Node command, zero exit на `dacef1f`; strict TS теперь охватывает source и test harness, fixtures исключены намеренно |
| `pnpm test:unit`, `pnpm test:architecture`, `pnpm test`, `pnpm build` | `pass` | на `dacef1f`: 2 unit assertions; 15 architecture cases; 1 real build target; negative cases exit nonzero |
| `pnpm audit --audit-level high` | `pass` | registry response: no known vulnerabilities |
| `gitleaks git . --redact` | `pass` | Gitleaks `8.30.1`, checked Darwin asset SHA-256, 14 commits scanned, no findings |
| `git diff --cached --check` | `pass` | implementation code commit had no whitespace errors |
| PR CI `validate` на `92cafce` | `pass` | `pull_request` run 38733974840: exact runtime, frozen install, lint, format, typecheck, tests, build, audit и Gitleaks — все steps success |
| Fork PR runtime | `needs_review` | workflow uses `pull_request`, `contents: read`, no secrets/deploy; отдельный fork run не запускался |

## Decisions

- Одобренный graph из одного real package оставлен. Root-only вариант не доказывает build; полный scaffold дал бы пустые packages.
- Exact Node запущен временно через `npm exec`; изменение системного runtime затронуло бы другие проекты. CI pin фиксирует Node `24.22.0`.
- Approved scope document сохранён как историческое решение; implementation evidence вынесено сюда, чтобы не переименовывать утверждённый документ и все его ссылки.

## Surprises / Open questions

- Первый architecture test обнаружил пропуск tsconfig aliases. `extractTSConfig` + fixture `baseUrl` закрыли его; затем все 15 cases прошли.
- Финальная проверка нашла, что первый `typecheck` не охватывал test harness. Добавлен отдельный strict `tsconfig.tests.json`; fixture modules исключены, поскольку содержат намеренно запрещённые imports.
- GitHub API возвращает `404 Branch not protected` для `main`. CI запускается на PR, но обязательность checks перед merge не настроена; настройка protection вне этого scope.
- Fork PR с read-only token пока не запускался. Статическая конфигурация не равна runtime evidence.
- Системный Node остаётся `24.17.0`; локальные проверки проводились под временным exact runtime.

## Recovery / Idempotence

Повторный `pnpm install --frozen-lockfile` не меняет lockfile. `pnpm build` воспроизводит `dist` из source; `dist` игнорируется Git. Не запускать bootstrap generator и не делать reset/clean занятого checkout. Rollback — отдельный revert PR.

## Outcome / Next step

Локальные M0 gates выполнены, [implementation PR #3](https://github.com/ipastin/phisys/pull/3) открыт и PR CI на `92cafce` прошёл. После расширения `typecheck` CI для final PR head отражается в PR Checks и требует проверки перед merge. Fork PR runtime остаётся `needs_review`; branch protection не настроен. Merge и deploy остаются отдельными решениями.
