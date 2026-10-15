---
title: "MyPhisys AI Interaction Patterns"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# AI Interaction Patterns

## 1. Principle

AI is a **reasoning and language layer over structured health context**, not the navigation shell and not the database.

Product design should constantly reinforce:

```text
My data / calculated facts
        ↓
AI interpretation
```

not the reverse.

## 2. Entry patterns

### Pattern A — Scoped Ask — preferred
Entry from Insight, Metric, Lab, Event.

Benefits:

- context is obvious;
- user asks less setup text;
- retrieval scope is narrower;
- answer is easier to audit.

### Pattern B — Global Ask
Used for cross-domain questions or natural retrieval.

Trade-off: more ambiguity; context inspection becomes more important.

### Pattern C — Embedded explanation
Small contextual CTA such as `Explain this result`; opens scoped conversation rather than rendering hidden AI copy in place.

## 3. Prompt suggestions

Suggestions should be derived from *available capabilities/data*, not engagement heuristics.

Categories:

- explain;
- compare;
- summarize;
- prepare;
- retrieve.

Avoid diagnosis-bait and emotionally loaded suggestions.

## 4. Answer structure patterns

### Fact answer

```text
[Answer]
[Date/source]
[Optional view history]
```

### Trend/change answer

```text
What changed
Comparison basis
Data quality
Source
```

### Interpretation

```text
Short answer
Your context
General evidence
Uncertainty
Sources
```

### Investigation

```text
Observed changes
Nearby context
Possible explanations
What cannot be concluded
Missing data
Sources
```

### Action-oriented preparation

```text
Summary
Questions worth discussing
Relevant records
Save/Add to appointment
```

## 5. Personal vs external evidence pattern

Never visually merge:

```text
YOUR DATA
- Sleep ↓46 min
- Resting HR ↑6 bpm

MEDICAL EVIDENCE
- guideline/review claim
```

This distinction should survive copying/export where feasible.

## 6. Context Inspector pattern

Default summary shows categories + date windows. Advanced details can list specific records if needed.

User mental model:

> “What did MyPhisys look at for this answer?”

Not:

> “What tokens were in the prompt?”

## 7. Uncertainty pattern

Use semantic statements:

- `Based on available records`;
- `Limited data`;
- `Possible explanation`;
- `These changes overlap in time`;
- `The available data doesn't establish causation`;
- `Records don't agree`.

Avoid uncalibrated confidence percentages.

## 8. Missing-data pattern inside answer

If missingness changes conclusion, surface near reasoning:

```text
What we don't know
- no nutrition data for this period
- medication adherence is incomplete
```

Do not bury in footer disclaimer.

## 9. Structured action preview

Whenever AI proposes a write/share:

```text
Conversation
→ candidate card
→ edit / confirm / cancel
→ commit
```

Candidate card must display the *complete material payload* that will be persisted/shared.

## 10. Tool/action transparency

Do not narrate internal tool calls (`I'm querying database`). Instead expose user-relevant operations:

- `Using your sleep data from the last 30 days`;
- `Checking current medical sources` when useful.

## 11. Generation states

Recommended:

- neutral activity indicator for short operations;
- truthful stage label for longer evidence/context flows;
- `Stop` when generation can be cancelled.

Avoid fake multi-stage animation purely for perceived intelligence.

## 12. Refusal/restriction pattern

A good restriction contains:

1. capability boundary;
2. supported alternative;
3. optional relevant data action.

Bad:

> I cannot give medical advice. Consult a doctor.

Better:

> I can help review the recorded dose, medication history and relevant questions, but I won't change a prescribed dose.

## 13. Urgent pattern

For policy-defined urgent flow:

- recommended real-world action first;
- concise reason;
- relevant immediate context;
- no exploratory “differential diagnosis” chat before action.

The exact content requires clinical review; design must support action-first hierarchy.

## 14. Conversation history

Titles should reflect subject (`Sleep change · Oct 7`) rather than auto-generated sensational summary.

Conversation history is not a clinical record. If an answer creates a persistent artifact, it should be explicitly saved/exported.

## 15. Editing context

Allow per-question exclusion of optional data categories only if model/runtime supports it safely. Do not create a privacy control that doesn't actually affect context.

## 16. AI iconography

Do not use sparkle as universal AI sign. `Ask MyPhisys` can use a simple conversational/search-like affordance consistent with brand.

## 17. AI design acceptance criteria

- User understands scope of a scoped chat.
- User can identify personal vs external evidence.
- User can inspect context categories.
- AI-generated action cannot silently commit data.
- Degraded AI doesn't block core data access.
- Safety boundary still offers a useful next path.
