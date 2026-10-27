'use client';

import { useId, useState } from 'react';
import type { Finding, ParsedCsv } from '@/lib/types';
import { RowDrilldown } from './RowDrilldown';
import { EvidenceBlock, Json } from './EvidenceBlock';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus } from '@/components/ui/icons';
import { EYEBROW, FOCUS, SEV_STYLE, inlineCode } from './format';

/**
 * Examples carry zero-based data-row positions (`row`, or `rows` for
 * duplicates). Show them as spreadsheet rows (header = row 1), the same
 * numbering the row drill-down uses, so the two never disagree by 2.
 */
function withSpreadsheetRows(ex: unknown): unknown {
  if (!hasRowNumbers(ex)) return ex;
  const out: Record<string, unknown> = { ...(ex as Record<string, unknown>) };
  if (typeof out.row === 'number') out.row = out.row + 2;
  if (Array.isArray(out.rows) && out.rows.every((r) => typeof r === 'number')) {
    out.rows = (out.rows as number[]).map((r) => r + 2);
  }
  return out;
}

function hasRowNumbers(ex: unknown): boolean {
  if (!ex || typeof ex !== 'object' || Array.isArray(ex)) return false;
  const o = ex as Record<string, unknown>;
  return typeof o.row === 'number' || (Array.isArray(o.rows) && o.rows.every((r) => typeof r === 'number'));
}

// Accordion rows. The native marker is hidden and replaced by a plus that turns into an x when open.
const DETAILS = 'group/acc rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors open:bg-white/[0.03]';
const SUMMARY = `flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-medium select-none hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden ${FOCUS}`;
const PLUS = 'shrink-0 text-muted transition-transform duration-300 group-open/acc:rotate-45';

export function FindingCard({
  finding,
  primary,
  test,
}: {
  finding: Finding;
  primary: ParsedCsv;
  test: ParsedCsv | null;
}) {
  const sev = SEV_STYLE[finding.severity];
  const [showRows, setShowRows] = useState(false);
  const rowsId = useId();

  // Contamination row indexes point into the test file, not the primary one.
  const inTest = finding.id === 'train-test-contamination';
  const source = inTest ? test : primary;
  const capped = finding.totalRows > finding.rowIndexes.length;
  const rowWord = finding.totalRows === 1 ? 'row' : 'rows';

  return (
    <GlassCard as="article" solid className="overflow-hidden p-5 sm:p-6">
      {/* Quiet severity accent down the left edge; the badge carries the word. */}
      <span aria-hidden className={`absolute top-6 left-0 h-10 w-[2px] rounded-r-full ${sev.dot}`} />

      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wider uppercase ${sev.soft} ${sev.text} ${sev.ring}`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
          {sev.label}
          <span className="sr-only"> severity</span>
        </span>
        <h4 className="min-w-0 flex-1 basis-60 text-[1.0625rem] leading-snug font-semibold tracking-tight break-words">
          {inlineCode(finding.title)}
        </h4>
      </div>

      <p className="mt-3 break-words text-muted">{inlineCode(finding.detail)}</p>

      {/* The reasoning is the point of the tool, so it is never collapsed. */}
      <div className="specular mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm break-words">
        <p className={EYEBROW}>Why this matters</p>
        <p className="mt-1">{inlineCode(finding.why)}</p>
      </div>

      {finding.caveat && (
        <p className="mt-3 rounded-xl border border-sev-medium/30 bg-sev-medium-soft px-4 py-3 text-sm break-words">
          <span className="font-semibold text-sev-medium">Caveat: </span>
          {inlineCode(finding.caveat)}
        </p>
      )}

      {finding.columns.length > 0 && (
        <div className="mt-4">
          <ul className="flex flex-wrap gap-1.5" aria-label="Affected columns">
            {finding.columns.map((c) => (
              <li
                key={c}
                className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs"
                title={c}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 space-y-2">
        <details className={DETAILS}>
          <summary className={SUMMARY}>
            Evidence
            <Plus className={PLUS} />
          </summary>
          <div className="px-4 pt-1 pb-4">
            <EvidenceBlock evidence={finding.evidence} />
          </div>
        </details>

        {finding.examples.length > 0 && (
          <details className={DETAILS}>
            <summary className={SUMMARY}>
              <span>
                Examples <span className="font-normal text-muted">({finding.examples.length})</span>
              </span>
              <Plus className={PLUS} />
            </summary>
            <div className="px-4 pt-1 pb-4">
              {finding.examples.some(hasRowNumbers) && (
                <p className="text-xs text-muted">
                  Row numbers are spreadsheet rows{inTest ? ' in the test file' : ''}, with the header as row 1.
                </p>
              )}
              <ul className="mt-2 space-y-1.5">
                {finding.examples.map((ex, i) => (
                  <li key={i}>
                    <Json value={withSpreadsheetRows(ex)} />
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {finding.totalRows > 0 &&
          (source ? (
            <div className="pt-2">
              <button
                type="button"
                aria-expanded={showRows}
                aria-controls={rowsId}
                onClick={() => setShowRows((v) => !v)}
                className={`btn-glass inline-flex min-h-9 items-center gap-2 rounded-full px-4 py-1.5 text-left text-sm font-medium transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] ${FOCUS}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${showRows ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span>
                  {showRows ? 'Hide' : 'Show'} {finding.totalRows.toLocaleString()} affected {rowWord}
                  {inTest && ' in the test file'}
                  {capped && ` (first ${finding.rowIndexes.length})`}
                </span>
              </button>
              <div id={rowsId} className="min-w-0">
                {showRows && (
                  <div className="mt-3">
                    <RowDrilldown finding={finding} rows={source.rows} columns={source.columns} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="pt-2 text-sm text-muted">
              {finding.totalRows.toLocaleString()} affected {rowWord} in the test file. The test file is not loaded
              in the browser, so they cannot be shown here.
            </p>
          ))}
      </div>
    </GlassCard>
  );
}
