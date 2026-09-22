/**
 * Application entry point: owns the working dataset, wires tabs, the board,
 * CSV import/export and the Executive Shell. All computation is in the pure
 * modules; this file orchestrates.
 */

import { mountExecShell } from './exec-shell.js';
import { samplePortfolio } from './data.js';
import { moveTask } from './board.js';
import { onTimeDelivery, cohortCompletion } from './kpi.js';
import { validateRaci } from './raci.js';
import { riskSummary } from './risk.js';
import {
  COHORT_COLUMNS, RISK_COLUMNS, TASK_COLUMNS, cohortsToRows, importCohorts, importRisks, importTasks, toCsv
} from './csv.js';
import {
  renderBoard, renderCohorts, renderDonut, renderGantt, renderKpis, renderPortfolio, renderRaci, renderRisks
} from './ui.js';

const REPO = 'https://github.com/Freddricklogan/edtech-program-command-center';
const PAGES = 'https://freddricklogan.github.io/edtech-program-command-center/';

const $ = (id) => document.getElementById(id);

const state = {
  data: samplePortfolio(),
  dragId: null,
  allowWipOverride: false
};

/* ----------------------------------------------------------------- status */

function setStatus(text, tone = 'muted') {
  const s = $('status');
  s.textContent = text;
  s.dataset.tone = tone;
}

/* ----------------------------------------------------------------- render */

function render() {
  const d = state.data;
  $('period').textContent = d.meta.period;
  $('program-count').textContent = String(d.programs.length);
  renderKpis($('kpi-row'), d);
  renderPortfolio($('portfolio-table'), d);
  renderDonut($('donut'), $('donut-legend'), d);
  renderGantt($('gantt'), d);
  renderBoard($('board'), d, { onMove: move, onDragStart: (id) => { state.dragId = id; }, onDrop: (col) => { if (state.dragId) move(state.dragId, col); state.dragId = null; } });
  renderCohorts($('cohorts'), $('outcomes'), d);
  renderRaci($('raci'), $('raci-findings'), $('raci-load'), d);
  renderRisks($('risks'), $('risk-summary'), $('risk-heat'), d);
  shell.refreshKpis();
}

/* ------------------------------------------------------------------ board */

function move(taskId, columnId) {
  const r = moveTask(state.data.tasks, state.data.columns, taskId, columnId, { force: state.allowWipOverride });
  if (!r.moved) {
    setStatus(`Move refused: ${r.reason}.${/WIP/.test(r.reason) ? ' Tick "Allow WIP overrides" to force it.' : ''}`, 'warn');
    render();
    return;
  }
  state.data.tasks = r.tasks;
  const t = r.tasks.find((x) => x.id === taskId);
  const col = state.data.columns.find((c) => c.id === columnId);
  setStatus(`Moved "${t.title}" to ${col.label}.`, 'ok');
  render();
}

/* -------------------------------------------------------------------- tabs */

const TABS = ['dash', 'road', 'board', 'cohort', 'gov'];

function selectTab(id) {
  for (const t of TABS) {
    const tab = $(`tab-${t}`);
    const panel = $(`view-${t}`);
    const on = t === id;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    panel.hidden = !on;
  }
}

for (const t of TABS) {
  $(`tab-${t}`).addEventListener('click', () => selectTab(t));
  $(`tab-${t}`).addEventListener('keydown', (e) => {
    const i = TABS.indexOf(t);
    const next = e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length] : e.key === 'ArrowLeft' ? TABS[(i - 1 + TABS.length) % TABS.length] : null;
    if (next) { e.preventDefault(); selectTab(next); $(`tab-${next}`).focus(); }
  });
}

/* --------------------------------------------------------------- CSV I/O */

