<h1 align="center">EdTech Program Command Center</h1>

<p align="center">
  <em>Run educational program delivery like a technical PMO — roadmap, agile board, cohort analytics, RACI, and risk register in one console.</em>
</p>

<p align="center">
  <a href="https://freddricklogan.github.io/edtech-program-command-center/"><img src="https://img.shields.io/badge/Live_Demo-Open_App-7c5cff?style=for-the-badge&logo=github" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Domain-Program_Management-7c5cff" alt="Program Management">
  <img src="https://img.shields.io/badge/EdTech-Delivery-25d6c4" alt="EdTech">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla_ES6-f7df1e?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Dependencies-None-success" alt="No dependencies">
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="License">
</p>

---

## Overview

**EdTech Program Command Center** is a project-management console for the people who *deliver*
education — program managers, instructional leaders, and technology teams running curriculum builds,
platform rollouts, and cohort-based learning at scale.

It brings the discipline of a technical Program Management Office (PMO) to educational delivery:
a KPI dashboard, a curriculum **roadmap (Gantt)**, a drag-and-drop **agile delivery board**,
**cohort progress analytics**, and governance artifacts (**RACI** and a live **risk register**) — all
in one responsive, dependency-free interface.

It's the intersection the best EdTech leaders live at: rigorous delivery management *and* genuine
understanding of learning outcomes.

> **▶ [Launch the live demo](https://freddricklogan.github.io/edtech-program-command-center/)**

---

## Why this project

| Skill demonstrated | Where it shows up |
|:--|:--|
| **Technical program management** | Portfolio health, KPIs, Gantt roadmap, delivery-confidence rollups |
| **Agile delivery** | Drag-and-drop board with WIP tracking across Backlog → In Progress → Review → Done |
| **Governance & risk** | RACI matrix and a severity-scored risk register with mitigation owners |
| **Learning analytics** | Cohort completion and outcome metrics vs. targets |
| **Front-end engineering** | Hand-built Gantt, donut, and drag-and-drop — **zero libraries** |

---

## Features

- **Executive dashboard** — on-time delivery, cohort completion, budget utilization, satisfaction, open risks, plus a portfolio health table and a delivery-confidence donut.
- **Curriculum & delivery roadmap** — a Gantt view from design through delivery and evaluation, with per-phase % complete and milestones.
- **Delivery board** — a working agile board; drag cards between columns to update status, with live WIP counts.
- **Cohort analytics** — module completion by cohort and outcome metrics against targets.
- **Governance** — a RACI matrix and a live risk register (probability × impact) with owners and mitigations.

---

## Tech stack

- **Language:** Vanilla JavaScript (ES6+)
- **Visualization:** Hand-built SVG/CSS (Gantt, donut, progress meters) — no charting library
- **Runtime:** 100% client-side — no backend, no build step, no dependencies

---

## Run locally

```bash
git clone https://github.com/Freddricklogan/edtech-program-command-center.git
cd edtech-program-command-center

# open index.html directly, or serve it:
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Author

**Freddrick Logan** — Educational Technologist & Technology Leader
[GitHub](https://github.com/Freddricklogan) · [LinkedIn](https://www.linkedin.com/in/freddricklogan/)

## License

Released under the [MIT License](LICENSE). Sample program data is illustrative.
