import type { ReactNode } from 'react';
import type { Severity } from '@/lib/types';
import { GlassCard } from '@/components/ui/GlassCard';

/** Same rounding as the server's pct() so chart labels match finding text. */
export function pct(x: number): string {
  return `${(x * 100).toFixed(x < 0.01 && x > 0 ? 2 : 1)}%`;
}

const SEV_TAG: Record<Severity, string> = {
  high: 'bg-sev-high-soft text-sev-high border-sev-high/30',
  medium: 'bg-sev-medium-soft text-sev-medium border-sev-medium/30',
  low: 'bg-sev-low-soft text-sev-low border-sev-low/30',
  info: 'bg-sev-info-soft text-sev-info border-sev-info/30',
};

// Bar fill once a bar has crossed a threshold. Below every threshold bars stay chrome.
const SEV_BAR: Record<Severity, string> = {
  high: 'bg-sev-high',
  medium: 'bg-sev-medium',
  low: 'bg-sev-low',
  info: 'bg-sev-info',
};

/** Severity as a word, so the tint is never the only signal. */
export function SevTag({ severity }: { severity: Severity }) {
  return (
    <span className={`rounded-full border px-2 py-px text-[0.6875rem] font-semibold tracking-wide capitalize ${SEV_TAG[severity]}`}>
      {severity}
    </span>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlassCard as="section" solid className="min-w-0 p-5 sm:p-6">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </GlassCard>
  );
}

/**
 * One row of a horizontal bar chart on a fixed 0-100% scale.
 * Reference marks poke 3px above and below the track so they stay visible
 * where a bar runs over them.
 */
export function BarRow({
  label,
  value,
  ratio,
  marks,
  tag,
  hint,
  severity,
}: {
  label: string;
  value: ReactNode;
  ratio: number;
  marks: number[];
  tag?: ReactNode;
  hint?: string;
  /** Set when the bar has crossed a threshold; tints the bar. The tag says the word. */
  severity?: Severity | null;
}) {
  return (
    <li className="rounded-lg px-1.5 py-2 transition-colors hover:bg-white/[0.03]" title={hint}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-mono">{label}</span>
        <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
          {tag}
          <span>{value}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-white/[0.06] shadow-[inset_0_1px_1px_rgb(0_0_0/0.5)]">
        {marks.map((m) => (
          <span
            key={m}
            className="absolute -top-[3px] -bottom-[3px] z-10 w-px bg-muted/50"
            style={{ left: `${m * 100}%` }}
          />
        ))}
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${
            severity ? `${SEV_BAR[severity]} opacity-80` : 'bg-linear-to-r from-white/50 via-white to-white/70'
          }`}
          // A 2px floor keeps a 0.1% bar from vanishing entirely.
          style={{ width: `max(2px, ${Math.min(1, ratio) * 100}%)` }}
        />
      </div>
    </li>
  );
}

/** Tick labels under the bars, aligned to the same reference marks. */
export function MarkAxis({ marks }: { marks: number[] }) {
  return (
    <div className="relative mx-1.5 mt-1 h-4 text-xs text-muted tabular-nums">
      {marks.map((m) => (
        <span key={m} className="absolute -translate-x-1/2" style={{ left: `${m * 100}%` }}>
          {Math.round(m * 100)}%
        </span>
      ))}
    </div>
  );
}

/** The chart's table twin: every value readable without the bars or hover. */
export function TableView({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <details className="group/tv mt-4 text-sm">
      <summary className="inline-flex cursor-pointer list-none [&::-webkit-details-marker]:hidden items-center gap-1.5 rounded-full text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform duration-300 group-open/tv:rotate-90"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        View as table
      </summary>
      <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-white/[0.08] bg-surface">
        <table className="w-full border-separate border-spacing-0 text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr>
              {head.map((h, i) => (
                <th key={h} scope="col" className={`border-b border-white/10 px-3 py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, r) => (
              <tr key={r} className="even:bg-white/[0.02] [&>*]:border-b [&>*]:border-white/[0.05] last:[&>*]:border-b-0">
                {cells.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-3 py-1.5 font-mono font-normal break-all">
                      {c}
                    </th>
                  ) : (
                    <td key={i} className="px-3 py-1.5 text-right whitespace-nowrap">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
