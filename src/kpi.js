/**
 * Portfolio KPIs — every number the dashboard shows is computed here from
 * the working dataset. Nothing is typed in as a string.
 */

import { phaseHealth } from './gantt.js';

const round = (v, dp = 0) => Number(v.toFixed(dp));

/**
 * Share of phases that have started and are on schedule (within tolerance).
 * Phases not yet started are excluded — they cannot be late yet.
 */
export function onTimeDelivery(phases, month) {
  const started = phases.filter((p) => month >= p.start);
  if (!started.length) return { value: null, on: 0, total: 0 };
  const on = started.filter((p) => phaseHealth(p, month) === 'on').length;
  return { value: round((on / started.length) * 100), on, total: started.length };
}

/** Distribution of started phases across health bands. */
export function deliveryConfidence(phases, month) {
  const started = phases.filter((p) => month >= p.start);
  const counts = { on: 0, risk: 0, off: 0 };
  for (const p of started) counts[phaseHealth(p, month)] += 1;
  const total = started.length;
  const pct = (n) => (total ? round((n / total) * 100) : 0);
  return { total, on: pct(counts.on), risk: pct(counts.risk), off: pct(counts.off), counts };
}

/** Module completion, weighted by learners so a 120-learner cohort counts more than an 18-learner one. */
export function cohortCompletion(cohorts) {
  let done = 0;
  let total = 0;
  for (const c of cohorts) {
    if (!c.modulesTotal || !c.learners) continue;
    done += (c.modulesDone / c.modulesTotal) * c.learners;
    total += c.learners;
  }
  return total ? round((done / total) * 100) : null;
}

/** Per-cohort completion %, for the bars. */
export function cohortProgress(cohort) {
  return cohort.modulesTotal ? round((cohort.modulesDone / cohort.modulesTotal) * 100) : 0;
}

/** Spent / allocated across the portfolio, and per program. */
export function budgetUtilization(programs) {
  const spent = programs.reduce((a, p) => a + p.budgetSpent, 0);
  const allocated = programs.reduce((a, p) => a + p.budgetAllocated, 0);
  return {
    value: allocated ? round((spent / allocated) * 100) : null,
    spent,
    allocated,
    perProgram: programs.map((p) => ({
      id: p.id,
      pct: p.budgetAllocated ? round((p.budgetSpent / p.budgetAllocated) * 100) : 0
    }))
  };
}

/** Response-weighted mean of the cohort surveys (1–5). */
export function learnerSatisfaction(cohorts) {
  let sum = 0;
  let n = 0;
  for (const c of cohorts) {
    if (!c.survey || !c.survey.n) continue;
    sum += c.survey.mean * c.survey.n;
    n += c.survey.n;
  }
  return n ? { value: round(sum / n, 1), responses: n } : { value: null, responses: 0 };
}

/**
 * A program's status is the worst health of its phases; programs with no
 * started phase are 'on' (nothing has had the chance to slip).
 * @returns {'on'|'risk'|'off'}
 */
export function programStatus(programId, phases, month) {
  const mine = phases.filter((p) => (p.program === programId || p.program === 'all') && month >= p.start);
  const order = { on: 0, risk: 1, off: 2 };
  return mine.reduce((worst, p) => {
    const h = phaseHealth(p, month);
    return order[h] > order[worst] ? h : worst;
  }, 'on');
}

/** Signed change against the previous-period snapshot; null when either side is missing. */
export function delta(current, previous, dp = 0) {
  if (current == null || previous == null) return null;
  return round(current - previous, dp);
}

/** Outcome vs target. */
export function outcomeHit(outcome) {
  return outcome.value >= outcome.target;
}
