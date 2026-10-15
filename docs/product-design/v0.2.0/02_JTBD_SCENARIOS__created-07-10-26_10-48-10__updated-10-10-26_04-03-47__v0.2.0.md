---
title: "MyPhisys JTBD & Product Scenarios"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# JTBD & Product Scenarios

## 1. Job hierarchy

### Core functional job

> Когда мои health records, measurements и everyday data разбросаны по разным источникам, я хочу понимать, что в моём здоровье изменилось во времени и на каких данных основан вывод, чтобы решить, что просто наблюдать, что изучить глубже и что подготовить к разговору со специалистом.

### Emotional job

> Я хочу чувствовать информированность и контроль без ощущения, что приложение постоянно ищет во мне проблему.

### Trust job

> Я хочу отличать мои реальные данные от вычислений и AI interpretation, чтобы понимать границы уверенности системы.

## 2. Primary JTBD

| ID | Job | Primary surface | Scope |
|---|---|---|---|
| J01 | Understand current state | Today / Metric | MVP |
| J02 | Know what changed | What Changed | MVP |
| J03 | Explore context | Insight Detail / Timeline | MVP |
| J04 | Explain result/change | Ask MyPhisys | MVP |
| J05 | Remember history | Timeline / Records | MVP |
| J06 | Add symptom/measurement | Record flow | MVP |
| J07 | Import clinical document | Import / Records | MVP |
| J08 | Understand source/quality | Provenance drill-down | MVP |
| J09 | Resolve conflicting data | Needs Review | V1 |
| J10 | Prepare appointment | Appointment Prep | V1 |
| J11 | Review week/month | Review | V1 |
| J12 | Watch a metric/event | Watch | V1 |

## 3. Canonical scenarios

### S01 — Passive morning orientation
**Trigger:** user opens app without a specific question.

**Expected path:** `Today → What Changed → optionally Explore`.

**Design requirement:** page must remain useful even when there are no changes; `No meaningful changes` is a successful state.

### S02 — A meaningful change appears
**Trigger:** persistent resting HR shift.

**Expected path:** `Insight Card → Insight Detail → Metric Detail → Ask MyPhisys`.

**Critical comprehension:** `above recent range` must not be read as clinical abnormality.

### S03 — New lab PDF
**Trigger:** user uploads report.

**Expected path:** `Upload → Processing → Review ambiguous fields → Import → Lab Result → Explain`.

**Critical safety:** user sees original source location for imported values.

### S04 — User reports symptom conversationally
**Trigger:** “Сегодня после обеда минут 40 болела голова”.

**Expected path:** `AI extraction → structured preview → Edit/Save → Timeline`.

**Critical safety:** no silent canonical write.

### S05 — Data source stops syncing
**Trigger:** Health Connect permission revoked or source stale.

**Expected path:** `Today subtle data-quality state → Connection Detail → Manage access`.

**Critical comprehension:** previously imported data remains unless user deletes it.

### S06 — AI explanation with incomplete context
**Trigger:** asks “Почему сон ухудшился?”, nutrition/adherence missing.

**Expected answer:** personal changes + explicit missing context; no fake causal conclusion.

### S07 — Conflicting medication status (V1)
**Trigger:** source says stopped, user previously says active.

**Expected path:** `Needs Review → domain question → current clarification / I'm not sure`.

### S08 — Prepare for appointment (V1)
**Trigger:** upcoming visit.

**Expected path:** `Upcoming → Build brief → review included data → edit questions → export/share preview`.

## 4. Scenario priorities for Figma prototypes

### Prototype P1 — core value
`TOD-01 → INS-01 → MET-01 → AI-02 → AI-05`

Goal: validate comprehension of change, comparison basis, data quality and AI source separation.

### Prototype P2 — trust
`IMP-01 → IMP-02 → IMP-03 → LAB-02 → DOC-02`

Goal: validate confidence in imported clinical data and provenance.

### Prototype P3 — safe conversational write
`AI-01 → SYM-02 → TIM-01`

Goal: validate preview/confirmation semantics and perceived control.

### Prototype P4 — permissions
`ONB-03 → CON-03 → Platform permission → ONB-05 → CON-02`

Goal: validate purpose-bound permission request, cancellation, insufficient-access recovery.

## 5. Jobs intentionally not optimized in MVP

- diagnosis seeking;
- treatment modification;
- medication optimization;
- emergency monitoring;
- social/community comparison;
- generalized wellness coaching;
- daily gamified goal adherence.

When these intents surface, UX should redirect to supported jobs instead of pretending capability.
