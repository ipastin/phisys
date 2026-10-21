# Phisys

**Personal health intelligence that keeps changes tied to their source.**

Phisys is an in-development system for bringing health records, measurements, and everyday health data into a trustworthy view over time. Its intended experience helps people see what is known, what changed against their own baseline, and what may deserve a closer look. Facts, uncertainty, and provenance come before interpretation.

> **Project status:** This repository contains research, specifications, and early backend packages. This repository does not yet provide an end-user app or deployment instructions.

## What exists today

- A TypeScript monorepo with architecture checks and CI.
- A PostgreSQL-backed health data foundation, canonical validation, provenance-aware ingestion, and a manual input connector.
- Deterministic `sleep_duration` quality, baseline/trend, and adjacent-period comparison. Insufficient data is represented explicitly instead of being treated as a normal result.

The broader product vision includes a user interface, a `What Changed` experience, and AI-assisted exploration. Those capabilities are **planned**, not available from this repository's `main` branch. Development and test data in this repository is synthetic.

## Developer quick start

Requirements: **Node.js 24.22.0** and **pnpm 12.13.0** (the versions pinned in [package.json](package.json)). PostgreSQL is only needed for database integration tests.

```sh
git clone https://github.com/ipastin/phisys.git
cd phisys
pnpm install --frozen-lockfile
pnpm test
```

A successful `pnpm test` run completes the unit and architecture suites. It also builds the workspace; it does not run the database integration suite. For the latter, use a **disposable PostgreSQL 16 database** and the `DATABASE_URL` and `M1_DISPOSABLE_DB=1` environment variables, then run `pnpm test:db`. The [CI workflow](.github/workflows/ci.yml) shows the tested database setup.

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

Phisys is designed to preserve the difference between a confirmed fact, a derived result, and an AI inference. Missing data stays unknown; a meaningful result should be traceable to its source. The intended product is a health understanding tool, not an autonomous clinician.

For the full product and engineering context, start with the [source-of-truth index](docs/SOURCE_OF_TRUTH.md). The [Project Specification](docs/project-spec/v0.4.0/00_README__created-06-10-26_06-56-08__updated-10-10-26_04-03-47__v0.4.0.md) and [Product Design Specification](docs/product-design/v0.2.0/00_README__created-07-10-26_10-48-10__updated-10-10-26_04-03-47__v0.2.0.md) describe the planned experience. Their roadmap is not a list of shipped features.

## License

No license file is currently included in this repository.

<!--
created: "15-10-26 10-56-12"
updated: "21-10-26 09-32-28"
timezone: Europe/Moscow
version: 0.1.0
commit: "docs(readme): introduce Phisys and contributor quick start"
-->
