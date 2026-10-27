import type { ColumnType } from '@/lib/types';

/**
 * Browser port of server/src/lib/infer.js (isMissing, toNumber, classify, and
 * the dominant-class rule in profileColumn). The preview's type tags must agree
 * with the report, so change both files together or not at all.
 */

const NULLISH = new Set([
  '', 'na', 'n/a', 'n.a.', 'null', 'none', 'nil', 'nan', '-', '--', '?', 'unknown', 'missing',
]);

const NUMERIC_RE = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?([eE][-+]?\d+)?$/;
const BOOLEAN_SET = new Set(['true', 'false', 'yes', 'no', 't', 'f', 'y', 'n']);
// Deliberately narrow. Date.parse() alone will happily turn "5" into a date.
const DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/;
const DATE_SLASH_RE = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;

type ValueClass = 'number' | 'boolean' | 'date' | 'string' | 'missing';

export function isMissing(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) return true;
  return NULLISH.has(String(raw).trim().toLowerCase());
}

function stripNumericNoise(s: string): string {
  return s.replace(/[$£€₹]/g, '').replace(/%$/, '').replace(/,/g, '').trim();
}

function toNumber(raw: string): number | null {
  const s = stripNumericNoise(String(raw).trim());
  if (!NUMERIC_RE.test(s.replace(/,/g, ''))) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function classify(raw: string | null | undefined): ValueClass {
  if (isMissing(raw)) return 'missing';
  const s = String(raw).trim();
  // Boolean before number, as on the server: "1"/"0" stay numbers, "y"/"n" do not.
  if (BOOLEAN_SET.has(s.toLowerCase())) return 'boolean';
  if (toNumber(s) !== null) return 'number';
  if (DATE_RE.test(s) || DATE_SLASH_RE.test(s)) return 'date';
  return 'string';
}

export interface ColumnInference {
  type: ColumnType;
  missing: number;
}

export function inferColumn(rows: Record<string, string>[], column: string): ColumnInference {
  const counts: Record<ValueClass, number> = { number: 0, boolean: 0, date: 0, string: 0, missing: 0 };
  for (const row of rows) counts[classify(row[column])]++;

  const present = rows.length - counts.missing;
  if (present === 0) return { type: 'empty', missing: counts.missing };

  // Same order and stable sort as the server, so ties resolve identically.
  const ranked = (['number', 'boolean', 'date', 'string'] as const)
    .map((k) => [k, counts[k]] as const)
    .sort((a, b) => b[1] - a[1]);
  return { type: ranked[0][0], missing: counts.missing };
}

export function inferColumns(rows: Record<string, string>[], columns: string[]): Map<string, ColumnInference> {
  return new Map(columns.map((c) => [c, inferColumn(rows, c)]));
}
