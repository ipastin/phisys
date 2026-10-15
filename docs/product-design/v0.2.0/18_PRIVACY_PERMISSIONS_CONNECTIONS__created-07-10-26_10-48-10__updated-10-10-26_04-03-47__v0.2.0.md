---
title: "MyPhisys Privacy, Permissions & Connections UX"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Privacy, Permissions & Connections UX

## 1. Principles

1. Ask only for data needed for a visible feature.
2. Explain purpose before platform permission UI.
3. Distinguish OS permission, sync state and stored data.
4. User can recover from denial without dead end.
5. Disconnect does not imply deletion.
6. Delete explains scope and dependency consequences.
7. Context visibility complements, not replaces, permissions.

## 2. Permission vocabulary

Use consistent verbs:

- `Connect` — establish integration;
- `Allow access` — OS/provider permission;
- `Sync` — ongoing ingestion;
- `Pause sync` — stop updates while connection/data remains;
- `Disconnect` — remove integration relationship/ongoing sync;
- `Delete imported data` — remove MyPhisys copy/derived dependencies;
- `Manage access` — open platform/provider permission controls.

Do not use these interchangeably.

## 3. Progressive permission model

### Onboarding
Request only categories needed for first-value loop: Sleep, Heart rate, Steps.

### Contextual request later
Weight, glucose, blood pressure etc. requested when feature/domain creates clear reason.

Rationale copy pattern:

```text
Add weight data?
This helps compare weight changes with your other tracked metrics.
[Allow] [Not now]
```

Avoid vague `to personalize your experience`.

## 4. Health Connect-specific UX constraints

The design must include:

- rationale before request;
- Manage access path;
- insufficient access screen;
- recovery when permission prompt is cancelled repeatedly;
- sync on/off semantics;
- attribution/source display.

System permission UI remains system-owned.

## 5. Privacy onboarding

Show 3 concrete promises, not legal language:

- choose what to connect;
- see where information came from;
- change access and delete imported data.

Legal/privacy-policy link secondary.

## 6. Context privacy

AI context is a separate level from connector permission.

A connected category may be available to MyPhisys but not needed for a particular AI question. Context Inspector shows actual inclusion categories.

This distinction should be documented in privacy education but not overload onboarding.

## 7. Source attribution

For Health Connect-derived data, show originating app/source when available and meaningful.

Basic attribution is sufficient on common surfaces; advanced provenance available on drill-down.

## 8. Share/export privacy preview

Before external share, show:

```text
Includes
✓ selected labs
✓ current medication

Not included
— mental health
— raw documents
— AI conversation history

Recipient
...
```

Never let a prior approval silently expand to additional health categories.

## 8.1 Ambient-surface privacy

Data permission and ambient disclosure are distinct permissions/choices.

Recommended user-facing privacy modes:

```text
Private  — counts/status only
Balanced — category/change summary
Detailed — metric/value detail where explicitly allowed
```

Defaults:

- lock-screen notification: Private/Balanced;
- watch complication/tile: Private/Balanced;
- home widget: Balanced;
- Detailed: explicit opt-in.

The UI should explain that changing widget/notification privacy does not change Health Connect access itself.

## 9. Destructive operations

### Delete imported source data
Explain whether re-sync can restore it later and what derived insights are affected.

### Delete account
Explain external sources are not necessarily deleted; account data and imported copy are.

### Remove one record
If feature exists, explain source re-sync behavior to prevent “deleted but came back” surprise.

## 10. Permission fatigue controls

- no repeated banner every session after `Not now`;
- trigger request from feature context;
- remember dismissal for reasonable interval;
- show value, not guilt.

## 11. Privacy settings IA

`Privacy & Permissions` should focus on controls/policy; `Data & Connections` on sources/sync. Cross-link rather than duplicate.

## 12. Acceptance tests

User should correctly explain difference between:

- permission vs sync;
- disconnect vs delete;
- connected data vs AI-used data;
- MyPhisys copy vs external source data.
