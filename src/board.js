/**
 * Delivery board — pure operations on the task list. Immutable: every
 * function returns a new array, never mutates its input.
 */

/** @param {import('./data.js').Task[]} tasks @param {string} columnId */
export function tasksIn(tasks, columnId) {
  return tasks.filter((t) => t.column === columnId);
}

/** Count per column, keyed by column id. */
export function columnCounts(tasks, columns) {
  const out = {};
  for (const c of columns) out[c.id] = 0;
  for (const t of tasks) if (t.column in out) out[t.column] += 1;
  return out;
}

/**
 * Would moving `taskId` to `columnId` exceed that column's WIP limit?
 * A task already in the column does not count twice.
 */
export function wipExceeded(tasks, columns, columnId, taskId) {
  const col = columns.find((c) => c.id === columnId);
  if (!col || col.wip == null) return false;
  const occupants = tasks.filter((t) => t.column === columnId && t.id !== taskId).length;
  return occupants + 1 > col.wip;
}

/**
 * Move a task. Returns `{ tasks, moved, reason }`; the move is refused (not
 * thrown) for an unknown task or column, a no-op, or a WIP breach unless
 * `force` is set — the UI can then ask.
 */
export function moveTask(tasks, columns, taskId, columnId, { force = false } = {}) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { tasks, moved: false, reason: 'unknown task' };
  if (!columns.some((c) => c.id === columnId)) return { tasks, moved: false, reason: 'unknown column' };
  if (task.column === columnId) return { tasks, moved: false, reason: 'already there' };
  if (!force && wipExceeded(tasks, columns, columnId, taskId)) {
    const col = columns.find((c) => c.id === columnId);
    return { tasks, moved: false, reason: `WIP limit ${col.wip} reached in ${col.label}` };
  }
  return {
    tasks: tasks.map((t) => (t.id === taskId ? { ...t, column: columnId } : t)),
    moved: true,
    reason: null
  };
}

/** Columns a task could move to, in board order, excluding its own. */
export function moveTargets(task, columns) {
  return columns.filter((c) => c.id !== task.column);
}

/** Flow summary: done share and how much is in flight. */
export function flowSummary(tasks, columns) {
  const counts = columnCounts(tasks, columns);
  const total = tasks.length;
  const done = counts.done ?? 0;
  const inFlight = total - done - (counts.backlog ?? 0);
  return { total, done, inFlight, donePct: total ? Math.round((done / total) * 100) : 0 };
}

const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };

/** Stable sort: priority first, then title. */
export function sortTasks(tasks) {
  return tasks.slice().sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) || a.title.localeCompare(b.title)
  );
}
