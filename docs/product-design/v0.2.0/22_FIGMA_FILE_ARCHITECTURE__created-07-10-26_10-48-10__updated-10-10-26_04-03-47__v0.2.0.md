---
title: "MyPhisys Figma File & Library Architecture"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Figma File & Library Architecture

## 1. Recommended file strategy

Do not keep discovery, wireframes, system components and production screens on one endless page.

### File A — `MyPhisys — Product Design`
Contains IA, flows, wireframes, hi-fi screens and prototypes.

### File B — `MyPhisys — Design System`
Foundations, components, patterns, data viz.

### Optional File C — `MyPhisys — Research & Validation`
Interview/test assets, findings, experiment snapshots if volume grows.

For solo work, A+B is sufficient; separate Research later.

## 2. Product Design file pages

Recommended:

```text
00 Cover & Index
01 Decisions / UX Notes
02 IA & Screen Map
03 User Flows
04 Wireframes — MVP
05 Wireframes — V1
06 UI — Onboarding
07 UI — Today & Insights
08 UI — Metrics & Health
09 UI — Timeline & Records
10 UI — Import
11 UI — Ask MyPhisys
12 UI — Connections & Settings
13 States & Edge Cases
14 Responsive / Desktop
15 Surface Strategy — Widgets / Push / Watch / Voice
16 Prototypes
99 Archive
```

## 3. Design System file pages

```text
00 Cover & Changelog
01 Foundations
02 Tokens / Variables
03 Primitives
04 Navigation
05 Health Data
06 Insights
07 Records & Import
08 AI Patterns
09 Charts
10 Feedback & States
11 Remote Surfaces / Templates
12 Documentation
99 Deprecated
```

## 4. Frame naming

Product screen:

```text
TOD-01 / Today / Default / Mobile
TOD-01 / Today / No changes / Mobile
MET-01 / Resting HR / Default / Mobile
```

Avoid names like `Frame 483`, `Final v2`, `New final`.

## 5. Section naming

Use numbered sections inside pages:

```text
01 Happy path
02 Limited data
03 Permission states
04 Error/degraded
```

## 6. Component naming

```text
Primitive/Button
Primitive/TextField
Navigation/BottomNav
Health/MetricValue
Health/DataQuality
Insight/Card
Records/LabResultRow
AI/ContextHeader
Chart/EventMarker
```

## 7. Variables

Use Figma Variables as token source of truth for reusable raw/semantic values.

Recommended collections:

```text
Primitives / Color
Semantic / Color
Semantic / Number
Content / Prototype (optional)
```

### Modes

Start only with modes you actually need:

- Light;
- Dark if actively designed;
- High Contrast later;
- Mobile/Desktop number mode only if spacing truly changes globally.

Do not create modes as a substitute for component variants.

## 8. Styles vs variables

Use variables for raw/semantic token values and modes. Use styles for useful composites such as text styles/effects where they remain clearer.

## 9. Component properties

Use:

- text property for labels;
- boolean for optional slots;
- instance swap for icons/source marks;
- variants for semantic state/size.

Avoid variant Cartesian explosion.

## 10. Auto Layout rules

All production components/screens should use Auto Layout except intentionally free-positioned visualization plot internals.

Requirements:

- content-driven height;
- long text wrapping;
- removable optional sections without broken gaps;
- correct min/max behavior;
- no manual pixel spacer rectangles.

## 11. Component status

Add documentation status:

```text
Draft
Candidate
Ready
Deprecated
```

Do not publish half-stable semantic components by default.

## 12. Documentation adjacent to component

Each semantic component section includes:

- purpose;
- anatomy;
- properties;
- usage;
- do/don't;
- accessibility;
- examples;
- related screen specs.

## 13. Annotation convention

Use consistent annotation styles/tags:

```text
[UX] behavior
[DATA] field/source semantics
[A11Y] accessibility
[DEV] implementation/handoff
[SAFETY] policy constraint
[OPEN] unresolved decision
```

Keep annotation layer separate from production frames so it can be toggled/hidden.

## 14. Wireframe convention

Wireframes use real-ish health semantics, not lorem ipsum. Use synthetic data fixtures so hierarchy problems are visible.

Color limited to neutral + annotation; avoid brand polish.

## 15. Prototype variables

Figma variables can model simple prototype state (selected range, onboarding progress), but do not reconstruct backend/analytics logic in prototype unless it directly tests interaction comprehension.

## 16. Source data fixtures

Create reusable content fixtures:

- Stable Person;
- Sleep Shift;
- Source Transition;
- Sparse Labs;
- Missing Data;
- Permission Revoked;
- AI Degraded.

Use consistent fixtures across screens so flow continuity is believable.

## 17. Branching/version habit

As solo designer, avoid branch bureaucracy. Use milestones/sections and changelog. Archive significant rejected directions with rationale, not every iteration.

## 17.1 Surface design sections

On `15 Surface Strategy`, organize:

```text
01 Capability Matrix
02 Widgets
03 Push Notifications
04 Quick Actions
05 Wear OS
06 Voice Capture
07 Cross-surface Handoffs
08 Privacy Modes
09 Platform constraints
```

Use the same synthetic person/scenario fixtures as mobile so semantic continuity can be reviewed across surfaces.

## 18. Figma handoff cleanliness

Before Dev-ready:

- no detached production components unless justified;
- all semantic colors from variables;
- frame names match screen IDs;
- prototype links don't cross into obsolete archive accidentally;
- states referenced by spec exist;
- annotations current;
- hidden stale layers removed.
