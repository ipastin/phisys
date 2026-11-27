---
title: "Phisys Surface & Delivery Strategy"
created: "10-10-26 04-03-47"
updated: "27-11-26 17-10-14"
timezone: Europe/Moscow
version: "0.5.0"
status: "accepted"
commit: "docs(stack): record native and web client decisions"
---

# Phisys — Surface & Delivery Strategy

## 0. Decision

Phisys использует **hub-and-spoke surface architecture**, а не один универсальный интерфейс и не feature parity между платформами.

```text
                          Phisys Core
                               │
          ┌────────────────────┼─────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
      FULL SURFACES       AMBIENT SURFACES      EXTERNAL SURFACES
          │                    │                     │
      Mobile App            Widgets                 MCP
      Web App               Watch                   API
                            Push                    FHIR / Export
                            Quick Actions           Secure Share
                            Voice input
```

Product principle:

> **Right health capability on the right surface.**

The goal is not to make every feature available everywhere. Each surface has a constrained interaction role.

---

# 1. Surface taxonomy

## 1.1 Full surfaces — understand / investigate / organize

### Mobile App — primary product hub

Primary jobs:

- Today / What Changed;
- Explore Insight;
- Metric Detail;
- Timeline;
- Records;
- Ask Phisys;
- quick/manual recording;
- Health Connect permissions and sync;
- PDF/photo import;
- privacy/data controls.

Mobile is simultaneously:

```text
Primary experience
+
Health-data acquisition hub
+
Trusted action surface
```

For Personal Beta, the primary full surface is the native Android app on Kotlin and Jetpack Compose. Its Health Connect adapter acquires source data through the platform permission flow. An authenticated connection to the backend governs delivery and access to the resulting Phisys data.

### Web/Desktop — deep-work companion

Primary jobs:

- long-range charts;
- records/documents;
- provenance inspection;
- comparison;
- appointment preparation;
- export/share configuration;
- side-by-side Ask Phisys + health object;
- long-form review.

The Web Companion uses React, strict TypeScript and Next.js over the scoped Fastify/OpenAPI contract. It consumes Phisys data through the backend. Health Connect and HealthKit acquisition stays in the native clients. PWA installability is an optional convenience.

---

## 1.2 Ambient surfaces — glance / notice / capture

Ambient surfaces intentionally expose less context and less functionality.

### Widgets

Jobs:

- glance at current state;
- glance at meaningful changes;
- launch Quick Add;
- deep-link into trusted mobile detail.

Recommended initial widget set:

1. `Today` — small state summary;
2. `What Changed` — count + privacy-filtered changes;
3. `Quick Add` — symptom / measurement / note shortcuts.

### Notifications

Jobs:

- operational attention;
- user-created reminders;
- weekly/review readiness;
- opt-in meaningful-change notification.

Rule:

```text
Insight ≠ Notification
```

A notification exists only after Notification Policy evaluates novelty, persistence, actionability, privacy and user opt-in.

### Watch

Watch is a companion, not a miniature phone app.

Primary jobs:

```text
Glance
+
Capture
+
Handoff
```

Allowed examples:

- count of changes to review;
- quick symptom capture;
- voice capture;
- review-later action;
- open on phone.

Do not replicate Timeline, Records, long AI conversations or detailed lab analysis on watch in the initial watch product.

### Quick Actions

Long-press/app shortcut candidates:

- Record symptom;
- Add measurement;
- Ask Phisys.

### Voice

Voice is **an input modality of Phisys**, not a separate external assistant product.

Canonical write flow remains:

```text
Voice
→ speech-to-text
→ structured candidate
→ preview/edit
→ confirm
→ Canonical record
```

---

## 1.3 External surfaces — integrate / share / automate

### MCP

Power-user/agent interoperability surface.

Initial posture:

- read-only first;
- scoped tools;
- Tool Gateway enforced;
- no treatment/action escalation;
- no bypass around Context/Safety/Privacy.

Examples:

```text
phisys.get_current_state
phisys.get_metric_series
phisys.what_changed
phisys.prepare_appointment
```

### API

Future platform capability for approved custom clients/integrations. API is not a shortcut around product permissions.

### FHIR / secure export / share

Used for interoperability and explicit data transfer. External sharing requires a privacy preview showing exactly what is included/excluded and recipient/destination.

### Email / messenger

Email, Telegram, WhatsApp and similar third-party communication systems are **not canonical health interaction surfaces** in the current strategy.

Potential roles:

- security/operational message;
- notification that a secure artifact is ready;
- deep link to Phisys.

Avoid delivering rich clinical reasoning, raw health data or canonical write flows inside third-party messengers by default.

---

