---
title: "Model Strategy"
created: "10-10-26 11-38-32"
updated: "10-10-26 04-03-47"
version: "0.4.0"
status: "accepted"
commit: "docs(product): add MyPhisys surface delivery architecture"
---

# MyPhisys — Model Strategy

> Integrated into Project Specification Pack v0.4.0 from standalone Model Strategy v0.1.0. Provider/model mappings remain replaceable configuration and are current as verified on 10-10-2026.

## 0. Purpose

Этот документ определяет, **как MyPhisys подключает, выбирает, ограничивает, оценивает и заменяет AI-модели**.

Он является source of truth для:

- Model Gateway;
- capability-based routing;
- provider selection;
- privacy-aware context disclosure;
- model fallback;
- model budgets;
- structured outputs;
- evidence-aware reasoning;
- model evaluation;
- shadow testing;
- provider migration;
- AI-related observability;
- privacy/safety invariants.

Документ **не** определяет clinical truth, canonical health data, safety policy или analytical calculations. Эти функции принадлежат другим подсистемам MyPhisys.

Ключевой принцип:

> **Модель — заменяемый inference component. Она не является архитектурой MyPhisys, Clinical Store, памятью пользователя или источником медицинской истины.**

---

# 1. Executive decision

## 1.1 Рекомендуемая стратегия для Personal Beta

Начать с:

```text
MyPhisys
   │
   ▼
Task Router
   │
   ▼
Context Engine
   │
   ▼
Privacy Filter
   │
   ▼
Custom TypeScript Model Gateway
   │
   ▼
OpenAI API
```

При этом с первого дня:

- application code обращается к **capability aliases**, а не к model IDs;
- Model Gateway поддерживает provider adapters;
- personal health context минимизируется до необходимого;
- identifiable health data не передаются модели без отдельного разрешения policy;
- provider memory/history не используется как MyPhisys memory;
- health documents остаются в storage MyPhisys;
- numeric analytics выполняются deterministic code;
- high-risk actions определяются Safety Engine, а не LLM;
- final substantive claims проходят claim verification;
- provider fallback не может снижать privacy guarantees.

### Стартовая deployment mapping

```text
classifier_fast        → GPT-6 Luna
extractor_text         → GPT-6 Luna
extractor_vision       → GPT-6.1 Sol
reasoning_standard     → GPT-6.1 Sol
reasoning_high         → GPT-6 Astra
summarizer             → GPT-6 Luna
claim_reviewer         → GPT-6.1 Sol
embedding              → approved embedding model
private_local          → not implemented / local adapter stub
```

Эта таблица — **deployment configuration**, не архитектурный контракт.

---

# 2. Goals

Model Strategy должна обеспечить:

1. **Provider independence** — замена OpenAI на Anthropic/Azure/Bedrock/Vertex/local без переписывания domain logic.
2. **Capability routing** — дешёвая модель не выполняет задачу только потому, что она default.
3. **Privacy-aware routing** — доступность модели не означает право видеть конкретные health data.
4. **Risk-aware routing** — model capability и clinical risk рассматриваются отдельно.
5. **Deterministic-first** — computation остаётся вне LLM.
6. **Grounded reasoning** — personal facts и external evidence явно передаются как evidence bundles.
7. **Structured outputs** — application не парсит произвольный prose там, где нужен contract.
8. **No silent privacy downgrade** — fallback не ухудшает retention/compliance policy.
9. **Measured selection** — модель выбирается по MyPhisys evals.
10. **Reproducibility** — production execution фиксирует provider/model snapshot/configuration.
11. **Graceful degradation** — MyPhisys остаётся полезным при недоступности LLM.
12. **Cost control** — frontier reasoning используется только там, где он приносит measurable value.

---

# 3. Non-goals

На Personal Beta **не** требуется:

- multi-agent provider voting;
- три frontier providers одновременно;
- autonomous model-generated SQL;
- provider-native long-term memory;
- provider-hosted vector store как Clinical Memory;
- provider Files API как основной document store;
- provider-native agents как source of truth;
- fine-tuning на personal health data;
- automatic model-generated treatment decisions;
- fully autonomous model selection based only on cost;
- generic AI gateway outside our privacy control plane.

---

# 4. AI workload taxonomy

## 4.1 Tier 0 — No model

Следующие задачи выполняются deterministic services и **никогда не делегируются LLM как primary implementation**:

- canonical health state;
- unit conversion;
- deduplication;
- temporal ordering;
- latest measurement;
- baseline calculation;
- trend calculation;
- state snapshot;
- state diff;
- `What Changed`;
- data-quality assessment;
- source/provenance tracing;
- permissions;
- tool authorization;
- write confirmation;
- retention policy;
- provider eligibility;
- clinical action policy;
- numeric verification.

```text
Health Data
    ↓
Deterministic Analytics
    ↓
Derived Facts
    ↓
LLM explanation
```

Не наоборот.

---

## 4.2 Tier 1 — Fast structured inference

