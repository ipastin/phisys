---
title: "MyPhisys Prototyping & UX Validation Plan"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Prototyping & UX Validation Plan

## 1. Validation priorities

Do not spend early tests on visual preference. Highest-risk assumptions are semantic:

1. users understand `personal baseline` vs clinical/reference range;
2. What Changed feels useful rather than alarming;
3. Today hierarchy makes signal discoverable;
4. users understand source/provenance;
5. scoped AI feels trustworthy;
6. `Disconnect` vs `Delete` is clear;
7. structured write preview feels controlled, not tedious.

## 2. Prototype P1 — Core Value

Flow:

```text
TOD-01 → INS-01 → MET-01 → AI-02 → AI-05
```

### Tasks

- Tell me what changed this week.
- Explain what the resting HR card means.
- Is the value “abnormal” or just different from your usual pattern?
- Find where the data came from.
- Ask why it may have changed.

### Observe

- whether user mistakes recent baseline for medical normal;
- whether contextual event is mistaken for cause;
- whether Source action is discoverable;
- whether AI answer hierarchy is read correctly.

## 3. Prototype P2 — Clinical Import Trust

Flow:

```text
IMP-01 → IMP-02 → IMP-03 → IMP-04 → LAB-02 → DOC-03
```

Tasks:

- import report;
- resolve ambiguous glucose value;
- find original source for HbA1c;
- explain result.

Critical metric: user knows which values were confidently extracted vs manually reviewed.

## 4. Prototype P3 — Conversational Write

Flow:

```text
AI-03 → SYM-02 → SYM-03 → TIM-04
```

Tasks:

- tell MyPhisys about a headache;
- notice missing severity;
- edit time;
- save;
- find it later.

Validate that preview is perceived as confirmation, not a second tedious form.

## 5. Prototype P4 — Permission Recovery

Flow:

```text
CON-03 → simulated platform deny → CON-04/05 → CON-02
```

Tasks:

- understand what access is missing;
- continue without it;
- later restore permission;
- pause sync without deleting data.

## 6. Prototype P5 — No-change / Data-gap

Test the non-sensational states:

- no meaningful change;
- insufficient data;
- stale source.

Ask participants to explain difference in their own words.

## 7. Research questions

### Mental model
- What do users think MyPhisys “knows” vs “infers”? 
- Do they assume AI continuously monitors danger?
- What does `baseline` mean to them?

### Trust
- What source detail is enough on default surface?
- Does `AI interpretation` label increase clarity or unnecessary doubt?

### Density
- How many Today insights feel actionable before overload?
- Do Stable/Data gaps help or clutter?

### AI
- Do users prefer scoped Ask from object vs global chat?
- Is Context Inspector understandable/useful?

## 8. Success criteria

Set comprehension gates, not preference scores:

- ≥80–90% can distinguish baseline vs reference range in moderated test before hi-fi freeze;
- critical source/provenance task success ≥90%;
- destructive semantics (`Disconnect` vs `Delete`) near 100% comprehension;
- no participant interprets association language as definite causation in P1 after final copy/layout;
- structured write participants notice preview before save.

Exact targets can be adjusted with sample size; critical semantics should aim near-zero misunderstanding.

## 9. Test data

Use synthetic but coherent longitudinal profile. Never require participants to expose personal health data for basic usability testing.

## 10. Iteration protocol

For each test round:

```text
Hypothesis
→ Prototype version
→ Findings
→ Severity
→ Design decision
→ Spec update
```

Update the relevant Markdown spec when a design decision changes; Figma alone is not source of truth for rationale.

## 11. Finding severity

- **S0 Critical:** could lead to dangerous/misleading health interpretation or destructive-data mistake;
- **S1 High:** core job failure/source distrust;
- **S2 Medium:** efficiency/comprehension friction;
- **S3 Low:** polish/preference.

Fix S0/S1 before advancing fidelity.
