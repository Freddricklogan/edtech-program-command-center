import { describe, it, expect } from 'vitest';
import {
  budgetUtilization, cohortCompletion, cohortProgress, delta, deliveryConfidence,
  learnerSatisfaction, onTimeDelivery, outcomeHit, programStatus
} from '../src/kpi.js';
import { samplePortfolio } from '../src/data.js';

const sample = samplePortfolio();

describe('onTimeDelivery', () => {
  it('excludes phases that have not started', () => {
    const phases = [{ start: 0, end: 4, progress: 100 }, { start: 9, end: 12, progress: 0 }];
    expect(onTimeDelivery(phases, 6)).toEqual({ value: 100, on: 1, total: 1 });
  });
  it('is null with nothing started', () => {
    expect(onTimeDelivery([{ start: 9, end: 12, progress: 0 }], 6).value).toBeNull();
  });
  it('computes the sample portfolio from its phases, not a typed string', () => {
    const r = onTimeDelivery(sample.phases, sample.meta.currentMonth);
    expect(r.total).toBe(6); // p7 starts at month 8
    expect(r.on).toBe(2);    // p1 (100), p2 (85 vs 100 → risk), p3 (70 vs 100 → off), p4 (45 vs 100 → off), p5 (60 vs 100 → off), p6 (15 vs 0 → on)
    expect(r.value).toBe(33);
  });
});

describe('deliveryConfidence', () => {
  it('sums to 100 over started phases', () => {
    const d = deliveryConfidence(sample.phases, sample.meta.currentMonth);
    expect(d.total).toBe(6);
    expect(d.on + d.risk + d.off).toBe(100);
    expect(d.counts).toEqual({ on: 2, risk: 1, off: 3 });
  });
  it('is all zeros with nothing started', () => {
    expect(deliveryConfidence([], 3)).toEqual({ total: 0, on: 0, risk: 0, off: 0, counts: { on: 0, risk: 0, off: 0 } });
  });
});

describe('cohortCompletion', () => {
  it('weights by learners', () => {
    const cohorts = [
      { learners: 100, modulesTotal: 10, modulesDone: 10 },
      { learners: 100, modulesTotal: 10, modulesDone: 0 }
    ];
    expect(cohortCompletion(cohorts)).toBe(50);
    cohorts[1].learners = 300;
    expect(cohortCompletion(cohorts)).toBe(25);
  });
  it('skips cohorts with no modules or learners and returns null when nothing counts', () => {
    expect(cohortCompletion([{ learners: 0, modulesTotal: 5, modulesDone: 5 }])).toBeNull();
  });
  it('per-cohort progress', () => {
    expect(cohortProgress({ modulesTotal: 11, modulesDone: 9 })).toBe(82);
    expect(cohortProgress({ modulesTotal: 0, modulesDone: 0 })).toBe(0);
  });
});

describe('budgetUtilization', () => {
  it('is spent over allocated, portfolio-wide and per program', () => {
    const b = budgetUtilization(sample.programs);
    expect(b.spent).toBe(187200 + 262400 + 38950 + 165600);
    expect(b.allocated).toBe(240000 + 410000 + 95000 + 180000);
    expect(b.value).toBe(71);
    expect(b.perProgram.find((p) => p.id === 'lms').pct).toBe(92);
  });
  it('is null with no allocation', () => {
    expect(budgetUtilization([]).value).toBeNull();
  });
});

describe('learnerSatisfaction', () => {
  it('is response-weighted', () => {
    const r = learnerSatisfaction([{ survey: { mean: 5, n: 10 } }, { survey: { mean: 3, n: 30 } }]);
    expect(r).toEqual({ value: 3.5, responses: 40 });
  });
  it('ignores cohorts without responses', () => {
    expect(learnerSatisfaction([{ survey: { mean: 4, n: 0 } }, {}])).toEqual({ value: null, responses: 0 });
  });
});

describe('programStatus', () => {
  it('is the worst health of the program\'s started phases, including portfolio-wide phases', () => {
    const m = sample.meta.currentMonth;
    expect(programStatus('lms', sample.phases, m)).toBe('off');
    expect(programStatus('analytics', sample.phases, m)).toBe('risk');
    expect(programStatus('nothing', sample.phases, m)).toBe('on');
  });
});

describe('delta and outcomes', () => {
  it('computes signed deltas and tolerates missing sides', () => {
    expect(delta(87, 81)).toBe(6);
    expect(delta(4.62, 4.4, 1)).toBe(0.2);
    expect(delta(null, 3)).toBeNull();
  });
  it('outcome hit is inclusive of the target', () => {
    expect(outcomeHit({ value: 85, target: 85 })).toBe(true);
    expect(outcomeHit({ value: 84, target: 85 })).toBe(false);
  });
});
