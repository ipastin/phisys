---
title: "MyPhisys Product Surface Strategy"
created: "10-10-26 04-03-47"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Product Surface Strategy

## 1. Design objective

MyPhisys must feel like one coherent product without forcing one interface onto every device.

Use the model:

```text
Phone    → Understand + Act
Web      → Investigate + Organize
Widget   → Glance
Push     → Notice
Watch    → Glance + Capture
Voice    → Capture modality
MCP/API  → Integrate
```

The design target is **semantic continuity, not visual/feature parity**.

---

# 2. Surface classes

## Full surfaces

### Mobile

Primary MyPhisys experience and Personal Beta reference surface.

Must support complete Tier-1 product loop:

```text
Today → What Changed → Insight → Metric/Source → Ask MyPhisys → Action
```

### Web/Desktop

Designed for density and deep work:

- wide data visualizations;
- record/document review;
- provenance;
- long history;
- appointment prep;
- split-view AI;
- exports.

Do not stretch mobile cards to desktop. Use list/detail, data/detail and data/AI split patterns.

---

## Ambient surfaces

### Widgets

#### WID-01 — Today Summary Widget

Purpose: glance at current state without opening the app.

Anatomy:

```text
MyPhisys
Today
[1–3 privacy-allowed summaries]
[Open]
```

States:

- no meaningful changes;
- changes available;
- stale;
- locked/private;
- data unavailable.

#### WID-02 — What Changed Widget

Default Balanced example:

```text
MyPhisys
2 health changes to review
[Review]
```

Detailed opt-in example:

```text
Sleep      ↓42 min
Resting HR ↑5 bpm
```

Do not display an AI-generated causal explanation inside the widget.

#### WID-03 — Quick Add Widget

Actions:

- Symptom;
- Measurement;
- Note.

Quick Add launches a trusted structured capture flow. It must not silently commit an LLM interpretation.

---

### Push notifications

#### PUSH-01 — Meaningful Change

Recommended default copy:

```text
MyPhisys noticed a change worth reviewing.
```

Detailed health content is secondary/opt-in.

#### PUSH-02 — Weekly Review Ready

```text
Your weekly health review is ready.
```

#### PUSH-03 — Sync / Connection Issue

```text
Sleep data hasn't updated recently.
Review your connection.
```

Every push has one canonical deep-link target.

---

### Quick Actions

#### QAC-01 — App Shortcut Menu

```text
Record symptom
Add measurement
Ask MyPhisys
```

No sensitive values displayed.

---

### Watch

#### WOS-01 — Glance / Tile

Private/Balanced default:

```text
MyPhisys
2 updates
```

or:

```text
No meaningful changes
```

#### WOS-02 — Quick Capture

Designed for one-handed/voice-first interaction:

```text
Record symptom
→ category / voice
→ compact structured preview
→ confirm
```

If preview cannot be understood safely on watch, hand off to phone before canonical commit.

#### WOS-03 — Review Handoff

```text
Change to review
[Open on phone]
[Later]
```

Do not design full metric investigation, Records or long chat as first watch scope.

---

### Voice

#### VOC-01 — Voice Capture Preview

Voice is designed as an input mode, usually reached from Mobile/Watch Quick Add.

Example:

```text
Heard:
"После обеда 40 минут болела голова"

Record as
Headache
Today · after lunch
Duration · ~40 min

[Save] [Edit]
```

Never present raw speech recognition as confirmed clinical state.

---

# 3. External surface UX

## MCP/API

No visual parity requirement. Documentation/authorization design should communicate:

- scopes;
- data categories;
- read/write capability;
- recipient/client;
- revocation;
- auditability.

## Secure Share / Export

Before data leaves MyPhisys show:

```text
Recipient / destination

Included
✓ ...
✓ ...

Not included
— ...

[Share]
```

## Email / messenger

Use as handoff:

```text
Your appointment brief is ready.
[Open securely]
```

Do not place rich medical content in the message by default.

---

# 4. Ambient privacy modes

## Private

Use for lock-screen-sensitive contexts by default.

```text
MyPhisys · 2 updates
```

## Balanced

```text
2 health changes to review
```

## Detailed

```text
Sleep ↓42 min
```

Detailed exposure must be explicit and domain-sensitive.

### Design requirements

Create components/variants for:

```text
Privacy=Private
Privacy=Balanced
Privacy=Detailed
```

But do not create variant explosion; privacy mode can be template/content logic when appropriate.

---

# 5. Cross-surface semantics

The following must remain identical across surfaces:

- unit;
- timestamp/date precision;
- insight ID;
- trend direction;
- data-quality meaning;
- current/stale/conflict state;
- source meaning;
- user confirmation state.

The following may adapt:

