---
title: "MyPhisys Wireframe Blueprints"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Wireframe Blueprints

These are **structural blueprints**, not final UI. Use them to create first-pass Figma wireframes. Preserve hierarchy and interaction semantics; visual language is intentionally unspecified.

---

# WF-01 — ONB-01 Welcome

```text
┌──────────────────────────────────┐
│             MyPhisys             │
│                                  │
│      Your health, understood.    │
│                                  │
│ Understand what changes in your  │
│ health over time — from records, │
│ measurements and everyday data.  │
│                                  │
│      [ Primary: Continue ]       │
│                                  │
│     Already set up? Sign in      │
└──────────────────────────────────┘
```

Hierarchy: brand → value → one action. Avoid feature carousel.

---

# WF-02 — ONB-03 Privacy & control

```text
┌──────────────────────────────────┐
│ ←                                │
│ You stay in control              │
│                                  │
│ [icon] Connect only what you want│
│ [icon] See where data came from  │
│ [icon] Change access anytime     │
│                                  │
│ MyPhisys uses the minimum data   │
│ needed for each analysis.        │
│                                  │
│ [Continue]                       │
└──────────────────────────────────┘
```

Do not bury privacy promise in legal copy.

---

# WF-03 — ONB-04 Health Connect rationale

```text
┌──────────────────────────────────┐
│ Connect Health Connect           │
│                                  │
│ Start with                       │
│ ✓ Sleep                          │
│ ✓ Heart rate                     │
│ ✓ Steps                          │
│                                  │
│ Why these?                       │
│ To build a recent baseline and   │
│ detect meaningful changes.       │
│                                  │
│ You can change access later.     │
│                                  │
│ [Continue to Health Connect]     │
│ [Not now]                        │
└──────────────────────────────────┘
```

---

# WF-04 — ONB-05 First sync

```text
┌──────────────────────────────────┐
│ Building your health history     │
│                                  │
│ Sleep            ✓ 84 nights     │
│ Heart rate       ✓ 90 days       │
│ Steps            … importing     │
│                                  │
│ [subtle progress activity]       │
│                                  │
│ You can leave this screen.       │
└──────────────────────────────────┘
```

Do not fake precise overall percentage if record count is unknown.

---

# WF-05 — TOD-01 Today

```text
┌──────────────────────────────────┐
│ Today                    [avatar]│
│ Tue, Oct 7                      │
│                                  │
│ WHAT CHANGED                     │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Sleep duration              │ │
│ │ 5h 58m       ↓ 46 min       │ │
│ │ vs recent baseline 6h 44m   │ │
│ │ Persisted 5 days      ›      │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Resting HR                  │ │
│ │ 69 bpm        ↑ 6 bpm       │ │
│ │ above recent range     ›     │ │
│ └──────────────────────────────┘ │
│                                  │
│ [See all changes]                │
│                                  │
│ TODAY                            │
│ Sleep 5h58   Steps 4.8k         │
│ Resting HR 69                    │
│                                  │
│ STABLE                           │
│ Weight · Activity                │
│                                  │
│ [Bottom navigation]              │
└──────────────────────────────────┘
```

Priority: changes > current metrics > stable/supporting content.

---

# WF-06 — TOD-02 No meaningful changes

```text
┌──────────────────────────────────┐
│ Today                            │
│                                  │
│ No meaningful changes detected   │
│                                  │
│ Your tracked metrics are close   │
│ to their recent patterns.        │
│                                  │
│ TODAY                            │
│ [metric summaries]               │
│                                  │
│ DATA COVERAGE                    │
│ Good · 3 connected categories    │
└──────────────────────────────────┘
```

No celebratory score/confetti; calm success state.

---

# WF-07 — WCH-01 What Changed

```text
┌──────────────────────────────────┐
│ ← What Changed        [7 days ▾] │
│                                  │
│ MEANINGFUL CHANGES               │
│ [Sleep change card]              │
│ [Resting HR card]                │
│                                  │
│ NEW                              │
│ Lab report · Oct 3          ›    │
│                                  │
│ STABLE                           │
│ Weight · Steps              ›    │
│                                  │
│ DATA GAPS                        │
│ Blood pressure                   │
│ Not enough recent data      ›    │
└──────────────────────────────────┘
```

---

# WF-08 — INS-01 Insight Detail

```text
┌──────────────────────────────────┐
│ ← Sleep duration                 │
│                                  │
│ 5h 58m                           │
│ ↓ 46 min                         │
│ vs previous 28-day baseline      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │          CHART               │ │
│ │ raw points + baseline band   │ │
│ └──────────────────────────────┘ │
│                                  │
│ THE CHANGE                       │
│ Started around Sep 30            │
│ Persisted 5 of 7 nights          │
│                                  │
│ CONTEXT                          │
│ Resting HR ↑ during same period  │
│ Activity stable                  │
│                                  │
│ DATA QUALITY                     │
│ 6 of 7 nights available          │
│                                  │
│ [Ask MyPhisys about this]        │
│ [Why am I seeing this?] [Source] │
└──────────────────────────────────┘
```

