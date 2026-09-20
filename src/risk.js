/**
 * Risk register — severity is probability × impact on a 1–5 scale, banded by
 * explicit thresholds. The previous build typed severity in by hand and told
 * the reader it was probability × impact.
 */

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
export const HIGH_THRESHOLD = 15;
export const MEDIUM_THRESHOLD = 8;

/** @returns {number} 1–25 */
export function riskScore(risk) {
  return risk.probability * risk.impact;
}

/** @returns {'high'|'medium'|'low'} */
export function severity(risk) {
  const s = riskScore(risk);
  if (s >= HIGH_THRESHOLD) return 'high';
  if (s >= MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/** Problems with a risk row; empty when valid. */
export function validateRisk(risk) {
  const problems = [];
  for (const k of ['probability', 'impact']) {
    const v = risk[k];
    if (!Number.isInteger(v) || v < SCALE_MIN || v > SCALE_MAX) problems.push(`${k} must be an integer ${SCALE_MIN}–${SCALE_MAX}`);
  }
  if (!risk.title) problems.push('title is required');
  if (risk.status && !['open', 'closed'].includes(risk.status)) problems.push('status must be open or closed');
  return problems;
}

/** Open risks, highest score first, then title. */
export function openRisks(risks) {
  return risks
    .filter((r) => r.status !== 'closed')
    .sort((a, b) => riskScore(b) - riskScore(a) || a.title.localeCompare(b.title));
}

/** Counts by band plus total exposure (sum of open scores). */
export function riskSummary(risks) {
  const open = openRisks(risks);
  const bands = { high: 0, medium: 0, low: 0 };
  let exposure = 0;
  for (const r of open) {
    bands[severity(r)] += 1;
    exposure += riskScore(r);
  }
  return { open: open.length, ...bands, exposure, closed: risks.length - open.length };
}

/** 5×5 heat-map cell counts, indexed [impact-1][probability-1]. */
export function heatMap(risks) {
  const grid = Array.from({ length: SCALE_MAX }, () => Array(SCALE_MAX).fill(0));
  for (const r of openRisks(risks)) grid[r.impact - 1][r.probability - 1] += 1;
  return grid;
}
