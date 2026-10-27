'use client';

import { useMemo } from 'react';
import type { ParsedCsv } from '@/lib/types';
import { inferColumns, isMissing } from './inferType';

const PREVIEW_ROWS = 50;

export function PreviewTable({ data, target }: { data: ParsedCsv; target: string | null }) {
  // Types and missing counts cover every row, not just the visible 50, so the
  // tags match what the report will say. Memoized: this is O(rows × columns).
  const inferred = useMemo(() => inferColumns(data.rows, data.columns), [data]);
  const shown = data.rows.slice(0, PREVIEW_ROWS);
  const total = data.rows.length;

  return (
    <section aria-labelledby="preview-heading" className="min-w-0 animate-fade-up">
      <h2 id="preview-heading" className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
        <span className="text-xl font-semibold tracking-tight text-foreground">Preview:</span>
        <span>
          first {shown.length.toLocaleString()} of {total.toLocaleString()} {total === 1 ? 'row' : 'rows'} ·{' '}
          {data.columns.length.toLocaleString()} {data.columns.length === 1 ? 'column' : 'columns'}
        </span>
      </h2>

      {data.columns.length === 0 ? (
        <p className="glass-solid rounded-2xl p-5 text-sm text-muted">
          No columns found. Is the first line a header row?
        </p>
      ) : (
        // Focusable so keyboard users can scroll a table wider than the screen.
        <div
          role="region"
          aria-labelledby="preview-heading"
          tabIndex={0}
          className="glass-solid max-h-[28rem] overflow-auto rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                {data.columns.map((col, i) => {
                  const info = inferred.get(col);
                  const isTarget = col === target;
                  return (
                    <th
                      key={`${i}:${col}`}
                      scope="col"
                      className={`sticky top-0 z-10 border-b border-white/10 px-3.5 py-2.5 align-top font-medium ${
                        isTarget ? 'bg-accent-soft' : 'bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="max-w-[16rem] truncate" title={col}>
                          {col}
                        </span>
                        {isTarget && (
                          <span className="rounded-full bg-foreground px-2 py-px text-[0.625rem] font-semibold tracking-wider text-background uppercase">
                            target
                          </span>
                        )}
                      </div>
                      {info && (
                        <div className="mt-1 flex items-center gap-2 text-xs font-normal whitespace-nowrap text-muted">
                          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono">{info.type}</span>
                          <span>{info.missing.toLocaleString()} missing</span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, r) => (
                <tr key={r} className="transition-colors even:bg-white/[0.02] hover:bg-white/[0.04]">
                  {data.columns.map((col, i) => {
                    const value = row[col];
                    const missing = isMissing(value);
                    return (
                      <td
                        key={`${i}:${col}`}
                        className={`max-w-[20rem] truncate border-b border-white/[0.05] px-3.5 py-1.5 font-mono text-xs whitespace-nowrap ${
                          col === target ? 'bg-white/[0.03]' : ''
                        }`}
                        title={value ?? undefined}
                      >
                        {missing ? (
                          // Empty cells get a visible placeholder; "NA", "null" etc. keep their text.
                          <span className="text-muted italic">{value?.trim() ? value : 'empty'}</span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