Типовые задачи:

- intent classification;
- health domain classification;
- entity extraction;
- temporal scope extraction;
- query rewriting;
- routing hints;
- document type classification;
- low-risk UX copy transformation.

Требования:

- low latency;
- low cost;
- strict JSON output;
- no broad health context;
- preferably P0/P1 context.

Capability:

`classifier_fast`

---

## 4.3 Tier 2 — Extraction

Задачи:

- structured extraction from medical text;
- laboratory report parsing assistance;
- visual extraction from image/PDF pages;
- medication candidate extraction;
- symptom candidate extraction.

Output:

```text
ExtractionCandidate[]
```

а не canonical facts.

Каждый candidate получает:

- source locator;
- extraction method;
- validation issues;
- uncertainty;
- provenance.

Capabilities:

- `extractor_text`
- `extractor_vision`

---

## 4.4 Tier 3 — Standard reasoning

Задачи:

- explain a deterministic insight;
- summarize verified data;
- explain a metric/result;
- contextualize a change;
- produce user-facing explanation;
- formulate appointment questions.

Capability:

`reasoning_standard`

Контекст:

- минимальный;
- structured;
- de-identified where possible;
- already normalized;
- includes data-quality information.

---

## 4.5 Tier 4 — High reasoning

Задачи:

- C2/C3 cross-domain synthesis;
- complex lab interpretation;
- conflicting-record analysis;
- complicated appointment preparation;
- evidence synthesis across several trusted sources.

Capability:

`reasoning_high`

Требования:

- strongest approved model;
- approved provider privacy tier;
- evidence bundle where substantive medical claims are needed;
- claim-level verification;
- no treatment action capability.

---

# 5. Capability aliases

Application code не должен содержать production model IDs.

## 5.1 Required aliases

```typescript
export type ModelCapability =
  | "classifier_fast"
  | "extractor_text"
  | "extractor_vision"
  | "reasoning_standard"
  | "reasoning_high"
  | "summarizer"
  | "claim_reviewer"
  | "embedding"
  | "private_local";
```

## 5.2 Why aliases

Плохо:

```typescript
await openai.responses.create({
  model: "gpt-6-astra",
  input
});
```

внутри `lab-interpretation`.

Правильно:

```typescript
await modelGateway.generate({
  capability: "reasoning_high",
  task: "lab_interpretation",
  context,
});
```

Gateway mapping может измениться без изменения skill.

---

# 6. Capability contract

```typescript
export interface ModelRequest<TOutput> {
  capability: ModelCapability;

  task:
    | "intent_classification"
    | "entity_extraction"
    | "document_extraction"
    | "health_explanation"
    | "lab_interpretation"
    | "appointment_summary"
    | "claim_review";

  clinicalRisk: "C0" | "C1" | "C2" | "C3" | "C4";

  privacyLevel: "P0" | "P1" | "P2" | "P3";

  sensitivity: "D0" | "D1" | "D2" | "D3" | "D4";

  context: ApprovedModelContext;

  outputSchema: unknown;

  budget: ModelBudget;

  requiredFeatures?: Array<
    "text" |
    "vision" |
    "structured_output" |
    "tool_use"
  >;
}
```

Model Gateway обязан отказать, если нет eligible deployment.

---

# 7. Privacy levels

Clinical sensitivity (`D0–D4`) и model disclosure level (`P0–P3`) — разные измерения.

## P0 — No personal health data

Примеры:

- объяснить общий медицинский термин;
- classify generic query;
- rewrite evidence query.

Допустимо для большинства approved providers.

---

## P1 — De-identified wellness context

Например:

```json
{
  "metric": "sleep_duration",
  "current_hours": 5.9,
  "baseline_hours": 6.7,
  "period_days": 7
}
```

Без:

- имени;
- email;
- адреса;
- record number;
- provider name, если он не нужен;
- unnecessary unrelated history.

---

## P2 — De-identified clinical context

Пример:

```json
{
  "metric": "hemoglobin_a1c",
  "current": 5.9,
  "previous": 6.1,
  "unit": "%",
  "measurement_dates": ["2026-09-22", "2026-04-14"],
  "source_type": "laboratory",
  "relevant_medication_changes": []
}
```

Это основной target level для cloud health reasoning.

---

## P3 — Identifiable / specially sensitive context

Включает:

- direct identifiers;
- full raw medical record;
- especially sensitive compartments;
- context, который нельзя разумно de-identify.

Default policy:

> **P3 запрещён для обычного cloud routing Personal Beta.**

Исключение возможно только через отдельный approved provider policy.

---

# 8. Data minimization pipeline

```text
Health Context Package
        │
        ▼
Purpose Limiter
        │
        ▼
Field Allowlist
        │
        ▼
Identifier Redaction
        │
        ▼
Sensitive Compartment Filter
        │
        ▼
Provider Policy
        │
        ▼
Model Request
```

## 8.1 Example

Canonical source:

