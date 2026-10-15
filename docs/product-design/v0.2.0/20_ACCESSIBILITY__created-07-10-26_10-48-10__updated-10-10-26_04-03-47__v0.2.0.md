---
title: "MyPhisys Accessibility Specification"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Accessibility Specification

## 1. Target

Target **WCAG 2.2 AA** for web surfaces and apply equivalent inclusive-design constraints to mobile. Platform-native accessibility conventions take precedence where stricter/more appropriate.

## 2. Touch/target sizing

WCAG 2.2 AA minimum pointer target is 24×24 CSS px under defined conditions; MyPhisys should use a **larger product target** for primary mobile controls, generally ~44–48 logical px, because health actions need low-error interaction.

Small inline source links may rely on spacing/equivalent target rules but should not become the only route to consequential information.

## 3. Text scaling

Test at:

- default;
- ~130–150%;
- platform large accessibility sizes.

Rules:

- no fixed-height health cards containing text;
- metric value/unit may reflow;
- bottom nav labels remain usable;
- charts retain textual summary outside plot;
- destructive confirmation remains fully visible/scrollable.

## 4. Contrast

Meet WCAG AA text/non-text requirements; test semantic states independently.

Do not use muted tertiary text below contrast just because it is metadata; source/date may be essential.

## 5. Color independence

Meaning must not depend on color alone.

Examples:

- change direction: arrow + text/value;
- data gap: label/pattern;
- conflict: icon + `Records don't agree`;
- chart layers: line style/label/marker differences.

## 6. Focus/keyboard — web

- visible focus indicator;
- no focused control hidden behind sticky panes/modals;
- logical focus order follows reading order;
- modal traps focus and returns to launcher;
- chart has accessible alternate data path;
- no drag-only function.

## 7. Screen reader semantics

Metric value should announce as meaningful phrase, e.g. `Resting heart rate, 69 beats per minute, 6 above recent baseline`, not fragmented visual spans.

InsightCard accessible name includes change basis, not every metadata field.

## 8. Charts

Every chart requires:

1. concise textual summary;
2. accessible list/table or point navigation for critical values;
3. labels for baseline/reference semantics;
4. no hover-only information;
5. event annotations accessible separately.

## 9. Motion

Respect reduced-motion preference.

Avoid:

- pulsing alerts;
- animated heartbeat decoration;
- motion that implies physiological monitoring when none exists.

Transitions should not be required to understand state change.

## 10. Cognitive accessibility

Health products carry cognitive/emotional load. Design for:

- one primary action per consequential state;
- explicit comparison labels;
- no unexplained abbreviations;
- progressive metadata;
- consistent location of Source/Context actions;
- clear destructive consequences.

## 11. Forms

- visible labels, not placeholder-only;
- units associated with input;
- error identifies field + repair;
- do not clear user-entered health data after validation error;
- date/time controls respect locale;
- redundant entry avoided when system already knows value.

## 12. Accessible authentication

Avoid unnecessary cognitive tests/puzzles. Support password-manager/passkey-friendly patterns where implementation allows.

## 13. Status announcements

Screen readers should receive meaningful announcements for:

- symptom saved;
- import completed;
- processing failed;
- permission/sync status change.

Do not repeatedly announce background sensor sync events.

## 14. Accessibility QA in Figma

Before handoff, each key flow must have an accessibility annotation layer covering:

- focus order;
- accessible names;
- reading order;
- non-color semantics;
- minimum target size;
- large-text layout;
- reduced-motion notes.

## 15. Test matrix

At minimum test:

- Android TalkBack;
- keyboard-only desktop web;
- 200% web zoom;
- large mobile font scaling;
- grayscale/color-vision simulation as supplemental tool;
- reduced motion;
- narrow screen.
