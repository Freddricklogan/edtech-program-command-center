/**
 * Sample portfolio — illustrative data for a fictional educational PMO.
 *
 * Everything the console displays is computed from this file by the pure
 * modules (`kpi.js`, `board.js`, `raci.js`, `risk.js`, `gantt.js`). The
 * previous build hard-coded every headline number as a string next to data
 * it did not read; here a number on screen is always a function of a row
 * below, and can be replaced by a CSV import.
 */

export const META = {
  period: 'Q3 · FY26',
  /** Zero-based month index used as "today" for schedule maths, so runs are deterministic. */
  currentMonth: 6,
  /** Prior-period snapshot for the KPI deltas — also sample data, labelled as such on screen. */
  previous: { onTime: 40, completion: 58, satisfaction: 4.4, openRisks: 6 }
};

export const PEOPLE = [
  { id: 'FL', name: 'F. Logan' },
  { id: 'AR', name: 'A. Rivera' },
  { id: 'MC', name: 'M. Chen' },
  { id: 'SP', name: 'S. Patel' }
];

/** @typedef {{ id: string, name: string, lead: string, budgetAllocated: number, budgetSpent: number }} Program */
/** @type {Program[]} */
export const PROGRAMS = [
  { id: 'analytics', name: 'Data Analytics Bootcamp', lead: 'FL', budgetAllocated: 240000, budgetSpent: 187200 },
  { id: 'stem', name: 'K-12 STEM Curriculum', lead: 'AR', budgetAllocated: 410000, budgetSpent: 262400 },
  { id: 'faculty', name: 'Faculty AI Upskilling', lead: 'MC', budgetAllocated: 95000, budgetSpent: 38950 },
  { id: 'lms', name: 'District LMS Migration', lead: 'SP', budgetAllocated: 180000, budgetSpent: 165600 }
];

/**
 * Roadmap phases. `start`/`end` are zero-based month indexes (end exclusive);
 * `progress` is reported % complete; `milestone` is an optional month index.
 * @typedef {{ id: string, title: string, program: string, start: number, end: number, progress: number, milestone?: number }} Phase
 */
