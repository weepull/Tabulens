import { T } from '../thresholds.js';
import { isMissing, toNumber } from '../infer.js';
import { pct } from '../finding.js';

export const id = 'target-leakage';
export const label = 'Target leakage';
export const needs = { target: true };

/**
 * Leakage is when a feature contains information that would not exist at
 * prediction time, usually because it was derived from the answer. A model
 * trained on it scores brilliantly in validation and collapses in production.
 *
 * We cannot prove leakage. What we can do is measure how well a single column
 * predicts the target on its own, and flag anything suspiciously good. Real
 * features are informative. A column that nails the target by itself, with no
 * model and no tuning, is usually the answer wearing a hat.
 *
 * Two tests, depending on the column type:
 *
 *   Categorical: group rows by the column's value, then ask how pure the target
 *   is inside each group. If knowing the category tells you the label almost
 *   every time, the category already encodes the label.
 *
 *   Numeric: find the single best threshold ("x <= t") and measure how
 *   accurately it separates the classes. One untuned cut beating 98% is not a
 *   feature, it is a leak.
 */

/** A name-based heuristic. Cheap, surprisingly effective, deliberately low severity. */
const SUSPICIOUS_NAME = /(score|label|outcome|result|target|prediction|predicted|is_|was_|final|actual|ground_?truth|y_)/i;

/** Majority-class accuracy: what you get by always guessing the most common class. */
function baselineAccuracy(labels) {
  const counts = new Map();
  for (const l of labels) counts.set(l, (counts.get(l) || 0) + 1);
  return Math.max(...counts.values()) / labels.length;
}

/**
 * Best single-threshold accuracy for a numeric column.
 *
 * Sort rows by the column value, then sweep every point where the value
 * changes. At each sweep position we know the class counts on the left and the
 * right from running totals, so the whole scan is O(n log n) for the sort plus
 * O(n * classes) for the sweep, not O(n^2).
 *
 * At each split we assume we would predict the majority class on each side,
 * so accuracy = (best class on the left + best class on the right) / n.
 */
export function bestNumericSplit(pairs, classes) {
  const sorted = [...pairs].sort((a, b) => a.x - b.x);
  const n = sorted.length;
  const left = new Map();
  const right = new Map();
  for (const c of classes) { left.set(c, 0); right.set(c, 0); }
  for (const p of sorted) right.set(p.y, right.get(p.y) + 1);

  let best = { accuracy: baselineAccuracy(sorted.map((p) => p.y)), threshold: null };

  for (let i = 0; i < n - 1; i++) {
    const p = sorted[i];
    left.set(p.y, left.get(p.y) + 1);
    right.set(p.y, right.get(p.y) - 1);
    // Only a real split if the next value differs, otherwise the cut is not expressible.
    if (sorted[i + 1].x === p.x) continue;

    const acc = (Math.max(...left.values()) + Math.max(...right.values())) / n;
    if (acc > best.accuracy) {
      best = { accuracy: acc, threshold: (p.x + sorted[i + 1].x) / 2 };
    }
  }
  return best;
}

/** Share of rows whose target equals the most common target within their own group. */
export function groupPurity(pairs) {
  const groups = new Map();
  for (const { x, y } of pairs) {
    let g = groups.get(x);
    if (!g) { g = new Map(); groups.set(x, g); }
    g.set(y, (g.get(y) || 0) + 1);
  }
  let correct = 0;
  for (const g of groups.values()) correct += Math.max(...g.values());
  return { purity: correct / pairs.length, groups: groups.size };
}

