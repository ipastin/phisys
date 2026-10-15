---
title: "Context & Memory Architecture"
created: "06-10-26 06-56-08"
updated: "10-10-26 04-03-47"
version: "0.4.0"
status: "accepted"
commit: "docs(product): add MyPhisys surface delivery architecture"
---

# Context & Memory Architecture

## 1. Core rule

**Universal agent memory does not exist.**

Required layers:

```text
L0 Working Context
L1 Conversation State
L2 Personal Memory
L3 Preference / Goal Memory
L4 Clinical Memory = Canonical Health Store

AI Inference Store — separate, not memory truth
```

## 2. L0 Working Context

Short-lived context for current task. Does not persist as user memory by default.

For significant executions persist **Context Manifest**, not necessarily full prompt:

- relevant record IDs;
- derived metrics;
- evidence refs;
- conflicts;
- context-builder version.

## 3. Conversation State

Continuity state, not medical chart:

- active topic;
- selected timeframe;
- unresolved question;
- scoped entity/insight.

TTL/retention policy applies. `said in conversation ≠ stored medical fact`.

## 4. Personal Memory

Non-clinical context useful across sessions:

- habits;
- routines;
- devices;
- environment;
- non-clinical preferences.

Memory items support freshness/staleness because routines change.

## 5. Preference Memory

Low-risk persistent preferences:

- language;
- units;
- chart display preference;
- notification preference.

Can usually auto-persist when explicitly stated.

## 6. Goal Memory

Separate:

```text
user_goal
clinician_goal
```

User goal never automatically becomes clinical target.

## 7. Clinical Memory

Implementation name: **Canonical Health Store**, not generic AI memory.

Every clinical item requires:

- schema validity;
- person binding;
- temporal semantics;
- provenance;
- epistemic/verification status.

## 8. AI Inference Store

Stores:

- hypotheses;
- associations;
- summaries;
- AI interpretations.

Rule:

```text
Inference ≠ Personal Fact ≠ Clinical Fact
```

No automatic promotion path exists.

## 9. Memory Candidate Service

Any potentially persistent information first becomes candidate:

```text
candidate
→ classification
→ policy
→ validation
→ conflict detection
→ confirmation/verification
→ persistence or rejection
```

Source examples:

- explicit user statement;
- conversational extraction;
- imported record;
- AI suggestion.

## 10. Promotion matrix

| Input | Target | Default |
|---|---|---|
| structured FHIR/lab record | Clinical | allow after validation |
| Health Connect measurement | Clinical | allow after validation |
| parsed PDF lab | Clinical | validate/review ambiguity |
| user symptom | Clinical user-reported | confirm |
| user unit preference | Preference | allow |
| user routine | Personal | persist if useful/explicit |
| AI hypothesis | Clinical | **deny** |
| web evidence | Clinical personal record | **deny** |

## 11. User-reported data

User is authoritative for many subjective/behavioural facts:

- pain;
- symptoms;
- medication intake;
- diet;
- wellbeing.

Store honestly as `user_reported`, not as clinician-confirmed.

## 12. Assertion taxonomy

Conversation extraction distinguishes:

```text
ASSERTION
OBSERVATION
PREFERENCE
INTENTION
HYPOTHESIS
```

Example: `кажется, препарат ухудшает сон` yields a user hypothesis, not confirmed adverse reaction.

## 13. Atomic memory extraction

Long sentence is decomposed into domain atoms with different lifecycles.

Example:

```text
"Начал препарат, хуже сплю, думаю из-за него"
→ medication event candidate
→ sleep symptom/context
→ user hypothesis relation
```

## 14. Current State Resolver

Current Health State is deterministic projection over temporal history.

Point-in-time API:

```text
resolveHealthState(person, at)
```

Supports historical questions and State Diff.

Conflicting current claims yield explicit conflict, not arbitrary source selection.

## 15. Context layers

LLM request is assembled from:

```text
Policy Context
Task Context
Health Context
Evidence Context
Relevant Conversation Context
Output Schema
```

External/document/evidence text clearly marked untrusted.

## 16. Context Planner

MVP uses fixed context profiles + deterministic requirements.

Possible V1: profile + bounded LLM refinement.

Progressive retrieval:

```text
S0 current fact
S1 local metric history
S2 related domains
S3 broader health history
S4 external evidence
```

Most requests stay at S0–S2.

## 17. Minimum necessary context

Question about HbA1c does not receive unrelated sleep/sexual/mental-health data.

Context permissions depend on:

- skill needs;
- user/source permission;
- safety/privacy policy;
- sensitivity compartment.

## 18. Sensitive compartments

Architecture supports separate scopes for particularly sensitive categories. Exact legal/product categorization may vary by deployment/jurisdiction.

## 19. Memory retrieval strategy

- Clinical Store → structured deterministic query;
- Personal/Preference → key/temporal query;
- Conversation → semantic retrieval where useful;
- Documents → hybrid structured/full-text/vector.

Embeddings are never primary retrieval mechanism for current medication/state.

## 20. Invalidation

Dependent summaries/inferences store refs to underlying canonical data.

When underlying fact is superseded/deleted:

```text
dependent summary/inference → stale
→ regenerate on demand
```

AI inference normally has TTL or dependency-based expiry.

## 21. Memory poisoning protection

External document/web/tool output cannot directly persist generic memory.

Only approved ingestion or candidate pipeline can create persistent objects.

## 22. UX

User-facing `Data & Memory` distinguishes:

- Health Records;
- About You (habits/preferences/goals);
- AI Context/Insights.

Persistent item can answer:

- what is it;
- source;
- effective time;
- status/freshness;
- how to correct/remove.

## 23. Context quality

Context package reports:

```text
coverage
freshness
conflicts
missing categories
source mix
```

Agent must expose relevant missingness rather than infer from absence.
