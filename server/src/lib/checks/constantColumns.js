import { T } from '../thresholds.js';
import { pct } from '../finding.js';

export const id = 'constant-columns';
export const label = 'Constant and near-constant columns';
export const needs = {};

export function run({ profile, target, finding }) {
  const out = [];
  for (const col of profile.values()) {
    if (col.name === target || col.present === 0) continue;

    if (col.unique === 1) {
      out.push(
        finding({
          severity: 'medium',
          title: `\`${col.name}\` has the same value in every row`,
          detail: `Every non-empty row reads "${col.topValue}".`,
          why:
            `A column that never varies cannot help a model separate anything. It is not harmful, ` +
            `it is dead weight, and its presence often means an upstream join or filter collapsed it.`,
          evidence: { unique: 1, value: col.topValue },
          columns: [col.name],
        }),
      );
      continue;
    }

    if (col.topRatio >= T.constant.dominantRatio) {
      out.push(
        finding({
          severity: 'low',
          title: `\`${col.name}\` is ${pct(col.topRatio)} one value`,
          detail: `"${col.topValue}" covers ${col.topCount} of ${col.present} non-empty rows.`,
          why:
            `Past ${pct(T.constant.dominantRatio)} the column behaves like a constant for almost ` +
            `every row. The rare other values may still matter, which is why this is low rather ` +
            `than a recommendation to drop it.`,
          evidence: { topValue: col.topValue, topCount: col.topCount, ratio: col.topRatio },
          columns: [col.name],
        }),
      );
    }
  }
  return out;
}
