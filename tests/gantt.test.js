import { describe, it, expect } from 'vitest';
import { barLayout, clamp, expectedProgress, phaseHealth, scheduleVariance, validatePhase } from '../src/gantt.js';

const ph = (start, end, progress, milestone) => ({ start, end, progress, milestone });

describe('expectedProgress', () => {
  it('is 0 before start, 100 at or after end, linear between', () => {
    const p = ph(2, 6, 0);
    expect(expectedProgress(p, 1)).toBe(0);
    expect(expectedProgress(p, 2)).toBe(0);
    expect(expectedProgress(p, 4)).toBe(50);
    expect(expectedProgress(p, 6)).toBe(100);
    expect(expectedProgress(p, 9)).toBe(100);
  });
  it('handles a zero-length phase without dividing by zero', () => {
    expect(expectedProgress(ph(3, 3, 0), 2)).toBe(0);
    expect(expectedProgress(ph(3, 3, 0), 3)).toBe(100);
  });
});

describe('health', () => {
  it('bands by variance with explicit tolerances', () => {
    const p = ph(0, 10, 50); // expected 50 at month 5
    expect(scheduleVariance(p, 5)).toBe(0);
    expect(phaseHealth(p, 5)).toBe('on');
    expect(phaseHealth({ ...p, progress: 45 }, 5)).toBe('on');     // -5: within tolerance
    expect(phaseHealth({ ...p, progress: 44 }, 5)).toBe('risk');   // -6
    expect(phaseHealth({ ...p, progress: 30 }, 5)).toBe('risk');   // -20: boundary is still risk
    expect(phaseHealth({ ...p, progress: 29 }, 5)).toBe('off');    // -21
  });
  it('ahead of schedule is on track', () => {
    expect(phaseHealth(ph(0, 10, 90), 5)).toBe('on');
  });
});

describe('barLayout', () => {
  it('positions bars and milestones as percentages, clamped to the view', () => {
    expect(barLayout(ph(3, 6, 0, 6), 12)).toEqual({ left: 25, width: 25, milestone: 50 });
    expect(barLayout(ph(10, 14, 0), 12)).toEqual({ left: expect.closeTo(83.33, 1), width: expect.closeTo(16.67, 1), milestone: null });
  });
  it('never produces a negative width', () => {
    expect(barLayout(ph(14, 15, 0), 12).width).toBe(0);
  });
});

describe('validatePhase', () => {
  it('accepts a sane phase', () => {
    expect(validatePhase(ph(1, 4, 50, 3), 6)).toEqual([]);
  });
  it('reports every problem', () => {
    const problems = validatePhase(ph(5, 4, 120, 9), 2);
    expect(problems).toContain('end must be after start');
    expect(problems).toContain('progress must be 0–100');
    expect(problems).toContain('progress reported before start');
    expect(problems).toContain('milestone outside phase');
  });
  it('clamp is inclusive', () => {
    expect(clamp(5, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
  });
});