# 2. Jobs-to-surface matrix

| User job | Phone | Web | Widget | Watch | Push | MCP/API |
|---|---:|---:|---:|---:|---:|---:|
| Glance at current state | ★★★ | ★★ | ★★★ | ★★ | – | ★ |
| Review What Changed | ★★★ | ★★★ | ★★ | ★ | ★ | ★★ |
| Explore chart/context | ★★★ | ★★★ | – | – | – | ★★ |
| Longitudinal investigation | ★★ | ★★★ | – | – | – | ★★ |
| Browse Records | ★★ | ★★★ | – | – | – | ★★ |
| Ask Phisys | ★★★ | ★★★ | – | limited input | – | structured |
| Record symptom | ★★★ | ★ | shortcut | ★★★ | – | restricted |
| Manual measurement | ★★★ | ★ | shortcut | device-specific | – | restricted |
| PDF import | ★★ | ★★★ | – | – | – | approved API |
| Appointment Prep | ★★ | ★★★ | – | handoff | ready notice | ★★★ |
| Provenance/detail | ★★ | ★★★ | – | – | – | structured |
| Connect Health Store | ★★★ | – | – | device-specific | – | – |

`★` is relative fit, not scope commitment.

---

# 3. Surface capability contract

Every user-facing capability must declare:

```yaml
capability: what_changed

surfaces:
  mobile:
    role: primary
    detail: full

  web:
    role: secondary
    detail: full

  widget:
    role: ambient
    detail: summary

  watch:
    role: ambient
    detail: count_or_summary

  notification:
    role: attention
    detail: privacy_filtered

  mcp:
    role: external
    detail: structured
```

Do not add a surface ad hoc without defining:

- role;
- data scope;
- allowed actions;
- privacy mode;
- authentication state;
- deep-link destination;
- failure/offline behavior.

---

# 4. Ambient privacy modes

Ambient surfaces can be visible without deliberate app opening. Therefore privacy is more restrictive than inside authenticated full surfaces.

## Private — recommended lock-screen/watch default

```text
Phisys
2 updates
```

No metric name/value.

## Balanced — recommended home-widget default

```text
2 health changes to review
```

Can expose category-level context but avoids sensitive clinical detail.

## Detailed — explicit opt-in

```text
Sleep ↓ 42 min
Resting HR ↑ 5 bpm
```

Detailed mode remains subject to domain sensitivity and OS lock-screen settings.

### Rule

> A full-surface permission does not automatically authorize equivalent exposure on an ambient surface.

---

# 5. Notification policy

Notifications are generated by a dedicated policy after insight generation.

```text
Insight Candidate
     ↓
Meaningfulness
     ↓
Notification Policy
     │
     ├─ novelty
     ├─ persistence
     ├─ actionability
     ├─ sensitivity
     ├─ quiet hours/preferences
     └─ user opt-in
     ↓
Notification Candidate
```

### Defaults

- sync failure: allowed operational notification;
- import completed: allowed;
- user reminder: explicit opt-in;
- weekly review ready: opt-in;
- meaningful health change: opt-in;
- generic AI insight: off by default.

Lock-screen copy should prefer intent over sensitive detail.

---

# 6. Deep-link architecture

Every ambient/external entry should resolve to a canonical trusted context.

Examples:

```text
Widget change
→ /insight/:id

Push meaningful change
→ /insight/:id

Widget Today
→ /today

Watch review-later
→ /insight/:id

Email appointment brief ready
→ authenticated /appointment/:id
```

Canonical internal routes should remain semantically stable across mobile/web where possible:

```text
/today
/insight/:id
/metric/:metricId
/timeline
/records/...
/documents/:id
/ask?subjectType=&subjectId=
/connections/...
```

Ambient surfaces should not reproduce complex reasoning that belongs at the deep-link target.

---

# 7. Authentication and trusted-surface rule

### Full surfaces

- authenticated session with backend authorization for each health request;
- biometric/app-lock option on mobile;
- full provenance/AI context according to policy;
- platform permission, PWA installation and a cached shell do not grant backend authorization.

### Ambient surfaces

- assume shoulder-surfing/lock-screen exposure;
- privacy-filter values;
- no high-risk clinical action;
- route detail to authenticated full surface.

### External surfaces

- explicit OAuth/scope/recipient authorization;
- Tool Gateway / API policy;
- read-only first where applicable.

---

# 8. Web/PWA role

Responsive web is a first-class **deep-work companion**.

If PWA capabilities are added, an offline shell may contain public static assets. Keep health payloads, authenticated pages and health API responses out of service-worker caches. Surface unavailable or stale state when offline. Health reads, writes and handoffs still require a current authenticated session and backend authorization. Background or push capabilities follow the same scoped surface and privacy rules.

