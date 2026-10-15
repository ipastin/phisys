---
title: "MyPhisys Core User Flows"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Core User Flows

## 1. Flow notation

```text
[Screen]
{Decision}
(Action)
! System/policy state
```

Each Figma prototype should annotate decision points, not only screens.

---

# F01 — First-run onboarding + Health Connect

```text
[ONB-01 Welcome]
  ↓ Continue
[ONB-02 How it works]
  ↓ Continue
[ONB-03 Privacy & control]
  ↓ Connect health data
[ONB-04 Health Connect rationale]
  ↓ Continue
[Platform permission UI]
  ↓
{Any requested read permission granted?}
  ├─ No → [CON-04 Insufficient access]
  │          ├─ Manage access → platform settings
  │          └─ Not now → [TOD-03 limited/no data]
  └─ Yes → [ONB-05 First sync]
              ↓
          {Enough historical data for baseline?}
              ├─ No → [ONB-06 Baseline warm-up]
              └─ Yes → [ONB-07 First Today reveal]
```

### Key UX decisions

- Explain value before OS permission.
- Ask only initial categories with direct MVP value.
- Permission denial is not onboarding failure; product can continue with manual/PDF paths.
- First sync shows categories/coverage, not fake progress percentage if exact total unknown.

---

# F02 — Passive What Changed exploration

```text
[TOD-01 Today]
  ↓ Tap Insight Card
[INS-01 Insight Detail]
  ├─ Tap chart/metric → [MET-01 Metric Detail]
  ├─ Why seeing this? → calculation/quality sheet
  ├─ Source → source sheet/detail
  └─ Ask MyPhisys → [AI-02 scoped conversation]
```

### Critical branch

If data quality is limited:

```text
[TOD-05 limited coverage]
→ [INS-03 Data gap / qualified insight]
```

Do not route to a confident interpretation screen.

---

# F03 — No meaningful changes

```text
[TOD-02 Today — no meaningful changes]
  ├─ Review today metrics
  ├─ Open Timeline
  ├─ Open Health
  └─ Ask MyPhisys
```

The empty-change state must feel like a successful health state, not an empty product.

---

# F04 — Metric investigation

```text
[MET-01 Metric Detail]
  ├─ change time range
  ├─ inspect point
  ├─ inspect event marker
  ├─ source transition → source detail
  ├─ view measurements → [MET-04]
  └─ Ask MyPhisys → [AI-02]
```

### Guardrail

Switching range recalculates display/analytics semantics; do not leave stale comparison copy from prior range.

---

# F05 — Lab PDF import

```text
[REC-01 Records]
  ↓ Add record
[IMP-01 Upload]
  ↓ Choose PDF
[IMP-02 Processing]
  ↓
{Extraction result}
  ├─ Unsupported/fail → [IMP-06]
  └─ Candidates found → [IMP-03 Review]
                         ↓
                    {Ambiguous fields?}
                      ├─ Yes → [IMP-04 Field review]
                      │           ↓ Resolve
                      └───────────┘
                         ↓ Import
                      [IMP-05 Success]
                         ↓
                      [LAB-02 Result detail]
                         ├─ View original → [DOC-03 source highlight]
                         └─ Explain → [AI-02]
```

### Guardrails

- Never auto-correct ambiguous numeric value silently.
- `Ready to import` and `Needs review` are distinct.
- Preserve source precision/unit.

---

# F06 — Conversational symptom recording

```text
[AI-01 / AI-03]
User: “Сегодня после обеда минут 40 болела голова”
  ↓ structured extraction
[SYM-02 Preview]
  ↓
{Correct?}
  ├─ Edit → [SYM-03 Edit]
  ├─ Cancel → conversation unchanged
  └─ Save → canonical write
             ↓
          [SYM-04 Saved]
             └─ View in Timeline → [TIM-04]
```

### Guardrail

Preview must show every field that will be persisted. No hidden inferred severity/cause/diagnosis.

---

# F07 — Manual measurement

```text
[Add action / Records]
→ [SYM-05 Manual measurement]
→ [SYM-06 Preview]
→ Save
→ Metric / Timeline confirmation
```

Use system/known defaults for current time and preferred units, but let user change them.

---

# F08 — Scoped AI explanation

```text
[INS-01 / MET-01 / LAB-02]
  ↓ Ask MyPhisys
[AI-02 scoped conversation]
  ↓ system builds minimum context
  ↓ answer composed
[Answer]
  ├─ Context used → [AI-04]
  ├─ Sources → [AI-05]
  ├─ source claim → record/evidence
  └─ follow-up question
```

### Degraded branches

```text
AI provider unavailable → [AI-07]
Evidence unavailable for required interpretation → [AI-08]
Treatment/high-risk request → [AI-09]
```

---

# F09 — Permission revoked / sync stale

```text
[TOD-04 stale source] or [CON-01]
  ↓ Manage
[CON-02 Health Connect detail]
  ↓
{Issue}
  ├─ permission missing → [CON-04]
  ├─ cancelled repeatedly → [CON-05]
  ├─ temporary sync error → [CON-06]
  └─ user action
       ├─ Pause → [CON-07]
       ├─ Disconnect → [CON-08]
       └─ Delete imported data → [CON-09]
```

Important: **Disconnect ≠ Delete**.

---

# F10 — Provenance trace

```text
[Insight / Metric / Lab]
  ↓ Source
[Source summary sheet]
  ↓ View details/original
[MET-03 or DOC-02/03]
```

Derived result path:

```text
Insight → Why seeing this? → Calculation basis → input records/sources
```

---

# F11 — Timeline exploration

```text
[TIM-01]
  ├─ Filter → [TIM-02]
  ├─ Tap event → [TIM-04]
  ├─ Tap grouped day summary → expand/day detail
  └─ Jump to metric/record source
```

Dense sensor data is aggregated; user never scrolls through raw minute-level readings in Timeline.

---

# F12 — Data export/delete

### Export

```text
[SET-01]
→ [EXP-01]
→ select scope/format
→ [EXP-02 progress/result]
```

### Delete source-derived data

```text
[CON-02]
→ Delete imported data
→ [CON-09 scope explanation]
→ confirm destructive action
→ progress/result
```

### Delete account

```text
[SET-01]
→ [DEL-02]
→ consequence summary
→ strong confirmation
→ delete orchestration
```

---

# V1 — F13 Medication conflict

```text
[MED-01 Needs Review]
→ [MED-03 conflict]
→ choose current real-world status / I'm not sure
→ review resulting record semantics
→ save clarification
```

Do not ask “which source is correct?” as primary question.

---

# V1 — F14 Appointment Prep

```text
[Upcoming appointment]
→ [APT-02 Prepare]
→ system proposes sections
→ user include/exclude
→ [APT-03 Build]
→ [APT-04 Review]
→ export/share preview
→ [APT-05]
```

Share scope must explicitly show included and excluded health categories.

---

# 15. Flow review checklist

Before approving any flow:

- Can the user exit safely?
- Can the user tell whether action changes data?
- Does permission/write/share have a preview/rationale?
- What happens with partial/missing/stale data?
- What happens offline?
- What happens if AI/evidence fails?
- Is source reachable?
- Are system vs user-owned states distinguishable?
- Is Back predictable?
