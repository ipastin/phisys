---
title: "MyPhisys Product Design Roadmap"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Product Design Roadmap

## 1. Recommended sequence

Do not design all 60+ frames hi-fi in screen-map order. Use risk-driven vertical slices.

---

# Phase D0 — Figma setup

Deliverables:

- Product Design file;
- Design System file;
- page/section naming;
- initial variable collections;
- neutral wireframe foundation;
- synthetic health content fixtures.

Exit criteria: no visual-brand commitment required.

---

# Phase D1 — Core-value wireframe slice

Design:

```text
TOD-01
WCH-01
INS-01
MET-01
AI-02
AI-04
AI-05
```

Also design:

```text
TOD-02 no change
TOD-03 warm-up
INS-03 data gap
```

Why first: validates core MyPhisys value and most important semantic distinctions.

Research: Prototype P1 + P5.

---

# Phase D2 — Health data foundations/components

Build candidate components driven by D1:

- navigation;
- typography/tokens;
- MetricValue/Delta;
- Insight Card;
- DataQuality;
- source/provenance;
- chart primitives.

Do not publish entire library yet; stabilize through D1 screens.

---

# Phase D3 — Clinical trust slice

Design:

```text
REC-01
LAB-01
LAB-02
LAB-03
DOC-01
DOC-02/03
IMP-01..06
```

Research: Prototype P2.

Critical output: provenance interaction pattern.

---

# Phase D4 — Timeline + manual recording

Design:

```text
TIM-01..05
REC-02..03
SYM-01..06
```

Research: Prototype P3.

Critical output: structured write preview and event semantics.

---

# Phase D5 — Permissions/connections

Design:

```text
ONB-01..07
CON-01..09
SET-01..04
```

Research: Prototype P4.

Do this before final onboarding polish because permission recovery states affect onboarding architecture.

---

# Phase D6 — AI system hi-fi

Refine:

```text
AI-01..09
```

with established components/content/trust patterns.

Do not visually brand AI as separate product.

---

# Phase D7 — Web deep-work adaptation

Design the desktop/web variants of Tier-1 data/records/investigation flows:

```text
TOD-01 / Web
INS-01 / Web
MET-01..04 / Web
TIM-01 / Web
REC/LAB/DOC core / Web
AI-02 / Web split view
```

Validate P9 desktop investigation. Do not stretch mobile cards; use split/list-detail patterns.

---

# Phase D8 — Accessibility/responsive pass

For Tier-1 screens:

- 320/narrow;
- 390/reference;
- tablet;
- desktop;
- large text;
- dark/high-contrast planning as appropriate.

Resolve system issues before visual-final status.

---

# Phase D9 — Design system publish candidate

Publish only stabilized components.

Create component docs, status, do/don't, A11Y notes.

---

# Phase D10 — Handoff MVP

Order implementation handoff in same vertical slices as engineering:

1. Today/analytics;
2. Health Connect/connection states;
3. Records/import;
4. AI;
5. symptom writes;
6. hardening.

---

# Phase D11 — Ambient surfaces after core validation

Design only after core mobile semantics are stable:

```text
WID-01..03
PUSH-01..03
QAC-01
VOC-01 where useful
```

Validate P6/P8 before publishing remote-surface patterns.

---

# Phase D12 — Watch / iOS surface exploration

After mobile/web/ambient Android evidence:

```text
WOS-01..03
iOS variants of core screens
WidgetKit equivalents
```

Do not create watch feature parity.

---

# Phase D13 — V1 feature exploration only after MVP validation

Priorities:

```text
Appointment Prep
Medication + Conditions
Weekly Review
Medical Records/FHIR
Correlation UX
HealthKit/iOS as product rollout requires
MCP/API UX/docs
```

Do not hi-fi all V1 before Personal Beta findings.

## 2. Design status model

For each screen:

```text
Mapped
Wireframed
Validated
UI Candidate
Ready for Dev
Implemented
QA Passed
```

Avoid generic `Done`.

## 3. Decision log

Maintain a compact UX decision table:

```text
ID
Decision
Why
Alternatives rejected
Date
Affected screens/specs
```

Promote architecture-level decisions to main project ADR.

## 4. First concrete Figma task

Start with one board containing:

1. IA overview;
2. P1 flow;
3. synthetic data scenario;
4. grayscale wireframes for `TOD-01 → INS-01 → MET-01 → AI-02`;
5. three alternate Today information hierarchies;
6. comparison of trade-offs;
7. select direction only after task-based critique.

This is more valuable than starting from color/logo/layout polish.
