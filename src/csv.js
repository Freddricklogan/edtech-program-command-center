/**
 * CSV import and export — RFC 4180 quoting, header row required, untrusted
 * input validated row by row. Bad rows are reported and skipped, never thrown,
 * so a spreadsheet with one typo still loads the other ninety-nine lines.
 */

import { validateRisk } from './risk.js';

/**
 * Parse CSV text into an array of objects keyed by the header row.
 * Handles quoted fields, doubled quotes, embedded newlines, CRLF and a BOM.
 * @param {string} text
 * @returns {{ headers: string[], rows: Record<string, string>[], warnings: string[] }}
 */
export function parseCsv(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const records = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { record.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      record.push(field); field = '';
      records.push(record); record = [];
    } else field += ch;
  }
  if (field.length || record.length) { record.push(field); records.push(record); }

  const warnings = [];
  if (inQuotes) warnings.push('Unterminated quoted field; the file may be truncated.');
  const nonEmpty = records.filter((r) => r.some((f) => f.trim() !== ''));
  if (!nonEmpty.length) return { headers: [], rows: [], warnings: ['File is empty.'] };
  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  const rows = [];
  nonEmpty.slice(1).forEach((r, idx) => {
    if (r.length !== headers.length) {
      warnings.push(`Row ${idx + 2}: expected ${headers.length} fields, found ${r.length}; skipped.`);
      return;
    }
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i].trim(); });
    rows.push(obj);
  });
  return { headers, rows, warnings };
}

