import { describe, it, expect } from 'vitest';
import {
  COHORT_COLUMNS, RISK_COLUMNS, TASK_COLUMNS, cohortsToRows, csvField, importCohorts, importRisks,
  importTasks, parseCsv, toCsv
} from '../src/csv.js';
import { samplePortfolio } from '../src/data.js';

const { columns, risks, cohorts, tasks } = samplePortfolio();

describe('parseCsv', () => {
  it('parses headers, quotes, doubled quotes, embedded newlines, CRLF and a BOM', () => {
    const text = '﻿Title,Note\r\n"Say ""hi""","line1\nline2"\r\nplain,x\r\n';
    const { headers, rows, warnings } = parseCsv(text);
    expect(headers).toEqual(['title', 'note']);
    expect(rows).toEqual([{ title: 'Say "hi"', note: 'line1\nline2' }, { title: 'plain', note: 'x' }]);
    expect(warnings).toEqual([]);
  });
  it('skips ragged rows with a warning and reports an empty file', () => {
    const r = parseCsv('a,b\n1\n2,3\n');
    expect(r.rows).toEqual([{ a: '2', b: '3' }]);
    expect(r.warnings[0]).toMatch(/Row 2: expected 2 fields, found 1/);
    expect(parseCsv('').warnings).toEqual(['File is empty.']);
    expect(parseCsv(null).rows).toEqual([]);
  });
  it('warns on an unterminated quote', () => {
    expect(parseCsv('a\n"open').warnings[0]).toMatch(/Unterminated/);
  });
});

describe('toCsv / csvField', () => {
  it('quotes only when needed and round-trips', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField(null)).toBe('');
    const text = toCsv(risks, RISK_COLUMNS);
    const back = importRisks(text);
    expect(back.warnings).toEqual([]);
    expect(back.risks).toEqual(risks);
  });
  it('cohorts round-trip through the flattened columns', () => {
    const text = toCsv(cohortsToRows(cohorts), COHORT_COLUMNS);
    const back = importCohorts(text);
    expect(back.warnings).toEqual([]);
    expect(back.cohorts).toEqual(cohorts);
  });
  it('tasks round-trip', () => {
    const back = importTasks(toCsv(tasks, TASK_COLUMNS), columns);
    expect(back.warnings).toEqual([]);
    expect(back.tasks).toEqual(tasks);
  });
});

describe('importRisks', () => {
  it('requires title, probability and impact columns', () => {
    expect(importRisks('id,owner\n1,x\n').warnings[0]).toMatch(/Missing required column\(s\): title, probability, impact/);
  });
  it('validates each row, de-duplicates ids, defaults status, and warns on unknown references', () => {
    const text = [
      'id,title,probability,impact,program,owner,status',
      'a,Good,3,4,lms,SP,',
      'a,Dup,3,4,lms,SP,open',
      'b,Bad scale,6,4,lms,SP,open',
      'c,Unknown refs,2,2,mars,ZZ,closed',
      ',No id,1,1,,,'
    ].join('\n');
    const r = importRisks(text, { knownPrograms: ['lms'], knownPeople: ['SP'] });
    expect(r.risks.map((x) => x.id)).toEqual(['a', 'c', 'import-5']);
    expect(r.risks[0].status).toBe('open');
    expect(r.risks[2].program).toBe('all');
    expect(r.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/Row 3: duplicate id "a"/),
      expect.stringMatching(/Row 4: probability must be an integer 1–5/),
      expect.stringMatching(/Row 5: unknown program "mars"/),
      expect.stringMatching(/Row 5: unknown owner "ZZ"/)
    ]));
  });
  it('caps and normalises whitespace in text fields', () => {
    const r = importRisks(`title,probability,impact\n"  lots   of   space ${'x'.repeat(200)}",1,1\n`);
    expect(r.risks[0].title.startsWith('lots of space')).toBe(true);
    expect(r.risks[0].title.length).toBe(120);
  });
});

describe('importCohorts', () => {
  it('requires its columns and validates ranges', () => {
    expect(importCohorts('name\nx\n').warnings[0]).toMatch(/Missing required/);
    const text = [
      'name,learners,modules_total,modules_done,survey_mean,survey_n',
      'ok,10,5,3,4.5,9',
      'no survey,10,5,3,,',
      'too many done,10,5,6,4,1',
      'bad survey,10,5,1,7,2'
    ].join('\n');
    const r = importCohorts(text);
    expect(r.cohorts.map((c) => c.name)).toEqual(['ok', 'no survey']);
    expect(r.cohorts[1].survey).toEqual({ mean: 0, n: 0 });
    expect(r.warnings).toHaveLength(2);
  });
});

describe('importTasks', () => {
  it('rejects unknown columns and priorities', () => {
    const r = importTasks('title,column,priority\nA,progress,high\nB,nowhere,med\nC,done,urgent\n', columns);
    expect(r.tasks.map((t) => t.title)).toEqual(['A']);
    expect(r.warnings).toHaveLength(2);
    expect(importTasks('x\n1\n', columns).warnings[0]).toMatch(/Missing required/);
  });
});
