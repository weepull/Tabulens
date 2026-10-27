/**
 * The report shape returned by POST /api/analyze.
 *
 * Mirrors server/src/lib/engine.js and server/src/lib/finding.js. If the
 * server changes shape, change it here and let the compiler find the fallout.
 */

export type Severity = 'high' | 'medium' | 'low' | 'info';

export const SEVERITIES: Severity[] = ['high', 'medium', 'low', 'info'];

export type ColumnType = 'number' | 'boolean' | 'date' | 'string' | 'empty';

export interface Finding {
  /** Check id, e.g. "target-leakage". Not unique: one check can emit several findings. */
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** The reasoning. Always shown, never behind a click. */
  why: string;
  /** Extra warning, e.g. small-sample leakage. */
  caveat: string | null;
  /** Raw numbers behind the finding. Shape varies per check. */
  evidence: Record<string, unknown>;
  columns: string[];
  /** Check-specific samples; shape varies per check. At most 5. */
  examples: unknown[];
  /**
   * Zero-based data-row positions (header excluded), capped at 100.
   * For `train-test-contamination` they index the TEST file, not the primary one.
   */
  rowIndexes: number[];
  /** Uncapped count of affected rows. */
  totalRows: number;
}

export interface ColumnSummary {
  name: string;
  type: ColumnType;
  confidence: number;
  missing: number;
  missingRatio: number;
  unique: number;
  uniqueRatio: number;
  sampleValues: string[];
}

export interface ParseIssues {
  ragged: { row: number; code: 'TooFewFields' | 'TooManyFields' }[];
  raggedCount: number;
  /** Original names of headers that appear more than once. */
  dupeHeaders: string[];
  /**
   * The parser renames repeats ('a,a' -> 'a', 'a_1'). Maps new name to original.
   * Optional so an older server without it still type-checks at runtime.
   */
  renamedHeaders?: Record<string, string>;
}

export interface Report {
  meta: {
    filename: string;
    rows: number;
    columns: number;
    target: string | null;
    testFilename: string | null;
    testRows: number | null;
    ms: number;
    parseIssues: ParseIssues;
  };
  columns: ColumnSummary[];
  findings: Finding[];
  counts: Record<Severity, number>;
  score: { value: number; grade: 'clean' | 'minor issues' | 'needs work' | 'poor'; note: string };
}

/** A CSV parsed in the browser, with the same rules the server uses. */
export interface ParsedCsv {
  filename: string;
  columns: string[];
  rows: Record<string, string>[];
}
