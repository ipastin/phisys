---
title: "MyPhisys Responsive, Tablet & Desktop Specification"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Responsive, Tablet & Desktop Specification

## 1. Strategy


MyPhisys Web is specifically the **deep-work companion surface**. It is optimized for investigation, records, provenance, appointment prep and side-by-side AI. It is not the canonical acquisition path for Health Connect/HealthKit data.

An installable PWA can improve launch/offline/push convenience, but it remains the Web surface with the same backend data semantics.

MyPhisys is mobile-first in usage, but desktop should exploit width for **comparison, provenance and AI side-by-side reasoning**, not simply scale mobile cards.

## 2. Breakpoint philosophy

Do not couple Figma design to framework breakpoints prematurely. Design behavioral ranges:

- **Compact** — phone / narrow window;
- **Medium** — tablet / small desktop;
- **Expanded** — desktop.

Code can map these to implementation breakpoints later.

## 3. Compact behavior

- bottom navigation;
- one primary content column;
- sheets for filters/context/source;
- charts full content width;
- AI full-screen or sheet;
- details stacked below chart.

## 4. Medium behavior

Possible navigation rail.

Two-column layouts where semantic pairing exists:

- chart + summary;
- list + event detail;
- import review list + source preview.

Do not force two columns for Today if hierarchy becomes noisy.

## 5. Expanded behavior

Fixed sidebar + workspace.

Recommended patterns:

### Today
Main content constrained to readable dashboard width; optional secondary panel for tasks/coverage rather than filling viewport with more metrics.

### Timeline
List can pair with persistent event detail.

### Metric
Wide chart + right metadata/insight panel.

### Records
Category/list + detail split.

### Ask
Conversation can use center column; scoped data/object remains visible in adjacent pane.

## 6. Desktop split-view states

```text
Data only
Data + details
Data + AI
List + detail
Import list + source preview
```

Avoid 3 equal columns; priority should be visually obvious.

## 7. Responsive chart rules

### Compact
- fewer x-axis labels;
- event labels collapse to markers;
- point detail below/overlay;
- legend direct labels when possible.

### Expanded
- more axis ticks only if useful;
- event annotations can show labels;
- detail panel can persist selected point/event.

Never change data semantics by breakpoint.

## 8. Tables

Dense measurement history may become table on desktop but list on mobile.

Desktop columns priority:

```text
Date
Value
Unit
Source
Status
```

Secondary metadata expandable.

## 9. Prose width

AI/evidence prose should not stretch across 1200 px. Keep readable measure while charts/tables can use workspace width.

## 10. Sticky behavior

Potentially sticky:

- desktop sidebar;
- screen title/action bar;
- AI input;
- table headers;
- selected object context header.

Do not let sticky elements obscure keyboard focus or source details.

## 11. Responsive component rules

Components should flex rather than have `Mobile`/`Desktop` variants unless semantics/layout truly differ. Use Auto Layout and variables/modes for spacing where justified.

## 12. Figma responsive test frames

For every Tier-1 screen test at minimum:

- Compact narrow (~320);
- Compact reference (~390);
- Medium (~768–900);
- Expanded (~1280–1440).

Also test long content and large text separately.