---

# WF-09 — MET-01 Metric Detail / daily

```text
┌──────────────────────────────────┐
│ ← Resting Heart Rate             │
│                                  │
│ 69 bpm                           │
│ Recent range 61–65               │
│                                  │
│ [7D] [30D] [3M] [6M] [1Y]       │
│ ┌──────────────────────────────┐ │
│ │ chart                        │ │
│ │ ─ personal baseline band     │ │
│ │ │ event/source change        │ │
│ └──────────────────────────────┘ │
│                                  │
│ INSIGHT                          │
│ Higher than recent range 5 days  │
│                                  │
│ ABOUT THIS DATA                  │
│ Source · Health Connect          │
│ Original · wearable/app          │
│ Updated · Today 06:12            │
│                                  │
│ [View measurements] [Ask]        │
└──────────────────────────────────┘
```

---

# WF-10 — MET-02 Sparse lab metric

```text
┌──────────────────────────────────┐
│ ← HbA1c                          │
│                                  │
│ 5.9%                             │
│ Sep 22                           │
│                                  │
│ Previous 6.1% · Apr 14           │
│ Change −0.2 percentage points    │
│                                  │
│ [1Y] [3Y] [All]                  │
│ ┌──────────────────────────────┐ │
│ │ ●──────●────────●            │ │
│ └──────────────────────────────┘ │
│                                  │
│ REFERENCE RANGE                  │
│ From source laboratory           │
│                                  │
│ [Explain this result]            │
│ [View source]                    │
└──────────────────────────────────┘
```

Do not call 2-point change a persistent trend.

---

# WF-11 — TIM-01 Timeline

```text
┌──────────────────────────────────┐
│ Timeline              [Filter]   │
│                                  │
│ TODAY                            │
│ ● Sleep · 5h 58m           ›     │
│ ● Resting HR · 69 bpm       ›     │
│                                  │
│ OCT 6                            │
│ ● Symptom · Headache        ›     │
│   User reported                  │
│                                  │
│ OCT 3                            │
│ ◆ Lab report · 12 results  ›     │
│   HbA1c · 5.9%                   │
│                                  │
│ SEP 29                           │
│ ◆ Data source changed       ›     │
└──────────────────────────────────┘
```

Use grouping/day hierarchy; dense sensor points stay aggregated.

---

# WF-12 — REC-01 Records

```text
┌──────────────────────────────────┐
│ Records                  [+ Add] │
│                                  │
│ Labs                        4  ›  │
│ Documents                   3  ›  │
│ Symptoms                    5  ›  │
│                                  │
│ NEEDS REVIEW                    │
│ 1 item                      ›   │
│                                  │
│ RECENT                           │
│ Lab report · Oct 3          ›   │
│ Headache · Oct 6            ›   │
└──────────────────────────────────┘
```

`Needs review` hidden if zero.

---

# WF-13 — LAB-02 Result Detail

```text
┌──────────────────────────────────┐
│ ← HbA1c result                   │
│                                  │
│ 5.9%                             │
│ Collected Sep 22                 │
│                                  │
│ Source reference range           │
│ [visual range only if reliable]  │
│                                  │
│ Compared with                    │
│ Apr 14 · 6.1%                    │
│                                  │
│ SOURCE                           │
│ Lab Report.pdf · Page 3     ›    │
│                                  │
│ [Explain this result]            │
│ [View history]                   │
└──────────────────────────────────┘
```

---

# WF-14 — IMP-03 Extraction Review

```text
┌──────────────────────────────────┐
│ ← Review lab report              │
│                                  │
│ 12 measurements found            │
│                                  │
│ READY TO IMPORT                  │
│ ✓ HbA1c     5.9%                 │
│ ✓ LDL       112 mg/dL            │
│ ✓ ...                            │
│                                  │
│ NEEDS REVIEW                     │
│ ! Glucose   value unclear    ›   │
│                                  │
│ [Import 11 ready results]        │
│ [Review 1 item]                  │
└──────────────────────────────────┘
```

Do not make user verify every high-confidence row.

---

# WF-15 — IMP-04 Ambiguous field

```text
┌──────────────────────────────────┐
│ ← Review glucose                 │
│                                  │
│ Original document                │
│ [cropped source image/text]      │
│                                  │
│ Detected value                   │
│ [  ?  ] mg/dL                    │
│                                  │
│ [Enter value]                    │
│ [Skip this result]               │
│                                  │
│ Why review?                      │
│ The source could not be read     │
│ reliably.                        │
└──────────────────────────────────┘
```

---

# WF-16 — AI-01 Ask landing

