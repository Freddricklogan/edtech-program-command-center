import { describe, it, expect } from 'vitest';
import { samplePortfolio } from '../src/data.js';
import { validatePhase } from '../src/gantt.js';
import { validateRisk } from '../src/risk.js';

describe('sample portfolio integrity', () => {
  const s = samplePortfolio();
  it('is a deep copy each time', () => {
    const a = samplePortfolio();
    a.tasks[0].column = 'done';
    expect(samplePortfolio().tasks[0].column).toBe('progress');
  });
  it('every reference resolves', () => {
    const programs = new Set([...s.programs.map((p) => p.id), 'all']);
    const people = new Set(s.people.map((p) => p.id));
    const columns = new Set(s.columns.map((c) => c.id));
    for (const p of s.programs) expect(people.has(p.lead)).toBe(true);
    for (const ph of s.phases) expect(programs.has(ph.program)).toBe(true);
    for (const t of s.tasks) { expect(programs.has(t.program)).toBe(true); expect(people.has(t.owner)).toBe(true); expect(columns.has(t.column)).toBe(true); }
    for (const c of s.cohorts) expect(programs.has(c.program)).toBe(true);
    for (const r of s.risks) { expect(programs.has(r.program)).toBe(true); expect(people.has(r.owner)).toBe(true); }
    for (const row of s.raci) for (const id of Object.keys(row.roles)) expect(people.has(id)).toBe(true);
  });
  it('phases and risks pass their own validators', () => {
    for (const ph of s.phases) expect(validatePhase(ph, s.meta.currentMonth)).toEqual([]);
    for (const r of s.risks) expect(validateRisk(r)).toEqual([]);
  });
  it('ids are unique within each collection', () => {
    for (const key of ['programs', 'phases', 'tasks', 'cohorts', 'outcomes', 'risks', 'people']) {
      const ids = s[key].map((x) => x.id);
      expect(new Set(ids).size, key).toBe(ids.length);
    }
  });
});
