---
title: "MyPhisys Information Architecture & Object Model"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Information Architecture & Object Model

## 1. Primary mobile IA

```text
MyPhisys
├─ Today
├─ Timeline
├─ Health
├─ Records
└─ Ask

Profile / Settings
├─ Data & Connections
├─ Privacy & Permissions
├─ Memory & Personalization
├─ Units & Display
├─ AI & Sources
├─ Notifications
├─ Export
└─ Account / Delete
```

## 2. Why these five destinations

| Destination | Mental model | User question |
|---|---|---|
| Today | now / priorities | What deserves attention now? |
| Timeline | time | What happened and when? |
| Health | domain/metric | What do I know about this part of my health? |
| Records | canonical/source | What records/documents/facts exist? |
| Ask | reasoning | Help me understand across domains. |

Avoid top-level `Trends`: trend is a representation within a health domain/metric, not a stable mental-model object.

## 3. Product object model from UX perspective

### Observable objects

- Metric
- Observation / measurement
- Insight
- Health event
- Lab result
- Document
- Symptom
- Medication / regimen (V1)
- Condition (V1)
- Goal (V1)

### System objects surfaced when useful

- Personal baseline
- Reference range
- Data quality / coverage
- Source
- Calculation
- Conflict
- AI interpretation
- Evidence source

### Objects users should *not* need to understand

- canonical record IDs;
- provenance chain internals;
- FHIR resources/version;
- context manifest;
- claim graph;
- connector cursor/sync token.

## 4. Relationship model

```text
Insight
├─ refers to Metric / Record / Event
├─ derived from Calculation
├─ supported by Observations
├─ contextualized by Events
└─ optionally explained by AI

Metric
├─ Observations
├─ Personal baseline (when valid)
├─ Reference range (source-specific, optional)
├─ Target/goal (optional)
├─ Data quality
└─ Source(s)

Record
├─ canonical fact
├─ Source
└─ Original document/record
```

UX must make these relationships traversable without exposing technical implementation.

## 5. Health domain taxonomy

MVP domain index can progressively reveal only domains with data:

```text
Heart
Sleep
Activity
Metabolic
Body
Labs
```

Potential V1/V2:

```text
Medication
Symptoms
Nutrition
Respiratory
Women's health / reproductive health (sensitive compartment)
Mental wellbeing (sensitive compartment)
```

Do not expose empty category taxonomy for comprehensiveness alone.

## 6. Records IA

```text
Records
├─ Labs
│  ├─ Lab reports
│  └─ Individual results
├─ Documents
├─ Symptoms
├─ Measurements (optional shortcut, not duplicate source of truth)
├─ Medications (V1)
├─ Conditions (V1)
├─ Allergies (V1)
├─ Visits (V1)
└─ Procedures (V1)
```

Principle: **Timeline answers “when”; Records answers “what is known about X”.**

## 7. Insight IA

Insights are not a separate content silo.

Surfaces:

- Today — current priorities;
- What Changed — chronological/period summary;
- Metric Detail — metric-specific insight history;
- Review (V1) — weekly/monthly aggregation.

There should be no generic `All AI Insights` bucket in MVP.

## 7.1 Surface IA

Surface architecture is orthogonal to product object IA:

```text
Product object
  Insight / Metric / Record / Event
          │
          ├─ Full surface: Mobile/Web
          ├─ Ambient projection: Widget/Watch/Push
          └─ External representation: MCP/API/Export
```

Do not create a separate object model for widgets/watch. They are projections or entry points into the same canonical objects.

Primary surface roles:

- Phone = `now / understand / act`;
- Web = `investigate / organize`;
- Widget = `glance`;
- Push = `attention`;
- Watch = `glance / capture`;
- MCP/API = `integrate`.

See `27_SURFACE_STRATEGY`.

## 8. Search model

Search is cross-object retrieval, not Ask MyPhisys.

Search results grouped:

```text
Metrics
Records
Documents
Timeline events
AI conversations (secondary)
```

Do not merge search and AI prompt input in MVP: predictability is more important than one-box novelty.

## 9. Object naming rules

- Prefer clinical/common-language canonical terms, with user-friendly alias where necessary.
- Do not rename a lab test just to fit UI.
- Preserve units and temporal precision.
- A source-derived label can differ from user-facing canonical label, but original text remains inspectable.

## 10. Sensitive compartments

Sensitive health areas must be able to exist without automatically entering every AI context or default overview. IA implication:

- no forced surfacing on Today unless relevant and policy-approved;
- explicit context visibility in Ask MyPhisys;
- dedicated privacy controls later if a compartment is added.

## 11. IA acceptance criteria

A user should be able to decide without trial-and-error where to go for:

- “что изменилось?” → Today / What Changed;
- “когда это произошло?” → Timeline;
- “как ведёт себя мой сон?” → Health → Sleep / Metric;
- “покажи оригинал анализа” → Records;
- “почему это могло измениться?” → Ask MyPhisys;
- “откуда эта цифра?” → Source/Calculation drill-down.
