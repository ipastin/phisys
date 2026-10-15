---
title: "Implementation Blueprint & Roadmap"
created: "06-10-26 06-56-08"
updated: "10-10-26 04-03-47"
version: "0.4.0"
status: "accepted"
commit: "docs(product): add MyPhisys surface delivery architecture"
---

# Implementation Blueprint & Roadmap

## 0. Repository identity

Repository/product codename is **MyPhisys**. New repository path examples use `myphisys/`; do not introduce `health-ai` or `phisys` as competing product identifiers.

## 1. Target stack

### Clients / surfaces

```text
Primary full surface: Android mobile — React Native + Expo + custom Kotlin Expo Module
Deep-work surface:    Web — Next.js / installable PWA where useful
Ambient Android:      Jetpack Glance widgets + notifications + app shortcuts
Later native:         iOS/HealthKit/WidgetKit; Wear OS/Apple Watch companions
External:             MCP/API/FHIR/secure export — post-core, scoped through policy
```

### Backend

```text
TypeScript
Fastify
Zod
OpenAPI
```

### Data/infra

```text
Supabase PostgreSQL
Drizzle ORM
Supabase Auth
Supabase Storage
pgvector
pg-boss
OpenTelemetry + Sentry
pnpm + Turborepo
GitHub Actions
```

Architecture deliberately avoids microservices/Kubernetes/Redis/Temporal/Python until proven necessary.

### AI / Model Gateway

```text
Custom TypeScript Model Gateway
Capability aliases
Privacy Filter P0–P3
Direct OpenAI API first
Provider adapters for later Anthropic/Azure/Bedrock/Vertex/local
Structured outputs
Capability-specific model evals
```

Personal Beta starting mapping (eval-gated):

```text
classifier_fast      → GPT-6 Luna
extractor_text       → GPT-6 Luna
extractor_vision     → GPT-6.1 Sol
reasoning_standard   → GPT-6.1 Sol
reasoning_high       → GPT-6 Astra
summarizer           → GPT-6 Luna
claim_reviewer       → GPT-6.1 Sol
```

Model IDs are configuration only. See `16 MODEL_STRATEGY`.

## 2. Deployment shape

```text
Mobile/Web
→ Fastify API
→ PostgreSQL
↕
Worker (ingestion/docs/analytics)
↕
Object Storage

API/Worker → Model Gateway
```

## 2.1 Surface deployment strategy

Delivery is phased independently from core architecture:

```text
S0 Personal Beta     Android full app
S1 Web Companion     deep work / records / appointment prep
S2 Ambient Android   widgets / push / quick actions
S3 iOS               HealthKit + Apple platform surfaces
S4 Watch             glance / capture / handoff
S5 Ecosystem         MCP / API / FHIR / approved share
```

The backend/domain core is shared. Surface-specific clients may reduce detail but may not change health semantics.

## 3. Database schemas

```text
identity
source
health
analytics
memory
agent
evidence
audit
jobs
```

Client does not directly CRUD clinical tables in MVP; backend domain layer remains primary boundary, RLS as defense-in-depth.

## 4. Queue / outbox

Initial job engine: pg-boss.

Transactional outbox prevents `DB commit succeeded / event publish lost` failure mode.

Jobs include:

```text
connector.sync
source.normalize
source.dedupe
document.parse
document.extract
analytics.recompute
state.snapshot
insights.generate
embeddings.generate
```

All jobs idempotent.

## 5. Monorepo

```text
apps/
  mobile/
  web/
  api/
  worker/

packages/
  contracts/
  database/
  health-core/
  clinical-state/
  ingestion/
  connectors/
  analytics/
  context-engine/
  memory/
  safety/
  tool-gateway/
  skills/
  agent-runtime/
  model-gateway/
  evidence/
  observability/
  ui/

evals/
docs/
```

## 6. Security implementation notes

- mobile long-lived tokens → platform secure storage;
- provider credentials never model-visible;
- strong TLS/encryption at rest;
- application-level envelope encryption for selected secrets/private values where useful;
- identity separated from health domain;
- raw PHI excluded from telemetry;
- database/service roles narrowly scoped;
- storage backup handled independently from DB backup.

## 7. Implementation strategy

**Balanced** roadmap: feature + data model + tests + basic observability + safety, rather than prototype now / provenance later.

## 8. Milestones

### M0 Foundation

**Step 00 — Repository bootstrap**
- pnpm/Turborepo;
- TypeScript strict;
- Vitest;
- base apps/packages.

Commit: `chore(repo): bootstrap myphisys monorepo`

**Step 01 — Architecture guardrails**
- ARCHITECTURE/INVARIANTS/AGENTS;
- import-boundary enforcement.

Commit: `chore(architecture): enforce domain boundaries`

**Step 02 — CI**
- lint/typecheck/tests/architecture/build;
- dependency/secret scan.

Commit: `ci: add core validation pipeline`

### M1 Health Data Pipeline

**Step 03 — Database foundation**
Initial schemas/tables, RLS, UUIDv7.

Commit: `feat(database): add canonical health foundation`

**Step 04 — Canonical Health Core**
Observation/Symptom/Source/Provenance/HealthEvent/Concept/Quantity/TemporalValue.

Commit: `feat(health-core): implement canonical health model`

**Step 05 — Synthetic Dataset**
90d sleep/HR, steps, weight, labs, symptoms, missingness/source change/conflict.

Commit: `test(fixtures): add synthetic longitudinal health profile`

**Step 06 — Ingestion Framework**
insert/update/duplicate/delete/quarantine, identity/dedupe.

Commit: `feat(ingestion): add idempotent source pipeline`