function download(filename, body) {
  const blob = new Blob([body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function applyImport(kind, text) {
  const d = state.data;
  let result;
  let count;
  if (kind === 'risks') {
    result = importRisks(text, { knownPrograms: d.programs.map((p) => p.id), knownPeople: d.people.map((p) => p.id) });
    if (result.risks.length) { d.risks = result.risks; count = result.risks.length; }
  } else if (kind === 'cohorts') {
    result = importCohorts(text);
    if (result.cohorts.length) { d.cohorts = result.cohorts; count = result.cohorts.length; }
  } else {
    result = importTasks(text, d.columns);
    if (result.tasks.length) { d.tasks = result.tasks; count = result.tasks.length; }
  }
  if (!count) {
    setStatus(`Import failed: ${result.warnings[0] ?? 'no valid rows.'}`, 'danger');
    return;
  }
  const w = result.warnings.length;
  setStatus(w ? `Imported ${count} ${kind} with ${w} warning${w === 1 ? '' : 's'}: ${result.warnings[0]}` : `Imported ${count} ${kind}.`, w ? 'warn' : 'ok');
  render();
}

for (const kind of ['risks', 'cohorts', 'tasks']) {
  $(`import-${kind}`).addEventListener('click', () => $(`file-${kind}`).click());
  $(`file-${kind}`).addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((text) => applyImport(kind, text)).catch(() => setStatus('Import failed: could not read the file.', 'danger'));
  });
}
$('export-risks').addEventListener('click', () => download('risks.csv', toCsv(state.data.risks, RISK_COLUMNS)));
$('export-cohorts').addEventListener('click', () => download('cohorts.csv', toCsv(cohortsToRows(state.data.cohorts), COHORT_COLUMNS)));
$('export-tasks').addEventListener('click', () => download('tasks.csv', toCsv(state.data.tasks, TASK_COLUMNS)));
$('reset').addEventListener('click', () => { state.data = samplePortfolio(); setStatus('Sample portfolio restored.', 'ok'); render(); });
$('wip-override').addEventListener('change', (e) => { state.allowWipOverride = e.target.checked; });

/* ------------------------------------------------------------------ shell */

const SAMPLE_RISK_CSV = [
  'title,probability,impact,program,owner,mitigation',
  'Grant reporting deadline slips,3,4,analytics,FL,Weekly burn-down with the grants office',
  'Pilot school withdraws,2,5,stem,AR,Second pilot site under MoU',
  'Bad row with probability 9,9,1,lms,SP,Should be skipped with a warning'
].join('\n');

const shell = mountExecShell({
  theme: 'ember',
  title: 'EdTech Program Command Center',
  tagline:
    'A programme-management console for educational delivery — roadmap, delivery board with WIP limits, cohort analytics, RACI validation and a scored risk register. Every number on screen is computed from the data beneath it. Sample data; illustrative.',
  repo: REPO,
  pagesUrl: PAGES,
  badges: [
    { label: 'Computed KPIs', tone: 'accent' },
    { label: 'CSV import · export', dot: true },
    { label: 'Client-side only', dot: true }
  ],
  kpis: [
    { label: 'Programs', compute: () => state.data.programs.length, tone: 'accent' },
    { label: 'On-time delivery', compute: () => { const v = onTimeDelivery(state.data.phases, state.data.meta.currentMonth).value; return v == null ? '—' : `${v}%`; }, tone: 'ok' },
    { label: 'Cohort completion', compute: () => { const v = cohortCompletion(state.data.cohorts); return v == null ? '—' : `${v}%`; } },
    { label: 'High risks open', compute: () => riskSummary(state.data.risks).high, tone: 'danger' },
    { label: 'RACI findings', compute: () => validateRaci(state.data.raci, state.data.people).errors.length, tone: 'warn' }
  ],
  tour: [
    {
      selector: '#kpi-row',
      title: 'Every number is computed',
      body: 'On-time delivery is the share of started phases within tolerance of plan; completion is weighted by learners; satisfaction by survey responses. The prior-period deltas are sample data and say so.',
      action: () => { state.data = samplePortfolio(); render(); selectTab('dash'); }
    },
    {
      selector: '#gantt',
      title: 'Plan versus reality',
      body: 'Each bar shows reported progress and a marker for where the phase should be today. The band — on track, at risk, off track — uses explicit tolerances, and it is what feeds the dashboard.',
      action: () => selectTab('road')
    },
    {
      selector: '#board',
      title: 'WIP limits that refuse',
      body: 'This tries to pull a fourth card into In Progress. The column\'s limit is three, so the move is refused and the reason is stated. Drag, or use the "Move to" control on any card from the keyboard.',
      action: () => { selectTab('board'); state.allowWipOverride = false; $('wip-override').checked = false; move('t2', 'progress'); }
    },
    {
      selector: '#raci-findings',
      title: 'RACI that is checked, not just drawn',
      body: 'A RACI chart needs exactly one Accountable and at least one Responsible per workstream. The validator reads the chart and lists every violation — the sample chart has four.',
      action: () => selectTab('gov')
    },
    {
      selector: '#csv-tools',
      title: 'Bring your own data',
      body: 'This imports a three-row risk CSV. Two rows load; the third has a probability of 9 on a 1–5 scale and is skipped with a warning that names the row. Export gives you the register back as CSV.',
      action: () => { applyImport('risks', SAMPLE_RISK_CSV); selectTab('gov'); }
    }
  ]
});

/* -------------------------------------------------------------------- boot */

selectTab('dash');
render();
setStatus('Sample portfolio loaded. Every figure is computed from the data on this page.');