```text
User full name
DOB
Clinic
Doctor
Lab PDF
HbA1c 5.9%
Previous HbA1c 6.1%
```

Model gets:

```json
{
  "metric": "hemoglobin_a1c",
  "current": 5.9,
  "previous": 6.1,
  "unit": "%",
  "interval_months": 5,
  "source_type": "laboratory"
}
```

Identity не нужна для reasoning.

---

# 9. Provider strategy

## 9.1 Direct OpenAI — Personal Beta default

### Recommended role

Primary provider for:

- structured classification;
- multimodal extraction;
- standard reasoning;
- complex reasoning.

### Current candidate models

As of 10-10-2026, OpenAI recommends the GPT-6 family for production API usage:

- `GPT-6 Luna` — efficient, focused, high-volume tasks;
- `GPT-6.1 Sol` — near-Astra capability with a substantially lower cost;
- `GPT-6 Astra` — highest-capability option for the most demanding reasoning.

These are starting candidates only; MyPhisys evals decide promotion by capability.

### Strengths

- one API for several workload classes;
- structured outputs;
- function calling;
- vision input;
- strong reasoning;
- mature API;
- current data-control options.

### Important privacy facts

OpenAI currently documents:

- API data is not used for training by default unless customer opts in;
- default abuse-monitoring retention can be up to 30 days;
- eligible customers can request Zero Data Retention (ZDR) or Modified Abuse Monitoring;
- ZDR changes behavior of supported endpoints such as forcing `store=false`;
- BAA support is available for eligible healthcare deployments/configurations;
- some endpoints/features are not ZDR compatible or can persist application state.

### MyPhisys policy

For Personal Beta:

- use direct API via Model Gateway;
- explicitly use stateless requests;
- set `store=false` where supported;
- do not use provider-native conversation history;
- do not use provider Files API for canonical medical document storage;
- avoid background/stateful features for sensitive flows;
- keep raw documents in MyPhisys storage;
- prefer P1/P2 de-identified context;
- treat ZDR/BAA as **explicit account configuration**, never as assumed default.

---

## 9.2 Direct Anthropic — secondary / evaluation provider

### Recommended role

Initially:

- shadow evals;
- alternative standard/high reasoning;
- document reasoning comparison.

Current comparison candidates include Claude Haiku 5.5, Sonnet 5.5 and Opus 5.5; exact mapping remains config-driven and eval-gated.

### Privacy facts

Anthropic currently documents:

- commercial API inputs/outputs are normally deleted within 30 days;
- ZDR arrangements are available for some approved enterprise API customers;
- BAA is available only for qualifying HIPAA-eligible configurations;
- ZDR/BAA may not cover features such as Files API, web search, explicit prompt caching, certain batch operations or other integrations.

### MyPhisys policy

Do not route P2/P3 production health data through standard Anthropic API configuration until provider policy is explicitly approved.

Use first for:

- synthetic evals;
- de-identified shadow tests;
- provider comparison.

---

## 9.3 Azure Foundry — enterprise evolution

### Recommended role

Candidate when MyPhisys moves from personal beta to a commercial/regulated cloud deployment.

Microsoft currently documents for models sold by Azure:

- prompts, outputs, embeddings and training data are not available to OpenAI/other underlying model providers;
- they are not used to train foundation models without permission;
- inference is hosted inside Microsoft's Azure environment;
- processing geography can be controlled according to deployment type.

### Strengths

- enterprise IAM;
- network isolation;
- geography controls;
- Microsoft compliance plane;
- separation from public model provider APIs.

### Trade-offs

- more cloud complexity;
- model availability may differ by region/deployment;
- abuse-monitoring/data-storage details must still be reviewed.

---

## 9.4 Amazon Bedrock — enterprise multi-model control plane

### Recommended role

Strong candidate if MyPhisys later requires:

- several model families behind one enterprise boundary;
- AWS-native IAM/VPC/audit;
- centralized retention controls.

AWS currently documents:

- account/project/region data-retention modes;
- `none` as zero data retention where supported;
- requests can be blocked when a model is incompatible with configured retention policy;
- Amazon Bedrock is on AWS's HIPAA Eligible Services list.

### Strength

Retention policy can become an infrastructure constraint:

```text
retention_mode = none
↓
incompatible model
↓
request blocked
```

This behavior aligns very well with MyPhisys fail-closed privacy policy.

---

## 9.5 Google Vertex AI

### Recommended role

Candidate for:

- Gemini multimodal evaluation;
- enterprise Google Cloud deployment;
- document-heavy workloads.

Google currently documents:

- customer data isn't used to train/fine-tune managed models without permission;
- ZDR requires explicit configuration/feature choices;
- Gemini in-memory caching can be disabled;
- some grounding features retain data and are incompatible with strict ZDR.

### Caveat

Do not adopt search-grounding or session-persistence features automatically in a health context.

---

## 9.6 Local models

Target adapter:

`LocalModelProvider`

Possible runtime later:

