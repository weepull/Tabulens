import { T } from './thresholds.js';

export const SEVERITIES = ['high', 'medium', 'low', 'info'];

/**
 * Build the finding factory for one check.
 *
 * Every finding has the same shape so the UI can render them generically, and
 * every finding is required to explain itself: `why` is the reasoning in plain
 * language, `evidence` is the raw numbers behind it. A check that asserts a
 * problem without showing its work is worse than no check, because the user
 * cannot tell a real hit from a false positive.
 */
export function makeFinding(checkId) {
  return function finding({
    severity = 'low',
    title,
    detail,
    why,
    evidence = {},
    columns = [],
    rowIndexes = [],
    examples = [],
    caveat = null,
  }) {
    if (!SEVERITIES.includes(severity)) throw new Error(`bad severity: ${severity}`);
    if (!title || !detail || !why) throw new Error(`${checkId}: title, detail and why are required`);
    return {
      id: checkId,
      severity,
      title,
      detail,
      why,
      caveat,
      evidence,
      columns,
      examples: examples.slice(0, T.limits.examplesPerFinding),
      rowIndexes: rowIndexes.slice(0, T.limits.rowIndexesPerFinding),
      totalRows: rowIndexes.length,
    };
  };
}

export function pct(x) {
  return `${(x * 100).toFixed(x < 0.01 && x > 0 ? 2 : 1)}%`;
}
