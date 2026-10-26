import { T } from '../thresholds.js';
import { pct } from '../finding.js';

export const id = 'missing-values';
export const label = 'Missing values';
export const needs = {};

export function run({ profile, finding }) {
  const out = [];
  for (const col of profile.values()) {
    const r = col.missingRatio;
    if (r <= T.missing.low) continue;

    const severity = r >= T.missing.high ? 'high' : r >= T.missing.medium ? 'medium' : 'low';
    out.push(
      finding({
        severity,
        title: `\`${col.name}\` is ${pct(r)} empty`,
        detail:
          `${col.missing} of ${col.rows} rows have no value. Blanks plus the usual stand-ins ` +
          `(NA, null, none, "-", "?", unknown) all count as missing.`,
        why:
          `Under ${pct(T.missing.low)} almost any imputation works. Past ${pct(T.missing.medium)} ` +
          `the filled-in value starts to outweigh the real signal, and past ${pct(T.missing.high)} ` +
          `there is barely a column left, so dropping it usually beats filling it.`,
        evidence: { missing: col.missing, rows: col.rows, ratio: r },
        columns: [col.name],
        rowIndexes: col.missingRows,
      }),
    );
  }
  return out;
}
