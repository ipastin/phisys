---
title: "MyPhisys Health Data Visualization Specification"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Health Data Visualization Specification

## 1. Visualization principles

1. **Comparison first.** A chart supports a specific question, not decoration.
2. **Raw vs derived are visually distinct.** Smoothing/baseline must never masquerade as observations.
3. **Missing data creates a gap.** Do not connect absent periods as continuous evidence.
4. **Reference/baseline/target are different visual objects.**
5. **Events/context are annotations, not causality arrows.**
6. **Source transitions are visible when they affect comparability.**
7. **Color is redundant with shape/label.**
8. **Default chart explains a few key things; advanced detail is progressive.**

## 2. Semantic chart layers

```text
Raw observation
Derived/aggregated series
Personal baseline
Personal range
Source reference range
Clinical target
User goal
Event marker
Source/device transition
Missing period
Selection/crosshair
```

Never reuse one visual style for two semantically different layers on same screen.

## 3. Dense/daily time series

Recommended default:

- raw points or subtle daily marks;
- derived recent summary line only if it aids reading;
- baseline band/line;
- time axis;
- event markers;
- gaps.

Avoid area-fill under every series by default: it visually amplifies magnitude and can obscure baseline bands.

## 4. Sparse lab series

Use discrete points connected only when connection communicates chronological sequence, not implied interpolation.

For 2 points:

- emphasize `previous → current`;
- show delta;
- avoid strong trend line.

For long irregular history:

- point labels/tooltips show date/value/source;
- reference range can vary by observation; if it varies, avoid misleading one global band.

## 5. Baseline visualization

### Option A — band — recommended when range exists
Communicates `usual range`, less likely to imply exact target.

### Option B — line
Use for a center baseline/median if range would overcrowd.

Label directly where feasible; do not rely solely on legend.

Copy: `Recent baseline`, `Your recent range`.

Never `Normal` unless referring to a valid clinical/source range.

## 6. Reference range

Label `Source reference range` or specific provider context. If source range is unavailable, do not substitute a generic web range into the canonical chart without explicit evidence/context.

Visually distinguish from personal baseline, e.g. pattern/border/position semantics, not just another shade.

## 7. Targets and goals

- Clinical target: source/clinician-defined, explicit label.
- User goal: user-defined, distinct.

Do not collapse into generic `Goal line` if semantics differ.

## 8. Missing data

Represent as:

- actual gap;
- faded unavailable region;
- clear `No data` tooltip/annotation.

Never interpolate in UI without a visible indication and product justification.

## 9. Source transitions

Marker example:

```text
│ Device/source changed · Oct 2
```

If transition invalidates baseline/comparison, chart should surface qualification near insight, not hide it in source details.

## 10. Event markers

Examples:

- medication change;
- symptom event;
- travel/context event if recorded;
- lab result.

Events should appear as vertical marker/icon, never arrow visually “causing” the series movement.

## 11. Range selector

Daily metrics: `7D 30D 3M 6M 1Y` where data supports.
Sparse labs: `1Y 3Y All`.

Selection must update:

- aggregation;
- comparison basis;
- labels;
- quality.

Do not change only x-axis while leaving summary text stale.

## 12. Chart interaction — mobile

Recommended hybrid:

- tap/drag within plot to activate crosshair/selection;
- selected point/period detail in anchored tooltip or fixed detail row;
- events separately tappable with sufficiently large target.

Avoid requiring precision drag as the only way to read values; accessibility and motor-control alternative is required.

## 13. Chart interaction — desktop

Hover can supplement but never be sole access. Keyboard/focus interactions should expose data points/summary where implementation permits.

## 14. Tooltip content

Minimum:

```text
Date/time
Value + unit
Source if multiple sources matter
Status if derived/corrected
```

For aggregated point: explicitly say `7-day median`/relevant summary instead of presenting as raw observation.

## 15. Axis rules

- include units near axis/header, not repeated unnecessarily;
- avoid truncating clinically meaningful decimal precision;
- use domain-appropriate baseline/zero; do not force zero for every line chart if it destroys readable variation, but prevent exaggeration through clear axis labels/range;
- keep time intervals honest.

## 16. Color rules

Do not encode health judgement by red/green based on value direction.

Recommended semantic channels:

- primary series: brand/neutral emphasis;
- baseline: subdued structural color;
- reference: separate neutral/semantic pattern;
- missing: muted/hatched;
- critical safety: reserved status color only after policy.

## 17. Accessibility

Every chart needs:

- textual summary of main point;
- non-color differentiation;
- accessible data list/table path for meaningful values;
- touch targets that meet accessibility rules;
- no essential meaning only in hover.

## 18. Chart empty/quality states

Design:

- one point;
- insufficient baseline;
- insufficient coverage;
- stale series;
- source transition;
- no data in selected range.

## 19. Chart annotation copy examples

Preferred:

- `Above your recent range for 5 days`
- `6 of 7 nights available`
- `Data source changed Oct 2`
- `Not enough data for a 30-day comparison`

Avoid:

- `Danger zone` without clinical policy;
- `Your health is getting worse`;
- `AI anomaly`.

## 20. Figma chart library

Build chart primitives with slot-like composition rather than dozens of fixed templates:

```text
Chart/Frame
Chart/Series
Chart/BaselineBand
Chart/ReferenceBand
Chart/EventMarker
Chart/SourceTransition
Chart/MissingGap
Chart/Crosshair
Chart/PointDetail
Chart/Legend
```

Create canonical examples for:

1. dense daily metric;
2. sparse lab metric;
3. source transition;
4. missing data;
5. baseline unavailable.
