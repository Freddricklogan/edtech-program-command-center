# Case Study — EdTech Program Command Center

**Repository:** [edtech-program-command-center](https://github.com/Freddricklogan/edtech-program-command-center) · **Live demo:** [freddricklogan.github.io/edtech-program-command-center](https://freddricklogan.github.io/edtech-program-command-center/) · **Author:** Freddrick Logan

---

## 1. Who has this problem

Anyone who runs several educational programmes at once and reports upward on them: the director of a career-readiness programme like Elevate at Illinois Tech, a district office rolling out a curriculum and a learning platform in one year, a workforce board funding cohorts across providers. Each has a roadmap, a task list, cohorts, a governance chart and a risk register — five hand-maintained files, summarised for leadership in a slide whose numbers nobody can trace.

## 2. The problem, as a scenario

A quarterly steering meeting. The director presents a dashboard: 87% on-time delivery, up six points; delivery confidence 68% green. A board member asks which phases are late. The director does not know; the 87% was typed into the slide from a feeling about the roadmap. Another member asks who is accountable for the platform migration that is visibly slipping. The RACI chart goes up; that row reads C, I, C, R. Nobody is accountable, and the chart has said so for a year without anyone reading it.

## 3. What it costs to leave it alone

A dashboard that cannot be wrong cannot be useful. The cost is decisions taken on a green slide over a red roadmap: the intervention that would have saved a cohort goes unfunded because the page said it was fine. Education programmes are often grant-funded and reported to a funder, so an untraceable figure is also a reporting risk — the kind that surfaces in an audit. I will not attach a dollar figure; it depends on the programme's size and on what the funder does when the numbers do not reconcile.

## 4. The approach, and the alternative I rejected

I rebuilt the console so that every figure on screen is a function of the data on the same page. On-time delivery is the share of started phases within a stated tolerance of where they should be this month; completion is weighted by learners, satisfaction by survey responses, budget is spent over allocated. The board enforces work-in-progress limits and refuses a move with the reason. The RACI chart is validated against the rule that defines it. Risks carry probability and impact and are scored. Any of it can be replaced by the reader's own CSV.

The alternative I rejected was to keep the polished interface and wire a back end to it. The interface already worked; the defect was between the data and the numbers — pure logic, testable in isolation. Fixing it also meant the sample portfolio had to tell the truth — computed honestly it is at 33% on time with three of four programmes off track — a better demonstration than a flattering one.

## 5. What the code does today

Real: the schedule mathematics, every KPI, programme status derivation, the WIP-limited board with a keyboard path for every move, the RACI validator and per-person load, the scored risk register and heat map, and CSV import and export with row-level validation. All of it is unit-tested pure logic, separated from a rendering layer that builds the page through `textContent` only.

Simulated: the portfolio. Programmes, phases, cohorts, people and risks are illustrative sample data, as are the prior-period figures the deltas compare against; the page says so in both places.

Worth knowing: rebuilding this exposed that the earlier version computed nothing — the headline KPIs, the confidence donut and every programme status were typed literals beside data they never read — and that the sample RACI chart had three workstreams with nobody Accountable and one with nobody Responsible. The chart is kept so the validator has something to show; the full list is in the audit file.

## 6. Evidence

Measured in continuous integration and a headless-browser smoke test: 60 unit tests passing across seven files, 100% statement coverage over the pure modules, lint and HTML validation clean, CodeQL and dependency scanning enabled. In the browser: zero console errors; the tour's third step is refused by the In Progress limit of three with the reason on screen; the fourth lists four RACI findings; the fifth imports a three-row CSV, loads two rows and names the skipped one. No horizontal scroll at 400 pixels. Security posture: Content Security Policy with `default-src 'none'`, no script from any CDN, no inline handlers or styles.

## 7. What it would take to run this in production

For one programme office it is close: static hosting, CSV in and out. For an institution-wide portfolio it would need live sources rather than files — phases and tasks from the project tool in use, cohort completion from the learning platform, budget from finance — behind a small API with campus single sign-on and per-programme permissions; a scheduled snapshot so the deltas are history rather than sample data; and an export the steering committee can read. The judgement-heavy logic — bands, weights, validation — exists and is tested. Rough effort: integrations a few weeks each; the rest, days.

## 8. Limits and next steps

Twelve months on one calendar, no phase dependencies, no resource capacity, no cost-to-complete, no board history so no cycle time. Next: phase dependencies with critical-path flagging, a monthly snapshot so trends are real, and an outcome model connecting cohort completion to funded targets rather than reporting them side by side.

## 9. Who should look at this

**Hiring manager:** evidence that I build the reporting layer for programmes I run, and would rather show 33% computed than 87% asserted.
**Consulting client:** a working model of a programme office's console to react to before choosing or building a portfolio tool — bring your own roadmap as CSV.
**Engineer:** read `src/kpi.js`, `src/raci.js` and `src/csv.js` for the logic, `tests/` for how it is verified, and the audit file for what the previous build displayed without computing.