/** Quote a field for CSV output. */
export function csvField(value) {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialise rows (objects) with the given column order. */
export function toCsv(rows, columns) {
  const lines = [columns.map(csvField).join(',')];
  for (const r of rows) lines.push(columns.map((c) => csvField(r[c])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

const MAX_TEXT = 120;
const clean = (s, max = MAX_TEXT) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Import risks. Required columns: title, probability, impact. Optional:
 * id, program, owner, mitigation, status.
 * @returns {{ risks: import('./data.js').Risk[], warnings: string[] }}
 */
export function importRisks(text, { knownPrograms = [], knownPeople = [] } = {}) {
  const { headers, rows, warnings } = parseCsv(text);
  const required = ['title', 'probability', 'impact'];
  const missing = required.filter((h) => !headers.includes(h));
  if (headers.length && missing.length) {
    return { risks: [], warnings: [`Missing required column(s): ${missing.join(', ')}.`] };
  }
  const risks = [];
  const seen = new Set();
  rows.forEach((r, idx) => {
    const risk = {
      id: clean(r.id, 40) || `import-${idx + 1}`,
      title: clean(r.title),
      program: clean(r.program, 40) || 'all',
      probability: Number(r.probability),
      impact: Number(r.impact),
      owner: clean(r.owner, 40) || '—',
      mitigation: clean(r.mitigation, 200),
      status: (clean(r.status, 10) || 'open').toLowerCase()
    };
    const problems = validateRisk(risk);
    if (seen.has(risk.id)) problems.push(`duplicate id "${risk.id}"`);
    if (knownPrograms.length && risk.program !== 'all' && !knownPrograms.includes(risk.program)) {
      warnings.push(`Row ${idx + 2}: unknown program "${risk.program}"; kept as-is.`);
    }
    if (knownPeople.length && risk.owner !== '—' && !knownPeople.includes(risk.owner)) {
      warnings.push(`Row ${idx + 2}: unknown owner "${risk.owner}"; kept as-is.`);
    }
    if (problems.length) { warnings.push(`Row ${idx + 2}: ${problems.join('; ')}; skipped.`); return; }
    seen.add(risk.id);
    risks.push(risk);
  });
  return { risks, warnings };
}

/**
 * Import cohorts. Required: name, learners, modules_total, modules_done.
 * Optional: id, program, survey_mean, survey_n.
 */
export function importCohorts(text) {
  const { headers, rows, warnings } = parseCsv(text);
  const required = ['name', 'learners', 'modules_total', 'modules_done'];
  const missing = required.filter((h) => !headers.includes(h));
  if (headers.length && missing.length) {
    return { cohorts: [], warnings: [`Missing required column(s): ${missing.join(', ')}.`] };
  }
  const cohorts = [];
  rows.forEach((r, idx) => {
    const c = {
      id: clean(r.id, 40) || `import-${idx + 1}`,
      name: clean(r.name),
      program: clean(r.program, 40) || 'all',
      learners: Number(r.learners),
      modulesTotal: Number(r.modules_total),
      modulesDone: Number(r.modules_done),
      survey: { mean: Number(r.survey_mean), n: Number(r.survey_n) }
    };
    const problems = [];
    if (!c.name) problems.push('name is required');
    if (!Number.isInteger(c.learners) || c.learners < 0) problems.push('learners must be a non-negative integer');
    if (!Number.isInteger(c.modulesTotal) || c.modulesTotal <= 0) problems.push('modules_total must be a positive integer');
    if (!Number.isInteger(c.modulesDone) || c.modulesDone < 0 || c.modulesDone > c.modulesTotal) problems.push('modules_done must be 0–modules_total');
    if (r.survey_mean === undefined || r.survey_mean === '' || !Number.isFinite(c.survey.mean)) c.survey = { mean: 0, n: 0 };
    else if (c.survey.mean < 1 || c.survey.mean > 5 || !Number.isInteger(c.survey.n) || c.survey.n < 0) problems.push('survey_mean must be 1–5 with a non-negative integer survey_n');
    if (problems.length) { warnings.push(`Row ${idx + 2}: ${problems.join('; ')}; skipped.`); return; }
    cohorts.push(c);
  });
  return { cohorts, warnings };
}

/**
 * Import tasks. Required: title, column. Optional: id, program, priority, owner.
 */
export function importTasks(text, columns) {
  const { headers, rows, warnings } = parseCsv(text);
  const required = ['title', 'column'];
  const missing = required.filter((h) => !headers.includes(h));
  if (headers.length && missing.length) {
    return { tasks: [], warnings: [`Missing required column(s): ${missing.join(', ')}.`] };
  }
  const colIds = new Set(columns.map((c) => c.id));
  const tasks = [];
  rows.forEach((r, idx) => {
    const t = {
      id: clean(r.id, 40) || `import-${idx + 1}`,
      title: clean(r.title),
      program: clean(r.program, 40) || 'all',
      priority: (clean(r.priority, 8) || 'med').toLowerCase(),
      owner: clean(r.owner, 8) || '—',
      column: clean(r.column, 20).toLowerCase()
    };
    const problems = [];
    if (!t.title) problems.push('title is required');
    if (!colIds.has(t.column)) problems.push(`unknown column "${t.column}"`);
    if (!['high', 'med', 'low'].includes(t.priority)) problems.push(`priority must be high, med or low`);
    if (problems.length) { warnings.push(`Row ${idx + 2}: ${problems.join('; ')}; skipped.`); return; }
    tasks.push(t);
  });
  return { tasks, warnings };
}

export const RISK_COLUMNS = ['id', 'title', 'program', 'probability', 'impact', 'owner', 'mitigation', 'status'];
export const COHORT_COLUMNS = ['id', 'name', 'program', 'learners', 'modules_total', 'modules_done', 'survey_mean', 'survey_n'];
export const TASK_COLUMNS = ['id', 'title', 'program', 'priority', 'owner', 'column'];

/** Flatten cohorts for export (survey object → two columns). */
export function cohortsToRows(cohorts) {
  return cohorts.map((c) => ({
    id: c.id, name: c.name, program: c.program, learners: c.learners,
    modules_total: c.modulesTotal, modules_done: c.modulesDone,
    survey_mean: c.survey?.mean ?? '', survey_n: c.survey?.n ?? ''
  }));
}
