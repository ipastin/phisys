---
title: "MyPhisys Content Design & UX Writing"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Content Design & UX Writing

## 1. Voice

**Precise · Calm · Intelligent · Transparent · Personal**.

Information density can be high; emotional intensity should remain low unless genuine safety state requires otherwise.

## 2. Copy hierarchy

### Level 1 — fact
`Resting HR is 69 bpm.`

### Level 2 — comparison
`6 bpm above your recent baseline.`

### Level 3 — context
`Sleep duration decreased during the same period.`

### Level 4 — interpretation
`Shorter sleep is one possible contextual factor, but these data do not establish causation.`

Do not collapse all four into one dense paragraph when structure improves comprehension.

## 3. Preferred vocabulary

- What Changed
- recent baseline
- your recent range
- source reference range
- data available
- limited data
- records don't agree
- user reported
- calculated
- AI interpretation
- source
- context
- during the same period
- based on available records

## 4. Avoid vocabulary

- AI doctor;
- diagnosis product promise;
- optimize your body;
- abnormal when only personal deviation is known;
- dangerous/critical without safety policy;
- AI-powered as headline;
- smart insight;
- health score/readiness score unless separately validated feature;
- `good/bad` for direction.

## 5. Directional copy

Preferred:

```text
Increased by 6 bpm
Decreased by 46 min
Stable compared with recent baseline
```

Avoid:

```text
Improved
Worsened
Better
Bad
```

unless semantic target makes it objectively warranted and source is clear.

## 6. Baseline copy

Use:

- `vs your recent baseline`;
- `your recent range`;
- `previous 28 days`.

Never:

- `normal for you` if algorithm only computes recent range;
- `healthy range`.

## 7. Data quality copy

### Insufficient
`Not enough data for a reliable comparison yet.`

### Partial
`6 of 7 nights are available.`

### Stale
`Sleep data hasn't updated for 3 days.`

### Warm-up
`Building your recent baseline. You can already view your data.`

## 8. Conflict copy

Headline: `Records don't agree`.

Explain specific claims. Avoid `Data error` unless actual corruption occurred.

## 9. Permission copy

Formula:

```text
Action/category
+ concrete feature value
+ control/reversibility
```

Example:

`Add sleep data? This lets MyPhisys compare recent sleep with your usual pattern. You can change access later.`

## 10. Error copy

Template:

1. what failed;
2. impact;
3. next action.

Example:

`AI explanation is temporarily unavailable. Your health data and calculated changes are still available. [View change] [Try again]`

## 11. Safety-boundary copy

Specific, not boilerplate.

`I can help review the medication and recorded instructions, but I won't change a prescribed dose.`

Avoid beginning every health answer with `I'm not a doctor`.

## 12. Confirmation copy

Structured health write:

- title as question: `Record symptom?`;
- show exact payload;
- primary verb matches action: `Save symptom`;
- `Edit` and `Cancel` explicit.

## 13. Destructive copy

`Delete imported Health Connect data?`

Describe consequences and external-source distinction. Primary destructive button repeats action, not `Yes`.

## 14. Dates/time

Reflect source precision:

- exact: `Oct 7 · 08:35`;
- date: `Oct 7`;
- month: `March 2024`.

Do not invent precision.

## 15. Numeric style

- include unit;
- use decimal precision appropriate to source/display rules;
- percentage point (`pp`) vs percent (`%`) distinction in explanation;
- avoid excess converted decimals.

## 16. Empty-state copy

Empty states explain what creates value next; no motivational filler.

Example:

`No blood-pressure data yet. Add a measurement manually or connect a supported source.`

## 17. Localization

Design copy containers for RU/EN expansion. Avoid icon-only controls. Health terminology can expand significantly across languages.

Do not bake punctuation/units into component shapes that prevent localization.

## 18. Content QA checklist

- Does the copy state comparison basis?
- Is direction accidentally framed as judgement?
- Does source precision match displayed date/value?
- Is uncertainty adjacent to the qualified claim?
- Is action verb explicit?
- Could this wording create unnecessary health anxiety?
