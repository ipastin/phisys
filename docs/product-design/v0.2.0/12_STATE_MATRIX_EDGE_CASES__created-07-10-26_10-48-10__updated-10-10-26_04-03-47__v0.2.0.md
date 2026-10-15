---
title: "MyPhisys State Matrix & Edge Cases"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# State Matrix & Edge Cases

## 1. Why states are first-class in MyPhisys

Health UX is not defined by the happy path. Missingness, delayed sync, conflicting records, low coverage and unavailable AI materially change interpretation. These states must be designed **before** final visual polish.

## 2. Global state taxonomy

| State | Meaning | Must not be confused with |
|---|---|---|
| Loading | data not resolved yet | Empty |
| Empty | valid query, zero records | Error |
| Warm-up | records exist, insufficient baseline/history | Empty |
| Limited data | analysis possible only with qualification | Stable |
| Insufficient data | analysis should not be produced | Stable |
| Stable | enough data, no meaningful change | Missing |
| Stale | last update too old for intended interpretation | Stable |
| Partial sync | some categories/periods unavailable | Complete |
| Conflict | sources disagree | Error |
| Offline | network unavailable; local/cached behavior applies | Server error |
| Error | operation failed | Permission denied |
| Permission denied | access intentionally/unintentionally absent | Empty source |
| AI unavailable | reasoning provider unavailable | Health data unavailable |
| Evidence unavailable | personal facts valid, medical interpretation limited | AI unavailable |
| Restricted | policy disallows requested action/claim | Technical error |
| Urgent | safety flow | Generic warning |

## 3. State precedence

When multiple states exist, design should prioritize the state that changes interpretation/action most.

Recommended priority:

```text
Urgent
→ Restricted (for current action)
→ Conflict
→ Permission/access issue
→ Stale/partial
→ Insufficient
→ Limited
→ Normal/stable
```

Technical loading/error overlays should not hide already-valid cached health data if it can still be shown safely.

## 4. Screen state matrix

### Today

- Loading: skeleton structure, no fake numeric values.
- Empty: no sources/data; connect/add CTA.
- Warm-up: enough data to show metrics, not baseline comparisons.
- Limited: qualified insight or data-quality callout.
- Stable: explicit no meaningful changes.
- Stale: banner/inline source freshness issue; suppress stale-derived insight when required.
- Offline: cached state with last-updated disclosure.
- Error: section-level degradation preferred over full-page error.

### Metric Detail

- No records;
- one observation;
- two sparse observations;
- baseline unavailable;
- baseline available;
- source transition;
- large missing gap;
- corrected observation;
- multiple sources;
- stale source;
- unsupported unit/method comparison.

### Timeline

- no events;
- one event;
- dense day requiring grouping;
- filter zero-results;
- limited historical coverage;
- event with incomplete date precision.

### Records

- category empty;
- processing document;
- needs review;
- corrected/superseded result;
- source deleted but canonical fact supported by another source;
- original document unavailable.

### AI

- thinking/generating;
- answer;
- partial answer;
- missing required context;
- evidence unavailable;
- model unavailable;
- restricted treatment request;
- urgent route;
- tool/source error;
- cancelled generation;
- structured write candidate awaiting confirmation.

### Connections

- available not connected;
- connected;
- partial permission;
- permission revoked;
- sync paused;
- sync stale;
- temporary error;
- reauth required;
- platform feature unavailable;
- disconnected with data retained.

### Ambient surfaces

#### Widgets
- fresh/default;
- stable/no changes;
- changes available;
- private/locked mode;
- stale data;
- app setup required;
- source unavailable.

#### Push
- permission not granted;
- category opt-out;
- quiet-hours deferred;
- privacy-filtered content;
- deep-link target invalidated/superseded.

#### Watch
- phone/account unavailable;
- device capability unsupported;
- quick capture pending confirmation;
- capture needs phone handoff;
- stale summary;
- offline.

Ambient errors should degrade to privacy-safe handoff rather than inventing health state.

## 5. Edge-case catalog

### E01 — Metric changes source/device mid-period
Show transition marker and qualify comparison if method may shift. Do not silently render a continuous line as one homogeneous source.

### E02 — Unit changes
Display canonical/preferred unit where valid, retain original in source detail. If conversion is analyte-specific or uncertain, do not merge blindly.

### E03 — Lab reference ranges differ by report
Reference range belongs to observation/source. Do not render one global fixed band across history if ranges differ.

### E04 — Date precision is month/year only
Display `March 2024`, never invent `Mar 1`.

### E05 — Value corrected by source
Default to current value but expose correction/source history where relevant.

### E06 — Conflicting current medication status
Do not select winner silently; mark Needs Review and preserve `I'm not sure`.

### E07 — User says symptom but no severity
Store/display `Not specified`; never infer `mild` from wording unless explicit extraction is semantically safe and confirmed.

### E08 — User asks reason but related domain missing
AI answer lists missing context rather than treating absence as no change.

### E09 — New source has only recent data
Coverage makes historical comparison impossible; show source start date.

### E10 — Same record imported twice
Do not show duplicate event; if duplicate uncertainty exists, review state belongs to data layer/admin, not alarming user unless action needed.

### E11 — Health Connect access cancelled repeatedly
Use recovery instructions/link to settings; do not loop system dialog.

### E12 — User disconnects connector
Existing data remains; show `Disconnected · data retained` until deletion decision.

### E13 — User deletes connector-derived data that also has another source
Derived UI may remain because canonical fact survives; source details should update.

### E14 — AI generates answer after context changed
If significant context invalidated while request runs, prefer invalidate/retry or disclose snapshot time; do not silently mix old/new state.

### E15 — Offline during symptom write
If local secure draft is supported, show pending state; otherwise do not claim saved. Never silently lose health write.

### E16 — Very long metric/lab names
Components must support wrapping; do not truncate the only semantic identifier without accessible/full-label path.

### E17 — Large accessibility text
Cards should grow vertically; avoid fixed-height health cards.

### E18 — Negative/zero/null
A numeric zero is data; null/missing is absence. Copy and charts must distinguish.

### E19 — No meaningful change but new document
Today can show `New` even when `Meaningful changes` is empty.

### E20 — Insight disappears after data correction
Metric history/source remains; previous AI inference should not continue as active insight. User-facing history of old insight is optional, not canonical truth.

## 6. Loading design rules

- Never skeleton numeric content with plausible numbers.
- Prefer section-level placeholders to full screen spinners.
- For long import/sync, explain real stages.
- Preserve readable cached content when freshness permits.

## 7. Error design rules

Error message must contain:

1. what failed;
2. what remains safe/available;
3. next action;
4. whether retry is meaningful.

Avoid raw API/auth terminology.

## 8. State review board in Figma

Create dedicated page/section with a matrix for core screens:

```text
Default | Loading | Empty | Limited | Stale | Error | Offline
```

This page is a QA asset, not presentation art.
