import type { Severity } from '@/lib/types';
import { BarRow, ChartCard, MarkAxis, SevTag, TableView, pct } from './chartParts';

// Mirrors server/src/lib/thresholds.js T.imbalance. Keep in sync.
const MEDIUM = 0.1;
const HIGH = 0.01;

/** Same rule as server/src/lib/checks/classImbalance.js, applied to the minority class. */
function severityOf(share: number): Severity | null {
  if (share > MEDIUM) return null;
  return share < HIGH ? 'high' : 'medium';
}

const show = (v: string) => (v === '' ? '(empty)' : v);

export function ClassBalanceChart({
  target,
  distribution,
}: {
  target: string;
  distribution: { value: string; count: number; share: number }[];
}) {
  if (distribution.length === 0) return null;

  const majority = distribution[0];
  const minority = distribution[distribution.length - 1];
  // A perfectly even split has no minority worth naming.
  const hasMinority = minority.count < majority.count;
  const sev = hasMinority ? severityOf(minority.share) : null;

  const summary =
    `Class balance of ${target}, ${distribution.length} classes. ` +
    `Largest is ${show(majority.value)} at ${pct(majority.share)}` +
    (hasMinority ? `, smallest is ${show(minority.value)} at ${pct(minority.share)}.` : '.');

  return (
    <ChartCard
      title={`Class balance: ${target}`}
      subtitle={
        <>
          Always predicting <span className="font-mono">{show(majority.value)}</span> would score{' '}
          {pct(majority.share)} accuracy.
        </>
      }
    >
      <div role="img" aria-label={summary}>
        <ul>
          {distribution.map((d, i) => {
            const isMinority = hasMinority && i === distribution.length - 1;
            return (
              <BarRow
                key={d.value}
                label={show(d.value)}
                value={
                  <>
                    {pct(d.share)} <span className="text-muted">· {d.count.toLocaleString()}</span>
                  </>
                }
                ratio={d.share}
                marks={[MEDIUM]}
                tag={
                  isMinority && (
                    <>
                      <span className="text-xs font-medium text-muted">Minority</span>
                      {sev && <SevTag severity={sev} />}
                    </>
                  )
                }
                hint={`${show(d.value)}: ${d.count.toLocaleString()} rows (${pct(d.share)})`}
                severity={isMinority ? sev : null}
              />
            );
          })}
        </ul>
        <MarkAxis marks={[MEDIUM]} />
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-muted">
        <span aria-hidden className="mt-0.5 h-3 w-px shrink-0 bg-muted/50" />
        <span>
          Mark at {pct(MEDIUM)}: a minority class below it makes plain accuracy misleading.
        </span>
      </p>

      <TableView
        caption={`Class counts for ${target}`}
        head={['Class', 'Rows', 'Share']}
        rows={distribution.map((d) => [show(d.value), d.count.toLocaleString(), pct(d.share)])}
      />
    </ChartCard>
  );
}
