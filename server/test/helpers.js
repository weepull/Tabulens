import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { profileTable } from '../src/lib/infer.js';
import { makeFinding } from '../src/lib/finding.js';
import { parseCsv } from '../src/lib/parse.js';

/** Build the same ctx the engine hands to a check, from plain row objects. */
export function ctxFor(check, rows, { target = null, testRows = null } = {}) {
  const columns = Object.keys(rows[0]);
  return {
    rows,
    columns,
    profile: profileTable(rows, columns),
    target,
    testRows,
    testColumns: testRows ? Object.keys(testRows[0]) : null,
    finding: makeFinding(check.id),
  };
}

/** n rows produced by fn(i). */
export function table(n, fn) {
  return Array.from({ length: n }, (_, i) => fn(i));
}

export function readExample(name) {
  const path = fileURLToPath(new URL(`../../examples/${name}`, import.meta.url));
  return parseCsv(readFileSync(path), { filename: name });
}
