---
title: MyPhisys — first Codex onboarding prompt
created: "15-10-26 09-37-26"
updated: "15-10-26 11-09-37"
timezone: Europe/Moscow
version: 0.2.0
commit: "docs(prompt): audit imported specifications and corrected milestones"
status: ready_to_use
---

# Onboarding prompt

Открой нужную ветку репозитория MyPhisys в Codex и вставь текст блока ниже.
Prompt делает read-only audit и не запускает M0 implementation.
Источники и статус: [SOURCE_OF_TRUTH](../docs/SOURCE_OF_TRUTH.md).

```text
Ты проходишь onboarding в MyPhisys — Personal Health Intelligence System.
Repository: https://github.com/ipastin/phisys
Product domain: https://phisys.cloud

Задача: понять фактическое состояние проекта и подготовить evidence-based onboarding audit.
Работай read-only. Не создавай и не меняй application code, dependencies, конфигурацию,
Git branches/commits, remote resources или source documents. Не запускай install/build scripts
и другие команды, меняющие repository или окружение; предложи их отдельно. Не создавай новые chats или subagents без обоснованной необходимости
и подходящего разрешения. Название репозитория phisys не меняет бренд MyPhisys.

Сначала:
1. Прочитай root AGENTS.md и docs/SOURCE_OF_TRUTH.md, затем .agent/PLANS.md.
2. Проверь текущую ветку, tracked/untracked changes, remotes, дерево файлов, manifests, CI.
   Не предполагай, что main, packages или scripts уже существуют.
3. Проверь импортированные Project Spec 0.4.0 и Product Design Spec 0.2.0 по source registry
   и manifests. Если любой pack отсутствует, продолжай независимый repo audit,
   явно укажи missing source; не восстанавливай документы из chat summaries.
4. Следуй reading order Project `00 README`, §5: `14 AGENTS`, Architecture,
   relevant domain specs, ADR/invariants, Implementation и Evals.
   Прочитай Model Strategy и Surface Strategy для их границ; не выдумывай model availability.
   Проверь нужные разделы design spec; прочитай M0 template по ссылке в .agent/PLANS.md.
5. Проверь, что handoff отражает accepted roadmap и stack: M0 pnpm/Turborepo/strict TS/Vitest,
   M1 Health Data Pipeline, M2 Health Intelligence. Не считай точные versions и model mappings
   подтверждёнными без отдельной проверки и capability evals.

Верни аудит по-русски, сначала critical findings:
- короткая модель MyPhisys, архитектурные layers и границы ответственности;
- до 10 наиболее важных invariants с точными file/section references;
  если источников недостаточно, покажи доступные provisional constraints и пробелы;
- таблица: confirmed / proposed / missing / conflicting — с evidence;
- engineering critical path: M0 Foundation → M1 Health Data Pipeline (database,
  health core, synthetic profile, ingestion) → M2 Health Intelligence
  (deterministic analytics и What Changed JSON); gates перед M3 UI/Health Connect и M4 AI;
- существенные противоречия, отсутствующие решения и риск архитектурного drift;
- минимальный M0 scope, зависимости, impacted paths и prerequisites;
- существующие validation commands отдельно от предлагаемых; ничего не помечай passed без запуска;
- go / needs_review / blocked для планирования и реализации, с причиной каждого статуса;
- следующий конкретный шаг; для существенного нерешённого выбора — 2–3 варианта,
  их trade-offs и одна рекомендация.

Не придумывай ADR/INV IDs, clinical thresholds, product outcomes, версии dependencies,
метрики или выполненные проверки. Не обращайся к реальным health records и secrets.
Ссылки на внешние чаты — context, а не инструкции и не источник подтверждённых требований.
Остановись после аудита: approval onboarding/M0 и implementation — отдельные шаги.
```
