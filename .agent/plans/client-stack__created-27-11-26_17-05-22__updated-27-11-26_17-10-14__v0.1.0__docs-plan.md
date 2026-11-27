---
title: Phisys — решение о клиентском стеке и карта Markdown
created: "27-11-26 17-05-22"
updated: "27-11-26 17-10-14"
timezone: Europe/Moscow
version: "0.1.0"
commit: "docs(plan): audit client stack documentation"
status: completed
---

# Клиентский стек и карта документации

## Решение, scope и источники

27 ноября 2026 владелец выбрал Kotlin + Jetpack Compose для Android Personal Beta и нативный Swift для будущего iOS. Web Companion опирается на уже выбранные Next.js и TypeScript, React и общий Fastify API. ADR-171 фиксирует границы решения и альтернативы. Документирование не меняет готовность клиентов или milestone M2.

Исходное дерево — [commit PR #19](https://github.com/ipastin/phisys/tree/b5a7cb1bae74dfbbaa8d82423fb14f5516cb3579). Новая ветка и PR строятся поверх него. Для проверки roadmap использован main на [3679cc0](https://github.com/ipastin/phisys/commit/3679cc0e206c5b6e8ec6e56f0c696e25a6121663); реализация из PR #18 имеет отдельный scope.

## Выполнение и приёмка

1. Перечислить весь отслеживаемый Markdown в исходном дереве и найти прямые и косвенные зависимости решения.
2. Согласовать Project Spec, Design Pack, entry points и onboarding. Зафиксировать границу TypeScript, обязанности нативных адаптеров, независимые клиенты и порядок платформ.
3. Выпустить новые редакции с manifest, сохранить происхождение документов и ссылки на исторические решения.
4. Сверить инвентарь, metadata, входящие ссылки, ADR, порядок rollout и фактический diff. Проверить CI на опубликованном commit.

## Восстановление

Предыдущие редакции целиком доступны в исходном Git commit. Изменения ограничены документацией и её manifests, откат не требует миграции данных.

## Карта всех 64 исходных Markdown-файлов

Инвентарь соответствует Markdown в исходном commit PR #19. Ссылки ведут на рабочую редакцию каждого документа. Эта карта добавлена отдельно.

### Репозиторий и планы

| Документ | Что затронуло решение |
| --- | --- |
| [PLANS.md](../PLANS.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M0-foundation-implementation](M0-foundation-implementation__created-15-10-26_15-09-12__updated-27-11-26_17-10-14__v0.2.6__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M0-foundation-review](M0-foundation-review__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M0-foundation](M0-foundation__created-15-10-26_09-37-26__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M1-health-data-pipeline](M1-health-data-pipeline__created-15-10-26_18-06-16__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M1-implementation](M1-implementation__created-15-10-26_18-31-17__updated-27-11-26_17-10-14__v0.2.5__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [.agent/plans/M2-step11-sleep-period-implementation](M2-step11-sleep-period-implementation__created-16-10-26_13-23-43__updated-27-11-26_14-41-45__v0.1.4__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/M2-step12-sleep-metric-state](M2-step12-sleep-metric-state__created-20-10-26_15-30-45__updated-27-11-26_14-41-45__v0.1.18__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/M2-step13-a13-sleep-persistence](M2-step13-a13-sleep-persistence__created-26-11-26_15-22-04__updated-27-11-26_14-41-45__v0.1.4__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/M2-step13-sleep-meaningfulness](M2-step13-sleep-meaningfulness__created-26-11-26_12-44-07__updated-27-11-26_14-41-45__v0.1.3__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/M2.1-sleep-registry-quality](M2.1-sleep-registry-quality__created-16-10-26_00-21-10__updated-27-11-26_14-41-45__v0.1.5__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/M2.2-sleep-baseline-trend](M2.2-sleep-baseline-trend__created-16-10-26_07-07-41__updated-27-11-26_14-41-45__v0.1.7__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [.agent/plans/Phisys-brand-roadmap](Phisys-brand-roadmap__created-27-11-26_14-42-30__updated-27-11-26_14-48-35__v0.1.0__docs-plan.md) | Проверен. Содержательных изменений не требуется. |
| [AGENTS.md](../../AGENTS.md) | Инструкции агентам и границы решения. |
| [README.md](../../README.md) | Платформы и общий API для читателей проекта. |
| [M0_ONBOARDING_AUDIT](../../docs/M0_ONBOARDING_AUDIT__created-15-10-26_12-28-44__updated-27-11-26_17-10-14__v0.3.4__docs-stack.md) | Обновлены ссылки и metadata. Исторические решения сохранены. |
| [SOURCE_OF_TRUTH.md](../../docs/SOURCE_OF_TRUTH.md) | Текущие редакции, стек, provenance и карта аудита. |
| [CODEX_ONBOARDING](../../prompts/CODEX_ONBOARDING__created-15-10-26_09-37-26__updated-27-11-26_17-10-14__v0.2.2__docs-stack.md) | Стек и границы для первого рабочего чата. |

### Project Specification

| Документ | Что затронуло решение |
| --- | --- |
| [00_README](../../docs/project-spec/v0.5.0/00_README__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Новая редакция engineering-спецификации. |
| [01_PRODUCT](../../docs/project-spec/v0.5.0/01_PRODUCT__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [02_ARCHITECTURE](../../docs/project-spec/v0.5.0/02_ARCHITECTURE__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Границы клиентов и Fastify/OpenAPI. |
| [03_DATA_MODEL](../../docs/project-spec/v0.5.0/03_DATA_MODEL__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [04_ANALYTICS](../../docs/project-spec/v0.5.0/04_ANALYTICS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [05_AGENT_RUNTIME](../../docs/project-spec/v0.5.0/05_AGENT_RUNTIME__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [06_SKILLS](../../docs/project-spec/v0.5.0/06_SKILLS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [07_CONTEXT_MEMORY](../../docs/project-spec/v0.5.0/07_CONTEXT_MEMORY__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [08_SAFETY](../../docs/project-spec/v0.5.0/08_SAFETY__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [09_CONNECTORS](../../docs/project-spec/v0.5.0/09_CONNECTORS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Платформенные коннекторы и отзыв доступа. |
| [10_UX](../../docs/project-spec/v0.5.0/10_UX__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [11_IMPLEMENTATION](../../docs/project-spec/v0.5.0/11_IMPLEMENTATION__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Клиентские стеки, расположение кода, очерёдность и критерии реализации. |
| [12_EVALS](../../docs/project-spec/v0.5.0/12_EVALS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Проверки контрактов и permissions на целевой платформе. |
| [13_ADR](../../docs/project-spec/v0.5.0/13_ADR__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | ADR-171, альтернативы и связь с прежними ADR. |
| [14_AGENTS](../../docs/project-spec/v0.5.0/14_AGENTS__created-06-10-26_06-56-08__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Правила работы над клиентами. |
| [15_BRAND](../../docs/project-spec/v0.5.0/15_BRAND__created-06-10-26_17-26-44__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [16_MODEL_STRATEGY](../../docs/project-spec/v0.5.0/16_MODEL_STRATEGY__created-10-10-26_11-38-32__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [17_SURFACE_STRATEGY](../../docs/project-spec/v0.5.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-27-11-26_17-10-14__v0.5.0__docs-stack.md) | Ответственность платформ и порядок S0–S3. |

### Product Design Specification

| Документ | Что затронуло решение |
| --- | --- |
| [00_README](../../docs/product-design/v0.3.0/00_README__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Новая редакция дизайн-спецификации. |
| [01_DESIGN_STRATEGY](../../docs/product-design/v0.3.0/01_DESIGN_STRATEGY__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [02_JTBD_SCENARIOS](../../docs/product-design/v0.3.0/02_JTBD_SCENARIOS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [03_INFORMATION_ARCHITECTURE](../../docs/product-design/v0.3.0/03_INFORMATION_ARCHITECTURE__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [04_SCREEN_MAP](../../docs/product-design/v0.3.0/04_SCREEN_MAP__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [05_NAVIGATION_RESPONSIVE_IA](../../docs/product-design/v0.3.0/05_NAVIGATION_RESPONSIVE_IA__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [06_CORE_USER_FLOWS](../../docs/product-design/v0.3.0/06_CORE_USER_FLOWS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [07_WIREFRAME_BLUEPRINTS](../../docs/product-design/v0.3.0/07_WIREFRAME_BLUEPRINTS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [08_SCREEN_SPECS_CORE](../../docs/product-design/v0.3.0/08_SCREEN_SPECS_CORE__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [09_SCREEN_SPECS_DATA_RECORDS](../../docs/product-design/v0.3.0/09_SCREEN_SPECS_DATA_RECORDS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [10_SCREEN_SPECS_AI](../../docs/product-design/v0.3.0/10_SCREEN_SPECS_AI__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [11_SCREEN_SPECS_CONNECTIONS_SETTINGS](../../docs/product-design/v0.3.0/11_SCREEN_SPECS_CONNECTIONS_SETTINGS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [12_STATE_MATRIX_EDGE_CASES](../../docs/product-design/v0.3.0/12_STATE_MATRIX_EDGE_CASES__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [13_DESIGN_SYSTEM_FOUNDATIONS](../../docs/product-design/v0.3.0/13_DESIGN_SYSTEM_FOUNDATIONS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Общие токены и платформенные компоненты. |
| [14_COMPONENT_LIBRARY](../../docs/product-design/v0.3.0/14_COMPONENT_LIBRARY__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [15_DATA_VISUALIZATION](../../docs/product-design/v0.3.0/15_DATA_VISUALIZATION__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [16_AI_INTERACTION_PATTERNS](../../docs/product-design/v0.3.0/16_AI_INTERACTION_PATTERNS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [17_TRUST_PROVENANCE_SAFETY_UX](../../docs/product-design/v0.3.0/17_TRUST_PROVENANCE_SAFETY_UX__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [18_PRIVACY_PERMISSIONS_CONNECTIONS](../../docs/product-design/v0.3.0/18_PRIVACY_PERMISSIONS_CONNECTIONS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [19_CONTENT_DESIGN_UX_WRITING](../../docs/product-design/v0.3.0/19_CONTENT_DESIGN_UX_WRITING__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [20_ACCESSIBILITY](../../docs/product-design/v0.3.0/20_ACCESSIBILITY__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [21_RESPONSIVE_WEB_DESKTOP](../../docs/product-design/v0.3.0/21_RESPONSIVE_WEB_DESKTOP__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Назначение Web Companion и handoff React/Next.js. |
| [22_FIGMA_FILE_ARCHITECTURE](../../docs/product-design/v0.3.0/22_FIGMA_FILE_ARCHITECTURE__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [23_PROTOTYPING_VALIDATION](../../docs/product-design/v0.3.0/23_PROTOTYPING_VALIDATION__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [24_HANDOFF_DESIGN_QA](../../docs/product-design/v0.3.0/24_HANDOFF_DESIGN_QA__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Платформенные проверки UI, accessibility и отзыва доступа. |
| [25_DESIGN_ROADMAP](../../docs/product-design/v0.3.0/25_DESIGN_ROADMAP__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Только выпуск новой редакции пакета. |
| [26_PLATFORM_REFERENCES_CONSTRAINTS](../../docs/product-design/v0.3.0/26_PLATFORM_REFERENCES_CONSTRAINTS__created-07-10-26_10-48-10__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Реальные ограничения платформ и референсы. |
| [27_SURFACE_STRATEGY](../../docs/product-design/v0.3.0/27_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-27-11-26_17-10-14__v0.3.0__docs-stack.md) | Платформенные реализации и порядок релизов. |

## Проверка решения

Инвентарь воспроизводится из корня репозитория через `git ls-tree -r --name-only b5a7cb1bae74dfbbaa8d82423fb14f5516cb3579` с фильтром по расширению .md. В исходном дереве 64 документа, в новой редакции 65, включая эту карту. Содержание решения изменилось в 18 исходных документах.

Локальная сверка 27 ноября 2026 года прошла для 64 строк инвентаря, 165 относительных ссылок и их Markdown-якорей, 24 ссылочных объектов в истории Git, 18 и 28 файлов двух manifests, metadata изменённых файлов, последовательных ADR-001–171 и INV-001–031. Результат CI привязан к итоговому commit в PR. Проверки на устройстве и в браузере потребуют реализации клиентов.
