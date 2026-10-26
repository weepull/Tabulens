import { T } from '../thresholds.js';
import { pct } from '../finding.js';

export const id = 'id-like-columns';
export const label = 'Identifier columns';
export const needs = {};

const NAME_HINT = /(^|[_\-\s])(id|uuid|guid|key|index|idx|no|number|code|ref)([_\-\s]|$)/i;

export function run({ profile, rows, target, finding }) {
  if (rows.length < T.idLike.minRows) return [];
  const out = [];

  for (const col of profile.values()) {
    if (col.name === target) continue;
    const nameLooksLikeId = NAME_HINT.test(col.name);
    if (col.uniqueRatio < T.idLike.uniqueRatio) continue;

    // A continuous measurement (income, temperature, a price) is near-unique by
    // nature, so uniqueness alone is not evidence of an identifier. For numeric
    // columns we additionally require the name to read like one. Without this,
    // every float column in the file gets flagged, which trains the user to
    // ignore the check.
    if (col.type === 'number' && !nameLooksLikeId) continue;

    out.push(
      finding({
        severity: 'medium',
        title: `\`${col.name}\` looks like an identifier`,
        detail:
          `${col.unique} distinct values across ${col.present} non-empty rows ` +
          `(${pct(col.uniqueRatio)} unique)${nameLooksLikeId ? ', and the column name reads like an ID' : ''}.`,
        why:
          `Above ${pct(T.idLike.uniqueRatio)} unique, the column is close to a row label. Fed in as ` +
          `a feature, a tree can memorise it and score perfectly in training while learning nothing ` +
          `that transfers. Keep it for joining and tracing, exclude it from features.`,
        evidence: {
          unique: col.unique,
          present: col.present,
          uniqueRatio: col.uniqueRatio,
          nameLooksLikeId,
        },
        columns: [col.name],
      }),
    );
  }
  return out;
}