- vLLM;
- equivalent self-hosted serving layer;
- development-only Ollama-style runtime.

### Recommended workloads

- PII redaction;
- lightweight classification;
- entity extraction;
- evidence-query rewriting;
- embeddings;
- low-risk structured preprocessing.

### Not default initially

Do not use local models for C2/C3 medical reasoning only because they are private. Privacy gain does not compensate for unmeasured reasoning-quality loss.

---

# 10. Provider matrix

| Provider path | Personal Beta | Sensitive production | Multi-model | Control | Recommended role |
| --- | --- | --- | --- | --- | --- |
| Direct OpenAI | **Yes** | With approved controls | Medium | Medium-high | Primary start |
| Direct Anthropic | Shadow/eval | With ZDR/BAA as needed | Low | Medium | Secondary |
| Azure Foundry | Later | **Strong candidate** | Medium | High | Enterprise OpenAI route |
| AWS Bedrock | Later | **Strong candidate** | **High** | **High** | Enterprise multi-model |
| Vertex AI | Eval/later | Strong with config | High | High | Multimodal/GCP |
| Local/self-hosted | Limited | **Maximum custody** | Configurable | **Maximum** | Privacy preprocessing |

---

# 11. Personal Beta model mapping

## 11.1 Recommended baseline

```yaml
model_aliases:

  classifier_fast:
    provider: openai
    model: gpt-6-luna
    reasoning_effort: low

  extractor_text:
    provider: openai
    model: gpt-6-luna
    reasoning_effort: low

  extractor_vision:
    provider: openai
    model: gpt-6.1-sol
    reasoning_effort: medium

  reasoning_standard:
    provider: openai
    model: gpt-6.1-sol
    reasoning_effort: medium

  reasoning_high:
    provider: openai
    model: gpt-6-astra
    reasoning_effort: high

  summarizer:
    provider: openai
    model: gpt-6-luna
    reasoning_effort: low

  claim_reviewer:
    provider: openai
    model: gpt-6.1-sol
    reasoning_effort: medium
```

This is a starting hypothesis. Production promotion requires evals.

---

# 12. Task routing matrix

| MyPhisys task | Primary implementation | Model capability | Context level |
| --- | --- | --- | --- |
| Latest measurement | Deterministic | none | none |
| Trend | Deterministic | none | none |
| Baseline | Deterministic | none | none |
| What Changed | Deterministic | none | none |
| Intent classification | Model | classifier_fast | P0/P1 |
| Health entity extraction | Model | classifier_fast | P1 |
| Symptom candidate parsing | Model | extractor_text | P1/P2 |
| Lab text extraction | Parser + model | extractor_text | P2 |
| Lab image extraction | Vision + validation | extractor_vision | P2 |
| Explain metric change | Model | reasoning_standard | P1/P2 |
| Explain lab | Evidence + model | reasoning_high | P2 |
| Appointment brief | Deterministic bundle + model | reasoning_standard/high | P2 |
| Clinical cross-domain investigation | Evidence + model | reasoning_high | P2 |
| Clinical policy | Deterministic | none | none |
| Tool authorization | Deterministic | none | none |
| Numeric verification | Deterministic | none | none |
| Claim support review | Deterministic + optional model | claim_reviewer | P0/P2 |

---

# 13. Routing decision

Model selection occurs **after** Safety and Context authorization.

```text
User request
    ↓
Intent / Risk
    ↓
Safety Policy
    ↓
Context Requirements
    ↓
Context Engine
    ↓
Privacy Level
    ↓
Model Capability
    ↓
Eligible Providers
    ↓
Provider Ranking
    ↓
Execution
```

The model cannot request a broader privacy tier.

---

# 14. Provider eligibility

```typescript
export interface ProviderPolicy {
  providerId: string;

  enabled: boolean;

  maxPrivacyLevel: "P0" | "P1" | "P2" | "P3";
  maxDataSensitivity: "D0" | "D1" | "D2" | "D3" | "D4";

  allowedClinicalRisks: Array<"C0" | "C1" | "C2" | "C3" | "C4">;
  allowedCapabilities: ModelCapability[];

  zeroRetentionRequiredFor?: string[];
  baaRequiredForPHI: boolean;

  allowedRegions?: string[];

  providerFilesAllowed: boolean;
  providerMemoryAllowed: boolean;
  providerWebSearchAllowed: boolean;
  promptCachingAllowed: boolean;
}
```

---

# 15. Routing algorithm

```typescript
function selectDeployment(
  request: ApprovedModelRequest,
  deployments: ModelDeployment[],
): ModelDeployment {
  const eligible = deployments
    .filter((d) => d.enabled)
    .filter((d) => d.capabilities.includes(request.capability))
    .filter((d) => privacyAllows(d, request))
    .filter((d) => riskAllows(d, request))
    .filter((d) => regionAllows(d, request))
    .filter((d) => featureRequirementsMet(d, request));

  if (eligible.length === 0) {
    throw new NoEligibleModelDeploymentError();
  }

  return rankBy(
    eligible,
    request.qualityPriority,
    request.latencyBudget,
    request.costBudget,
  )[0];
}
```

