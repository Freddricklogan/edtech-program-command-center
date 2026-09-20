/**
 * DOM rendering. Builds elements with `textContent` and `createElement`
 * only — cohort names, risk titles and task titles can come from an imported
 * CSV, so nothing is interpolated into `innerHTML`. Every number rendered
 * here comes from the pure modules.
 */

import { MONTHS } from './data.js';
import { barLayout, expectedProgress, phaseHealth } from './gantt.js';
import {
  budgetUtilization, cohortCompletion, cohortProgress, delta, deliveryConfidence,
  learnerSatisfaction, onTimeDelivery, outcomeHit, programStatus
} from './kpi.js';
import { columnCounts, moveTargets, sortTasks, tasksIn } from './board.js';
import { raciLoad, validateRaci } from './raci.js';
import { heatMap, openRisks, riskScore, riskSummary, severity } from './risk.js';

export function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids) if (kid != null) node.append(kid);
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

const HEALTH_LABEL = { on: 'On track', risk: 'At risk', off: 'Off track' };
const fmtPct = (v) => (v == null ? '—' : `${v}%`);
const fmtUsd = (v) => `$${Math.round(v).toLocaleString('en-US')}`;

function bar(pct, tone) {
  const fill = el('span', { class: 'epc-bar__fill', 'aria-hidden': 'true' });
  fill.style.setProperty('--w', `${Math.max(0, Math.min(100, pct))}%`);
  fill.dataset.tone = tone;
  return el('span', { class: 'epc-bar' }, [fill]);
}

function trendEl(value, unit, dp = 0) {
  if (value == null) return el('span', { class: 'epc-kpi__trend', text: 'no prior period' });
  const sign = value > 0 ? '▲' : value < 0 ? '▼' : '■';
  const tone = value > 0 ? 'ok' : value < 0 ? 'danger' : 'muted';
  return el('span', { class: 'epc-kpi__trend', 'data-tone': tone, text: `${sign} ${Math.abs(value).toFixed(dp)}${unit} vs prior period` });
}

/* ------------------------------------------------------------- dashboard */

export function renderKpis(host, data) {
  clear(host);
  const m = data.meta.currentMonth;
  const onTime = onTimeDelivery(data.phases, m);
  const completion = cohortCompletion(data.cohorts);
  const budget = budgetUtilization(data.programs);
  const sat = learnerSatisfaction(data.cohorts);
  const risk = riskSummary(data.risks);
  const prev = data.meta.previous ?? {};
  const cards = [
    { label: 'On-time delivery', value: fmtPct(onTime.value), detail: `${onTime.on} of ${onTime.total} started phases within tolerance`, pct: onTime.value ?? 0, tone: 'ok', trend: trendEl(delta(onTime.value, prev.onTime), ' pts') },
    { label: 'Cohort completion', value: fmtPct(completion), detail: 'modules complete, weighted by learners', pct: completion ?? 0, tone: 'accent', trend: trendEl(delta(completion, prev.completion), ' pts') },
    { label: 'Budget utilization', value: fmtPct(budget.value), detail: `${fmtUsd(budget.spent)} of ${fmtUsd(budget.allocated)}`, pct: budget.value ?? 0, tone: 'muted', trend: el('span', { class: 'epc-kpi__trend', text: budget.value != null && budget.value > 85 ? 'above 85% watch line' : 'within plan' }) },
    { label: 'Learner satisfaction', value: sat.value == null ? '—' : `${sat.value.toFixed(1)} / 5`, detail: `${sat.responses} survey responses`, pct: sat.value == null ? 0 : (sat.value / 5) * 100, tone: 'warn', trend: trendEl(delta(sat.value, prev.satisfaction, 1), '', 1) },
    { label: 'Open risks', value: String(risk.open), detail: `${risk.high} high · ${risk.medium} medium · ${risk.low} low`, pct: risk.open ? (risk.high / risk.open) * 100 : 0, tone: 'danger', trend: trendEl(prev.openRisks == null ? null : -(risk.open - prev.openRisks), ' fewer') }
  ];
  for (const c of cards) {
    host.append(el('div', { class: 'epc-kpi' }, [
      el('div', { class: 'epc-kpi__label', text: c.label }),
      el('div', { class: 'epc-kpi__value', 'data-tone': c.tone, 'aria-live': 'polite', text: c.value }),
      el('div', { class: 'epc-kpi__detail', text: c.detail }),
      c.trend,
      bar(c.pct, c.tone)
    ]));
  }
}

