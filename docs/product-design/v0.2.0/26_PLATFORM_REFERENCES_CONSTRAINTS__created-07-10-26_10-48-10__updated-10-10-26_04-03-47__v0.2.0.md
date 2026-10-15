---
title: "MyPhisys Platform References & External Design Constraints"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "reference"
commit: "docs(design): add cross-surface delivery strategy"
---

# Platform References & External Design Constraints

This document records external constraints that materially affect product design. Product UX is not copied from these platforms; these are interoperability/accessibility boundaries.

## 1. Android Health Connect UI guidance

Current Android guidance emphasizes three UX principles for Health Connect integration:

- consistency;
- transparency;
- clarity.

Design implications:

- explain integration benefit and how it works;
- provide in-app path to manage Health Connect access;
- model insufficient-access state explicitly;
- keep permission/sync behavior consistent across entry points.

Official source: Android Developers — `Health Connect UI guidelines` and `Permissions and data access`.

## 2. Health Connect attribution

Android guidance expects source attribution so users can understand where health data originated. Basic source app name/icon is appropriate on common surfaces, with more detailed education where useful.

Design implication: `SourceLabel` is a first-class semantic component, not optional developer metadata.

Official source: Android Developers — `Data display and attribution`.

## 3. Apple privacy/HealthKit principles

Apple HIG emphasizes:

- request only data actually needed;
- make permission purpose clear;
- provide specific control;
- protect sensitive health information;
- process on device where appropriate/possible.

Even before iOS HealthKit implementation, these principles reinforce MyPhisys progressive-permission design.

Official source: Apple Human Interface Guidelines — `Privacy`, `HealthKit`.

## 4. Apple chart guidance

Apple chart guidance frames charts as tools to highlight a few key pieces of information for decisions rather than decorative displays.

Design implication: chart complexity should be question-driven; textual summaries and clear anatomy are essential.

Official source: Apple Human Interface Guidelines — `Charts`.

## 5. Figma Variables & Modes

Current Figma supports variables for reusable color/number/string/boolean values and modes for contextual values such as light/dark, responsive sizes and localization prototypes. Figma also supports DTCG token import for variable collections.

Design implication:

- use Variables as token layer;
- modes for real contexts, not variant replacement;
- document decisions adjacent to components and in written guides.

Official sources: Figma Learn — `Guide to variables`, `Modes for variables`, `Build design systems`.

## 6. Accessibility target

WCAG 2.2 is the preferred conformance target for web. Relevant newer criteria include:

- focus not obscured;
- accessible authentication;
- alternatives to dragging;
- target-size minimum.

MyPhisys product target is WCAG 2.2 AA for web, with stronger ~44–48 logical-pixel product target sizing for primary mobile controls where practical.

Official source: W3C WAI — `WCAG 2.2`.

## 7. Design constraint hierarchy

When external platform guidance conflicts with a local aesthetic choice:

```text
Safety/accessibility/platform requirement
> product semantics
> design system consistency
> local visual preference
```

## 7.1 Cross-surface platform references — verified 10-10-2026

### Android widgets / Glance

- https://developer.android.com/develop/ui/compose/glance
- https://developer.android.com/jetpack/androidx/releases/glance

Glance provides Kotlin/Compose-style APIs for app widgets/remote surfaces. Do not assume ordinary in-app Compose/React Native component reuse.

### Wear OS Health Services

- https://developer.android.com/health-and-fitness/health-services
- https://developer.android.com/reference/androidx/health/services/client/PassiveMonitoringClient

Wear capabilities vary by device; design must support capability detection/unavailable states.

### Apple HealthKit

- https://developer.apple.com/documentation/HealthKit/reading-data-from-healthkit

HealthKit supports snapshot and long-running query patterns, including background delivery for observer queries. iOS data acquisition remains native.

### PWA

- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

PWA can improve installability/offline/background/push behavior on supporting browsers; it does not replace native health-store integration.

## 8. Verification cadence

Re-check external guidance before:

- Health Connect production release;
- HealthKit/iOS work;
- app-store submission;
- accessibility certification/audit;
- major Figma library/token migration.

Platform docs evolve; this v0.1.0 reference captures design-relevant guidance as of 07-10-26.