```text
┌──────────────────────────────────┐
│ Ask MyPhisys                     │
│                                  │
│ [ Ask about your health…       ] │
│                                  │
│ SUGGESTED FROM YOUR DATA         │
│ Why has my sleep changed?    ›   │
│ Explain my latest lab result ›   │
│ What changed this month?     ›   │
│                                  │
│ RECENT                           │
│ Sleep change                ›    │
│ HbA1c result                ›    │
└──────────────────────────────────┘
```

Suggestions should be neutral, not fear-triggering.

---

# WF-17 — AI-02 Scoped conversation

```text
┌──────────────────────────────────┐
│ ← Ask MyPhisys                   │
│ [Sleep · Sep 29–Oct 6] [Context] │
│                                  │
│ USER                             │
│ Why did this change?             │
│                                  │
│ MYPHISYS                         │
│ Your sleep duration...           │
│                                  │
│ YOUR DATA                        │
│ • Sleep ↓ 46 min                 │
│ • Resting HR ↑ same period       │
│                                  │
│ WHAT WE CAN SAY                  │
│ ...                              │
│                                  │
│ WHAT WE CAN'T CONCLUDE           │
│ ...                              │
│                                  │
│ [Sources · 4]                    │
│                                  │
│ [Ask a follow-up…]               │
└──────────────────────────────────┘
```

---

# WF-18 — AI-04 Context Inspector sheet

```text
┌──────────────────────────────────┐
│ Context used                 ×   │
│                                  │
│ INCLUDED                         │
│ ✓ Sleep · 30 days                │
│ ✓ Resting HR · 30 days           │
│ ✓ Medication changes · 60 days   │
│                                  │
│ NOT USED                         │
│ Nutrition                        │
│ Older records                    │
│                                  │
│ [Manage for this question]       │
└──────────────────────────────────┘
```

Default should be informational; editing context is secondary.

---

# WF-19 — SYM-02 Conversational write preview

```text
┌──────────────────────────────────┐
│ Record symptom?                  │
│                                  │
│ Headache                         │
│ Today · after lunch              │
│ Duration · about 40 min          │
│ Severity · Not specified         │
│                                  │
│ [Edit]                           │
│ [Save symptom]                   │
│ [Cancel]                         │
└──────────────────────────────────┘
```

Never invent severity to complete the card.

---

# WF-20 — CON-01 Data & Connections

```text
┌──────────────────────────────────┐
│ Data & Connections               │
│                                  │
│ Health Connect                   │
│ Connected · synced today    ›    │
│ Sleep · Heart rate · Steps       │
│                                  │
│ Documents                        │
│ 3 imported                  ›    │
│                                  │
│ Manual data                      │
│ 18 records                  ›    │
└──────────────────────────────────┘
```

---

# WF-21 — CON-02 Health Connect detail

```text
┌──────────────────────────────────┐
│ ← Health Connect                 │
│                                  │
│ Connected                        │
│ Sync [ON]                        │
│                                  │
│ DATA ACCESS                      │
│ Sleep             On             │
│ Heart rate        On             │
│ Steps             On             │
│ Weight            Off            │
│                                  │
│ COVERAGE                         │
│ Sleep · Mar 2026 → today         │
│                                  │
│ [Manage access]                  │
│ [Pause sync]                     │
│                                  │
│ Disconnect                       │
│ Delete imported data             │
└──────────────────────────────────┘
```

Destructive delete is visually separated from normal connection management.

---

# WF-22 — CON-04 Insufficient access

```text
┌──────────────────────────────────┐
│ Health Connect access is limited │
│                                  │
│ MyPhisys can continue with the   │
│ data you already imported, but   │
│ it can't update Sleep.           │
│                                  │
│ [Manage access]                  │
│ [Continue without it]            │
└──────────────────────────────────┘
```

---

# WF-23 — SYS degraded AI

```text
┌──────────────────────────────────┐
│ AI explanation is unavailable    │
│                                  │
│ Your health data and calculated  │
│ changes are still available.     │
│                                  │
│ [View the change]                │
│ [Try again]                      │
└──────────────────────────────────┘
```

Do not present as total product outage.

---

# WF-24 — V1 Medication conflict

```text
┌──────────────────────────────────┐
│ ← Medication status              │
│                                  │
│ Records don't agree              │
│                                  │
│ Medical record                   │
│ Stopped Sep 20                   │
│                                  │
│ You reported                     │
│ Taking on Oct 3                  │
│                                  │
│ What is correct now?             │
│ ○ I'm still taking it            │
│ ○ I stopped taking it            │
│ ○ I'm not sure                   │
│                                  │
│ [Continue]                       │
└──────────────────────────────────┘
```

---

# 25. Wireframe review rules

At lo-fi stage, every flow must explicitly show:

- state labels;
- source affordance where relevant;
- comparison basis;
- primary/secondary/destructive actions;
- confirmation boundaries;
- missing/limited data behavior;
- scroll hierarchy.

Do not spend time on visual brand before these are understandable in grayscale.
