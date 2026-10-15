---
title: MyPhisys — черновик review M0 Foundation
created: "15-10-26 12-28-44"
updated: "15-10-26 12-38-00"
timezone: Europe/Moscow
version: 0.1.1
commit: "docs(plan): localize M0 review draft"
status: draft
---

# Черновик review M0 Foundation

## Цель

Результат M0 — воспроизводимый pnpm/Turborepo foundation, реальный package build и проверки import boundaries, чтобы безопасно начать M1 Health Data Pipeline. Clinical schemas, database, analytics, UI и Model Gateway относятся к последующим milestones.

Provide a reproducible pnpm/Turborepo foundation whose real package build, strict checks,
and tested import rules can gate M1 Health Data Pipeline. M0 does not implement health
schemas, database, analytics, UI, model routing, or real-data integration.
[Project `11 IMPLEMENTATION`, §8 Steps 00–02](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Статус и разрешение

- Status: `draft`, ready for owner review; this is not implementation authorization.
- Base: `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a` (`main`/`origin/main` at onboarding).
- Current documentation branch: `codex/m0-plan-review`. Proposed future implementation branch:
  `codex/m0-foundation`, from the then-current `origin/main` after this documentation review.
- Scope approval: `awaiting_owner_review`. Merge, deploy, production services, secrets, and
  shared-system writes remain separate decisions under [root AGENTS, Scope](../../AGENTS.md).
- Recheck HEAD, diff, remote and scoped instructions before implementation; this base SHA
  is a planning snapshot, not permission to reset or overwrite work.

## Контекст и источники

- [Onboarding audit](../../docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-15-10-26_12-38-00__v0.1.1__docs-audit.md) — входная доказательная база.
- Current source packs: [Project Spec 0.4.0](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
  and [Design Spec 0.2.0](../../docs/product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md).
- Plan contract: [.agent/PLANS.md](../PLANS.md). Prior [M0 template](M0-foundation__created-15-10-26_09-37-26__updated-15-10-26_11-09-37__v0.2.0__docs-plan.md)
  remains historical; its assumption of an unmerged docs PR is superseded by the checkout evidence.
- Source order and priority: [Project `00 README`, §5](../../docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
  [Project `14 AGENTS`, §§2–4](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Scope и границы

**Решение для review:** root workspace плюс один реальный `packages/architecture-guardrails`, который содержит import rules, исполняемую проверку и тесты; `tests/architecture` хранит synthetic allowed/forbidden graphs. Пустые `apps/*` и domain packages в M0 не создавать. Владелец должен принять это узкое прочтение Step 00 до начала реализации.

Chosen candidate: root pnpm workspace + exactly one real workspace package,
`packages/architecture-guardrails`, containing the import-rule configuration, an executable
check/build target, and tests. `tests/architecture/` holds synthetic allowed and forbidden
graphs that model future package names. Do not create empty `apps/*`, `health-core`,
`analytics`, provider, or UI packages. M1 adds production domain packages when their real
contracts are implemented. This is the smallest proposed interpretation of `base apps/packages`
in [Project `11 IMPLEMENTATION`, §8 Step 00](../../docs/project-spec/v0.4.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md);
it requires owner review before implementation.

In scope: pinned runtime/tooling, lockfile, strict TS, lint/format, meaningful Vitest
assertions, dependency-cruiser rules, CI on PR, dependency audit and secret scan.
Out of scope: application/domain features, clinical schemas/fixtures, database/RLS,
analytics/What Changed, mobile/web UI, Health Connect/HealthKit, LLM/Model Gateway,
provider calls, deployment and DNS.

## Invariants и влияние на архитектуру

Initial forbidden/allowed graph must enforce at least `health-core` isolation from model,
vendor, UI and infrastructure SDKs, connector isolation, analytics write separation, and
agent/model gateway boundaries when those packages appear. Rules must resolve workspace
imports, tsconfig aliases, and relative interpackage imports; a fixture must prove each
critical forbidden edge fails while an allowed edge passes. Scope and exact edges come from
[Project `02 ARCHITECTURE`, §9](../../docs/project-spec/v0.4.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md)
and [Project `14 AGENTS`, §4](../../docs/project-spec/v0.4.0/14_AGENTS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).
The M0 fixture graph is synthetic technical data, not a health record or a clinical entity.

## Предложенные точные версии, проверены 15-10-26

All versions below are **proposed pins**, not installed or integration-tested by this review.
Use exact versions in `packageManager`, `devDependencies`, runtime file and CI; no caret ranges.

| Tool | Pin | Evidence and rationale |
| --- | --- | --- |
| Node.js | `24.22.0` | [Official LTS release, 14-10-26](https://nodejs.org/en/blog/release/v24.22.0). Local node is `24.17.0`, so parity is `not_run`. |
| pnpm | `12.13.0` | [Official release, 13-10-26](https://pnpm.io/blog/releases/12.13.0) and [Node 24 compatibility](https://pnpm.io/installation/). Local pnpm matches. |
| Turborepo | `2.11.8` | [npm package metadata](https://registry.npmjs.org/turbo/2.11.8); accepted M0 stack per Project `11 IMPLEMENTATION`, §§1, 8. |
| TypeScript | `6.0.3` | [npm package metadata](https://registry.npmjs.org/typescript/6.0.3); chosen over 7.0 because `typescript-eslint@8.71.2` declares `<6.1.0` peer support. |
| `@types/node` | `24.19.2` | [npm package metadata](https://registry.npmjs.org/%40types%2Fnode/24.19.2); matches Node major. |
| Vitest / Vite | `5.0.4` / `8.3.4` | [Vitest metadata](https://registry.npmjs.org/vitest/5.0.4) and [Vite peer/Node requirements](https://vitest.dev/guide/migration/). Vite is an explicit peer pin. |
| ESLint / `@eslint/js` / `typescript-eslint` | `10.12.0` / `10.0.1` / `8.71.2` | [ESLint](https://registry.npmjs.org/eslint/10.12.0), [ESLint JS](https://registry.npmjs.org/%40eslint%2Fjs/10.0.1), [typescript-eslint peer range](https://registry.npmjs.org/typescript-eslint/8.71.2). |
| Prettier | `3.9.10` | [npm package metadata](https://registry.npmjs.org/prettier/3.9.10); format only new first-party code/config/docs, preserving imported source bytes. |
| dependency-cruiser | `18.6.0` | [npm metadata](https://registry.npmjs.org/dependency-cruiser/18.6.0) and [official rule/alias docs](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md); compatible with Node 24. |
| Gitleaks CLI | `8.30.1` | [Official release and binary checksums](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1); pin binary checksum per CI platform. |

CI action proposal: [actions/checkout `v7.0.1`](https://github.com/actions/checkout/releases/tag/v7.0.1)
and [pnpm/setup `v3.1.1`](https://github.com/pnpm/setup/releases/tag/v3.1.1), with
`node@24.22.0` and `pnpm@12.13.0` exact inputs. Pin immutable action SHAs when writing
the workflow; verify the referenced release commits then. CI runner availability and fork-PR
behavior are `not_run`.

## Файлы и зависимости

| Proposed path | Purpose / consumer |
| --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, runtime-version file | Exact scripts, workspace membership, frozen dependency graph and local/CI runtime. |
| `turbo.json`, root `tsconfig*.json`, ESLint/Prettier config, `.gitignore` | Meaningful task graph, strict checks, formatting scope and generated-output exclusion. |
| `packages/architecture-guardrails/**` | One real package: import rules, CLI/build entry and tests consumed by root scripts/CI. |
| `tests/architecture/**` | Synthetic allowed/forbidden import graphs, outside production graph. |
| `.github/workflows/ci.yml` | PR/push checks using pinned Node/pnpm and read-only permissions; no deploy/secrets. |
| This plan and source index | Progress/evidence; links remain correct. |

Before implementing, repeat `git ls-files`, `git status`, scoped AGENTS search, and caller/
config/export inventory. If application code appeared, update this graph before edits.

## Этапы

1. **M0.0 — owner review:** decide the one-package scope, confirm the exact toolchain/checks,
   recheck `origin/main` SHA and branch protection, and record approval. Do not start M0.1
   while scope authorization is absent.
2. **M0.1 — workspace:** pin Node/pnpm/dependencies, create lockfile and a non-placeholder
   guardrails package. `pnpm install --frozen-lockfile` must not alter the lockfile.
3. **M0.2 — graph:** implement import rules with dependency-cruiser, TypeScript strict,
   Vitest allowed/forbidden cases, and a real build output. The negative corpus must cause
   a nonzero exit when a forbidden edge is introduced.
4. **M0.3 — CI:** run the same checks on PR commit SHA; verify fork PR behavior with
   read-only permissions and no deployment or product secrets.
5. **M0.4 — review:** inspect diff, evidence and out-of-scope absence; open a reviewable PR.
   Merge remains a separate action. M1 requires its own plan after M0 acceptance.

## Проверки и критерии принятия

All commands below are a **proposed executable contract**, currently `not_run` because
M0 files/dependencies do not exist. The implementation PR must record command, cwd, SHA,
timestamp, result and evidence pointer for each. `pnpm test` must run assertions, not a
zero-test pass. Imported source packs are excluded from formatter rewrites.

| Check | Expected outcome | Status |
| --- | --- | --- |
| `node --version`, `pnpm --version` | `v24.22.0`, `12.13.0` locally and in CI | `not_run` for pair |
| `pnpm install --frozen-lockfile` | Fresh install; no lockfile diff | `not_run` |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | First-party scoped source/config passes; strict TS | `not_run` |
| `pnpm test:unit` | Real guardrails logic assertions | `not_run` |
| `pnpm test:architecture` | Allowed graph passes; forbidden workspace/alias/relative edges fail under test | `not_run` |
| `pnpm test`, `pnpm build` | Both run non-empty targets; build artifact is consumed by the checker | `not_run` |
| `pnpm audit --audit-level high` | No unreviewed high/critical advisories; registry error fails closed | `not_run` |
| `gitleaks git . --redact` | No secret findings in Git history; CLI version `8.30.1` | `not_run` |
| `git diff --check` | No whitespace errors in changed first-party files | `not_run` for implementation diff |
| PR CI on same SHA | Local and CI checks agree, read-only token, no deployment | `not_run` |

Acceptance: reproducible install; a real package build and public entry; strict/lint/format
checks; architecture negative tests; dependency/secret checks; CI evidence on a PR SHA;
no application feature or real health data. The test/eval intent comes from
[Project `12 EVALS`, §§1–2, 16](../../docs/project-spec/v0.4.0/12_EVALS__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md).

## Прогресс

- [x] Onboarding/source reconciliation: documented in the audit; pack presence verified.
- [x] Current planning base SHA, recommended graph, proposed versions/check names recorded.
- [ ] Owner review of the narrow Step 00 interpretation and implementation scope.
- [ ] Recheck exact version availability/compatibility at implementation start.
- [ ] Toolchain, guardrails, tests, build, CI and PR outcome: `not_run`.

## Журнал решений

| Date/time (Europe/Moscow) | Choice and alternatives | Status / reason |
| --- | --- | --- |
| 15-10-26 12-28-44 | **Recommend one real guardrails package.** Root-only graph is smaller but cannot prove a package build; full target scaffold matches the monorepo map but adds empty shells. | `needs_review`: narrow reading of Project M0 Step 00; owner must accept before implementation. |
| 15-10-26 12-28-44 | Node 24 LTS + pnpm 12 + TS 6.0: TS 7 is newer but outside the current `typescript-eslint` peer range; older TS adds no M0 benefit. | Proposed exact pins above; install/CI compatibility still `not_run`. |
| 15-10-26 12-28-44 | dependency-cruiser over custom parser or import-string grep: one focused dependency but handles resolved graph/aliases; custom code is harder to validate, grep misses relative/alias edges. | Proposed; negative fixtures are mandatory acceptance. |
| 15-10-26 12-28-44 | `pnpm audit` + pinned Gitleaks CLI over extra action-specific scanners: same local/CI commands, with registry availability and binary checksum as explicit gates. | Proposed; no scan has run. |

## Открытые вопросы

| `pending` из onboarding | Решение для M0 review | Следующий gate |
| --- | --- | --- |
| Base SHA и статус source packs | `resolved`: GitHub compare подтвердил `origin/main` = `ab7c2cab7d2f829fe5ae2870b0c26b41fed55a8a`; packs уже в `main`. | Перед implementation branch проверить SHA повторно. |
| Минимальный package graph | `needs_review`: рекомендован один реальный guardrails package. | Owner принимает либо меняет scope; без решения M0.1 не начинается. |
| Точные версии и checks | `proposed`: pins и команды ниже конкретизированы; совместимость локального install/CI ещё не доказана. | Проверить на свежем checkout после разрешения реализации. |
| ADR-151–170, P2 dates, approved Figma | `deferred`: это не зависимости M0 Foundation; источники остаются с исходным статусом. | Отдельные решения до затрагивающих их M3/M4 работ. |
| Branch protection, action SHAs и GitHub CI | `not_run`: M0 workflow отсутствует; shell remote check не прошёл из-за DNS. | Проверка при implementation PR; не объявлять их готовыми заранее. |

- Local Node is `24.17.0`, below proposed `24.22.0`; do not declare local/CI parity.
- Project ADR-151–170 status conflict and P2 measurement-date privacy decision remain
  `needs_review` for their later dependent features; do not resolve either in M0 code.
  [SOURCE_OF_TRUTH, Open questions](../../docs/SOURCE_OF_TRUTH.md#открытые-вопросы-исходных-спецификаций).
- Approved Figma file/node is missing for future visual implementation, not M0 tooling.
- Branch protection, CI run, frozen install, action SHAs and any package build are unverified.

## Восстановление и повторный запуск

Never run a bootstrap generator over an existing workspace or reset/clean an occupied
checkout. Review current files before each step; preserve others' changes. A failed
frozen install is diagnosed without altering the lockfile to mask it. Keep negative
fixtures outside the production graph. Rollback goes through a separate revert PR.

## Результат

Это reviewable draft. После решения по package graph и отдельного разрешения на scope реализации нужно обновить base SHA и доступность точных версий, затем выполнять M0 в отдельной ветке. M1 начинается с database/canonical pipeline; deterministic analytics и `What Changed` остаются M2.

Current outcome is a reviewable **plan draft**, not an implemented Foundation. The owner
can now decide the one-package M0 scope; after that decision, record its approval, recheck
base/tool versions and start a separate implementation task. M1 then begins with database
and canonical data, while deterministic analytics/What Changed remain M2.
