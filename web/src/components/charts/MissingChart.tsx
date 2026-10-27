import type { ColumnSummary, Severity } from '@/lib/types';
import { BarRow, ChartCard, MarkAxis, SevTag, TableView, pct } from './chartParts';

// Mirrors server/src/lib/thresholds.js T.missing. Keep in sync.
const LOW = 0.05;
const MEDIUM = 0.3;
const HIGH = 0.6;
const MARKS = [LOW, MEDIUM, HIGH];

const MAX_BARS = 15;

/** Same rule as server/src/lib/checks/missingValues.js: at or under 5% is not flagged. */
function severityOf(r: number): Severity | null {
  if (r <= LOW) return null;
  return r >= HIGH ? 'high' : r >= MEDIUM ? 'medium' : 'low';
}

export function MissingChart({ columns, rows }: { columns: ColumnSummary[]; rows: number }) {
  // Recomputed from the exact counts. The report's ratio is rounded to 4
  // places, which can push a column across a threshold (0.050005 -> 0.05)
  // and make the tag disagree with the server's own finding.
  const missing = columns
    .filter((c) => c.missing > 0)
    .map((c) => ({ ...c, ratio: rows > 0 ? c.missing / rows : 0 }))
    .sort((a, b) => b.ratio - a.ratio || a.name.localeCompare(b.name));

  if (rows === 0) {
    return (
      <ChartCard title="Missing values by column">
        <p className="text-sm text-muted">The file has no data rows, so there is nothing to measure.</p>
      </ChartCard>
    );
  }

  if (missing.length === 0) {
    return (
      <ChartCard title="Missing values by column">
        <p className="text-sm">
          <span className="font-medium text-ok">No missing values.</span>{' '}
          <span className="text-muted">
            All {columns.length} {columns.length === 1 ? 'column is' : 'columns are'} fully filled in.
          </span>
        </p>
      </ChartCard>
    );
  }

  const shown = missing.slice(0, MAX_BARS);
  const hidden = missing.length - shown.length;
  const worst = missing[0];
  const summary =
    `Missing values by column. ${missing.length} of ${columns.length} columns have gaps. ` +
    `Worst is ${worst.name} at ${pct(worst.ratio)}.`;

  return (
    <ChartCard
      title="Missing values by column"
      subtitle={`${missing.length} of ${columns.length} columns have gaps, worst first.`}
    >
      <div role="img" aria-label={summary}>
        <ul>
          {shown.map((c) => {
            const sev = severityOf(c.ratio);
            return (
              <BarRow
                key={c.name}
                label={c.name}
                value={pct(c.ratio)}
                ratio={c.ratio}
                marks={MARKS}
                tag={sev && <SevTag severity={sev} />}
                severity={sev}
                hint={`${c.name}: ${c.missing.toLocaleString()} missing (${pct(c.ratio)})`}
              />
            );
          })}
        </ul>
        <MarkAxis marks={MARKS} />
      </div>

      {hidden > 0 && (
        <p className="mt-2 text-sm text-muted">
          +{hidden} more {hidden === 1 ? 'column' : 'columns'}, each at or under{' '}
          {pct(shown[shown.length - 1].ratio)}. All are in the table.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs text-muted">
        <span aria-hidden className="mt-0.5 h-3 w-px shrink-0 bg-muted/50" />
        <span>
          Marks at {pct(LOW)}, {pct(MEDIUM)} and {pct(HIGH)}: past each one the server rates the
          column low, medium, then high.
        </span>
      </p>

      <TableView
        caption="Missing values per column"
        head={['Column', 'Missing', 'Share', 'Severity']}
        rows={missing.map((c) => [
          c.name,
          c.missing.toLocaleString(),
          pct(c.ratio),
          severityOf(c.ratio) ?? '—',
        ])}
      />
    </ChartCard>
  );
}
