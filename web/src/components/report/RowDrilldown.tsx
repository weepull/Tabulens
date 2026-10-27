'use client';

import { useId, useState } from 'react';
import type { Finding } from '@/lib/types';

/** Past this many columns, start collapsed so the flagged ones are not lost off to the right. */
const COLLAPSE_OVER = 12;
/** Unflagged columns shown alongside the flagged ones while collapsed. */
const CONTEXT_COLUMNS = 4;

// Same list as server/src/lib/infer.js, so a cell looks missing here exactly
// when the server counted it as missing.
const NULLISH = new Set([
  '', 'na', 'n/a', 'n.a.', 'null', 'none', 'nil', 'nan', '-', '--', '?', 'unknown', 'missing',
]);

function isMissing(raw: string | undefined): boolean {
  return raw === undefined || raw === null || NULLISH.has(String(raw).trim().toLowerCase());
}

export function RowDrilldown(props: {
  finding: Finding;
  rows: Record<string, string>[];
  columns: string[];
}) {
  const { finding, rows, columns } = props;
  const [showAll, setShowAll] = useState(false);
  const captionId = useId();

  if (finding.rowIndexes.length === 0) {
    return <p className="text-sm text-muted">This finding does not point at individual rows.</p>;
  }

  // Flagged columns first, in the finding's order, but only ones this file has.
  const flagged = finding.columns.filter((c) => columns.includes(c));
  const flaggedSet = new Set(flagged);
  const others = columns.filter((c) => !flaggedSet.has(c));
  const collapsible = columns.length > COLLAPSE_OVER;
  const shownOthers = collapsible && !showAll ? others.slice(0, CONTEXT_COLUMNS) : others;
  const visible = [...flagged, ...shownOthers];
  const hiddenCount = others.length - shownOthers.length;

  const shown = finding.rowIndexes.length;
  const truncated = finding.totalRows > shown;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p className="text-foreground">
          {truncated
            ? `Showing the first ${shown.toLocaleString()} of ${finding.totalRows.toLocaleString()} affected rows`
            : `${shown.toLocaleString()} affected ${shown === 1 ? 'row' : 'rows'}`}
        </p>
        {collapsible && (
          <button
            type="button"
            // No aria-pressed: the label already says what pressing it will do.
            onClick={() => setShowAll((v) => !v)}
            className="rounded text-foreground underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {showAll ? 'Show flagged columns only' : `Show all ${columns.length} columns`}
          </button>
        )}
      </div>

      <p id={captionId} className="text-xs text-muted">
        &ldquo;Row&rdquo; is where the row sits in a spreadsheet, with the header as row 1. Blank
        lines in the file are skipped when it is read, so if it has any, rows after them appear
        further down in a spreadsheet than shown here.
        {flagged.length > 0 && ' Columns this finding is about are marked “flagged” and come first.'}
        {hiddenCount > 0 && ` ${hiddenCount} other ${hiddenCount === 1 ? 'column is' : 'columns are'} hidden.`}
      </p>

      {/* Own scroll container so a wide file never scrolls the page sideways. */}
      <div
        role="region"
        aria-label={`Affected rows for: ${finding.title}`}
        tabIndex={0}
        className="max-h-96 overflow-auto rounded-xl border border-white/[0.08] bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <table aria-describedby={captionId} className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-20 border-b border-white/10 bg-surface-2 px-3 py-2 font-medium text-muted"
              >
                Row
              </th>
              {visible.map((c) => {
                const isFlagged = flaggedSet.has(c);
                return (
                  <th
                    key={c}
                    scope="col"
                    className={`sticky top-0 z-10 border-b border-white/10 px-3 py-2 align-bottom font-medium whitespace-nowrap ${
                      isFlagged ? 'bg-accent-soft text-foreground' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {isFlagged && (
                      <span className="block text-[0.625rem] font-semibold tracking-wider text-foreground uppercase">
                        flagged
                      </span>
                    )}
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {finding.rowIndexes.map((idx, i) => {
              const row = rows[idx];
              const rowLabel = (idx + 2).toLocaleString();
              return (
                <tr key={`${idx}-${i}`} className="group/row [&>*]:border-b [&>*]:border-white/[0.05] last:[&>*]:border-b-0 even:bg-surface-2/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-0 bg-surface px-3 py-1.5 font-mono text-xs font-normal text-muted tabular-nums group-even/row:bg-surface-2"
                  >
                    {rowLabel}
                  </th>
                  {row === undefined ? (
                    // The report and the browser parse disagree about this row. Say so
                    // rather than show a neighbouring row as if it were the right one.
                    <td colSpan={Math.max(visible.length, 1)} className="px-3 py-1.5 text-muted italic">
                      Row not found in the file as parsed here.
                    </td>
                  ) : (
                    visible.map((c) => {
                      const value = row[c];
                      const missing = isMissing(value);
                      const flaggedCell = flaggedSet.has(c);
                      return (
                        <td
                          key={c}
                          title={value && value.length > 40 ? value : undefined}
                          className={`max-w-xs truncate px-3 py-1.5 whitespace-nowrap ${
                            flaggedCell ? 'bg-accent-soft/40' : ''
                          } ${missing ? 'text-muted italic' : 'text-foreground'}`}
                        >
                          {value === undefined || value.trim() === '' ? '(empty)' : value}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