- amount of copy;
- number of visible metrics;
- chart detail;
- navigation;
- input method;
- disclosure depth.

---

# 6. Handoff patterns

## Widget → Mobile

```text
WID-02
→ INS-01
```

## Push → Mobile

```text
PUSH-01
→ INS-01 exact insight
```

## Watch → Mobile

```text
WOS-03
→ INS-01 / SYM-02
```

## Email → Web

```text
secure link
→ authenticated artifact/detail
```

The receiving screen must preserve the referenced object/time range and should not recalculate a semantically different item unless stale/invalidated.

---

# 7. Surface state matrix

| State | Mobile/Web | Widget | Push | Watch |
|---|---|---|---|---|
| Loading | skeleton | last safe state / placeholder | n/a | minimal loader |
| Empty | onboarding/action | setup/open CTA | no notification | open phone/setup |
| Stable | explicit | `No meaningful changes` | usually none | concise stable state |
| Limited | qualified detail | suppress/summary | usually none | handoff |
| Stale | source issue | `Data may be outdated` | operational if policy | stale marker |
| Conflict | Needs Review | count only | optional review notice | handoff only |
| AI unavailable | data still usable | unaffected | no AI message | unaffected |
| Urgent | safety flow | do not compress to widget insight | dedicated safety policy only | handoff/action per safety policy |

---

# 8. Surface capability matrix

| Capability | Mobile | Web | Widget | Push | Watch | External |
|---|---|---|---|---|---|---|
| Today | Primary | Secondary | Summary | – | Glance | structured |
| What Changed | Primary | Primary | Summary | Attention | Count/summary | structured |
| Insight Detail | Full | Full | deep-link | deep-link | handoff | structured |
| Metric Detail | Full | Full+ | – | – | – | structured |
| Timeline | Full | Full+ | – | – | – | API/MCP |
| Records | Full | Full+ | – | – | – | scoped |
| Ask MyPhisys | Full | Full+ | – | – | capture/handoff | MCP workflow |
| Symptom capture | Full | Secondary | shortcut | – | Primary quick | write restricted |
| Import | Camera/share | Primary file | – | completion only | – | API later |
| Appointment Prep | Secondary | Primary | – | ready notice | handoff | Primary external workflow |

---

# 9. Figma organization

Add Product Design page:

```text
15 Surface Strategy
  01 Capability Matrix
  02 Widgets
  03 Notifications
  04 Quick Actions
  05 Watch
  06 Voice Capture
  07 Cross-surface handoff
  08 Privacy modes
```

Add Design System page/sections:

```text
Remote Surfaces
Notification content patterns
Ambient privacy patterns
```

Do not publish remote-surface components before platform constraints are validated.

---

# 10. Prototype plan

## P6 — Widget → Insight

Test whether user understands:

- summary is not full diagnosis;
- tap opens exact detail;
- privacy mode is predictable.

## P7 — Watch symptom capture

Test:

- speed;
- recognition correction;
- confirmation comprehension;
- handoff threshold.

## P8 — Notification privacy

Compare Private/Balanced/Detailed copy and assess comfort on a simulated lock screen.

## P9 — Desktop investigation

Validate mobile-to-web mental continuity and data + AI split view.

---

# 11. Accessibility / platform rules

### Widget/watch

- prioritize large legible text;
- do not encode direction/status by color alone;
- tap targets follow platform constraints;
- truncation cannot remove the metric identity when shown;
- accessible labels must describe value + unit + direction, not arrow glyph alone.

### Notifications

Copy must remain understandable if app icon/image is missing. Sensitive information should not be required to understand the action.

---

# 12. Design acceptance criteria

1. Each surface has one explicit role.
2. No full feature parity is implied by the design library.
3. Every ambient health surface has privacy-safe default content.
4. Widget/Watch never present unsupported causal/diagnostic interpretation.
5. Every notification has a destination and policy reason.
6. Watch capture has an understandable confirmation path.
7. Deep links preserve object/time context.
8. Web uses width for real comparison/deep work rather than enlarged mobile cards.
9. Voice output is treated as candidate data until confirmed.
10. Surface-specific stale/offline/permission states exist.
11. Figma surface frames use synthetic data fixtures.
12. Cross-surface terminology/units/provenance semantics remain consistent.

---

# 13. Current platform references

Verified 10-10-2026:

- Jetpack Glance / Android widgets: https://developer.android.com/develop/ui/compose/glance
- Wear OS Health Services: https://developer.android.com/health-and-fitness/health-services
- Wear OS passive monitoring: https://developer.android.com/reference/androidx/health/services/client/PassiveMonitoringClient
- HealthKit reading/background queries: https://developer.apple.com/documentation/HealthKit/reading-data-from-healthkit
- PWA installability: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- PWA offline/background/push: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
