import { describe, it, expect } from 'vitest';
import { raciLoad, validateRaci } from '../src/raci.js';
import { samplePortfolio } from '../src/data.js';

const { raci, people } = samplePortfolio();

describe('validateRaci', () => {
  it('finds the four defects in the sample chart carried over from the earlier build', () => {
    const r = validateRaci(raci, people);
    expect(r.valid).toBe(false);
    expect(r.errors.map((e) => `${e.workstream}: ${e.message}`)).toEqual([
      'Platform / LMS: nobody is Accountable',
      'Faculty enablement: nobody is Accountable',
      'Assessment & QA: nobody is Accountable',
      'Stakeholder comms: nobody is Responsible'
    ]);
  });
  it('flags two Accountables, no Responsible, and invalid letters', () => {
    const rows = [{ workstream: 'X', roles: { FL: 'A', AR: 'A', MC: 'Q' } }];
    const r = validateRaci(rows, people);
    expect(r.errors.map((e) => e.message)).toEqual([
      '2 people are Accountable; RACI allows one',
      'nobody is Responsible',
      'invalid letter "Q" for MC'
    ]);
  });
  it('warns when one person is Accountable for everything (3+ rows)', () => {
    const rows = ['a', 'b', 'c'].map((w) => ({ workstream: w, roles: { FL: 'A', AR: 'R' } }));
    const r = validateRaci(rows, people);
    expect(r.valid).toBe(true);
    expect(r.warnings).toEqual([{ person: 'FL', message: 'accountable for every workstream' }]);
  });
  it('tolerates empty roles', () => {
    expect(validateRaci([{ workstream: 'X' }], people).errors).toHaveLength(2);
  });
});

describe('raciLoad', () => {
  it('counts R and A per person', () => {
    const load = raciLoad(raci, people);
    expect(load.find((p) => p.id === 'FL')).toEqual({ id: 'FL', name: 'F. Logan', responsible: 1, accountable: 2 });
    expect(load.find((p) => p.id === 'SP').responsible).toBe(1);
  });
});