If no eligible deployment exists:

> **degrade the feature, not privacy.**

---

# 16. Fallback policy

## 16.1 Core rule

> A fallback must provide **equal or stronger privacy guarantees** than the failed deployment.

### Allowed

```text
Approved primary deployment unavailable
↓
another deployment with same privacy contract
```

### Forbidden

```text
ZDR-required deployment unavailable
↓
standard-retention provider
```

without a new explicit policy decision.

## 16.2 Fallback tree

```text
Primary deployment
      │
      ├─ transient failure?
      │      ↓
      │   retry once
      │
      ▼
Same privacy tier alternate
      │
      ├─ available → execute
      │
      ▼
Local eligible model
      │
      ├─ quality sufficient → execute
      │
      ▼
Graceful degradation
```

---

# 17. No-provider mode

Still available:

- Today;
- Timeline;
- Records;
- Metric Detail;
- personal baseline;
- Trend;
- What Changed;
- provenance;
- data quality;
- connector sync.

Unavailable/degraded:

- AI explanation;
- complex synthesis;
- free-form cross-domain reasoning.

---

# 18. Model Gateway architecture

```text
packages/model-gateway/

  capabilities/
    classifier/
    extractor-text/
    extractor-vision/
    reasoning-standard/
    reasoning-high/
    summarizer/
    claim-reviewer/
    embedding/

  providers/
    openai/
    anthropic/
    azure/
    bedrock/
    vertex/
    local/

  routing/
    eligibility/
    quality/
    privacy/
    risk/
    fallback/

  privacy/
    de-identification/
    field-allowlist/
    compartment-filter/
    provider-policy/

  schemas/
    requests/
    responses/
    claims/
    extraction/

  budgets/
    token/
    cost/
    latency/

  telemetry/
    events/
    metrics/

  evals/
```

---

# 19. Provider adapter

```typescript
export interface ModelProvider {
  id: string;

  capabilities(): Promise<ModelProviderCapabilities>;

  generate<T>(
    request: ProviderModelRequest<T>
  ): Promise<ProviderModelResponse<T>>;

  embed?(
    input: EmbeddingRequest
  ): Promise<EmbeddingResponse>;

  healthCheck(): Promise<ProviderHealth>;
}
```

Provider adapter may know model names. Domain packages may not.

---

# 20. Stateless model calls

Default:

```text
request
→ response
→ MyPhisys stores approved result
```

Not:

```text
provider thread
→ provider memory
→ future conversation
```

Conversation state belongs to MyPhisys.

---

# 21. Provider Files policy

Default:

`providerFilesAllowed = false`

Medical documents remain in MyPhisys Object Storage.

For model processing:

```text
Document
↓
relevant pages / extracted text
↓
temporary inference request
```

---

# 22. Prompt caching policy

## Cache candidates

- generic system instructions;
- static schemas;
- non-personal skill instructions;
- static terminology.

## Do not cache by default

- personal clinical context;
- raw documents;
- identifiable health information;
- conversation health history.

Provider-specific behavior must be part of ProviderPolicy.

---

# 23. Web/search policy

Provider-native web search is disabled for personal-context calls by default.

Instead:

```text
Personal question
   ↓
Evidence Query Builder
   ↓
De-identified generic medical query
   ↓
Evidence Provider
   ↓
Evidence Bundle
   ↓
Reasoning model
```

---

# 24. Evidence-aware reasoning

```typescript
interface HealthReasoningContext {
  personalFacts: VerifiedPersonalFact[];
  derivedFacts: VerifiedDerivedFact[];
  conflicts: ConflictSummary[];
  missingData: MissingDataSummary[];
  dataQuality: DataQualitySummary[];
  medicalEvidence?: EvidenceItem[];
}
```

Model must not invent missing personal facts.

---

# 25. Claim-first generation

```typescript
type ClaimType =
  | "PERSONAL_FACT"
  | "CALCULATION"
  | "MEDICAL_FACT"
  | "ASSOCIATION"
  | "HYPOTHESIS"
  | "RECOMMENDATION"
  | "UNCERTAINTY";

interface CandidateClaim {
  type: ClaimType;
  text: string;
  supportRefs: string[];
}
```

Pipeline:

```text
Model
 ↓
Candidate Claims
 ↓
Numeric Verifier
 ↓
Evidence Verifier
 ↓
Clinical Policy
 ↓
Approved Claims
 ↓
Response Composer
```

---

# 26. Second-model review

Do not default to model voting.

Recommended uses:

- offline eval;
- synthetic/de-identified shadow traffic;
- A/B quality comparison;
- optional claim-review experiments.

---

# 27. Shadow testing

Production:

```text
reasoning_standard → approved OpenAI deployment
```

Shadow:

```text
same synthetic/de-identified input
→ Anthropic candidate
```

Compare:

