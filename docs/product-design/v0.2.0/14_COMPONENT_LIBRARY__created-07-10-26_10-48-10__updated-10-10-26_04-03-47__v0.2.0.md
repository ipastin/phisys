---
title: "MyPhisys Component & Pattern Library Specification"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Component & Pattern Library

## 1. Component strategy

Build **primitives → semantic components → product patterns**. Do not create a unique card component for every screen.

## 2. Foundation primitives

### Actions

- Button / Primary
- Button / Secondary
- Button / Tertiary
- Button / Destructive
- Icon Button
- Text Link

Properties:

```text
size: S/M/L where truly needed
state: default/pressed/focus/disabled/loading
leadingIcon / trailingIcon
label
```

### Inputs

- Text Field
- Text Area
- Search Field
- Numeric/Measurement Field
- Date/Time Field
- Select/Menu Trigger
- Checkbox
- Radio
- Switch
- Segmented Control

Health numeric field must support unit as semantic accessory, validation and source precision.

### Navigation

- Bottom Nav
- Navigation Rail / Sidebar Item
- Top App Bar
- Breadcrumb (web)
- Tabs
- Back affordance

### Feedback

- Inline Message
- Banner
- Snackbar
- Progress
- Skeleton
- Empty State
- Error State

Do not create generic `Alert` with red styling for all feedback.

## 3. Health semantic components

### MetricValue
Properties:

```text
value
unit
size: L/M/S
precision
status optional
```

### MetricDelta
Properties:

```text
direction: up/down/stable/unknown
absolute value
relative value optional
comparison label
```

Direction icon/color must not imply good/bad globally.

### DataQuality
Variants:

```text
sufficient
limited
insufficient
stale
partial
```

### SourceLabel
Compact attribution with source name/icon/date where applicable.

### EpistemicBadge

```text
Medical record
User reported
Calculated
AI interpretation
```

Use selectively.

### ReferenceRangeLabel
Explicitly says `Source reference range`; separate from PersonalBaseline.

### PersonalBaselineLabel
`Recent baseline` / `Your recent range`; never `normal range`.

## 4. Insight components

### InsightCard

Properties:

```text
type: metric-change/new/data-gap/conflict
headline
metricValue optional
delta optional
comparisonBasis
supportingStatus optional
action
```

Variants should not be multiplied by metric domain.

### InsightSummaryRow
Compact for What Changed list.

### StableSummary
Aggregated stable domains/metrics.

### DataGapCard
Missing/limited state with cause/next action.

## 5. Timeline components

- TimelineDayHeader
- TimelineEventRow
- TimelineEventGroup
- TimelineMarker
- EventTypeIcon

Event row must flex for date precision and longer canonical labels.

## 6. Record components

- RecordCategoryRow
- LabResultRow
- DocumentRow
- SymptomRow
- NeedsReviewRow
- RecordSourceBlock
- SourceLocatorLink

## 7. Import components

- UploadDropzone / mobile picker row
- ImportProgressRow
- ExtractionResultRow
- ReviewIssueRow
- OriginalSourceCrop
- ImportSummary

ExtractionResultRow variants:

```text
ready
needs-review
skipped
imported
```

## 8. AI components

- AskInput
- ScopedContextHeader
- UserMessage
- MyPhisysAnswer
- AnswerSection
- PersonalEvidenceBlock
- MedicalEvidenceBlock
- SourceChip/Link
- ContextSummary
- StructuredWritePreview
- SafetyBoundaryMessage

Avoid making every AI answer a visually heavy card stack; use typography/section rhythm.

## 9. Connection/settings components

- ConnectorRow
- ConnectorStatus
- PermissionCategoryRow
- CoverageRow
- SettingsRow
- DestructiveActionRow

## 10. Chart components

See `15_DATA_VISUALIZATION` for semantics. Component families:

- TimeSeriesChart
- SparseSeriesChart
- RangeBand
- EventMarker
- SourceTransitionMarker
- ChartTooltip/PointDetail
- Legend
- MissingDataGap

## 11. Product patterns vs components

Patterns are compositions documented separately:

- Insight anatomy;
- Source/provenance drill-down;
- Natural-language write confirmation;
- Permission rationale;
- Share scope preview;
- Conflict resolution;
- AI context inspector;
- Empty/limited data state.

Do not force complex patterns into one giant component with 30 variants.

## 12. Component property rules in Figma

Use component properties for actual variability:

- boolean: icon/source/supporting text presence;
- text: labels/content;
- instance swap: icon/source mark;
- variant: semantic state/size only.

Avoid variant explosion such as:

```text
InsightCard/Sleep/Up/Limited/Dark/Mobile/WithSource...
```

Theme and responsive differences should come from variables/layout, not Cartesian variants.

## 12.1 Remote / ambient surface patterns

Treat these as templates/patterns first; platform remote UI frameworks have different constraints from in-app components.

```text
Remote/WidgetSummary
Remote/ChangeSummary
Remote/QuickAdd
Remote/PrivacyState
Remote/WatchGlance
Remote/HandoffAction
Notification/Operational
Notification/ReviewReady
Notification/MeaningfulChange
```

Do not assume in-app component instances can be reused technically on Jetpack Glance/WidgetKit/Wear surfaces. Preserve semantic tokens/content rules even when implementation components differ.

## 13. Naming convention

```text
Primitive/Button
Primitive/Input
Navigation/BottomNav
Health/MetricValue
Health/DataQuality
Insight/Card
Records/LabResultRow
AI/ContextHeader
Chart/EventMarker
```

## 14. Component documentation requirements

Every published semantic component should document:

- purpose;
- when to use/not use;
- anatomy;
- properties;
- states;
- content rules;
- accessibility notes;
- edge cases;
- examples.

## 15. Priority for Figma library build

### Tier 1 — build before core screens
Buttons, inputs, app bars/nav, text, status/inline message, MetricValue, MetricDelta, SourceLabel.

### Tier 2 — build while screens emerge
InsightCard, TimelineEvent, LabResultRow, ConnectorRow, DataQuality, chart primitives.

### Tier 3 — after patterns stabilize
AI answer structures, import review components, source/calculation details, conflict components.

Do not overbuild library before first 5–8 screens establish real needs.
