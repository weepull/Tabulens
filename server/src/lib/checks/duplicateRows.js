import { T } from '../thresholds.js';
import { normalize } from '../infer.js';
import { pct } from '../finding.js';

export const id = 'duplicate-rows';
export const label = 'Exact duplicate rows';
export const needs = {};

/** Join normalized cell values with a separator that will not occur in data. */
export function rowKey(row, columns) {
  return columns.map((c) => normalize(row[c])).join('\u0000');
}

export function run({ rows, columns, finding }) {
  const seen = new Map();
  for (let i = 0; i < rows.length; i++) {
    const key = rowKey(rows[i], columns);
    const bucket = seen.get(key);
    if (bucket) bucket.push(i);
    else seen.set(key, [i]);
  }

  const groups = [...seen.values()].filter((g) => g.length > 1);
  if (groups.length === 0) return [];

  // Every row after the first in each group is redundant.
  const redundant = groups.reduce((n, g) => n + g.length - 1, 0);
  const ratio = redundant / rows.length;
  const affected = groups.flatMap((g) => g.slice(1));

  return [
    finding({
      severity: ratio >= T.duplicates.highRatio ? 'high' : 'medium',
      title: `${redundant} duplicate row${redundant === 1 ? '' : 's'} (${pct(ratio)} of the file)`,
      detail:
        `${groups.length} group${groups.length === 1 ? '' : 's'} of identical rows. Comparison ignores ` +
        `surrounding whitespace and letter case, so "Mumbai" and " mumbai " count as the same value.`,
      why:
        `Duplicates inflate whichever rows they repeat. If they survive the train/test split they ` +
        `end up on both sides and your validation score measures memorisation. Past ` +
        `${pct(T.duplicates.highRatio)} of the file this stops being stray double-entry and starts ` +
        `shifting class balance, so it is raised to high.`,
      evidence: { duplicateRows: redundant, groups: groups.length, ratio },
      rowIndexes: affected,
      examples: groups.slice(0, 5).map((g) => ({ rows: g.slice(0, 5), copies: g.length })),
    }),
  ];
}
