import { T } from './thresholds.js';

/**
 * A single headline number, because people want one.
 *
 * Deliberately crude and documented as such in the UI: it is a sum of severity
 * weights, not a statistical measure of anything. Its only job is to make a
 * clean file feel different from a broken one at a glance.
 */
export function scoreReport(findings) {
  let value = 100;
  for (const f of findings) value -= T.score[f.severity] ?? 0;
  value = Math.max(0, Math.min(100, Math.round(value)));
  const grade =
    value >= 85 ? 'clean' : value >= 65 ? 'minor issues' : value >= 40 ? 'needs work' : 'poor';
  return {
    value,
    grade,
    note: 'Severity-weighted deduction, not a statistical measure. Read the findings.',
  };
}
