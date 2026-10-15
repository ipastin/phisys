---
title: "MyPhisys Screen Specifications — Core Experience"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Screen Specifications — Core Experience

## Spec template

Each screen spec defines:

- **Purpose** — job to complete;
- **Entry** — how user gets here;
- **Primary object** — semantic focus;
- **Hierarchy** — mandatory content order;
- **Actions** — primary/secondary/destructive;
- **States** — required variants;
- **Rules** — semantic/safety constraints;
- **Figma acceptance** — what must exist before approval.

---

# ONB-01 — Welcome — MVP

**Purpose:** establish category/value without leading with AI.

**Primary message:** `Your health, understood.`

**Mandatory content:**

1. MyPhisys name/wordmark;
2. one-line value proposition;
3. concise description of longitudinal understanding;
4. primary `Continue`;
5. sign-in path if relevant.

**Do not show:** dashboard mock packed with medical values, “AI doctor”, health score, permissions.

**Figma acceptance:** default + small-screen/Dynamic Type stress frame.

---

# ONB-02 — How it works — MVP

**Purpose:** teach system mental model before permissions.

Use 3-step sequence:

```text
Bring your data together
→ See meaningful changes
→ Understand the context
```

AI may be mentioned only in third step as explanation support.

**Rule:** do not imply continuous emergency monitoring.

---

# ONB-03 — Privacy & Control — MVP

**Purpose:** establish trust/permission model.

**Content hierarchy:**

- user controls data access;
- source is visible;
- access can be changed;
- minimum necessary context principle;
- continue.

**Avoid:** long legal copy; false claims such as “data never leaves device” unless architecture actually guarantees it.

---

# ONB-04 — Health Connect Rationale — MVP

**Purpose:** explain initial requested categories before system UI.

**Show:** categories, purpose, ability to change later.

**Initial recommended categories:** Sleep, Heart rate, Steps. Weight can be progressive.

**Actions:** `Continue to Health Connect`, `Not now`.

**Rule:** `Not now` remains a viable path to app/manual/PDF functionality.

---

# ONB-05 — First Sync — MVP

**Purpose:** make ingestion legible and build confidence.

**Display by category:** state + approximate/known coverage.

Possible row states:

- queued;
- importing;
- imported;
- partial;
- unavailable;
- permission missing.

Do not claim overall `%` unless denominator is real.

**Exit behavior:** allow background continuation if supported; otherwise be explicit.

---

# ONB-06 — Baseline Warm-up — MVP

**Purpose:** explain why comparisons may not yet be available.

**Content:**

- what is already usable;
- what needs more history;
- current valid-day count if meaningful;
- no artificial countdown promise.

Copy should say `building your recent baseline`, not `learning your body` or medicalized language.

---

# TOD-01 — Today / Meaningful Changes — MVP

**Purpose:** 5–10 second orientation.

**Primary object:** prioritized `InsightCandidate` list.

### Hierarchy

1. Header/date/profile;
2. `What Changed` section — 1–3 prominent cards, max 5 before `See all`;
3. current/today metric summaries;
4. stable summary;
5. optional tasks/upcoming only if they exist;
6. data freshness issue only when relevant.

### Insight card mandatory fields

- metric/event label;
- current/recent value where meaningful;
- directional change;
- comparison basis;
- optional persistence/quality cue;
- navigation affordance.

### Rules

- no universal score;
- no red/green valence based on direction;
- no generated paragraph inside card;
- if comparison basis invalid, show data-quality state instead of delta.

### Required states

`TOD-01 default`, `TOD-02 no change`, `TOD-03 warm-up`, `TOD-04 stale`, `TOD-05 limited coverage`, loading/error/offline.

### Figma acceptance

Must demonstrate hierarchy with 0, 1, 2 and 5 insight items; test long localized metric names and large text.

---

# WCH-01 — What Changed — MVP

**Purpose:** period-level inventory of change without forcing chart-by-chart review.

### Sections

```text
Meaningful changes
New
Stable
Data gaps
```

Sections with zero content can collapse, but `Stable` and `Data gaps` must not be conflated.

### Period selector

MVP default: 7 days. If 30-day support is reliable, offer explicit preset. Avoid arbitrary custom date complexity until semantics are implemented.

### Row/card rules

- same semantic object should not appear in multiple primary sections;
- new lab report may link to record; metric change links to Insight Detail;
- stable summary can aggregate domains rather than list all metrics.

---

# INS-01 — Insight Detail / Metric Change — MVP

**Purpose:** answer `what changed, when, compared to what, what else happened nearby, how good is the data?`

### Content order

1. metric label;
2. current/recent summary;
3. delta + explicit baseline/period basis;
4. chart;
5. change start/persistence;
6. nearby contextual events/metrics;
7. data quality;
8. `Ask MyPhisys`;
9. calculation/source links.

### Context block

Use neutral language:

- `changed during the same period`;
- `recorded near this change`;
- `no meaningful change detected`.

Do not use causal connectors unless claim is explicitly evidence-supported.

### Data-quality representation

At minimum show if coverage materially limits interpretation. Detailed %/days can live in drill-down.

---

# INS-02 — Insight Detail / New Event — MVP

Used for new lab/document/event.

Hierarchy:

- what is new;
- event date/source;
- extracted/key facts;
- relationship to previous records if deterministic;
- source/original;
- optional Ask.

Do not fabricate “why it matters” without evidence/AI layer.

---

# INS-03 — Data Gap Insight — MVP

**Purpose:** make missingness actionable without alarm.

Examples:

- not enough sleep nights for trend;
- source stopped updating;
- baseline unavailable after device/source transition.

Actions depend on cause: `Check connection`, `View data`, or simply `Continue collecting data`.

---

# MET-01 — Metric Detail / Dense-Daily — MVP

**Purpose:** inspect longitudinal metric.

### Header

- canonical metric name;
- current/recent summary;
- personal recent range/baseline when valid;
- unit.

### Chart

Required semantics:

- raw/summary series;
- baseline band or line;
- missing gaps;
- source transitions/events;
- selected point state.

### Secondary blocks

- current insight;
- data quality/coverage;
- source attribution;
- measurements/history link;
- Ask action.

### Time range

Recommended presets: `7D / 30D / 3M / 6M / 1Y` if data type supports them. Ranges can alter aggregation; copy must update accordingly.

### Rule

`Recent range` wording cannot be visually identical to `Reference range`.

---

# MET-02 — Metric Detail / Sparse-Lab — MVP

**Purpose:** show irregular clinical measurements without fake continuous trend.

### Hierarchy

- latest result/date;
- previous result/date;
- absolute delta (and relative only if useful);
- discrete-point chart;
- source laboratory reference range where available;
- source;
- explain/history actions.

### Rule

Two points support `higher/lower than previous`; persistent trend language requires adequate data.

---

# MET-03 — Source & Calculation Details — MVP

**Purpose:** trust drill-down.

Possible sections:

- `Why you're seeing this`;
- input period;
- sample count/coverage;
- algorithm human-readable description;
- source(s);
- exact advanced version metadata behind disclosure.

Default user-facing explanation should not expose implementation jargon like MAD unless user opens advanced details.

---

# MET-04 — Measurements / Data Table — MVP

**Purpose:** inspect underlying observations.

Use list/table based on density/platform.

Columns/rows must preserve:

- date/time precision;
- value/unit;
- source;
- status if corrected/user reported.

Do not interpolate absent observations into this view.
