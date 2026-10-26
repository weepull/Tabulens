import { normalize } from '../infer.js';
import { pct } from '../finding.js';

export const id = 'train-test-contamination';
export const label = 'Train/test contamination';
export const needs = { test: true };

/**
 * The headline check.
 *
 * If a row appears in both the training file and the test file, your test score
 * is partly a memory test. The model has already seen the answer. This is the
 * single most common reason a model that validated at 97% behaves like a coin
 * flip once it meets real data.
 *
 * Two passes:
 *   1. Whole-row overlap: identical records on both sides.
 *   2. Feature-only overlap: identical features, target excluded. This catches
 *      the subtler case where the same entity was sampled twice and relabelled,
 *      and it also catches a row that was copied and then had its label fixed.
 *
 * Both use hashing into a Set, so the comparison is O(train + test) rather than
 * comparing every row against every other row.
 */
function keyOf(row, cols) {
  return cols.map((c) => normalize(row[c])).join('\u0000');
}

export function run({ rows, columns, testRows, testColumns, target, finding }) {
  const out = [];
  if (!testRows || testRows.length === 0) return out;

  const shared = columns.filter((c) => testColumns.includes(c));
  if (shared.length === 0) {
    return [
      finding({
        severity: 'medium',
        title: 'The two files share no column names',
        detail: `Primary file: ${columns.join(', ')}. Second file: ${testColumns.join(', ')}.`,
        why: 'Contamination cannot be checked without overlapping columns. Usually this means one of the files has a header row problem, or the wrong file was uploaded.',
        evidence: { columns, testColumns },
      }),
    ];
  }

  // Pass 1: full row.
  const trainKeys = new Set(rows.map((r) => keyOf(r, shared)));
  const fullHits = [];
  for (let i = 0; i < testRows.length; i++) {
    if (trainKeys.has(keyOf(testRows[i], shared))) fullHits.push(i);
  }

  if (fullHits.length > 0) {
    const ratio = fullHits.length / testRows.length;
    out.push(
      finding({
        severity: 'high',
        title: `${fullHits.length} test row${fullHits.length === 1 ? '' : 's'} also appear in the training file (${pct(ratio)} of the test set)`,
        detail:
          `Compared on the ${shared.length} column${shared.length === 1 ? '' : 's'} the two files ` +
          `have in common, ignoring case and surrounding whitespace. Row numbers are positions in ` +
          `the second file.`,
        why:
          `Any overlap at all is a problem, which is why there is no threshold here. Every ` +
          `contaminated row is one the model may have memorised, so your reported test score is ` +
          `inflated by roughly this fraction and you cannot tell by how much from the score alone.`,
        evidence: { overlappingRows: fullHits.length, testRows: testRows.length, ratio, comparedColumns: shared },
        rowIndexes: fullHits,
      }),
    );
  }

  // Pass 2: features only.
  if (target && shared.includes(target)) {
    const featureCols = shared.filter((c) => c !== target);
    if (featureCols.length > 0) {
      const trainFeatureKeys = new Set(rows.map((r) => keyOf(r, featureCols)));
      const featureHits = [];
      for (let i = 0; i < testRows.length; i++) {
        if (trainFeatureKeys.has(keyOf(testRows[i], featureCols))) featureHits.push(i);
      }
      const extra = featureHits.length - fullHits.length;
      if (extra > 0) {
        out.push(
          finding({
            severity: 'high',
            title: `${extra} further test row${extra === 1 ? '' : 's'} match training rows on every feature but differ on \`${target}\``,
            detail:
              `Identical feature values, different label. These are on top of the ${fullHits.length} ` +
              `exact duplicate${fullHits.length === 1 ? '' : 's'} reported above.`,
            why:
              `Same inputs with different answers means either the same entity was sampled twice ` +
              `and labelled inconsistently, or the label is not actually a function of these ` +
              `features. Both cap the accuracy any model can reach, and the model will have seen ` +
              `these exact inputs during training regardless.`,
            evidence: { featureOnlyOverlap: featureHits.length, exactOverlap: fullHits.length, comparedColumns: featureCols },
            rowIndexes: featureHits.filter((i) => !fullHits.includes(i)),
          }),
        );
      }
    }
  }

  if (out.length === 0) {
    out.push(
      finding({
        severity: 'info',
        title: 'No overlap between the two files',
        detail: `Checked ${testRows.length} rows against ${rows.length} on ${shared.length} shared column${shared.length === 1 ? '' : 's'}.`,
        why: 'Exact matching only. Near-duplicates (a changed timestamp, a reformatted number, the same customer under two IDs) would not be caught and are not implemented in this version.',
        evidence: { testRows: testRows.length, trainRows: rows.length, comparedColumns: shared },
      }),
    );
  }
  return out;
}
