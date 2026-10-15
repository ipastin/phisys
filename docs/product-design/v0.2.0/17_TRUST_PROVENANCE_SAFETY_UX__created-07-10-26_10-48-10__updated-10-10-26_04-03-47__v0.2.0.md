---
title: "MyPhisys Trust, Provenance & Safety UX"
created: "07-10-26 10-48-10"
updated: "10-10-26 04-03-47"
version: "0.2.0"
status: "draft-for-design"
commit: "docs(design): add cross-surface delivery strategy"
---

# Trust, Provenance & Safety UX

## 1. Trust model

Trust is built through **inspectability**, not repeated claims that MyPhisys is “accurate” or “secure”.

User should be able to answer:

- where did this fact come from?
- was it measured, reported, calculated or interpreted?
- compared to what?
- is data complete enough?
- what did AI use?

## 2. Epistemic UI model

Four primary user-facing classes:

```text
Medical record
User reported
Calculated
AI interpretation
```

Additional state labels:

```text
Records don't agree
Limited data
Data may be outdated
```

Do not introduce abstract trust score.

## 3. Provenance levels

### Level 0 — implicit
Most ordinary data: source icon/name may be enough.

### Level 1 — source summary
Source name, date, original app/provider, measurement type.

### Level 2 — trace
Original document/record, page/location, import/extraction status.

### Level 3 — calculation detail
Inputs, comparison period, sample count, algorithm human-readable description, version metadata in advanced view.

## 4. When provenance must be prominent

- imported lab/clinical value;
- conflicting record;
- AI answer making substantive claim;
- manual/user-reported data affecting reasoning;
- device/source transition affecting comparison;
- calculated insight that could be misread as clinical judgement.

## 5. “Why am I seeing this?”

This pattern explains *selection/meaningfulness*, not medical meaning.

Example:

```text
Your 7-day resting-HR median is above your previous 28-day baseline.
The difference persisted for 5 days.
7 of 7 days are available.
```

Keep separate from `What might this mean?` AI explanation.

## 6. Personal baseline vs clinical range

Visual and verbal distinction is mandatory.

```text
Your recent range
Source reference range
Clinical target
Your goal
```

Never label personal range `Normal`.

## 7. Conflicts

Use `Needs review` at collection level and `Records don't agree` at item level.

Do not use generic error icon/color; conflict is valid data state, not system failure.

Resolution design:

- show claims side-by-side;
- ask real-world question;
- preserve `I'm not sure`;
- explain what updating does.

## 8. Safety severity visual model

Do not overload one red warning component.

Recommended levels:

### Neutral qualification
`Limited data`, `Based on available records`.

### Attention
Needs review, stale source, permission issue.

### Restricted action
Boundary explanation + alternative.

### Urgent
Dedicated, action-first layout; critical semantic styling reserved here or similarly high-risk policy states.

## 9. Treatment boundary UX

When asked to modify medication/treatment:

- no fake “medical disclaimer card” before every answer;
- explain specific capability boundary;
- offer recorded regimen/history, evidence, appointment-question workflow.

## 10. Association/cause UX

Prefer phrases:

- `during the same period`;
- `changed around the same time`;
- `associated in your available data` only when analytics supports it.

Do not use causal arrows between event marker and metric series.

## 11. Source deletion/correction

If source correction invalidates insight:

- current views update;
- old insight must not continue as active fact;
- if history is shown, label it as historical/generated from earlier data snapshot.

## 12. Security/privacy indicators

Avoid decorative shields/checkmarks that imply blanket security guarantees. Explain concrete controls in Privacy/Connections instead.

## 13. Trust anti-patterns

- `AI confidence 93%` without calibrated definition;
- `Verified by AI`;
- one global `Health Score`;
- green `normal` based on personal baseline;
- hiding source because “AI summarized it”;
- red alert for all out-of-range values;
- fake clinical authority tone.

## 14. Safety UX review checklist

For each consequential screen ask:

- Can user misread descriptive change as diagnosis?
- Is uncertainty close to the claim it qualifies?
- Is source reachable?
- Is next action proportional?
- Are external sharing/write consequences previewed?
- Does error/degraded state create pressure to accept more permissions?
