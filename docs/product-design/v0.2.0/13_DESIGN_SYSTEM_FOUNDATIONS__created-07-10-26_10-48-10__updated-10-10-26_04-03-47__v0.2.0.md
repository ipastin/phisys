---
title: "MyPhisys Design System Foundations"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Design System Foundations

## 1. System objective

Design system must support:

- calm high-trust health UI;
- mobile-first + desktop data density;
- structured data and prose in same product;
- semantic status without alarm inflation;
- charts and provenance;
- light/dark/high-contrast evolution;
- Figma → code token mapping.

The goal is **semantic stability**, not a huge component catalog.

## 2. Token layers

Recommended three-layer token architecture:

```text
Primitive tokens
→ Semantic tokens
→ Component tokens (only when needed)
```

### Primitive

Raw scales: neutral/color ramps, spacing, radii, font sizes.

### Semantic

`surface/default`, `text/primary`, `status/attention`, `chart/baseline`.

### Component

Only for components with stable special semantics, e.g. `insight-card/padding`.

Avoid hardcoding raw color names in product components.

## 3. Figma variable collections

Recommended collections:

### `Primitives / Color`
Raw palette ramps.

### `Semantic / Color`
Modes: Light, Dark, High Contrast (HC can be later but architecture ready).

### `Semantic / Number`
Spacing, sizing, radius; modes Mobile / Desktop only if real values differ.

### `Typography`
Font sizes/line heights/weights where variable support is practical; composite text styles can remain styles.

### `Content / Prototype` (optional)
String variables only for prototype scenarios/localization testing, not canonical UX-copy source of truth.

## 4. Color semantic roles

Define roles before choosing hex values:

```text
surface/canvas
surface/default
surface/subtle
surface/elevated
surface/selected

text/primary
text/secondary
text/tertiary
text/inverse
text/link

border/default
border/subtle
border/strong
border/focus

accent/primary
accent/secondary (optional)

status/info
status/attention
status/critical
status/success

health/change
health/stable
health/data-gap
health/conflict

chart/series-primary
chart/series-secondary
chart/baseline
chart/reference
chart/target
chart/missing
chart/event
```

### Critical rule
`status/critical` is not a general-purpose brand accent.

## 5. Color strategy alternatives

### A — Mostly neutral + one brand accent — recommended
Best for keeping health semantics clear.

### B — Multiple domain colors
Helpful for domain scan but can turn into fitness-dashboard rainbow and create false semantics.

### C — Monochrome + semantic status only
Very calm, but weaker navigation/recognition.

Recommendation: **A**, with domain color used sparingly in charts/navigation if research supports it.

## 6. Typography

### Functional roles

- Display / rare marketing only;
- Screen title;
- Section title;
- Body;
- Supporting body;
- Label;
- Metric Large;
- Metric Medium;
- Data/table;
- Caption/source.

### Metric typography

Value and unit must form one semantic cluster. Unit is lower emphasis but not so faint that value becomes ambiguous.

Recommended numeric behavior:

- tabular numerals for tables/time-series comparisons if typeface supports;
- preserve decimal precision from display rules;
- avoid monospaced font for all data unless it improves a specific dense table.

## 7. Type scale starting point

Use as Figma prototype baseline, adjust to chosen typeface/platform:

```text
12 Caption
13–14 Label
15–16 Body
18 Section
22 Screen title
28–32 Metric M
40–48 Metric L
```

Do not lock line heights before typeface test. Accessibility text scaling must be tested early.

## 8. Spacing system

Recommended base grid: **4 px**, with dominant layout rhythm on 8 px.

Common tokens:

```text
space/0  = 0
space/1  = 4
space/2  = 8
space/3  = 12
space/4  = 16
space/5  = 20
space/6  = 24
space/8  = 32
space/10 = 40
space/12 = 48
space/16 = 64
```

Use optical adjustment where data/typography demands; do not force every internal gap onto 8.

## 9. Layout/grid

### Mobile

- design reference width: 360/390-class, test 320 and large Android;
- horizontal page padding: start 16–20 px exploration;
- no fixed card widths;
- edge-to-edge charts allowed if interaction benefits, but labels/actions respect safe content margin.

### Desktop

Use flexible grid rather than fixed 12-column dogma; main constraints are content measure and data visualization width.

## 10. Radius

Choose restrained scale, e.g.:

```text
radius/s  6
radius/m  10
radius/l  14
radius/xl 20
radius/pill 999
```

Do not make every container a floating rounded card. Use grouping by spacing/dividers where possible.

## 11. Elevation

Keep minimal. Most hierarchy via surface/border/spacing.

Use elevation for:

- floating sheet/menu;
- sticky overlay;
- desktop side pane separation where needed.

Avoid card shadow as default container style.

## 12. Iconography

Principles:

- simple outline/filled system consistent with platform;
- icon + text for consequential health actions;
- do not encode states only by icons;
- avoid decorative medical iconography.

## 13. Motion

Motion communicates:

- navigation continuity;
- expand/collapse;
- data-range transitions;
- save/import completion.

Avoid:

- pulsing health risk;
- animated ECG decoration;
- AI sparkles;
- long staged “thinking” theater.

Respect reduced-motion settings.

## 14. Density modes

Do not create arbitrary compact/comfortable mode in MVP unless web data tables require it. Mobile should have one accessible density.

## 15. Design token naming

Recommended syntax:

```text
color/surface/default
color/text/primary
color/status/critical
space/4
radius/m
size/control/min-touch
```

Avoid names tied to current appearance:

```text
blue500Button
lightGrayBackground
redAlert
```

## 16. Design-system acceptance criteria

- light theme complete;
- dark theme semantics can map without component redesign even if dark UI comes later;
- status meaning survives grayscale/high-contrast;
- no raw palette variables in product frames unless prototyping foundation itself;
- component properties use semantic labels;
- token names can map predictably to code.
