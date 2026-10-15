---
title: "MyPhisys Navigation & Responsive IA"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Navigation & Responsive IA

## 1. Mobile primary navigation

Recommended bottom navigation:

```text
Today | Timeline | Health | Records | Ask
```

### Why 5 tabs are justified

Each maps to a unique user mental model:

- **Today** — priority / now;
- **Timeline** — time/history;
- **Health** — domain/metric exploration;
- **Records** — canonical/source browsing;
- **Ask** — reasoning across objects.

Do not add top-level `Profile`, `Insights`, `Trends`, `Goals`, `Documents` or `Settings` tabs.

## 2. Mobile navigation behavior

### Today
Default launch destination after onboarding.

### Timeline
Preserve last-used filters during session; reset to reasonable default between long sessions unless explicitly saved.

### Health
Preserve domain/metric drill-down in back stack.

### Records
Source-oriented stack; returning from original PDF should return to same record/detail context.

### Ask
Two entry modes:

1. global `Ask` tab;
2. scoped `Ask MyPhisys` action from Insight/Metric/Record.

Scoped entry must visually retain subject context.

## 3. Back behavior

### Android
Respect platform Back semantics. Do not create custom back that skips unsaved confirmation states.

### Modal/sheet hierarchy
Back closes in order:

```text
keyboard → popover/sheet → full-screen modal → nested detail → primary tab
```

Never use Back to commit a health-data write.

## 4. Deep-link model

Screens that should support internal deep links:

```text
/insight/:id
/metric/:metricId
/timeline?event=:id
/records/lab/:id
/documents/:id
/ask?subjectType=&subjectId=
/connections/health-connect
```

Purpose: notifications, cross-links, history, future web/mobile parity.

## 4.1 Cross-surface navigation

Ambient surfaces are entry points, not independent navigation trees.

```text
Widget What Changed → /insight/:id
Push change          → /insight/:id
Watch review later   → /insight/:id
Quick Add            → /record/symptom or /measurement/new
```

Rules:

- a deep-linked full surface restores the referenced object/time context;
- ambient UI does not contain hidden multi-step navigation;
- watch detail hands off to phone when the task exceeds glance/capture;
- web routes should mirror semantic mobile routes where practical.

See `27_SURFACE_STRATEGY`.

## 5. Desktop/web IA

Desktop sidebar:

```text
MyPhisys

Today
Timeline
Health
Records
Ask

────────────
Data & Connections
Settings
```

Top-level search can be placed in header after search capability exists.

### Desktop shell

Recommended max content behavior:

- navigation: fixed 224–256 px;
- main workspace: fluid;
- optional details/AI pane: 360–480 px;
- data-heavy pages: allow wider chart/table region;
- prose/AI answer measure: constrain line length independently from workspace width.

## 6. Desktop split view

For object + reasoning workflows:

```text
┌──────────┬────────────────────────────┬──────────────────┐
│ Sidebar  │ Health object / chart      │ Ask MyPhisys     │
│          │                            │ scoped context   │
└──────────┴────────────────────────────┴──────────────────┘
```

Use split view for:

- Metric + Ask;
- Lab result + Ask;
- Timeline event + Ask;
- Appointment brief builder + AI assistance (V1).

Do not force split view for simple Today orientation.

## 7. Tablet

Tablet should not be a stretched phone.

Recommended behavior:

- compact sidebar/navigation rail in landscape;
- bottom nav remains acceptable in portrait;
- Metric Detail can pair chart + metadata in two columns;
- Timeline can use list + event-detail split when width allows;
- AI scoped conversation may appear as side sheet.

## 8. Responsive information priority

When width reduces, remove/stack in this order:

1. secondary metadata columns;
2. secondary controls;
3. supporting descriptions;
4. never remove core value, comparison basis, state, source affordance.

Do not solve narrow layouts by hiding uncertainty/data-quality indicators that change interpretation.

## 9. Modal vs navigation decision rule

Use **navigation** when:

- content has a stable URL/deep link;
- user may spend >30 seconds;
- content has its own hierarchy/history;
- user may want to return/share/bookmark.

Use **sheet/modal** when:

- choosing a filter/range;
- showing source summary;
- confirming action;
- editing one structured candidate;
- inspecting AI context/sources without leaving conversation.

## 10. Navigation states

Bottom/side navigation should not show badges for routine new data. Badges reserved for actionable state, e.g.:

- `Needs review` count;
- sync permission issue;
- explicit user-created task.

Do not badge `AI has a new insight` by default.

## 11. Health index visibility decision

Two MVP alternatives:

### Option A — keep `Health` tab — recommended long-term
Pros: stable home for domain/metric exploration; scales.
Cons: one more destination before content density warrants it.

### Option B — four tabs for earliest prototype
`Today / Timeline / Records / Ask`, with metrics accessible from Today/Records.
Pros: lower navigation complexity.
Cons: weakens metric/domain browsing, likely temporary IA migration.

Recommendation: **design five-tab target IA**, but test whether `Health` earns its tab during P1 prototype. Avoid coding a temporary four-tab architecture unless research strongly supports it.

## 12. Navigation acceptance tests

Users should complete without search:

- find historical event;
- inspect sleep trend;
- locate original lab report;
- ask about current insight;
- manage Health Connect access.

Target: no task should require guessing whether `Records` or `Health` contains the same duplicate content; cross-links are fine, duplicate ownership is not.