Recommended Web capabilities:

- same canonical user account/data;
- Records/Timeline/Metric Detail;
- wide charts;
- source-document inspection;
- Ask Phisys split view;
- Appointment Prep;
- secure export/share.

---

# 9. Watch strategy

## Initial scope

- one privacy-safe glance surface;
- Quick Capture;
- review-later/deep-link handoff;
- notification handling.

## Not initial scope

- full AI workspace;
- broad medical record browsing;
- complex charting;
- treatment actions;
- unrestricted background health capture beyond platform/device capabilities and approved purpose.

Wearable capability must be runtime-detected; unsupported sensor/data capabilities produce unavailable/limited UI, not assumptions.

---

# 10. Cross-surface consistency

Consistency does **not** mean identical layout.

Must remain consistent:

- names/units;
- semantic state;
- privacy labels;
- source/provenance meanings;
- insight identity;
- time period;
- action state;
- unresolved conflicts.

May adapt per surface:

- density;
- amount of detail;
- navigation;
- chart complexity;
- input modality;
- notification wording.

---

# 11. Delivery roadmap

## Phase S0 — Personal Beta

**Native Android app on Kotlin and Jetpack Compose.**

Must prove:

- Health Connect → canonical data;
- Today / What Changed;
- Records;
- Ask Phisys;
- symptom/manual capture.

## Phase S1 — Web Companion

React, strict TypeScript and Next.js with the same Fastify/OpenAPI contract. Installability is optional.

Add:

- records/document deep work;
- wide charts;
- long history;
- Appointment Prep;
- AI split view;
- secure export/share.

## Phase S2 — Ambient Android

Add:

- What Changed widget;
- Today widget;
- Quick Add widget/action;
- privacy-filtered push.

## Phase S3 — iOS

Native Swift app with a native HealthKit adapter. SwiftUI vs UIKit remains open. Share API contracts, design tokens and health state semantics across surfaces. iOS implements its own UI, permissions and navigation. WidgetKit follows the scope and privacy policy of the ambient surface.

## Phase S4 — Watch

Wear OS first where useful, then Apple Watch when iOS product exists.

## Phase S5 — Ecosystem

- MCP;
- approved API;
- FHIR interoperability;
- secure partner/share surfaces.

The roadmap is value/evidence-driven; phases can move if user research shows a stronger job.

---

# 12. Product metrics by surface

Do not evaluate surfaces by raw engagement alone.

### Mobile

- insight-to-understanding completion;
- successful health write;
- source/provenance access success;
- task completion.

### Web

- deep investigation completion;
- appointment brief completion;
- document review completion.

### Widget

- useful open/deep-link rate;
- privacy mode changes;
- dismiss/removal rate.

### Notifications

- opt-in rate;
- useful open rate;
- disable rate;
- false/annoying notification feedback.

### Watch

- successful quick capture;
- handoff completion;
- abandoned/failed capture.

Do not optimize time-in-app.

---

# 13. Acceptance criteria

Surface architecture is respected when:

1. Android app remains the Personal Beta primary hub.
2. Web is optimized for investigation, not copied mobile layout.
3. Widget/Watch/Push do not expose full clinical reasoning by default.
4. Detailed ambient health values require explicit privacy choice where appropriate.
5. Insight generation and notification delivery remain separate systems.
6. Every ambient insight can deep-link to a full trusted context.
7. Watch does not receive accidental feature parity requirements.
8. Voice writes still use structured preview/confirmation policy.
9. MCP/API cannot bypass Tool Gateway/Safety/Context/Privacy.
10. Messenger/email cannot become clinical source of truth without a new approved architecture/security decision.
11. Surface-specific unavailable/offline/privacy states are designed before release.
12. Cross-surface semantic identity is preserved even when layout/detail differs.
13. Native permissions, source attribution, recovery and accessibility match approved UX on each released target.
14. If the Web PWA ships, installation or cached shell access grants no health data or authorization. Verify this with stale sessions, offline access and cache inspection.

---

# 14. Current platform references

Verified 10-10-2026:

- Android Jetpack Glance — widgets/remote surfaces: https://developer.android.com/develop/ui/compose/glance
- Android Health Services on Wear OS: https://developer.android.com/health-and-fitness/health-services
- Wear OS `PassiveMonitoringClient`: https://developer.android.com/reference/androidx/health/services/client/PassiveMonitoringClient
- Apple HealthKit data queries/background behavior: https://developer.apple.com/documentation/HealthKit/reading-data-from-healthkit
- MDN PWA installability: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- MDN PWA offline/background/push: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
