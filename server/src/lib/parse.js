import Papa from 'papaparse';

/**
 * Parse a CSV buffer into rows of plain objects.
 *
 * dynamicTyping is off on purpose. Papa's coercion would quietly turn "007"
 * into 7 and "NA" into null before our own inference ever sees the value, and
 * inference is the thing we actually want control over.
 */
export function parseCsv(buffer, { filename = 'upload.csv' } = {}) {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const out = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  const columns = (out.meta.fields || []).filter((f) => f !== '' && f !== '__parsed_extra');
  if (columns.length === 0) {
    const err = new Error('No columns found. Is the first row a header?');
    err.status = 400;
    throw err;
  }

  // Papa renames repeated headers ('a,a' -> 'a', 'a_1') before meta.fields is
  // built, so duplicates have to be read from its rename map, not from columns.
  const renamedHeaders = { ...(out.meta.renamedHeaders || {}) };
  const dupeHeaders = [...new Set(Object.values(renamedHeaders))];
  const rows = out.data.filter((r) => r && typeof r === 'object');

  // Papa reports ragged rows here; worth surfacing rather than silently padding.
  const ragged = out.errors
    .filter((e) => e.code === 'TooFewFields' || e.code === 'TooManyFields')
    .map((e) => ({ row: e.row, code: e.code }));

  return {
    filename,
    columns,
    rows,
    parseIssues: { ragged: ragged.slice(0, 50), raggedCount: ragged.length, dupeHeaders, renamedHeaders },
  };
}
