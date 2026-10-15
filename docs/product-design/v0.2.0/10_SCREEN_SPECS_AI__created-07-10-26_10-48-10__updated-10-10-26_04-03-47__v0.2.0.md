---
title: "MyPhisys Screen Specifications — Ask MyPhisys"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Screen Specifications — Ask MyPhisys

## 1. Product role

Ask MyPhisys is a **reasoning workspace over trusted health context**, not the app homepage and not a separate AI persona.

Core entry modes:

1. **Global** — user asks cross-domain question;
2. **Scoped** — launched from Insight/Metric/Record/Event with known subject.

Scoped is the preferred high-trust path.

---

# AI-01 — Ask Landing — MVP

**Purpose:** reduce blank-chat burden without manufacturing anxiety.

### Content hierarchy

1. input;
2. suggested questions from current data/capabilities;
3. recent conversations;
4. optional capability hints.

### Suggestion rules

Good:

- `Why has my sleep changed?`
- `Explain my latest HbA1c result.`
- `What changed this month?`

Bad:

- `Could your heart rate mean something serious?`
- `Ask AI anything about your health!`
- fear/diagnosis bait.

Suggested prompts should only reference data user actually has.

---

# AI-02 — Scoped Conversation — MVP

**Purpose:** reason about one health object with visible scope.

### Persistent subject header

Examples:

```text
Sleep · Sep 29–Oct 6
HbA1c · Sep 22 result
Resting HR change
```

Header actions:

- inspect context;
- exit/clear scope if appropriate.

### Answer anatomy by investigation type

Recommended blocks:

```text
Answer / summary
Your data
What changed / context
What we can say
What we cannot conclude
Sources
Possible next step
```

Not every answer needs every heading; renderer should avoid repetitive boilerplate.

### Visual distinction

Personal data/calculations and external medical evidence must be visually distinguishable.

---

# AI-03 — Global Conversation — MVP

**Purpose:** cross-domain question when no object context is supplied.

The UI may show a compact `Using your health data` disclosure, but full categories live in Context Inspector.

If question can be answered deterministically (`What was my last HbA1c?`), response should remain concise rather than pretending deep AI reasoning.

---

# AI-04 — Context Inspector — MVP

**Purpose:** make personal-data use inspectable.

Display by category/time window, not raw record dump:

```text
Included
- Sleep · 30 days
- Resting HR · 30 days
- Medication changes · 60 days

Not used
- Nutrition
- Older records
```

### Optional manage mode

Allow user to exclude optional context for current question where product supports it. Required context should explain why it is required or prevent that analysis.

Do not expose internal context tokens/chunks/model prompt.

---

# AI-05 — Sources Panel — MVP

Separate:

### Your data

- observation/calculation/source record;
- date/period;
- source/provider.

### Medical evidence

- source title/organization;
- date/version;
- claim relevance.

Do not combine into one undifferentiated `Sources (4)` list after opening.

---

# AI-06 — Claim/Source Detail — V1

For consequential claims, user can inspect:

- claim;
- type: personal fact / calculation / medical fact / association / hypothesis;
- supporting source(s);
- uncertainty.

This should be power-user transparency, not mandatory reading.

---

# AI-07 — AI Unavailable — MVP

Must communicate:

- health data remains available;
- calculations/What Changed unaffected if true;
- user can view underlying data;
- retry is optional.

Avoid total outage language.

---

# AI-08 — Evidence Unavailable — MVP

If medical interpretation requires external evidence but retrieval fails:

- show personal facts/calculations that are valid;
- explicitly withhold/limit interpretation;
- offer retry later;
- do not silently fall back to model memory for substantive medical claim.

---

# AI-09 — Restricted/Safety Response — MVP

Used when request exceeds product boundary (e.g., treatment modification) or safety flow applies.

Design requirements:

- short explanation of boundary;
- useful safe alternative;
- no repetitive generic disclaimer;
- for urgent state, action before explanation;
- distinct from technical error state.

Example structure:

```text
I can help review your current medication and recorded instructions,
but I won't change a prescribed dose.

[Review medication]
[Prepare questions]
```

---

# 2. Conversation mechanics

## User messages

Keep normal chat affordances, but health writes should not commit from message itself.

## Structured cards in conversation

Allowed:

- metric/result card;
- source card;
- symptom write preview;
- appointment-question draft;
- context summary.

Avoid generic `AI insight` gradient cards.

## Follow-up suggestions

Should be context-aware and finite, e.g. 2–3 chips. Do not keep generating infinite rabbit-hole prompts.

---

# 3. Input behavior

Support:

- text;
- attachment entry only when supported;
- stop/cancel generation;
- retry.

Future voice can map to same transcript/confirmation semantics.

Do not place `Record`/`Save` implicit inside send action.

---

# 4. Answer density

Three response modes:

### Compact fact
For retrieval. Example: last measurement/date/source.

### Structured explanation
For C2-style interpretation.

### Investigation
For cross-domain/context questions.

Use progressive disclosure instead of always producing long prose.

---

# 5. Citations/source interaction

Do not rely on tiny numbered footnotes only. Health claims need source affordance discoverable on mobile.

Recommended:

- inline source marker on consequential claim where useful;
- `Sources` block/panel;
- source detail deep link.

---

# 6. AI loading

Avoid theatrical `Analyzing your body…`.

Use truthful stages only if they correspond to real product states:

- `Reviewing your recent data…`;
- `Checking sources…`.

If response is quick, generic activity indicator is sufficient.

---

# 7. Safety-specific interaction

Urgent path should not wait for long evidence/reasoning animations. Treatment-restricted answers should redirect to supported tasks.

---

# 8. AI acceptance criteria

Users can correctly identify:

- what came from their personal records;
- what was calculated;
- what is general medical evidence;
- what is AI interpretation;
- what data categories were used;
- whether a proposed action writes/shares data.