**Step 07 — Manual Connector**
weight/BP/generic observation/symptom.

Commit: `feat(connectors): add manual health data connector`

### M2 Health Intelligence

**Step 08 — Metric Registry**
Initial metric definitions.

**Step 09 — Quality Engine**
coverage/freshness/source continuity/missingness.

**Step 10 — Baseline Engine**
rolling robust baseline, MAD/IQR, contamination tests.

**Step 11 — Trend/Period Comparison**
Daily + sparse semantics.

**Step 12 — State Snapshot/Diff**
Point-in-time state and deterministic diff.

**Step 13 — Meaningfulness**
Rule-based candidate suppression/ranking.

**Step 14 — What Changed**
High-level service without LLM.

Suggested commits follow `feat(analytics|state|insights): ...`.

### M3 Product Experience

**Step 15 — Mobile shell**
Auth/navigation/design tokens/error states.

**Step 16 — Today**
What Changed + summaries/data quality.

**Step 17 — Insight/Metric Detail**
Charts, baseline, quality, provenance.

**Step 18 — Timeline**
HealthEvent-backed history.

**Step 19 — Health Connect**
Availability/permissions/history/changes/cursor expiry/revocation → ingestion → analytics → Today.

Completion = Vertical Slice A.

### M4 Clinical Data + AI

**Step 20 — PDF storage/parser**
Text-based lab PDFs only initially.

**Step 21 — Extraction Review**
Ready vs Needs Review, source locator.

Completion = Vertical Slice B.

**Step 22 — Records UI**
Labs/Documents/Symptoms first.

**Step 23 — Safety Engine v0.1**
C/A risk, treatment prohibition, context/write policy.

**Step 24 — Context Engine v0.1**
metric/lab/what-changed profiles.

**Step 25 — Model Gateway**
Implement a custom TypeScript gateway before any skill can call a provider.

Required order:

1. logical capability aliases;
2. provider interface/registry;
3. P0–P3 privacy validation and field minimization;
4. OpenAI Responses API adapter as first provider;
5. stateless calls (`store=false` where supported/configured);
6. strict structured-output validation;
7. token/cost/latency budgets;
8. equal-or-stronger-privacy fallback rule;
9. graceful no-provider mode;
10. model eval harness.

Initial candidate mapping uses GPT-6 Luna / GPT-6.1 Sol / GPT-6 Astra by capability, but promotion is eval-driven and mapping remains configuration.

Do not add Anthropic/Azure/Bedrock/Vertex/LiteLLM/managed AI gateway until the direct-provider baseline and evaluation harness are stable.

**Step 26 — Agent Router**
DIRECT/SKILL/WRITE/SAFETY; COMPOSITE feature-flagged.

**Step 27 — Initial Skills**
Timeline, trend, what-changed, lab-interpretation, record-symptom.

**Step 28 — Claim Pipeline**
Typed claims + numeric/evidence verification.

**Step 29 — AI UX**
Scoped `Ask MyPhisys about this`, context/sources inspector.

**Step 30 — Conversational Symptom Write**
Preview → confirmation → Symptom → Timeline.

Completion = Vertical Slice C.

### M5 Hardening

**Step 31 — Provenance Inspector**
Fact → Source; Derived → algorithm+inputs.

**Step 32 — Audit**
Privacy-safe access/policy metadata.

**Step 33 — Observability**
OTel/Sentry with PHI sanitizer.

**Step 34 — Security Hardening**
RLS/storage/auth/rate/file/secrets/backups.

**Step 35 — Safety Evals**
Normal/edge/adversarial/treatment/leakage.

**Step 36 — Analytics Evals**
Golden longitudinal series.

**Step 37 — Agent Evals**
Routing/context/claims/citations/over-refusal.

**Step 38 — Export/Delete**
Data export, source data deletion, account deletion.

**Step 39 — Personal Beta Gate**
Release only after quality gates pass.

## 9. Critical path

```text
Repository
→ Canonical Data
→ Synthetic Profile
→ Analytics
→ What Changed
→ Today
→ Health Connect
→ PDF
→ Safety
→ Context
→ AI Explanation
→ Symptom Write
→ Evals
→ Personal Beta
```

## 9.1 Post-beta surface rollout

After Personal Beta gates pass, prioritize delivery expansion in this order unless user research contradicts it:

1. responsive Web companion;
2. Android `What Changed` / Today widget;
3. privacy-aware notifications and Quick Actions;
4. iOS + HealthKit;
5. Wear OS / Apple Watch companion;
6. MCP/API interoperability.

Web should be designed for records, charts, provenance, appointment prep and side-by-side Ask MyPhisys. Watch should not receive full Records/Timeline/AI parity.

## 10. What not to build before beta

- HealthKit;
- SMART/FHIR direct connection;
- Health Connect Medical Records;
- MCP;
- direct wearable APIs;
- forecasting;
- correlation mining;
- family accounts;
- provider messaging;
- autonomous treatment/diagnosis.

## 11. Definition of Done

Any health feature requires:

- domain schema;
- provenance semantics;
- temporal semantics;
- permission policy;
- missing/error states;
- tests;
- audit implications reviewed;
- safety classification reviewed;
- UX source visibility where relevant;
- eval fixture for AI/analytics;
- ADR/docs update if semantics changed.

## 12. Release strategy

Suggested app versions:

```text
0.1.0-alpha.1 foundation
0.1.0-alpha.2 ingestion
0.1.0-alpha.3 analytics
0.1.0-alpha.4 Today
0.1.0-alpha.5 Health Connect
0.1.0-alpha.6 PDF
0.1.0-alpha.7 AI
0.1.0-beta.1 Personal Beta
```

Architecture specification is versioned independently.
