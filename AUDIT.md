# AUDIT — EdTech Program Command Center (pre-refactor)

Audit of the previous single-file `index.html` (381 lines: ~100 lines of CSS,
~110 lines of markup, ~150 lines of inline JavaScript). Line numbers refer to
that file as it stood on `main` before this change.

The interface was good — five views a programme manager would recognise. The
findings are that **almost nothing on it was computed**, that the governance
artefacts were not checked against the rules they represent, and the usual
single-file hygiene.

---

## A. Correctness — headline numbers that read nothing

### A1 — Every KPI was a typed string beside data it ignored

```js
237: {l:"On-Time Delivery", n:"87%", d:"milestones this quarter", t:"+6 pts", …}
238: {l:"Cohort Completion", n:"91%", …, t:"+3 pts"}
241: {l:"Open Risks", n:"5", d:"2 high severity", t:"-1", …}
```

The roadmap had seven phases with progress figures, the cohort list had five
completion figures and the risk register had five rows, and none of them fed
the dashboard. "87% on time" was a literal. The trends ("+6 pts") compared a
literal to nothing.

**Fix:** `src/kpi.js` computes every card from the working dataset: on-time
delivery as the share of *started* phases within a stated tolerance of their
expected progress; completion weighted by learners; satisfaction weighted by
survey responses; budget as spent over allocated; open risks by band. Deltas
compare against an explicit prior-period snapshot in the dataset, labelled on
screen as sample data. Computed honestly, the sample portfolio is at **33%
on time**, not 87% — which is the more useful number for a demo of a
console whose job is to tell the truth.

### A2 — "Delivery confidence" was three constants

```js
308: const on=68,risk=21,off=11
```

The donut never looked at a phase. It is now `deliveryConfidence()`: started
phases banded by schedule variance, with the counts in the legend.

### A3 — Programme status and budget were typed in

`programs` carried `status:"On track"` and `budget:78` as literals (lines
231–235). Status is now the worst band among the programme's started phases;
budget is `budgetSpent / budgetAllocated` from two real figures.

### A4 — The RACI chart violated RACI

RACI's one rule is *exactly one Accountable per workstream*. The sample chart
(lines 264–270) had **three workstreams with nobody Accountable** (Platform /
LMS, Faculty enablement, Assessment & QA) and one with nobody Responsible
(Stakeholder comms). Nothing checked, so the chart displayed a governance
model that could not govern.

**Fix:** `src/raci.js` validates the chart — exactly one A, at least one R,
valid letters, and a warning when one person is Accountable for everything —
and the console lists every violation under the table. The sample data is
kept as it was so the validator has something to show; a test pins all four
findings.

### A5 — Risk "severity (probability × impact)" was a label

Line 206 told the reader severity was probability × impact; the data
(lines 271–277) carried `sev:"hi"` and no probability or impact at all.
Risks now carry both on a 1–5 scale, `riskScore()` multiplies them, and
severity is banded at explicit thresholds (≥ 15 high, ≥ 8 medium). A 5×5
heat map is derived from the same numbers. The threshold constants are
exported and tested at their boundaries.

### A6 — "Work-in-progress is tracked per column" — it was counted, not limited

Line 176 promised WIP tracking; the board counted cards and enforced nothing.
Columns now carry a `wip` limit; `moveTask()` refuses a move that would
breach it and says why, with an explicit override the user must tick.

### A7 — Roadmap bars showed progress with no notion of expected progress

A bar at 45% in month 6 of a phase that ends in month 6 looked identical to
a bar at 45% in month 1. `expectedProgress()` and `scheduleVariance()` put a
marker on every bar for where it should be today, and the band that results
is the same one the dashboard uses (A1), so the two views cannot disagree.

---

## B. Security

- **B1** Inline drag-and-drop handlers `ondragover=`, `ondrop=`,
  `ondragleave=`, `ondragstart=`, `ondragend=` (lines 334, 336) and four
  functions attached to `window` to serve them. Now `addEventListener` in
  the render layer; nothing on `window`.
- **B2** One inline `<script>`, one inline `<style>`, ~30 inline `style=`
  attributes — no strict CSP possible. Now `default-src 'none';
  script-src 'self'`, no inline anything; `html-validate` enforces
  `no-inline-style`.
- **B3** `innerHTML` with interpolated strings in every render function
  (292, 300, 311, 329, 332, …). Harmless on hard-coded sample data; this
  build adds CSV import, so every string now goes through `textContent`.
- **B4** CSV import is new and therefore audited on arrival: RFC 4180
  parsing with quoted fields, header validation, per-row validation with
  the row number in every warning, text fields normalised and length-capped,
  duplicate ids rejected, unknown programme and owner references reported.

---

## C. Accessibility

- **C1** Drag-and-drop was the only way to move a card — unusable from a
  keyboard. Every card now has a "Move to" control.
- **C2** Tabs were buttons toggling a class: no `tablist`/`tab`/`tabpanel`
  roles, no `aria-selected`, no arrow-key navigation. Fixed.
- **C3** Gantt bars conveyed their meaning by `title=` hover text only
  (line 324). Each bar is now `role="img"` with a label stating progress,
  expected progress and band.
- **C4** The donut was an SVG with no accessible name; the flash message was
  invisible to assistive technology. The donut has an `aria-label`
  summarising the bands; status is a `role="status"` region.
- **C5** RACI letters were bare glyphs; each now carries its full word as an
  accessible name. Status colour is paired with text everywhere.
- **C6** Two `<h1>`s once the shell was added; demoted the page heading.

---

## D. Engineering hygiene

- **D1** Module-level mutable state (`let tasks`, `let dragId`). Now a
  single working dataset, with board operations immutable and tested.
- **D2** No `package.json`, tests, lint or CI. Now 60 Vitest tests over the
  pure modules at 100% statement coverage, ESLint flat config, html-validate,
  Trivy and CodeQL in CI.
- **D3** The footer linked to LinkedIn, an external origin outside the CSP
  allow-list; the shell footer carries the standard links.

---

## E. What is new (not fixes)

CSV import and export for risks, cohorts and tasks; prior-period deltas
from an explicit snapshot; a 5×5 risk heat map; RACI load per person; a
"reset to sample" control; a tour whose steps refuse a WIP breach, list the
RACI violations and import a CSV with a deliberately bad row.
