import { describe, it, expect } from 'vitest';
import { heatMap, openRisks, riskScore, riskSummary, severity, validateRisk } from '../src/risk.js';
import { samplePortfolio } from '../src/data.js';

const { risks } = samplePortfolio();

describe('scoring', () => {
  it('score is probability × impact and bands by thresholds', () => {
    expect(riskScore({ probability: 4, impact: 5 })).toBe(20);
    expect(severity({ probability: 3, impact: 5 })).toBe('high');   // 15
    expect(severity({ probability: 2, impact: 4 })).toBe('medium'); // 8
    expect(severity({ probability: 2, impact: 3 })).toBe('low');    // 6
    expect(severity({ probability: 1, impact: 1 })).toBe('low');
  });
  it('the sample: two high, two medium, one low open; one closed', () => {
    expect(riskSummary(risks)).toEqual({ open: 5, high: 2, medium: 2, low: 1, exposure: 20 + 16 + 9 + 10 + 6, closed: 1 });
  });
  it('open risks are sorted by score then title', () => {
    expect(openRisks(risks).map((r) => r.id)).toEqual(['r1', 'r2', 'r4', 'r3', 'r5']);
  });
});

describe('validateRisk', () => {
  it('accepts a valid row', () => {
    expect(validateRisk({ title: 'x', probability: 1, impact: 5, status: 'open' })).toEqual([]);
  });
  it('rejects out-of-scale, non-integer, missing title and bad status', () => {
    const p = validateRisk({ title: '', probability: 0, impact: 2.5, status: 'maybe' });
    expect(p).toHaveLength(4);
  });
});

describe('heatMap', () => {
  it('places open risks at [impact-1][probability-1]', () => {
    const g = heatMap(risks);
    expect(g[4][3]).toBe(1); // r1: p4 i5
    expect(g[3][3]).toBe(1); // r2
    expect(g[3][0]).toBe(0); // r6 is closed
    expect(g.flat().reduce((a, b) => a + b, 0)).toBe(5);
  });
});
