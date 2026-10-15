---
title: "MyPhisys Screen Specifications — Timeline, Records & Import"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Screen Specifications — Timeline, Records & Import

# TIM-01 — Timeline — MVP

**Purpose:** unified chronological history across health event types.

### Default hierarchy

- title;
- optional filter affordance;
- reverse chronological day/month groups;
- event rows/cards;
- bottom nav.

### Event row fields

- type icon/semantic marker;
- canonical title;
- short value/summary;
- time/date if needed;
- epistemic/source label only when material;
- chevron if detail exists.

### Aggregation

Dense data must appear as summaries, not raw minute-level events.

Examples:

- Sleep session → one event;
- daily resting HR → optional daily summary;
- lab report → parent event with key result preview;
- document import → only if meaningful as health event, not technical log.

### Required states

Default, filtered, limited history, empty, loading, error/offline.

---

# TIM-02 — Timeline Filter — MVP

Recommended filter groups:

```text
All
Clinical
Measurements
Symptoms
Lifestyle
```

Advanced type filters live in sheet, not 12 horizontal chips.

Filtering must not imply deletion/hiding from canonical data.

---

# TIM-04 — Event Detail — MVP

Dynamic template by event type.

Mandatory:

- event semantic title;
- effective date/time with correct precision;
- relevant structured fields;
- source;
- cross-links to Metric/Record/Document;
- optional Ask.

For user-reported symptom, show `User reported`; for calculated event, show `Calculated` if relevant.

---

# HEA-01 — Health Index — MVP/V1 decision

**Purpose:** browse by health domain rather than time/source.

Show only domains with meaningful data.

Each domain card may include:

- domain name;
- 1–2 key recent summaries;
- meaningful change indicator, if any;
- data coverage hint.

Do not invent domain-level composite score.

---

# HEA-02+ — Domain Overview

Template:

1. current/recent domain summary;
2. meaningful change if present;
3. metrics list;
4. recent related events;
5. domain data coverage;
6. Ask scoped to domain.

Domain page is navigation/summary, not an AI-generated health assessment.

---

# REC-01 — Records Index — MVP

**Purpose:** canonical/source-oriented browsing.

MVP categories:

- Labs;
- Documents;
- Symptoms.

Potential summary:

- recent records;
- `Needs Review` only if >0;
- Add record.

Do not duplicate Timeline chronology as main layout.

---

# LAB-01 — Labs List — MVP

Two viable organizations:

### Option A — reports first — recommended early
Group by lab report/date; drill into individual results.

**Pros:** preserves source mental model/provenance.
**Cons:** harder to inspect one metric longitudinally.

### Option B — metric first
Group by test; report is source metadata.

**Pros:** longitudinal comparison faster.
**Cons:** source report context less obvious.

Recommendation: default to **recent reports + search/metric history cross-links**; `LAB-03` handles longitudinal metric view.

---

# LAB-02 — Lab Result Detail — MVP

Mandatory:

- metric name;
- value/unit exactly at appropriate source precision;
- collection/effective date;
- source reference range if provided;
- previous comparable result/delta if valid;
- source document/provider;
- `View original`;
- `View history`;
- `Explain this result`.

### Important semantic separations

- source `reference range` visually labeled as such;
- personal baseline not used unless analytically valid for this metric;
- no automatic `normal/abnormal` color if source interpretation semantics unavailable.

---

# LAB-03 — Lab Metric History — MVP

Uses sparse metric template with discrete points.

Optional filters by source/method if source transitions make comparison invalid.

Show correction/superseded status only where relevant.

---

# DOC-01 — Documents List — MVP

Rows/cards:

- document title/type;
- date;
- source/provider if known;
- extraction/import state;
- results count if parsed.

States:

- imported;
- processing;
- needs review;
- failed/unsupported.

---

# DOC-02 — Document Detail / Original — MVP

Purpose: trust/source access, not general PDF manager.

Must support:

- original document viewing;
- metadata;
- extracted linked facts;
- page navigation;
- source-locator deep link.

If rendered inside app, protect against accidental share/download assumptions; explicit actions only.

---

# DOC-03 — Source Location Highlight — MVP

When user enters from a fact, open document at exact page/region if locator exists.

UI should clearly say `Source for HbA1c 5.9%` or equivalent so user understands why they landed there.

If exact region unavailable, page-level location is acceptable; do not fake precision.

---

# REC-02 — Symptoms List — MVP

Recommended organization:

- recent symptoms;
- filter/search later;
- no diagnostic grouping unless user/clinical record explicitly provides it.

Each item:

- symptom;
- date/time/period;
- optional severity if user provided;
- `User reported` where useful.

---

# REC-03 — Symptom Detail — MVP

Display only reported/recorded fields:

- symptom concept;
- onset/end/duration;
- severity;
- context/note;
- source;
- linked nearby events only in separate contextual section.

Do not infer cause on this screen.

---

# IMP-01 — Add / Upload — MVP

Entry points: Records `+ Add`, empty-state CTA.

Options:

- upload PDF/document;
- record symptom;
- add measurement.

Avoid catch-all upload that promises support for any medical file if parser scope is narrower.

---

# IMP-02 — Processing — MVP

Show stages only if meaningful:

```text
Uploading
Reading document
Checking results
```

Do not show pseudo-technical AI “thinking” theater.

Allow safe background exit if processing is asynchronous.

---

# IMP-03 — Extraction Review — MVP

Primary goals:

- show count found;
- separate `Ready to import` from `Needs review`;
- let user import validated subset;
- explain why review is needed.

Use compact result rows, not full editable spreadsheet.

---

# IMP-04 — Ambiguous Field Review — MVP

Mandatory:

- cropped/original source context;
- detected concept if reliable;
- editable value/unit/date field(s);
- Skip;
- reason for review.

Do not preselect guessed value when confidence is genuinely ambiguous unless clearly labeled.

---

# IMP-05 — Import Success — MVP

Show:

- results imported;
- skipped/needs review count;
- primary next action `View results`;
- secondary `View document`.

No celebratory animation necessary.

---

# IMP-06 — Failed / Unsupported — MVP

Differentiate:

- unreadable/scanned unsupported document;
- no supported health data found;
- corrupted file;
- temporary processing failure.

Each state needs a specific next action: retry, upload another file, or keep document without extraction if supported.

---

# MED-01..03 — Medication (V1)

Medication views must separate:

- product/medication identity;
- regimen/instructions;
- actual intake/adherence;
- current vs past;
- source conflict.

Do not use one `Active` toggle as the whole medication model.

### MED-03 Conflict

Primary question is real-world state, not database source choice. Include `I'm not sure`.

---

# Records acceptance criteria

Before hi-fi approval:

- a lab value can be traced to original document;
- a corrected/ambiguous value has a visible status;
- Timeline and Records do not feel like duplicate tabs;
- user-reported content is distinguishable from medical-record content when it matters;
- import failure states are actionable and non-technical.
