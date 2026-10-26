/**
 * Type inference.
 *
 * CSV has no types. Everything arrives as a string, so "42" is text until we
 * decide otherwise. Every check downstream depends on this module, so if it is
 * wrong, the whole report is wrong.
 *
 * The approach: classify each value independently, count the classes, and let
 * the dominant class win along with a confidence ratio. We never coerce the
 * data itself, we only describe it.
 */

/** Values that mean "no value" in the wild. Checked case-insensitively. */
const NULLISH = new Set([
  '', 'na', 'n/a', 'n.a.', 'null', 'none', 'nil', 'nan', '-', '--', '?', 'unknown', 'missing',
]);

const NUMERIC_RE = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?([eE][-+]?\d+)?$/;
const BOOLEAN_SET = new Set(['true', 'false', 'yes', 'no', 't', 'f', 'y', 'n']);
// Deliberately narrow. Date.parse() alone will happily turn "5" into a date.
const DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/;
const DATE_SLASH_RE = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;

export function isMissing(raw) {
  if (raw === null || raw === undefined) return true;
  return NULLISH.has(String(raw).trim().toLowerCase());
}

/** Strip the decoration people put on numbers in spreadsheets. */
function stripNumericNoise(s) {
  return s.replace(/[$£€₹]/g, '').replace(/%$/, '').replace(/,/g, '').trim();
}

export function toNumber(raw) {
  const s = stripNumericNoise(String(raw).trim());
  if (!NUMERIC_RE.test(s.replace(/,/g, ''))) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function classify(raw) {
  if (isMissing(raw)) return 'missing';
  const s = String(raw).trim();
  const lower = s.toLowerCase();
  if (BOOLEAN_SET.has(lower)) return 'boolean';
  if (toNumber(s) !== null) return 'number';
  if (DATE_RE.test(s) || DATE_SLASH_RE.test(s)) return 'date';
  return 'string';
}

/** Normalized form used for duplicate and category grouping. */
export function normalize(raw) {
  if (isMissing(raw)) return '';
  return String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Profile one column.
 *
 * Returns the shape every check reads from. `values` is the raw column, in row
 * order, so indexes line up with the row array.
 */
export function profileColumn(name, values) {
  const typeCounts = { number: 0, boolean: 0, date: 0, string: 0, missing: 0 };
  const counts = new Map();   // raw value -> occurrences
  const numeric = [];         // parsed numbers, non-missing only
  const missingRows = [];

  for (let i = 0; i < values.length; i++) {
    const raw = values[i];
    const kind = classify(raw);
    typeCounts[kind]++;
    if (kind === 'missing') {
      missingRows.push(i);
      continue;
    }
    const key = String(raw).trim();
    counts.set(key, (counts.get(key) || 0) + 1);
    if (kind === 'number' || kind === 'boolean') {
      const n = toNumber(raw);
      if (n !== null) numeric.push(n);
    }
  }

  const present = values.length - typeCounts.missing;
  // Booleans encoded as 0/1 land in `number`; that is correct and intentional,
  // the imbalance and leakage checks treat low-cardinality numbers as classes.
  const ranked = Object.entries(typeCounts)
    .filter(([k]) => k !== 'missing')
    .sort((a, b) => b[1] - a[1]);
  const [dominant, dominantCount] = ranked[0] ?? ['string', 0];

  let topValue = null;
  let topCount = 0;
  for (const [value, c] of counts) {
    if (c > topCount) { topValue = value; topCount = c; }
  }

  return {
    name,
    type: present === 0 ? 'empty' : dominant,
    confidence: present === 0 ? 0 : dominantCount / present,
    typeCounts,
    rows: values.length,
    present,
    missing: typeCounts.missing,
    missingRatio: values.length === 0 ? 0 : typeCounts.missing / values.length,
    missingRows,
    unique: counts.size,
    uniqueRatio: present === 0 ? 0 : counts.size / present,
    counts,
    numeric,
    topValue,
    topCount,
    topRatio: present === 0 ? 0 : topCount / present,
  };
}

/** Profile an entire table. `rows` is an array of plain objects. */
export function profileTable(rows, columns) {
  const profile = new Map();
  for (const name of columns) {
    profile.set(name, profileColumn(name, rows.map((r) => r[name])));
  }
  return profile;
}
