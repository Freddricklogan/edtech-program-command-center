/**
 * Roadmap mathematics — pure. Given a phase and "today" (a month index),
 * where should it be, and where is it?
 */

/** Clamp to [lo, hi]. */
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Expected % complete at `month` for a phase running [start, end).
 * 0 before start, 100 at or after end, linear between.
 */
export function expectedProgress(phase, month) {
  const span = phase.end - phase.start;
  if (span <= 0) return month >= phase.end ? 100 : 0;
  return Math.round(clamp((month - phase.start) / span, 0, 1) * 100);
}

/** Reported minus expected; negative means behind. */
export function scheduleVariance(phase, month) {
  return phase.progress - expectedProgress(phase, month);
}

export const ON_TRACK_TOLERANCE = 5;
export const OFF_TRACK_THRESHOLD = 20;

/**
 * Health band for one phase. Tolerances are explicit constants rather than
 * a colour picked by eye.
 * @returns {'on'|'risk'|'off'}
 */
export function phaseHealth(phase, month) {
  const v = scheduleVariance(phase, month);
  if (v < -OFF_TRACK_THRESHOLD) return 'off';
  if (v < -ON_TRACK_TOLERANCE) return 'risk';
  return 'on';
}

/**
 * Layout for a Gantt bar as percentages of the track width.
 * @param {{ start: number, end: number, milestone?: number }} phase
 * @param {number} monthsInView
 */
export function barLayout(phase, monthsInView) {
  const n = Math.max(1, monthsInView);
  const left = clamp(phase.start / n, 0, 1) * 100;
  const right = clamp(phase.end / n, 0, 1) * 100;
  return {
    left,
    width: Math.max(0, right - left),
    milestone: phase.milestone == null ? null : clamp(phase.milestone / n, 0, 1) * 100
  };
}

/**
 * Is the phase's reported progress plausible? Progress must be 0–100, and a
 * phase that has not started cannot be complete.
 */
export function validatePhase(phase, month) {
  const problems = [];
  if (!(phase.end > phase.start)) problems.push('end must be after start');
  if (!(phase.progress >= 0 && phase.progress <= 100)) problems.push('progress must be 0–100');
  if (phase.progress > 0 && month < phase.start) problems.push('progress reported before start');
  if (phase.milestone != null && (phase.milestone < phase.start || phase.milestone > phase.end)) {
    problems.push('milestone outside phase');
  }
  return problems;
}
