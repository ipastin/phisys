---
title: "MyPhisys Product Design Strategy"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Product Design Strategy

## 1. Design problem

Health products обычно проваливаются в одну из трёх моделей:

1. **data dump** — десятки metrics/charts без приоритизации;
2. **score simplification** — сложное здоровье сжимается в непрозрачный 0–100;
3. **AI chat** — пользователь должен сам догадаться, что спросить, а source/reasoning скрыты.

MyPhisys должен решить противоположную задачу: **сделать longitudinal health data понятными без потери provenance, uncertainty и контроля пользователя**.

## 2. Core design proposition

> MyPhisys должен помогать пользователю сначала увидеть изменение, затем понять его контекст и только после этого использовать AI для объяснения.

### Primary loop

```text
Notice → Explore → Understand → Decide → Record/Prepare/Watch
```

### Information-depth ladder

```text
L0 Headline signal
L1 Metric/change
L2 Chart + comparison basis
L3 Context/events/data quality
L4 Source/calculation details
L5 AI interpretation/evidence
```

Progressive disclosure — системное правило, не декоративный прием.

## 3. Primary experience goals

### G1 — Immediate orientation
За 5–10 секунд пользователь должен понять:

- есть ли meaningful changes;
- что новое;
- что стабильно;
- есть ли data gaps / sync issues.

### G2 — Traceable understanding
За 1–2 taps пользователь должен попасть от insight к:

```text
Insight → Metric → Source / calculation
```

### G3 — Controlled AI
AI должен ощущаться не как black-box authority, а как reasoning layer:

- scoped subject;
- visible personal context categories;
- separated personal evidence vs external evidence;
- explicit uncertainty;
- no hidden writes.

### G4 — Low anxiety
Интерфейс не должен максимизировать attention через alarm states. Default visual/emotional tone — calm, neutral, precise.

### G5 — Longitudinal literacy
Пользователь постепенно учится различать:

- current value;
- recent baseline;
- reference range;
- goal/target;
- source quality;
- association vs causation.

## 4. Design principles

### P01 Signal over volume
Home/Today не становится dashboard всех данных. 3–5 meaningful items — нормальный верхний предел primary summary.

### P02 Facts before AI
Не начинать карточку/экран с generated prose, если есть структурированный факт.

### P03 Comparison must name its basis
Нельзя показывать `↓ 12%` без ответа «по сравнению с чем?».

### P04 Personal baseline before judgement
`Above your recent range` допустимо; `abnormal` — только если есть корректный clinical reference/policy.

### P05 Stable is a state
Показывать `Stable` aggregate, чтобы отсутствие проблем не выглядело как отсутствие данных.

### P06 Data gap is a state
`No change detected` и `not enough data` никогда не выглядят одинаково.

### P07 Source on demand, not metadata everywhere
Level-1 provenance lightweight; Level-2 available by drill-down.

### P08 Direction is neutral
Arrow up/down encodes direction, not valence. Do not couple green=down/red=up globally.

### P09 Context is not causality
Nearby events visualized as context; words `caused`, `because`, `led to` reserved for evidence-supported statements.

### P10 Every write is legible before commit
Natural language health input must become a structured preview the user can edit.

### P11 Permissions are earned
Ask for a category when a user understands why it creates value; do not front-load all Health Connect scopes.

### P12 AI failure does not break health access
If AI/evidence is unavailable, factual data and deterministic analytics remain usable.

## 5. Anti-goals

Do not optimize for:

- daily streaks;
- maximum screen time;
- health-score gamification;
- fear-based notification opens;
- AI novelty;
- maximal data density;
- auto-generated explanations for every metric fluctuation.

## 6. Visual-semantic rules before visual style exists

Even before choosing palette/typeface:

- use neutral surfaces for default facts;
- reserve semantic emphasis for status, not decoration;
- do not use gradients as a semantic status system;
- do not use generic medical red unless actual urgency/policy warrants it;
- charts must remain interpretable in monochrome/high-contrast contexts;
- iconography supplements labels, never replaces critical health labels.

## 7. Three visual directions to explore

### Option A — Systemic Intelligence — recommended
Neutral, precise, structural, longitudinal. Strong typography + thin data geometry + restrained semantic accents.

**Trade-off:** can feel colder unless copy/layout provides humanity.

### Option B — Quiet Clinical
More clinical cues, higher density, stronger record/provenance feeling.

**Trade-off:** risks feeling like provider software rather than personal product.

### Option C — Human Health
Warmer surfaces and organic rhythm without wellness-gamification.

**Trade-off:** can weaken perceived precision if pushed too far.

Recommendation: **A with selected warmth from C**, not a 50/50 hybrid.

## 8. UX success criteria

A design direction is viable if usability testing shows users can correctly answer:

1. What changed?
2. Compared to what?
3. Is this medically abnormal or merely different from my recent baseline?
4. Where did this data come from?
5. Is this a fact, calculation or AI interpretation?
6. What data did AI use?
7. What happens if I press Save/Share/Delete?
8. What does the system *not* know?

If users systematically fail any of 1–5, visual polish should stop until hierarchy/semantics are corrected.
