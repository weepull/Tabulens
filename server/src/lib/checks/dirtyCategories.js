import { T } from '../thresholds.js';
import { normalize } from '../infer.js';

export const id = 'dirty-categories';
export const label = 'Same category, different spelling';
export const needs = {};

export function run({ profile, finding }) {
  const out = [];
  for (const col of profile.values()) {
    // Only meaningful for things that are actually categories.
    if (col.type !== 'string' && col.type !== 'boolean') continue;
    if (col.unique > T.dirtyCategories.maxCardinality || col.unique < 2) continue;

    // Group the raw values by their normalized form. More than one raw value
    // mapping to the same normalized key means the "categories" are variants.
    const groups = new Map();
    for (const [raw, count] of col.counts) {
      const key = normalize(raw);
      const g = groups.get(key) || [];
      g.push({ raw, count });
      groups.set(key, g);
    }

    const collisions = [...groups.entries()].filter(([, variants]) => variants.length > 1);
    if (collisions.length === 0) continue;

    const collapsedTo = groups.size;
    out.push(
      finding({
        severity: 'medium',
        title: `\`${col.name}\` has ${collisions.length} categor${collisions.length === 1 ? 'y' : 'ies'} spelled more than one way`,
        detail:
          `${col.unique} distinct values collapse to ${collapsedTo} once case and surrounding ` +
          `whitespace are ignored. For example: ` +
          collisions
            .slice(0, 3)
            .map(([, v]) => v.map((x) => `"${x.raw}"`).join(' / '))
            .join('; ') + '.',
        why:
          `One-hot encoding and groupby treat these as separate categories, so a single real ` +
          `category gets its signal split across several columns and each one looks weaker than it ` +
          `is. Only scanned while cardinality is under ${T.dirtyCategories.maxCardinality}, above ` +
          `which the column is free text rather than a category.`,
        evidence: { rawCardinality: col.unique, normalizedCardinality: collapsedTo, collisions: collisions.length },
        columns: [col.name],
        examples: collisions.slice(0, 5).map(([key, variants]) => ({ normalized: key, variants })),
      }),
    );
  }
  return out;
}
