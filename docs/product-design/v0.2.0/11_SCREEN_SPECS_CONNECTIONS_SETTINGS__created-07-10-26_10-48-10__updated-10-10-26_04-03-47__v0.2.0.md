---
title: "MyPhisys Screen Specifications — Connections, Permissions & Settings"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Screen Specifications — Connections, Permissions & Settings

# CON-01 — Data & Connections — MVP

**Purpose:** show what supplies MyPhisys data and current health of each connection.

Rows:

- Health Connect;
- Documents;
- Manual data;
- future FHIR/HealthKit/provider connectors.

Each connector row shows only useful summary:

- connected / paused / needs attention;
- last sync freshness;
- active categories or concise count.

Do not show technical cursor/API state.

---

# CON-02 — Health Connect Detail — MVP

### Sections

1. connection status;
2. sync toggle/state;
3. data access categories;
4. coverage summary;
5. manage access;
6. pause/disconnect;
7. destructive delete imported data separated visually.

### Important semantics

- `Sync off` does not revoke OS permission automatically unless product explicitly performs it;
- `Disconnect` does not mean data deletion;
- `Delete imported data` explains what happens to derived insights/history.

---

# CON-03 — Permission Rationale — MVP

Use before OS Health Connect permission screen.

Structure:

- feature/value the category enables;
- exact categories requested;
- read/write direction (MVP should usually be read-only unless feature requires write);
- manage-later reassurance;
- continue/not now.

Avoid `We need access to improve your experience` vague copy.

---

# CON-04 — Insufficient Access — MVP

Must identify affected capability/category without blaming user.

Example:

```text
Sleep access is off.
MyPhisys can still use previously imported data, but new sleep data won't sync.
```

Actions: `Manage access`, `Continue without it`.

---

# CON-05 — Permission Cancelled / Recovery — MVP

Designed for platform state where permissions request can no longer be re-shown normally after repeated cancellation.

Content:

- what happened;
- clear route to Health Connect settings;
- no repeated nagging prompt loop.

---

# CON-06 — Sync Issue — MVP

Differentiate:

- temporary sync error;
- stale data;
- reauthorization needed;
- feature unavailable on device/platform.

Do not collapse into generic `Connection error`.

---

# CON-07 — Pause Sync — MVP

Confirmation should state:

- new sync stops;
- existing data remains;
- can resume.

Avoid destructive styling equivalent to delete.

---

# CON-08 — Disconnect — MVP

State:

- source will stop syncing;
- existing imported data remains by default;
- OS permissions may require separate management depending on connector behavior.

Follow-up may offer `Delete imported data` as separate destructive action, not bundled default.

---

# CON-09 — Delete Imported Source Data — MVP

Strong confirmation.

Must describe:

- which source;
- types/time range if known;
- derived insights may disappear/recalculate;
- original external source is not deleted unless explicitly supported;
- action irreversibility/re-sync implications.

Prefer typed confirmation only if risk warrants; avoid excessive friction for ordinary source cleanup.

---

# SET-01 — Settings Index — MVP

Recommended groups:

```text
Data & Connections
Privacy & Permissions
Memory & Personalization
Units & Display
AI & Sources
Notifications
Export data
Account
```

Avoid giant flat settings list.

---

# SET-02 — Privacy & Permissions — MVP

Show product-level privacy controls and links to source-specific access management.

Do not duplicate every Health Connect system permission as fake in-app toggle unless it actually controls the permission.

---

# SET-03 — Units & Display — MVP

Potential preferences:

- metric system / specific metric units;
- date/time locale behavior;
- appearance theme if supported;
- chart display preferences only if users need them (avoid over-customization early).

Unit conversion must never erase original source unit in provenance.

---

# SET-04 — AI & Sources — MVP

Possible content:

- explanation of AI role;
- external evidence/source preference transparency;
- context/privacy controls that are stable user preferences;
- links to AI context/history.

Do not expose model-provider selector unless it has real product value.

---

# MEM-01 — Memory & Personalization — MVP/V1

Structure:

### About you

- preferences;
- habits/routines;
- goals.

### AI context

- saved conversation context/inferences if product persists them.

### Health records

Link to Records; do not present canonical clinical store as generic AI memory.

Each item should answer: source, recency, editable/removable status.

---

# NOT-01 — Notifications — MVP

Suggested categories:

- sync/connection issues — default on where platform allows;
- document import completed — on;
- user reminders — opt-in;
- weekly review — opt-in/V1;
- meaningful change — opt-in/V1;
- AI-generated proactive insight — off by default.

Notification settings should describe trigger, not just label `Insights`.

---

# EXP-01 / EXP-02 — Data Export — MVP

Export configuration should let user understand scope and format.

Potential formats:

- canonical JSON;
- CSV selected metrics;
- original documents bundle.

Show progress/result and security considerations for generated archive if relevant.

---

# DEL-02 — Delete Account — MVP

Must distinguish:

- deleting app/account data;
- disconnecting external health sources;
- deleting external source data (usually not implied).

Use explicit consequence summary and final confirmation.

---

# Settings acceptance criteria

- no destructive action is visually adjacent/indistinguishable from routine management;
- user can understand `permission`, `sync`, `disconnect`, `delete imported data` as different concepts;
- privacy controls reflect actual technical capability;
- no setting claims local-only processing unless true;
- stale/revoked states have recovery path.