export function run({ rows, columns, profile, target, finding }) {
  const out = [];
  const targetProfile = profile.get(target);
  if (!targetProfile) return out;

  // This check is shaped for classification. A continuous target needs a
  // correlation-based version, which v1 does not implement, so say so plainly
  // rather than returning a wrong answer.
  if (targetProfile.unique > T.leakage.maxTargetClasses) {
    return [
      finding({
        severity: 'info',
        title: `Leakage detection skipped for \`${target}\``,
        detail: `The target has ${targetProfile.unique} distinct values, which reads as a regression target rather than a class label.`,
        why: `Both leakage tests here are classification-shaped: they measure how cleanly a column separates classes. Above ${T.leakage.maxTargetClasses} distinct target values that framing breaks down, and reporting a number anyway would be misleading.`,
        evidence: { targetCardinality: targetProfile.unique, limit: T.leakage.maxTargetClasses },
        columns: [target],
      }),
    ];
  }

  const smallSample = rows.length < T.leakage.minRows;
  const caveat = smallSample
    ? `Only ${rows.length} rows. Below ${T.leakage.minRows}, perfect separation happens by chance, so treat this as a prompt to look rather than a conclusion.`
    : null;

  const classes = [...targetProfile.counts.keys()];

  for (const name of columns) {
    if (name === target) continue;
    const col = profile.get(name);
    if (!col || col.present === 0) continue;

    // Rows where both the feature and the target are present.
    const pairs = [];
    for (let i = 0; i < rows.length; i++) {
      const rawX = rows[i][name];
      const rawY = rows[i][target];
      if (isMissing(rawX) || isMissing(rawY)) continue;
      pairs.push({ raw: String(rawX).trim(), x: toNumber(rawX), y: String(rawY).trim(), row: i });
    }
    if (pairs.length < 10) continue;

    const baseline = baselineAccuracy(pairs.map((p) => p.y));
    const isNumeric = (col.type === 'number' || col.type === 'date') && pairs.every((p) => p.x !== null);

    if (isNumeric) {
      const { accuracy, threshold } = bestNumericSplit(pairs, classes);
      if (accuracy < T.leakage.numericAccuracy || accuracy <= baseline + 1e-9) continue;

      out.push(
        finding({
          severity: smallSample ? 'medium' : 'high',
          title: `\`${name}\` on its own predicts \`${target}\` ${pct(accuracy)} of the time`,
          detail:
            `A single cut at ${name} ${threshold === null ? '' : `≤ ${Number(threshold.toPrecision(6))}`} ` +
            `separates the target with ${pct(accuracy)} accuracy. Always guessing the most common ` +
            `class would give ${pct(baseline)}.`,
          why:
            `Above ${pct(T.leakage.numericAccuracy)} from one untuned threshold, the column is almost ` +
            `always computed from the target or recorded after it. Ask whether this value is really ` +
            `known at the moment you would need to predict. If it is not, drop it.`,
          evidence: { splitAccuracy: accuracy, threshold, baseline, lift: accuracy - baseline, rowsUsed: pairs.length },
          columns: [name],
          caveat,
        }),
      );
      continue;
    }

    // Categorical branch.
    // Group on the raw text: `x` is the numeric parse, null for every non-number.
    const { purity, groups } = groupPurity(pairs.map((p) => ({ x: p.raw, y: p.y })));
    // A column with a distinct value per row reaches purity 1.0 for free. That
    // is an identifier, and id-like-columns already reports it.
    if (groups > pairs.length * T.leakage.maxCardinalityRatio) continue;
    if (purity < T.leakage.categoricalPurity || purity <= baseline + 1e-9) continue;

    out.push(
      finding({
        severity: smallSample ? 'medium' : 'high',
        title: `\`${name}\` almost determines \`${target}\``,
        detail:
          `Grouping by ${name} gives ${groups} groups, and within them the target is consistent ` +
          `${pct(purity)} of the time. The majority-class baseline is ${pct(baseline)}.`,
        why:
          `If knowing the category tells you the label ${pct(T.leakage.categoricalPurity)} of the ` +
          `time, the category already carries the answer. Either it was derived from the target, or ` +
          `it is a near-duplicate encoding of it.`,
        evidence: { purity, groups, baseline, lift: purity - baseline, rowsUsed: pairs.length },
        columns: [name],
        caveat,
      }),
    );
  }

  // Name-based pass, reported separately and softly: a column called
  // "final_score" is worth a human glance even when the maths says nothing.
  const flaggedByMaths = new Set(out.flatMap((f) => f.columns));
  const byName = columns.filter(
    (c) => c !== target && SUSPICIOUS_NAME.test(c) && !flaggedByMaths.has(c),
  );
  if (byName.length > 0) {
    out.push(
      finding({
        severity: 'low',
        title: `${byName.length} column name${byName.length === 1 ? '' : 's'} suggest${byName.length === 1 ? 's' : ''} it may come from the target`,
        detail: `Worth a manual look: ${byName.map((c) => `\`${c}\``).join(', ')}.`,
        why:
          `Purely a name heuristic, with no evidence from the data behind it, which is why it is ` +
          `low. Names like score, outcome, result or final often mark values recorded after the ` +
          `event you are trying to predict, even when the column alone does not separate the classes.`,
        evidence: { matchedColumns: byName },
        columns: byName,
      }),
    );
  }

  return out;
}
