---
title: "MyPhisys Design Handoff & QA Specification"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Design Handoff & QA

## 1. Handoff philosophy

Handoff must specify **semantics and behavior**, not only pixel measurements. Health-data mistakes frequently come from misunderstood states/comparisons, not visual spacing.

## 2. Dev-ready screen annotation

Each significant frame documents:

- Screen ID/state;
- data objects/fields;
- comparison basis;
- source/quality rules;
- interactions/navigation;
- loading/empty/error/degraded behavior;
- responsive behavior;
- accessibility notes;
- analytics events only if needed for product measurement;
- open dependencies.

## 3. Component handoff

Published component includes:

- canonical name;
- property names/values;
- required vs optional slots;
- content constraints;
- state mapping;
- accessibility role/label notes;
- token mapping.

## 4. Data-contract annotation examples

### Insight Card

```text
metric.label
metric.currentSummary
change.absolute/relative
a comparison label derived from baseline/period
quality.status
```

Do not annotate UI with backend table column names unless that is the actual stable API contract.

### Lab result

```text
concept.display
value + unit
effective date precision
source reference range
source/provider
document locator
```

## 5. Design QA layers

### Semantic QA
Correct labels/status/source/baseline semantics.

### Interaction QA
Navigation, confirmation, permission recovery, focus/back behavior.

### Visual QA
Spacing/type/color/component match.

### Accessibility QA
Focus, labels, contrast, large text, chart alternative.

### Data QA
Missing/stale/conflict/source-transition fixtures render correctly.

## 6. Required fixture QA

Every release candidate should be checked against:

- stable profile;
- no data;
- baseline warm-up;
- limited coverage;
- stale connector;
- source transition;
- sparse lab data;
- ambiguous import;
- AI unavailable;
- evidence unavailable;
- permission revoked;
- long localized text;
- large accessibility text.

## 7. Screenshot/visual regression targets

Prioritize:

- Today states;
- Insight Card variants;
- Metric chart states;
- Lab result/import review;
- AI answer/source blocks;
- permission/destructive confirmation.

## 8. Interaction acceptance examples

### Today
Tapping card opens exact insight; `See all changes` preserves period.

### Metric range
Changing range updates summary/comparison semantics, not chart alone.

### Source
Source from lab result opens original page/locator where available.

### Symptom save
No canonical record exists until confirmation returns success.

### Disconnect
Does not invoke delete-imported-data path.

## 9. Copy QA

- no `normal` for personal baseline;
- no causal wording for temporal association;
- no invented precision;
- no `AI confidence %`;
- destructive buttons use action verbs;
- errors say what remains available.

## 9.1 Cross-surface QA

For any Widget/Push/Watch/Voice/Web adaptation verify:

- canonical object ID/time range matches full surface;
- privacy mode is explicit;
- no sensitive values leak in default ambient mode;
- deep link resolves correctly;
- stale/offline behavior is specified;
- units/date precision remain identical;
- no unsupported causal/clinical copy is introduced to shorten content;
- platform implementation constraints are annotated;
- feature parity has not been assumed without a user job.

## 10. Dev Mode readiness checklist

A screen/page is `Ready for development` only when:

- component/tokens finalized enough for build;
- required states present;
- UX annotations current;
- open S0/S1 decisions resolved;
- responsive rule defined;
- accessibility note defined;
- no placeholder health copy/data that changes semantics.

## 11. Post-build design QA loop

```text
Implementation build
→ semantic pass
→ interaction pass
→ visual pass
→ accessibility pass
→ fix / recheck
```

Semantic pass precedes pixel polishing.

## 12. Change management

If implementation reveals a product-semantic change, update:

1. spec Markdown;
2. Figma annotation;
3. component/pattern docs;
4. product/architecture ADR if boundary-level.

Do not let production code silently become the only source of truth.