/** @type {Phase[]} */
export const PHASES = [
  { id: 'p1', title: 'Needs Analysis & Design', program: 'analytics', start: 0, end: 2, progress: 100 },
  { id: 'p2', title: 'Curriculum Development', program: 'analytics', start: 1, end: 4, progress: 85 },
  { id: 'p3', title: 'Platform / LMS Setup', program: 'lms', start: 2, end: 5, progress: 70 },
  { id: 'p4', title: 'Pilot Cohort', program: 'stem', start: 4, end: 6, progress: 45, milestone: 6 },
  { id: 'p5', title: 'Faculty Enablement', program: 'faculty', start: 3, end: 6, progress: 60 },
  { id: 'p6', title: 'Full Delivery', program: 'analytics', start: 6, end: 10, progress: 15 },
  { id: 'p7', title: 'Assessment & Evaluation', program: 'all', start: 8, end: 11, progress: 0, milestone: 11 }
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @typedef {{ id: string, label: string, wip: number|null }} Column */
/** @type {Column[]} */
export const COLUMNS = [
  { id: 'backlog', label: 'Backlog', wip: null },
  { id: 'progress', label: 'In Progress', wip: 3 },
  { id: 'review', label: 'Review', wip: 2 },
  { id: 'done', label: 'Done', wip: null }
];

/** @typedef {{ id: string, title: string, program: string, priority: 'high'|'med'|'low', owner: string, column: string }} Task */
/** @type {Task[]} */
export const TASKS = [
  { id: 't1', title: 'Finalize Module 4 assessments', program: 'analytics', priority: 'high', owner: 'FL', column: 'progress' },
  { id: 't2', title: 'Record lab walkthrough videos', program: 'analytics', priority: 'med', owner: 'MC', column: 'backlog' },
  { id: 't3', title: 'STEM kit vendor selection', program: 'stem', priority: 'high', owner: 'AR', column: 'review' },
  { id: 't4', title: 'Migrate gradebook data', program: 'lms', priority: 'high', owner: 'SP', column: 'progress' },
  { id: 't5', title: 'Accessibility audit (WCAG 2.1)', program: 'lms', priority: 'med', owner: 'SP', column: 'backlog' },
  { id: 't6', title: 'Faculty AI workshop deck', program: 'faculty', priority: 'low', owner: 'MC', column: 'done' },
  { id: 't7', title: 'Pilot cohort onboarding', program: 'stem', priority: 'med', owner: 'AR', column: 'progress' },
  { id: 't8', title: 'Define outcome rubrics', program: 'analytics', priority: 'low', owner: 'FL', column: 'done' },
  { id: 't9', title: 'Stakeholder steering readout', program: 'all', priority: 'med', owner: 'FL', column: 'review' }
];

/**
 * Cohorts: module completion and the end-of-module survey (1–5 mean, n responses).
 * @typedef {{ id: string, name: string, program: string, learners: number, modulesTotal: number, modulesDone: number, survey: { mean: number, n: number } }} Cohort
 */
/** @type {Cohort[]} */
export const COHORTS = [
  { id: 'c1', name: 'Analytics · Cohort A', program: 'analytics', learners: 28, modulesTotal: 11, modulesDone: 9, survey: { mean: 4.7, n: 26 } },
  { id: 'c2', name: 'Analytics · Cohort B', program: 'analytics', learners: 31, modulesTotal: 11, modulesDone: 6, survey: { mean: 4.5, n: 24 } },
  { id: 'c3', name: 'STEM · Spring Pilot', program: 'stem', learners: 120, modulesTotal: 8, modulesDone: 5, survey: { mean: 4.4, n: 98 } },
  { id: 'c4', name: 'Faculty · Group 1', program: 'faculty', learners: 18, modulesTotal: 6, modulesDone: 6, survey: { mean: 4.8, n: 17 } },
  { id: 'c5', name: 'Faculty · Group 2', program: 'faculty', learners: 22, modulesTotal: 6, modulesDone: 2, survey: { mean: 4.3, n: 12 } }
];

/** @typedef {{ id: string, name: string, value: number, target: number }} Outcome */
/** @type {Outcome[]} */
export const OUTCOMES = [
  { id: 'o1', name: 'Competency mastery', value: 88, target: 85 },
  { id: 'o2', name: 'Assignment completion', value: 91, target: 90 },
  { id: 'o3', name: 'Weekly active learners', value: 76, target: 80 },
  { id: 'o4', name: 'Peer collaboration index', value: 71, target: 70 }
];

/**
 * RACI: one row per workstream, one letter per person id. The sample
 * deliberately keeps the earlier build's assignments so the validator has
 * something to find — three workstreams have nobody Accountable and one has
 * nobody Responsible.
 * @typedef {{ workstream: string, roles: Record<string, 'R'|'A'|'C'|'I'|''> }} RaciRow
 */
/** @type {RaciRow[]} */
export const RACI = [
  { workstream: 'Curriculum design', roles: { FL: 'A', AR: 'R', MC: 'C', SP: 'I' } },
  { workstream: 'Platform / LMS', roles: { FL: 'C', AR: 'I', MC: 'C', SP: 'R' } },
  { workstream: 'Faculty enablement', roles: { FL: 'C', AR: 'I', MC: 'R', SP: 'I' } },
  { workstream: 'Assessment & QA', roles: { FL: 'R', AR: 'C', MC: 'C', SP: 'I' } },
  { workstream: 'Stakeholder comms', roles: { FL: 'A', AR: 'C', MC: 'I', SP: 'C' } }
];

/**
 * Risks carry probability and impact on a 1–5 scale; severity is derived, not typed.
 * @typedef {{ id: string, title: string, program: string, probability: number, impact: number, owner: string, mitigation: string, status: 'open'|'closed' }} Risk
 */
/** @type {Risk[]} */
export const RISKS = [
  { id: 'r1', title: 'LMS data migration slips past cutover window', program: 'lms', probability: 4, impact: 5, owner: 'SP', mitigation: 'Parallel-run + phased cutover', status: 'open' },
  { id: 'r2', title: 'STEM kit procurement lead time', program: 'stem', probability: 4, impact: 4, owner: 'AR', mitigation: 'Dual-source vendors; early PO', status: 'open' },
  { id: 'r3', title: 'Faculty availability during term', program: 'faculty', probability: 3, impact: 3, owner: 'MC', mitigation: 'Async micro-modules + stipends', status: 'open' },
  { id: 'r4', title: 'Accessibility non-compliance', program: 'lms', probability: 2, impact: 5, owner: 'SP', mitigation: 'WCAG audit gate before launch', status: 'open' },
  { id: 'r5', title: 'Cohort B engagement dip', program: 'analytics', probability: 3, impact: 2, owner: 'FL', mitigation: 'Early-alert nudges + mentoring', status: 'open' },
  { id: 'r6', title: 'Vendor contract renewal lapse', program: 'lms', probability: 1, impact: 4, owner: 'SP', mitigation: 'Renewed 30 days early', status: 'closed' }
];

/** Deep-copy the sample so the app can mutate its working set freely. */
export function samplePortfolio() {
  return structuredClone({
    meta: META, people: PEOPLE, programs: PROGRAMS, phases: PHASES, columns: COLUMNS,
    tasks: TASKS, cohorts: COHORTS, outcomes: OUTCOMES, raci: RACI, risks: RISKS
  });
}
