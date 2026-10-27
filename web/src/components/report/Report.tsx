'use client';

import type { ReactNode } from 'react';
import type { Finding, ParsedCsv, Report as ReportData } from '@/lib/types';
import { SEVERITIES } from '@/lib/types';
import { MissingChart } from '@/components/charts/MissingChart';
import { ClassBalanceChart } from '@/components/charts/ClassBalanceChart';
import { ScoreSummary } from './ScoreSummary';
import { FindingCard } from './FindingCard';
import { ColumnsTable } from './ColumnsTable';
import { SEV_STYLE } from './format';

// Matches T.leakage.minRows on the server: below this, leakage hits are often noise.
const LEAKAGE_MIN_ROWS = 200;

type Distribution = { value: string; count: number; share: number }[];

function isDistribution(x: unknown): x is Distribution {
  return (
    Array.isArray(x) &&
    x.every((d) => d && typeof d === 'object' && typeof d.count === 'number' && typeof d.share === 'number')
  );
}

export function Report({
  report,
  primary,
  test,
  onReset,
}: {
  report: ReportData;
  primary: ParsedCsv;
  test: ParsedCsv | null;
  onReset(): void;
}) {
  const { meta, findings } = report;
  const issues = meta.parseIssues;
  const hasParseIssues = issues.raggedCount > 0 || issues.dupeHeaders.length > 0;
  // New name -> original, grouped by original so 'a' lists 'a_1, a_2'.
  const renamedTo = new Map<string, string[]>();
  for (const [renamed, original] of Object.entries(issues.renamedHeaders ?? {})) {
    renamedTo.set(original, [...(renamedTo.get(original) ?? []), renamed]);
  }
  // A header with nothing under it: every check passes vacuously, so say so
  // instead of presenting an empty file as a clean one.
  const noRows = meta.rows === 0;

  const imbalance = findings.find((f) => f.id === 'class-imbalance');
  const distribution = imbalance?.evidence.distribution;
  const showBalance = Boolean(meta.target) && isDistribution(distribution) && distribution.length > 0;

  const groups = SEVERITIES.map((severity) => ({
    severity,
    items: findings
      .map((finding, index) => ({ finding, index }))
      .filter(({ finding }) => finding.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-12 sm:space-y-16">
      <ScoreSummary report={report} onReset={onReset} />

      {noRows && (
        <Notice title="This file has a header but no data rows">
          It has {meta.columns.toLocaleString()} {meta.columns === 1 ? 'column' : 'columns'} and nothing under them, so
          none of the checks had any data to look at. The score above does not mean the data is clean.
        </Notice>
      )}

      {meta.target && !noRows && meta.rows < LEAKAGE_MIN_ROWS && (
        <Notice title="Small file: leakage results are unreliable">
          This file has {meta.rows.toLocaleString()} rows. Below about {LEAKAGE_MIN_ROWS}, a column can separate the
          target perfectly by chance, so treat leakage findings as leads to check rather than conclusions.
        </Notice>
      )}

      {hasParseIssues && (
        <Notice title="The file did not parse cleanly">
          <ul className="list-disc space-y-1 pl-5">
            {issues.raggedCount > 0 && (
              <li>
                {issues.raggedCount.toLocaleString()} {issues.raggedCount === 1 ? 'row has' : 'rows have'} too few or
                too many fields, so values may have landed in the wrong columns.
                {issues.ragged.length > 0 && (
                  <>
                    {' '}
                    Data rows (counting from 1, header excluded):{' '}
                    {issues.ragged
                      .slice(0, 10)
                      .map((r) => r.row + 1)
                      .join(', ')}
                    {issues.raggedCount > 10 && ', …'}
                  </>
                )}
              </li>
            )}
            {issues.dupeHeaders.length > 0 && (
              <li>
                Duplicate column names:{' '}
                {issues.dupeHeaders.map((h, i) => {
                  const copies = renamedTo.get(h) ?? [];
                  return (
                    <span key={i}>
                      {i > 0 && ', '}
                      <code className="font-mono break-all">{h}</code>
                      {copies.length > 0 && (
                        <>
                          {' '}
                          (repeats shown as{' '}
                          {copies.map((c, j) => (
                            <span key={c}>
                              {j > 0 && ', '}
                              <code className="font-mono break-all">{c}</code>
                            </span>
                          ))}
                          )
                        </>
                      )}
                    </span>
                  );
                })}
                . Each repeat was renamed so no values are lost, but those names are not in your file. Check that
                the columns really are different before using them.
              </li>
            )}
          </ul>
        </Notice>
      )}

      <section aria-labelledby="findings-heading">
        <SectionTitle id="findings-heading" count={findings.length}>
          Findings
        </SectionTitle>
        {groups.length === 0 && noRows ? (
          <p className="glass-solid mt-5 rounded-2xl p-6 text-muted">
            No findings, because there were no rows to check.
          </p>
        ) : groups.length === 0 ? (
          <p className="glass-solid mt-5 rounded-2xl p-6">
            <span className="font-semibold text-ok">Nothing found.</span>{' '}
            <span className="text-muted">
              None of the checks flagged anything in this file. That rules out the specific problems this tool looks
              for, not every problem.
            </span>
          </p>
        ) : (
          <div className="mt-6 space-y-10">
            {groups.map(({ severity, items }) => (
              <FindingGroup key={severity} severity={severity} items={items} primary={primary} test={test} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="charts-heading">
        <SectionTitle id="charts-heading">Charts</SectionTitle>
        <div className={`mt-6 grid grid-cols-1 gap-4 ${showBalance ? 'lg:grid-cols-2' : ''}`}>
          <MissingChart columns={report.columns} rows={meta.rows} />
          {showBalance && meta.target && (
            <ClassBalanceChart target={meta.target} distribution={distribution as Distribution} />
          )}
        </div>
      </section>

      <section aria-labelledby="columns-heading">
        <SectionTitle id="columns-heading" count={report.columns.length}>
          Columns
        </SectionTitle>
        <div className="mt-6">
          <ColumnsTable columns={report.columns} target={meta.target} />
        </div>
      </section>
    </div>
  );
}

function FindingGroup({
  severity,
  items,
  primary,
  test,
}: {
  severity: Finding['severity'];
  items: { finding: Finding; index: number }[];
  primary: ParsedCsv;
  test: ParsedCsv | null;
}) {
  const style = SEV_STYLE[severity];
  return (
    <section id={`findings-${severity}`} aria-labelledby={`findings-${severity}-heading`} className="scroll-mt-6">
      <h3 id={`findings-${severity}-heading`} className="flex items-center gap-3 text-sm font-semibold">
        <span aria-hidden className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className={style.text}>{style.label} severity</span>
        <span className={`rounded-full border px-2 py-px text-xs tabular-nums ${style.soft} ${style.text} ${style.ring}`}>
          {items.length}
        </span>
        <span aria-hidden className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
      </h3>
      <ul className="mt-4 space-y-4">
        {/* Check ids are not unique (one check can emit several findings), so key by position. */}
        {items.map(({ finding, index }) => (
          <li key={`${finding.id}-${index}`}>
            <FindingCard finding={finding} primary={primary} test={test} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="note" className="rounded-2xl border border-sev-medium/30 bg-sev-medium-soft p-5 text-sm">
      <p className="font-semibold text-sev-medium">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Section heading in the report: chrome text with a quiet count beside it. */
function SectionTitle({ id, count, children }: { id: string; count?: number; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-baseline gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
      <span className="chrome-text">{children}</span>
      {count !== undefined && <span className="text-base font-normal text-subtle tabular-nums">({count})</span>}
    </h2>
  );
}
