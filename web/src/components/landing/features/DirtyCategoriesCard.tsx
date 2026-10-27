'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/components/ui/cn';
import { canHover } from '@/components/ui/useReducedMotionSafe';
import { FeatureCard, Stage } from './FeatureCard';

// The two collisions the analyzer reports for `city` in loans_train.csv.
const GROUPS = [
  {
    key: 'mumbai',
    variants: [
      { raw: 'Mumbai', count: 57 },
      { raw: 'MUMBAI', count: 47 },
      { raw: 'mumbai', count: 44 },
    ],
  },
  {
    key: 'pune',
    variants: [
      { raw: 'Pune', count: 44 },
      { raw: 'pune', count: 46 },
    ],
  },
];

const CHIP = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs whitespace-nowrap';

/** One row of spelling variants that slide into a single chip when merged. */
function VariantRow({ group, merged }: { group: (typeof GROUPS)[number]; merged: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [offsets, setOffsets] = useState<number[]>(() => group.variants.map(() => 0));
  const total = group.variants.reduce((n, v) => n + v.count, 0);

  // offsetLeft ignores transforms, so this measures the resting layout. Re-measured
  // on each toggle because chip widths change once the web font loads.
  useLayoutEffect(() => {
    function measure() {
      const row = rowRef.current;
      if (!row) return;
      const mid = row.clientWidth / 2;
      setOffsets(chipRefs.current.map((c) => (c ? mid - (c.offsetLeft + c.offsetWidth / 2) : 0)));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [merged]);

  return (
    <div ref={rowRef} className="relative flex h-9 items-center justify-center gap-1.5">
      {group.variants.map((v, i) => (
        <span
          key={v.raw}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          aria-hidden={merged}
          className={cn(
            CHIP,
            'brushed specular border border-white/10 text-foreground transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          )}
          style={{
            transform: merged ? `translateX(${offsets[i]}px) scale(0.92)` : undefined,
            opacity: merged ? 0 : 1,
            transitionDelay: merged ? `${i * 40}ms` : `${120 + i * 40}ms`,
          }}
        >
          {v.raw}
          <span className="text-muted">{v.count}</span>
        </span>
      ))}
      <span
        aria-hidden={!merged}
        className={cn(
          CHIP,
          'absolute top-1/2 left-1/2 bg-[linear-gradient(180deg,white,rgb(255_255_255/0.78))] font-semibold text-background shadow-[0_8px_24px_-8px_rgb(255_255_255/0.4)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        )}
        style={{
          transform: `translate(-50%, -50%) scale(${merged ? 1 : 0.7})`,
          opacity: merged ? 1 : 0,
          transitionDelay: merged ? '220ms' : '0ms',
        }}
      >
        {group.key}
        <span className="font-normal">{total}</span>
      </span>
    </div>
  );
}

export function DirtyCategoriesCard({ className }: { className?: string }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const merged = hover || pinned;

  return (
    <FeatureCard
      className={className}
      check="Dirty categories"
      severity="medium"
      title="One city, three spellings"
      onMouseEnter={() => canHover() && setHover(true)}
      onMouseLeave={() => setHover(false)}
      demo={
        <Stage className="px-3 pt-4 pb-4 sm:px-5 sm:pt-5">
          <div className="relative flex flex-wrap items-start justify-between gap-3 px-1">
            <p className="font-mono text-[11px] tracking-wide whitespace-nowrap text-subtle">
              city ·{' '}
              <span aria-live="polite" className="text-foreground">
                {merged ? 4 : 7} distinct values
              </span>
            </p>
            <button
              type="button"
              aria-pressed={pinned}
              onClick={() => setPinned((v) => !v)}
              className="btn-glass -mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-medium aria-pressed:border-white/35 aria-pressed:bg-white/15 transition-transform duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Merge spellings
            </button>
          </div>
          <div className="relative mt-5 space-y-3">
            {GROUPS.map((g) => (
              <VariantRow key={g.key} group={g} merged={merged} />
            ))}
          </div>
          <p className="relative mt-4 text-center text-[11px] text-subtle">The two cities spelled more than one way, with row counts from loans_train.csv.</p>
        </Stage>
      }
    >
      In the loans file, <code className="font-mono text-foreground">city</code> has 7 values that collapse to 4 once
      case and spaces are ignored, and <code className="font-mono text-foreground">employment_type</code> has 5 that
      collapse to 3. One-hot encoding would split each real category across several columns.
    </FeatureCard>
  );
}
