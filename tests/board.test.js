import { describe, it, expect } from 'vitest';
import { columnCounts, flowSummary, moveTargets, moveTask, sortTasks, tasksIn, wipExceeded } from '../src/board.js';
import { samplePortfolio } from '../src/data.js';

const { tasks, columns } = samplePortfolio();

describe('board queries', () => {
  it('counts per column and lists tasks in a column', () => {
    expect(columnCounts(tasks, columns)).toEqual({ backlog: 2, progress: 3, review: 2, done: 2 });
    expect(tasksIn(tasks, 'done').map((t) => t.id)).toEqual(['t6', 't8']);
  });
  it('flow summary', () => {
    expect(flowSummary(tasks, columns)).toEqual({ total: 9, done: 2, inFlight: 5, donePct: 22 });
  });
  it('sorts by priority then title', () => {
    expect(sortTasks(tasks).slice(0, 3).map((t) => t.priority)).toEqual(['high', 'high', 'high']);
    expect(sortTasks(tasks)[0].title).toBe('Finalize Module 4 assessments');
  });
});

describe('WIP limits', () => {
  it('In Progress is full at 3', () => {
    expect(wipExceeded(tasks, columns, 'progress', 't2')).toBe(true);
    expect(wipExceeded(tasks, columns, 'review', 't2')).toBe(true);
    expect(wipExceeded(tasks, columns, 'backlog', 't1')).toBe(false);
  });
  it('a task already in the column does not count against itself', () => {
    expect(wipExceeded(tasks, columns, 'progress', 't1')).toBe(false);
  });
  it('unknown column is never exceeded', () => {
    expect(wipExceeded(tasks, columns, 'nope', 't1')).toBe(false);
  });
});

describe('moveTask', () => {
  it('moves immutably', () => {
    const r = moveTask(tasks, columns, 't2', 'done');
    expect(r.moved).toBe(true);
    expect(r.tasks.find((t) => t.id === 't2').column).toBe('done');
    expect(tasks.find((t) => t.id === 't2').column).toBe('backlog');
  });
  it('refuses unknown task, unknown column and no-op moves', () => {
    expect(moveTask(tasks, columns, 'zz', 'done').reason).toBe('unknown task');
    expect(moveTask(tasks, columns, 't2', 'zz').reason).toBe('unknown column');
    expect(moveTask(tasks, columns, 't2', 'backlog').reason).toBe('already there');
  });
  it('refuses a WIP breach unless forced', () => {
    const r = moveTask(tasks, columns, 't2', 'progress');
    expect(r.moved).toBe(false);
    expect(r.reason).toMatch(/WIP limit 3 reached in In Progress/);
    expect(moveTask(tasks, columns, 't2', 'progress', { force: true }).moved).toBe(true);
  });
  it('lists move targets excluding the current column', () => {
    expect(moveTargets(tasks[0], columns).map((c) => c.id)).toEqual(['backlog', 'review', 'done']);
  });
});