export function renderPortfolio(host, data) {
  clear(host);
  const m = data.meta.currentMonth;
  const budget = budgetUtilization(data.programs);
  const people = new Map(data.people.map((p) => [p.id, p.name]));
  const thead = el('thead', {}, [el('tr', {}, ['Program', 'Lead', 'Status', 'Budget used'].map((h) => el('th', { scope: 'col', text: h })))]);
  const tbody = el('tbody');
  for (const p of data.programs) {
    const status = programStatus(p.id, data.phases, m);
    const pct = budget.perProgram.find((x) => x.id === p.id)?.pct ?? 0;
    tbody.append(el('tr', {}, [
      el('td', {}, [el('strong', { text: p.name })]),
      el('td', { text: people.get(p.lead) ?? p.lead }),
      el('td', {}, [el('span', { class: 'epc-status', 'data-tone': status, text: HEALTH_LABEL[status] })]),
      el('td', {}, [bar(pct, pct > 85 ? 'danger' : 'accent'), el('span', { class: 'epc-muted', text: ` ${pct}%` })])
    ]));
  }
  host.append(thead, tbody);
}

export function renderDonut(host, legendHost, data) {
  clear(host);
  clear(legendHost);
  const d = deliveryConfidence(data.phases, data.meta.currentMonth);
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 140 140');
  svg.setAttribute('width', '140');
  svg.setAttribute('height', '140');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Delivery confidence: ${d.on}% on track, ${d.risk}% at risk, ${d.off}% off track across ${d.total} started phases`);
  const C = 2 * Math.PI * 52;
  let offset = 0;
  for (const [key, colour] of [['on', 'var(--ok)'], ['risk', 'var(--warn)'], ['off', 'var(--danger)']]) {
    const len = d[key];
    if (!len) continue;
    const c = document.createElementNS(svgNs, 'circle');
    c.setAttribute('r', '52'); c.setAttribute('cx', '70'); c.setAttribute('cy', '70');
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', colour); c.setAttribute('stroke-width', '16');
    c.setAttribute('stroke-dasharray', `${(C * len) / 100} ${C}`);
    c.setAttribute('stroke-dashoffset', String((-C * offset) / 100));
    c.setAttribute('transform', 'rotate(-90 70 70)');
    svg.append(c);
    offset += len;
  }
  const t1 = document.createElementNS(svgNs, 'text');
  t1.setAttribute('x', '70'); t1.setAttribute('y', '66'); t1.setAttribute('text-anchor', 'middle'); t1.setAttribute('class', 'epc-donut__big');
  t1.textContent = `${d.on}%`;
  const t2 = document.createElementNS(svgNs, 'text');
  t2.setAttribute('x', '70'); t2.setAttribute('y', '86'); t2.setAttribute('text-anchor', 'middle'); t2.setAttribute('class', 'epc-donut__small');
  t2.textContent = 'on track';
  svg.append(t1, t2);
  host.append(svg);
  for (const [key, label] of [['on', 'On track'], ['risk', 'At risk'], ['off', 'Off track']]) {
    legendHost.append(el('li', {}, [el('span', { class: 'epc-dot', 'data-tone': key, 'aria-hidden': 'true' }), `${label} — ${d.counts[key]} phase${d.counts[key] === 1 ? '' : 's'} (${d[key]}%)`]));
  }
}

/* --------------------------------------------------------------- roadmap */

export function renderGantt(host, data) {
  clear(host);
  const m = data.meta.currentMonth;
  const programs = new Map(data.programs.map((p) => [p.id, p.name]));
  const table = el('table', { class: 'epc-gantt' });
  const head = el('tr', {}, [el('th', { scope: 'col', class: 'epc-gantt__task', text: 'Phase' })]);
  MONTHS.forEach((mo, i) => head.append(el('th', { scope: 'col', class: 'epc-gantt__month' + (i === m ? ' is-now' : ''), text: mo })));
  table.append(el('thead', {}, [head]));
  const body = el('tbody');
  for (const ph of data.phases) {
    const layout = barLayout(ph, MONTHS.length);
    const expected = expectedProgress(ph, m);
    const health = phaseHealth(ph, m);
    const barEl = el('div', { class: 'epc-gbar', 'data-tone': health, role: 'img',
      'aria-label': `${ph.title}: ${ph.progress}% complete, ${expected}% expected by now, ${HEALTH_LABEL[health].toLowerCase()}` });
    barEl.style.setProperty('--left', `${layout.left}%`);
    barEl.style.setProperty('--width', `${layout.width}%`);
    const fill = el('span', { class: 'epc-gbar__fill', 'aria-hidden': 'true' });
    fill.style.setProperty('--w', `${ph.progress}%`);
    const exp = el('span', { class: 'epc-gbar__expected', 'aria-hidden': 'true' });
    exp.style.setProperty('--w', `${expected}%`);
    barEl.append(fill, exp, el('span', { class: 'epc-gbar__label', text: `${ph.progress}%` }));
    const track = el('div', { class: 'epc-track' }, [barEl]);
    if (layout.milestone != null) {
      const ms = el('span', { class: 'epc-milestone', role: 'img', 'aria-label': `Milestone in ${MONTHS[ph.milestone] ?? ''}` });
      ms.style.setProperty('--left', `${layout.milestone}%`);
      track.append(ms);
    }
    const now = el('span', { class: 'epc-now', 'aria-hidden': 'true' });
    now.style.setProperty('--left', `${((m + 0.5) / MONTHS.length) * 100}%`);
    track.append(now);
    body.append(el('tr', {}, [
      el('th', { scope: 'row', class: 'epc-gantt__task' }, [
        el('span', { text: ph.title }),
        el('span', { class: 'epc-gantt__prog', text: programs.get(ph.program) ?? 'Portfolio-wide' }),
        el('span', { class: 'epc-gantt__var', 'data-tone': health, text: `${ph.progress - expected >= 0 ? '+' : ''}${ph.progress - expected} pts vs plan` })
      ]),
      el('td', { colspan: String(MONTHS.length) }, [track])
    ]));
  }
  table.append(body);
  host.append(table);
}

/* ----------------------------------------------------------------- board */

/**
 * @param {HTMLElement} host
 * @param {object} data
 * @param {{ onMove: (taskId: string, columnId: string) => void, onDragStart: (id: string) => void, onDrop: (columnId: string) => void }} handlers
 */
export function renderBoard(host, data, handlers) {
  clear(host);
  const counts = columnCounts(data.tasks, data.columns);
  const programs = new Map(data.programs.map((p) => [p.id, p.name]));
  for (const col of data.columns) {
    const over = col.wip != null && counts[col.id] > col.wip;
    const colEl = el('section', { class: 'epc-col' + (over ? ' is-over' : ''), dataset: { col: col.id }, 'aria-labelledby': `col-${col.id}` });
    colEl.append(el('h3', { id: `col-${col.id}`, class: 'epc-col__title' }, [
      el('span', { text: col.label }),
      el('span', { class: 'epc-col__count', text: col.wip == null ? String(counts[col.id]) : `${counts[col.id]} / ${col.wip}` })
    ]));
    colEl.addEventListener('dragover', (e) => { e.preventDefault(); colEl.classList.add('is-drag'); });
    colEl.addEventListener('dragleave', () => colEl.classList.remove('is-drag'));
    colEl.addEventListener('drop', (e) => { e.preventDefault(); colEl.classList.remove('is-drag'); handlers.onDrop(col.id); });
    for (const t of sortTasks(tasksIn(data.tasks, col.id))) {
      const select = el('select', { class: 'epc-card__move', 'aria-label': `Move "${t.title}" to` }, [
        el('option', { value: '', text: 'Move to…' }),
        ...moveTargets(t, data.columns).map((c) => el('option', { value: c.id, text: c.label }))
      ]);
      select.addEventListener('change', () => { if (select.value) handlers.onMove(t.id, select.value); });
      const card = el('article', { class: 'epc-card', draggable: 'true', dataset: { id: t.id }, 'data-priority': t.priority }, [
        el('div', { class: 'epc-card__title', text: t.title }),
        el('div', { class: 'epc-card__meta' }, [
          el('span', { class: 'epc-card__prog', text: programs.get(t.program) ?? 'All programs' }),
          el('span', { class: 'epc-pill', 'data-priority': t.priority, text: t.priority }),
          el('span', { class: 'epc-avatar', 'aria-label': `Owner ${t.owner}`, text: t.owner })
        ]),
        select
      ]);
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; card.classList.add('is-dragging'); handlers.onDragStart(t.id); });
      card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
      colEl.append(card);
    }
    host.append(colEl);
  }
}

/* --------------------------------------------------------------- cohorts */

export function renderCohorts(host, outcomesHost, data) {
  clear(host);
  clear(outcomesHost);
  const programs = new Map(data.programs.map((p) => [p.id, p.name]));
  for (const c of data.cohorts) {
    const pct = cohortProgress(c);
    const tone = pct >= 80 ? 'ok' : pct >= 55 ? 'accent' : 'warn';
    host.append(el('div', { class: 'epc-row' }, [
      el('div', { class: 'epc-row__top' }, [
        el('span', {}, [el('span', { text: c.name }), el('span', { class: 'epc-muted', text: ` · ${programs.get(c.program) ?? ''} · ${c.learners} learners` })]),
        el('strong', { 'data-tone': tone, text: `${pct}%` })
      ]),
      bar(pct, tone),
      el('div', { class: 'epc-muted epc-small', text: `${c.modulesDone} of ${c.modulesTotal} modules · survey ${c.survey?.n ? `${c.survey.mean.toFixed(1)} / 5 (n=${c.survey.n})` : 'none yet'}` })
    ]));
  }
  for (const o of data.outcomes) {
    const hit = outcomeHit(o);
    outcomesHost.append(el('div', { class: 'epc-row' }, [
      el('div', { class: 'epc-row__top' }, [
        el('span', { text: o.name }),
        el('span', {}, [el('strong', { 'data-tone': hit ? 'ok' : 'warn', text: `${o.value}%` }), el('span', { class: 'epc-muted', text: ` / target ${o.target}%` })])
      ]),
      bar(o.value, hit ? 'ok' : 'warn')
    ]));
  }
}

/* ------------------------------------------------------------ governance */

export function renderRaci(tableHost, findingsHost, loadHost, data) {
  clear(tableHost);
  clear(findingsHost);
  clear(loadHost);
  const head = el('tr', {}, [el('th', { scope: 'col', text: 'Workstream' }), ...data.people.map((p) => el('th', { scope: 'col', text: p.name }))]);
  tableHost.append(el('thead', {}, [head]));
  const body = el('tbody');
  const result = validateRaci(data.raci, data.people);
  const bad = new Set(result.errors.map((e) => e.workstream));
  for (const row of data.raci) {
    body.append(el('tr', { class: bad.has(row.workstream) ? 'is-invalid' : '' }, [
      el('th', { scope: 'row', text: row.workstream }),
      ...data.people.map((p) => {
        const letter = row.roles?.[p.id] ?? '';
        return el('td', {}, [letter ? el('span', { class: 'epc-raci', 'data-letter': letter, text: letter, 'aria-label': { R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed' }[letter] ?? letter }) : el('span', { class: 'epc-muted', text: '–' })]);
      })
    ]));
  }
  tableHost.append(body);
  if (result.valid && !result.warnings.length) {
    findingsHost.append(el('li', { class: 'epc-finding', 'data-tone': 'ok', text: 'Every workstream has exactly one Accountable and at least one Responsible.' }));
  }
  for (const e of result.errors) findingsHost.append(el('li', { class: 'epc-finding', 'data-tone': 'danger', text: `${e.workstream}: ${e.message}.` }));
  for (const w of result.warnings) findingsHost.append(el('li', { class: 'epc-finding', 'data-tone': 'warn', text: `${data.people.find((p) => p.id === w.person)?.name ?? w.person} is ${w.message}.` }));
  for (const l of raciLoad(data.raci, data.people)) {
    loadHost.append(el('li', { text: `${l.name}: ${l.accountable} accountable · ${l.responsible} responsible` }));
  }
}

export function renderRisks(tableHost, summaryHost, heatHost, data) {
  clear(tableHost);
  clear(summaryHost);
  clear(heatHost);
  const people = new Map(data.people.map((p) => [p.id, p.name]));
  const s = riskSummary(data.risks);
  summaryHost.textContent = `${s.open} open (${s.high} high · ${s.medium} medium · ${s.low} low) · exposure ${s.exposure} · ${s.closed} closed`;
  tableHost.append(el('thead', {}, [el('tr', {}, ['Risk', 'P', 'I', 'Score', 'Severity', 'Owner', 'Mitigation'].map((h) => el('th', { scope: 'col', text: h })))]));
  const body = el('tbody');
  for (const r of openRisks(data.risks)) {
    const sev = severity(r);
    body.append(el('tr', {}, [
      el('td', { text: r.title }),
      el('td', { text: String(r.probability) }),
      el('td', { text: String(r.impact) }),
      el('td', { text: String(riskScore(r)) }),
      el('td', {}, [el('span', { class: 'epc-sev', 'data-tone': sev, text: sev })]),
      el('td', { text: people.get(r.owner) ?? r.owner }),
      el('td', { class: 'epc-muted', text: r.mitigation })
    ]));
  }
  tableHost.append(body);
  const grid = heatMap(data.risks);
  const table = el('table', { class: 'epc-heat', 'aria-label': 'Risk heat map, impact by probability' });
  const h = el('tr', {}, [el('th', { scope: 'col', text: 'Impact ↓ / Probability →' })]);
  for (let p = 1; p <= 5; p += 1) h.append(el('th', { scope: 'col', text: String(p) }));
  table.append(el('thead', {}, [h]));
  const tb = el('tbody');
  for (let i = 5; i >= 1; i -= 1) {
    const tr = el('tr', {}, [el('th', { scope: 'row', text: String(i) })]);
    for (let p = 1; p <= 5; p += 1) {
      const n = grid[i - 1][p - 1];
      const score = i * p;
      const tone = score >= 15 ? 'high' : score >= 8 ? 'medium' : 'low';
      tr.append(el('td', { 'data-tone': tone, text: n ? String(n) : '' }));
    }
    tb.append(tr);
  }
  table.append(tb);
  heatHost.append(table);
}
