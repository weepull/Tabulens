import type { ColumnSummary } from '@/lib/types';
import { FOCUS, pct } from './format';

export function ColumnsTable({ columns, target }: { columns: ColumnSummary[]; target: string | null }) {
  return (
    // Focusable so keyboard users can scroll the table sideways on narrow screens.
    <div
      role="region"
      aria-label="Column summary, scrolls horizontally"
      tabIndex={0}
      className={`glass-solid max-h-[36rem] overflow-auto rounded-2xl ${FOCUS}`}
    >
      <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 font-medium">Column</th>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 font-medium">Type</th>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 text-right font-medium">Confidence</th>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 text-right font-medium">Missing</th>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 text-right font-medium">Unique</th>
            <th scope="col" className="sticky top-0 z-10 border-b border-white/10 bg-surface-2 px-3.5 py-2.5 font-medium">Sample values</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <tr key={c.name} className="transition-colors even:bg-white/[0.02] hover:bg-white/[0.04] [&>*]:border-b [&>*]:border-white/[0.05] last:[&>*]:border-b-0">
              <th scope="row" className="max-w-[14rem] px-3.5 py-2.5 text-left font-mono font-medium break-all">
                {c.name}
                {c.name === target && (
                  <span className="ml-2 rounded-full bg-foreground px-2 py-px align-middle font-sans text-[0.625rem] font-semibold tracking-wider text-background uppercase">target</span>
                )}
              </th>
              <td className="px-3.5 py-2.5">{c.type}</td>
              <td className="px-3.5 py-2.5 text-right tabular-nums">{pct(c.confidence)}</td>
              <td className={`px-3.5 py-2.5 text-right tabular-nums ${c.missing > 0 ? '' : 'text-muted'}`}>
                {c.missing.toLocaleString()} <span className="text-muted">({pct(c.missingRatio)})</span>
              </td>
              <td className="px-3.5 py-2.5 text-right tabular-nums">{c.unique.toLocaleString()}</td>
              <td className="px-3.5 py-2.5">
                {c.sampleValues.length === 0 ? (
                  <span className="text-muted">none</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {c.sampleValues.map((v, i) => (
                      <code
                        key={i}
                        title={v}
                        className="max-w-[12rem] truncate rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs"
                      >
                        {v === '' ? '(empty)' : v}
                      </code>
                    ))}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