- claim support;
- safety;
- context use;
- latency;
- cost.

---

# 28. Embeddings strategy

Use embeddings for:

- document retrieval;
- evidence retrieval;
- conversation retrieval;
- optional personal-memory semantic search.

Do not use embeddings as source of truth for:

- current medications;
- latest observations;
- conditions;
- current health state.

---

# 29. Fine-tuning policy

Personal Beta:

> **No fine-tuning on user health data.**

Fine-tuning later may be evaluated for:

- style;
- non-sensitive extraction;
- classification;

using synthetic/de-identified data.

---

# 30. Model budgets

Example:

```yaml
budgets:

  classifier_fast:
    max_calls: 1
    max_input_tokens: 4000
    max_output_tokens: 500

  extractor_text:
    max_calls: 2
    max_input_tokens: 16000
    max_output_tokens: 4000

  reasoning_standard:
    max_calls: 1
    max_input_tokens: 24000
    max_output_tokens: 5000

  reasoning_high:
    max_calls: 1
    max_input_tokens: 40000
    max_output_tokens: 8000
```

---

# 31. Large context policy

Large context windows do not relax data-minimization.

Even if a model supports very large contexts:

- privacy exposure increases;
- signal/noise worsens;
- provenance is harder;
- cost rises;
- stale context can distort reasoning.

---

# 32. Latency strategy

Interactive:

```text
classifier
→ deterministic retrieval
→ reasoning
```

Avoid model chains unless they have measured value.

Non-interactive:

- weekly review;
- document post-processing;
- offline evals;

can accept higher latency.

---

# 33. Cost strategy

Optimize in this order:

1. avoid model call;
2. reduce context;
3. use cheaper capability tier;
4. cache only when privacy-safe;
5. batch only non-sensitive/offline workloads where approved;
6. optimize provider price.

Do not downgrade medical reasoning quality merely to save tokens.

---

# 34. Eval methodology

A deployment is approved per **capability**, not globally.

Not:

> Model X is approved for MyPhisys.

But:

> Deployment X is approved for `reasoning_standard@v1` on P1/P2 workloads.

---

# 35. Eval suites

```text
evals/models/

  classification/
  extraction-text/
  extraction-vision/
  health-explanation/
  lab-interpretation/
  appointment-prep/
  claim-review/
```

Each contains:

- golden;
- edge;
- missing-data;
- conflicting-data;
- adversarial;
- privacy;
- safety cases.

---

# 36. Evaluation dataset policy

Priority:

1. synthetic health profiles;
2. generated edge cases;
3. carefully de-identified real cases where justified;
4. never casually upload production PHI to eval platforms.

---

# 37. Core model metrics

## Quality

- task accuracy;
- structured-output validity;
- entity extraction F1;
- extraction accuracy;
- reasoning completeness.

## Grounding

- Supported Clinical Claim Rate;
- Unsupported Claim Rate;
- Source Attribution Accuracy;
- Citation Support Accuracy.

## Numerical

- Numeric Error Rate;
- Temporal Error Rate.

## Safety

- Treatment Directive Rate;
- Unsupported Diagnostic Claim Rate;
- Causal Overclaim Rate;
- Over-refusal Rate.

## Privacy

- Sensitive Context Exposure Rate;
- Forbidden Field Exposure;
- Context Minimization Score.

## Operations

- p50/p95 latency;
- cost/request;
- tokens;
- provider failure rate;
- schema retry rate.

---

# 38. Release gates

```text
Candidate
  ↓
Offline eval
  ↓
Safety regression
  ↓
Privacy review
  ↓
Shadow test
  ↓
Limited rollout
  ↓
Production
```

Block release on:

- treatment directive regression;
- sensitive-context exposure;
- unsupported diagnosis regression;
- numeric regression;
- material increase in unsupported claims.

---

# 39. Snapshot/version policy

Execution trace stores:

```text
provider
model/deployment
snapshot/version
capability alias
gateway policy version
skill version
prompt version
context manifest
```

Avoid silent production upgrades.

---

# 40. Provider migration

Migration should require no domain-code changes:

```text
reasoning_standard
OpenAI
↓
Anthropic / Azure / Bedrock
```

Only:

- deployment config;
- adapter;
- prompt tuning where required;
- eval baseline.

---

# 41. Local model roadmap

## L0

Provider stub.

## L1

Embeddings / PII redaction.

## L2

Classification/entity extraction.

## L3

Document preprocessing.

## L4

Reasoning only after eval parity.

---

# 42. LiteLLM strategy

Evaluate later if:

- ≥3 providers are active;
- provider routing/key management becomes burdensome;
- centralized budget/rate control is needed.

LiteLLM must not replace:

- Safety Engine;
- Context Engine;
- privacy eligibility;
- provider policy.

MyPhisys Policy layer remains in front.

---

# 43. Managed gateway strategy

Managed gateways add a data processor:

```text
MyPhisys
→ Managed Gateway
→ Provider
```

Therefore they require the same privacy/retention/contractual review as a model provider.

