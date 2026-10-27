import Papa from 'papaparse';
import type { ParsedCsv } from './types';

/**
 * Parse a CSV in the browser with exactly the options server/src/lib/parse.js
 * uses. This is not cosmetic: the report's `rowIndexes` are positions in the
 * server's row array, and row drill-down looks them up in this one. Any
 * difference here (empty-line handling, BOM, header trimming) shifts every
 * index and shows the user the wrong rows.
 */
export function parseCsvText(text: string, filename: string): ParsedCsv {
  const out = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });
  const columns = (out.meta.fields || []).filter((f) => f !== '' && f !== '__parsed_extra');
  const rows = out.data.filter((r) => r && typeof r === 'object');
  return { filename, columns, rows };
}

export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  return parseCsvText(await file.text(), file.name);
}
