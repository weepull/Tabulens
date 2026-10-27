'use client';

import { useId, useState } from 'react';
import { Plus } from '@/components/ui/icons';
import { cn } from '@/components/ui/cn';
import { FeatureCard, SeverityTag, Stage } from './FeatureCard';

// The analyzer's duplicate-rows finding for loans_train.csv, verbatim apart
// from the "why", which keeps its first two sentences.
const EVIDENCE: [string, string][] = [
  ['Duplicate rows', '3'],
  ['Groups', '2'],
  ['Ratio', '0.0093 (0.93%)'],
];
// Spreadsheet rows (header = row 1), as the report shows them.
const ROW_GROUPS = [
  [7, 322, 323],
  [44, 324],
];

/** Height of the drawer's header strip, which stays visible while collapsed. */
const PEEK = 48;

export function ShowWorkCard({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <FeatureCard
      className={className}
      check="Every finding"
      title="Shows its work"
      demo={
        <Stage className="min-h-[300px] sm:min-h-[280px]">
          <div className="relative p-4 sm:p-5" style={{ paddingBottom: PEEK + 16 }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="rounded-full border border-white/10 bg-sev-medium-soft px-2.5 py-0.5 text-[11px] tracking-wide uppercase">
                <SeverityTag severity="medium" />
              </span>
              <span className="font-mono text-[11px] text-subtle">loans_train.csv</span>
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">3 duplicate rows (0.93% of the file)</p>
            <p className="mt-1 text-sm text-muted">
              2 groups of identical rows. Comparison ignores surrounding whitespace and letter case.
            </p>
            <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-muted">
              <span className="font-semibold text-foreground">Why this matters: </span>
              Duplicates inflate whichever rows they repeat. If they survive the train/test split they end up on both
              sides and your validation score measures memorisation.
            </p>
          </div>

          {/* Bottom sheet: only its header peeks out until opened. Moves with transform only. */}
          <div
            className="glass-solid absolute inset-x-2 bottom-2 rounded-xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ transform: open ? 'translateY(0)' : `translateY(calc(100% - ${PEEK}px))` }}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen((v) => !v)}
              className="group/ev flex w-full items-center justify-between rounded-xl px-4 text-left text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{ height: PEEK }}
            >
              <span>
                Evidence <span className="font-normal text-subtle">· raw numbers and rows</span>
              </span>
              <span
                aria-hidden
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-white/5 transition-transform duration-300 group-hover/ev:bg-white/10',
                  open && 'rotate-45',
                )}
              >
                <Plus />
              </span>
            </button>
            <div
              id={bodyId}
              className={cn('px-4 pb-4 transition-[visibility] duration-500', open ? 'visible' : 'invisible')}
            >
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {EVIDENCE.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-subtle">{k}</dt>
                    <dd className="font-mono text-foreground">{v}</dd>
                  </div>
                ))}
                <dt className="text-subtle">Exact rows</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {ROW_GROUPS.map((g) => (
                    <span key={g[0]} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {g.join(' = ')}
                    </span>
                  ))}
                </dd>
              </dl>
              <p className="mt-2 text-[11px] text-subtle">Spreadsheet rows, header is row 1.</p>
            </div>
          </div>
        </Stage>
      }
    >
      Each finding says why it matters, shows the numbers behind it, and lists the exact rows. The same file
      always gets the same report. This one is real output for the loans example.
    </FeatureCard>
  );
}