Personal Beta defaults to direct adapters.

---

# 44. Model Gateway observability

Allowed:

- capability;
- provider;
- deployment;
- risk level;
- privacy level;
- latency;
- token count;
- estimated cost;
- schema validity;
- fallback reason;
- error class.

Forbidden by default:

- raw health prompt;
- raw clinical record;
- full output;
- direct identifiers.

---

# 45. Usage telemetry

```typescript
interface ModelUsageEvent {
  capability: ModelCapability;
  provider: string;
  deployment: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  fallbackUsed: boolean;
}
```

No PHI required.

---

# 46. Provider health states

```text
AVAILABLE
DEGRADED
RATE_LIMITED
DISABLED
PRIVACY_INELIGIBLE
```

`PRIVACY_INELIGIBLE` must never trigger an unsafe fallback.

---

# 47. Kill switches

```text
provider.openai.enabled
provider.anthropic.enabled
provider.local.enabled

capability.reasoning_high.enabled
capability.extractor_vision.enabled

cloud_p2_context_enabled
provider_web_search_enabled
provider_files_enabled
```

---

# 48. Personal Beta configuration

```yaml
strategy:
  mode: direct-provider
  primary_provider: openai

privacy:
  default_max_cloud_level: P2
  p3_cloud_enabled: false
  provider_memory: false
  provider_files: false
  provider_web_search_with_personal_context: false
  silent_privacy_downgrade: false

routing:
  classifier_fast: openai:gpt-6-luna
  extractor_text: openai:gpt-6.1-sol
  extractor_vision: openai:gpt-6.1-sol
  reasoning_standard: openai:gpt-6.1-sol
  reasoning_high: openai:gpt-6-astra
  summarizer: openai:gpt-6.1-sol
  claim_reviewer: openai:gpt-6.1-sol

fallback:
  retries: 1
  require_equal_or_stronger_privacy: true
  if_no_eligible_model: graceful_degradation
```

---

# 49. V1 candidate

```text
MyPhisys Gateway
   ├── OpenAI primary
   ├── Anthropic shadow/secondary
   └── Local classifier/redaction
```

Possible future routing:

```text
classifier_fast → local
extractor → best evaluated cloud model
reasoning_standard → quality/cost winner
reasoning_high → strongest approved model
```

---

# 50. Commercial/regulated evolution

## Azure-centric

Choose if:

- OpenAI models dominate evals;
- Microsoft enterprise control plane is preferred.

## Bedrock-centric

Choose if:

- model diversity matters;
- infrastructure-level retention enforcement is valuable;
- AWS becomes primary cloud.

## Hybrid direct + local

Choose if:

- maximum flexibility is required;
- MyPhisys remains the primary governance plane.

---

# 51. Architectural invariants

Add to `INVARIANTS.md`:

### INV-016

**Application/domain code references model capabilities, never production model names.**

### INV-017

**Provider fallback cannot weaken privacy, retention or compliance requirements.**

### INV-018

**Provider-native memory is not MyPhisys memory.**

### INV-019

**Medical documents remain in MyPhisys storage unless provider storage is explicitly approved.**

### INV-020

**Model selection is based on MyPhisys task-specific evals, not generic benchmarks.**

### INV-021

**Large model context windows do not relax context-minimization policy.**

### INV-022

**Model availability never grants access to additional health context.**

### INV-023

**High-risk clinical actions are controlled by deterministic policy outside the model.**

### INV-024

**MyPhisys remains useful when model providers are unavailable.**

### INV-025

**No production model/snapshot upgrade bypasses eval and release gates.**

---

# 52. ADR proposals

## ADR-149 — Custom Model Gateway

**Accepted**

MyPhisys owns a TypeScript Model Gateway instead of exposing provider SDKs to skills.

## ADR-150 — Capability aliases

**Accepted**

Skills request `reasoning_high`, etc., not model IDs.

## ADR-151 — Direct provider first

**Accepted**

Personal Beta begins with direct OpenAI API integration rather than third-party AI gateway.

## ADR-152 — Deterministic-first

**Accepted**

LLMs do not own numerical analytics, health state, permissions or clinical-action policy.

## ADR-153 — P3 cloud default deny

**Accepted**

Identifiable/highly sensitive context is not sent to ordinary cloud model routes by default.

## ADR-154 — No silent privacy downgrade

**Accepted**

Fallback may reduce functionality but not privacy guarantees.

## ADR-155 — Provider statelessness

**Accepted**

Long-term conversation/memory state belongs to MyPhisys.

## ADR-156 — Provider storage default deny

**Accepted**

Files/memory/vector stores hosted by model providers are disabled by default for health data.

## ADR-157 — Eval-based promotion

**Accepted**

Each provider/model is promoted independently by capability.

## ADR-158 — Local models incremental

**Accepted**

Local inference begins with preprocessing/classification, not clinical reasoning.

---

# 53. Implementation sequence

## Phase 1 — Gateway skeleton

