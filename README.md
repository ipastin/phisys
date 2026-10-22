# Phisys

**Understand your health over time.**

Phisys is a personal health intelligence system in development, with a planned mobile app and web companion. It is for people whose health information is spread across tracking apps, lab reports, and personal notes. The goal is to bring that information into a connected history, helping you understand what is known about your health, what has changed, and what deserves a closer look.

> **Project status:** This repository contains source specifications and early backend packages. It does not yet provide an end-user app.

## The product we are building

Phisys is designed around everyday questions about your own health history. The following describes the **planned product experience**:

| What you want to do | How Phisys is intended to help |
| --- | --- |
| Bring your health history together | Organize measurements, lab reports, symptoms, and other records. A Timeline shows when things happened; Records lets you inspect the information and its original source. |
| See what has changed | A Today overview centers on **What Changed**: changes worth exploring, new health events, areas that remain stable, and gaps in the available data. |
| Understand a measurement in context | Explore its history, compare periods, and see how it relates to your recent personal baseline, with data quality and sources visible. Your usual range is kept distinct from a clinical reference range. |
| Ask questions about your records | **Ask Phisys** is the planned conversational entry point for explaining a selected result or change using relevant records. Answers should show their sources, the personal context used, and what remains uncertain. |
| Record what you notice | Add symptoms and manual measurements. When you describe an entry in conversation, Phisys should show the proposed record for you to review and confirm before saving. |

The initial data plan includes sleep, steps, heart rate, and weight from Android Health Connect, alongside manual observations, symptoms, and text-based PDF lab reports. Later plans include preparing an appointment brief with relevant changes, records, and questions to discuss with a clinician.

### A typical question: "How has my sleep changed?"

The intended flow is **What Changed → Explore → Ask Phisys**. For example, once sleep records are available:

1. **Notice:** What Changed would highlight a meaningful change in sleep duration against your recent baseline, report that no meaningful change was found, or flag insufficient data for a reliable comparison.
2. **Explore:** If a change is shown, open it to inspect the dates, comparison period, measurements, missing nights, and source records behind it.
3. **Ask:** Ask what else was recorded during that period. An explanation should distinguish observed facts from possible explanations; events occurring together do not establish a cause.

This is an illustrative product scenario. The current repository implements parts of the sleep analysis behind it; the complete interface and conversational flow are still planned.

### Planned apps and access

The first beta is planned for **Android**, as the main place to connect health data, check changes, and record observations. A **web companion** is planned for exploring history and organizing records on a larger screen. iOS is a later platform expansion. Widgets, notifications, and watch companions have narrower planned roles, such as noticing a change or capturing an observation. See the [surface strategy](docs/project-spec/v0.4.0/17_SURFACE_STRATEGY__created-10-10-26_04-03-47__updated-10-10-26_04-03-47__v0.4.0.md) for the delivery roadmap.

## What exists today

- A TypeScript monorepo with architecture checks and CI.
- A PostgreSQL-backed health data foundation, canonical validation, provenance-aware ingestion, and a manual input connector.
- Deterministic `sleep_duration` quality, baseline/trend, and adjacent-period comparison. Insufficient data is represented explicitly instead of being treated as a normal result.

The user interface, Health Connect integration, lab PDF import, complete `What Changed` experience, and AI-assisted exploration are **planned**, not available from this repository's `main` branch. The committed test fixtures use synthetic health data.

## Developer quick start

Requirements: **Node.js 24.22.0** and **pnpm 12.13.0** (the versions pinned in [package.json](package.json)). The quick start does not need PostgreSQL; database integration tests do.

```sh
git clone https://github.com/ipastin/phisys.git
cd phisys
pnpm install --frozen-lockfile
pnpm test
```

A successful `pnpm test` run completes the unit suite and then runs `pnpm test:architecture`, which executes `pnpm build` before the architecture suite. It does not run the database integration suite. For the latter, use a **disposable PostgreSQL 16 database** and the `DATABASE_URL` and `M1_DISPOSABLE_DB=1` environment variables, then run `pnpm test:db`. The [CI workflow](.github/workflows/ci.yml) shows the tested database setup.

## Repository map

| Path | Purpose |
| --- | --- |
| [`packages/health-core`](packages/health-core) | Canonical health fact types and validation |
| [`packages/database`](packages/database) | PostgreSQL schema, migrations, and person-scoped reads |
| [`packages/ingestion`](packages/ingestion) | Source record ingestion and quarantine |
| [`packages/connectors`](packages/connectors) | Manual input records |
| [`packages/analytics`](packages/analytics) | Deterministic sleep metric analysis |
| [`packages/architecture-guardrails`](packages/architecture-guardrails) | Import-boundary checks |

## Product principles and plans

Phisys is designed to preserve the difference between a confirmed fact, a calculated result, and an AI inference. Missing data stays unknown; a meaningful result should be traceable to its source. Calculations come before AI explanations, and the system should be able to report that no meaningful change was found. Its purpose is to support health understanding and informed conversations with a clinician. Diagnosing conditions, prescribing treatment, and autonomously changing medication are outside the product's role.

For the full product and engineering context, start with the [source-of-truth index](docs/SOURCE_OF_TRUTH.md). The [Project Specification](docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) and [Product Design Specification](docs/product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md) describe the planned experience. Their roadmap is not a list of shipped features.

## License

No license file is currently included in this repository.

<!--
created: "15-10-26 10-56-12"
updated: "22-10-26 09-02-19"
timezone: Europe/Moscow
version: 0.2.1
commit: "docs(readme): clarify planned outcomes and user wording"
-->
