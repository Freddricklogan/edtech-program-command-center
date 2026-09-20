/**
 * RACI validation — the rules a PMO actually applies to the chart:
 *   exactly one Accountable per workstream,
 *   at least one Responsible per workstream,
 *   nobody Accountable for everything (a concentration smell, reported as a warning).
 */

export const RACI_LETTERS = ['R', 'A', 'C', 'I'];

/**
 * @param {import('./data.js').RaciRow[]} rows
 * @param {{ id: string, name: string }[]} people
 * @returns {{ errors: Array<{ workstream: string, message: string }>, warnings: Array<{ person: string, message: string }>, valid: boolean }}
 */
export function validateRaci(rows, people) {
  const errors = [];
  const warnings = [];
  const accountableCount = Object.fromEntries(people.map((p) => [p.id, 0]));

  for (const row of rows) {
    const letters = Object.values(row.roles ?? {});
    const a = letters.filter((l) => l === 'A').length;
    const r = letters.filter((l) => l === 'R').length;
    if (a === 0) errors.push({ workstream: row.workstream, message: 'nobody is Accountable' });
    if (a > 1) errors.push({ workstream: row.workstream, message: `${a} people are Accountable; RACI allows one` });
    if (r === 0) errors.push({ workstream: row.workstream, message: 'nobody is Responsible' });
    for (const [person, letter] of Object.entries(row.roles ?? {})) {
      if (letter && !RACI_LETTERS.includes(letter)) {
        errors.push({ workstream: row.workstream, message: `invalid letter "${letter}" for ${person}` });
      }
      if (letter === 'A' && person in accountableCount) accountableCount[person] += 1;
    }
  }

  if (rows.length >= 3) {
    for (const [person, n] of Object.entries(accountableCount)) {
      if (n === rows.length) warnings.push({ person, message: 'accountable for every workstream' });
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}

/** Workload per person: how many R and A they carry. */
export function raciLoad(rows, people) {
  return people.map((p) => {
    let r = 0;
    let a = 0;
    for (const row of rows) {
      const l = row.roles?.[p.id];
      if (l === 'R') r += 1;
      if (l === 'A') a += 1;
    }
    return { id: p.id, name: p.name, responsible: r, accountable: a };
  });
}