Create:

```text
packages/model-gateway/
```

Implement:

- capability aliases;
- provider registry;
- deployment config;
- provider interface;
- privacy validation;
- no-eligible-provider error.

## Phase 2 — OpenAI adapter

Implement:

- Responses API adapter;
- `store=false`;
- structured output validation;
- timeout;
- single retry;
- token/cost telemetry;
- normalized errors.

## Phase 3 — Privacy filter

Implement:

- field allowlists;
- identifier stripping;
- sensitive compartment controls;
- P0–P3 classification;
- audit metadata.

## Phase 4 — First capabilities

Implement:

- `classifier_fast`;
- `extractor_text`;
- `reasoning_standard`;

then:

- `extractor_vision`;
- `reasoning_high`.

## Phase 5 — Eval harness

Example command:

```text
pnpm eval:model --suite health-explanation
```

## Phase 6 — Shadow provider

Add Anthropic adapter only after OpenAI baseline is stable.

## Phase 7 — Local adapter

Add local classification/redaction candidate.

---

# 54. Definition of Done — Model Gateway v0.1

1. No skill imports provider SDK directly.
2. No skill contains production model ID.
3. Privacy level is mandatory on every request.
4. Provider eligibility is checked before call.
5. No eligible deployment produces graceful failure.
6. Fallback cannot weaken privacy.
7. Outputs are schema-validated.
8. Provider state is not used as MyPhisys memory.
9. Provider health-document storage is disabled by default.
10. Telemetry contains no raw health payload.
11. Model/snapshot is recorded in trace.
12. At least one model eval suite gates deployment.
13. P3 cloud context is denied by default.
14. Core MyPhisys UX remains functional when gateway is disabled.

---

# 55. Definition of Done — New Model Deployment

A model/deployment can be promoted only if:

- provider policy exists;
- retention/privacy behavior is documented;
- capability eval passes;
- critical safety cases pass;
- structured-output success meets target;
- cost/latency are measured;
- fallback is defined;
- snapshot/version strategy is known;
- prohibited provider features are not implicitly enabled.

---

# 56. Immediate decision summary

## Use now

- custom TypeScript Model Gateway;
- direct OpenAI API;
- capability aliases;
- GPT-6 Luna/Terra/Sol as initial candidates;
- stateless requests;
- structured outputs;
- P1/P2 de-identification;
- deterministic analytics;
- claim verification.

## Defer

- Anthropic production routing;
- Azure;
- Bedrock;
- Vertex;
- LiteLLM;
- managed AI gateways;
- local clinical reasoning;
- fine-tuning;
- provider-native agents;
- provider vector stores.

## Explicitly avoid

- full medical-history dumps;
- provider memory as product memory;
- automatic cross-provider fan-out;
- privacy-degrading fallback;
- model-generated numerical truth;
- LLM-only clinical safety.

---

# 57. Reference sources — verified 10-10-2026

## OpenAI

- Data controls:  
  https://developers.openai.com/api/docs/guides/your-data
- GPT-6 Astra:  
  https://developers.openai.com/api/docs/models/gpt-6-astra
- GPT-6.1 Sol:  
  https://developers.openai.com/api/docs/models/gpt-6.1-sol
- GPT-6 Luna:  
  https://developers.openai.com/api/docs/models/gpt-6-luna
- Enterprise privacy / BAA:  
  https://openai.com/enterprise-privacy/

## Anthropic

- Commercial API retention:  
  https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- Zero Data Retention:  
  https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to
- BAA:  
  https://privacy.anthropic.com/en/articles/8114513-business-associate-agreements-baa-for-commercial-customers
- Model lifecycle/deprecations:  
  https://docs.anthropic.com/en/docs/about-claude/model-deprecations

## Microsoft Azure

- Foundry Models data privacy:  
  https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/openai/data-privacy

## AWS

- Bedrock data retention:  
  https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html
- HIPAA Eligible Services:  
  https://aws.amazon.com/compliance/hipaa-eligible-services-reference/

## Google Cloud

- Vertex AI zero data retention:  
  https://docs.cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention
- Vertex generative AI release notes:  
  https://docs.cloud.google.com/vertex-ai/generative-ai/docs/release-notes

---

# 58. Final recommendation

Для MyPhisys strongest near-term solution:

```text
Deterministic health core
        ↓
Minimum necessary context
        ↓
Privacy-aware Model Gateway
        ↓
Capability-selected frontier model
        ↓
Structured claims
        ↓
Verification + safety
```

Начать нужно с **одного сильного provider и сильных boundaries**, а не с максимального числа моделей.

Новый provider следует добавлять только если выполняется хотя бы одно условие:

1. он выигрывает конкретный MyPhisys capability eval;
2. compliance/privacy architecture требует другого deployment plane;
3. resilience/cost оправдывает дополнительную operational complexity.

Это сохраняет MyPhisys **model-agnostic**, не превращая Personal Beta в преждевременно сложную multi-provider платформу.
