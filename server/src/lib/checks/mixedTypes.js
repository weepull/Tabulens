import { T } from '../thresholds.js';
import { classify } from '../infer.js';
import { pct } from '../finding.js';

export const id = 'mixed-types';
export const label = 'Mixed types in one column';
export const needs = {};

export function run({ rows, profile, finding }) {
  const out = [];
  for (const col of profile.values()) {
    if (col.present === 0) continue;
    const conf = col.confidence; // share of non-missing values matching the dominant type
    if (conf < T.mixedTypes.minDominant || conf > T.mixedTypes.maxDominant) continue;

    // Collect the minority values so the user can see what actually broke.
    const offenders = [];
    const rowIndexes = [];
    for (let i = 0; i < rows.length && offenders.length < 50; i++) {
      const raw = rows[i][col.name];
      const kind = classify(raw);
      if (kind === 'missing' || kind === col.type) continue;
      offenders.push({ row: i, value: String(raw), parsedAs: kind });
      rowIndexes.push(i);
    }
    if (offenders.length === 0) continue;

    const minority = col.present - Math.round(conf * col.present);
    out.push(
      finding({
        severity: 'medium',
        title: `\`${col.name}\` is mostly ${col.type} but not entirely`,
        detail:
          `${pct(conf)} of non-empty values parse as ${col.type}; about ${minority} do not. ` +
          `Offending values: ${offenders.slice(0, 5).map((o) => `"${o.value}"`).join(', ')}.`,
        why:
          `Between ${pct(T.mixedTypes.minDominant)} and ${pct(T.mixedTypes.maxDominant)} agreement ` +
          `there is a clear intended type with a few values fighting it. Pandas resolves this by ` +
          `making the whole column object dtype, so arithmetic silently stops working or the whole ` +
          `column is read as text. Below ${pct(T.mixedTypes.minDominant)} we assume it is genuinely ` +
          `free text and stay quiet.`,
        evidence: { dominantType: col.type, confidence: conf, offenders: offenders.length },
        columns: [col.name],
        rowIndexes,
        examples: offenders.slice(0, 5),
      }),
    );
  }
  return out;
}
