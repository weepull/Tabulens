'use client';

import { useInView } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/components/ui/cn';
import { canHover, prefersReducedMotion } from '@/components/ui/useReducedMotionSafe';
import { FeatureCard, Stage } from './FeatureCard';
import { LOANS } from './loansData';

// Circle areas are to scale: train r = 64 holds 323 rows, so test (104 rows)
// is r = 64 * sqrt(104 / 323). JOINED is the centre distance at which the
// lens between them has the area of 14 rows (solved numerically).
const R_TRAIN = 64;
const R_TEST = 36.3;
const CX_TRAIN = 104;
const APART = 128;
const JOINED = 84.4;
const CY = 92;

export function ContaminationCard({ className }: { className?: string }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [auto, setAuto] = useState(false);
  const joined = hover || pinned || auto;
  const stageRef = useRef<SVGSVGElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.7 });

  // Touch screens have no hover, and reduced motion should not hide the result
  // behind a gesture, so there the files overlap on their own once in view.
  useEffect(() => {
    if (!inView || (canHover() && !prefersReducedMotion())) return;
    const t = window.setTimeout(() => setAuto(true), 500);
    return () => window.clearTimeout(t);
  }, [inView]);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clip = `train-clip-${uid}`;
  const hatch = `hatch-${uid}`;
  const shift = joined ? JOINED - APART : 0;
  const cxTest = CX_TRAIN + APART;

  return (
    <FeatureCard
      className={className}
      check="Train/test contamination"
      severity="high"
      title="Rows your model has already seen"
      onMouseEnter={() => canHover() && setHover(true)}
      onMouseLeave={() => setHover(false)}
      demo={
        <Stage className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
          <div className="relative flex items-start justify-between gap-3">
            <p className="font-mono text-[11px] tracking-wide text-subtle">loans_train.csv ∩ loans_test.csv</p>
            <button
              type="button"
              aria-pressed={pinned || auto}
              onClick={() => {
                // Pressing it while the auto overlap is showing separates the files.
                if (auto) setAuto(false);
                else setPinned((v) => !v);
              }}
              className="btn-glass -mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-medium aria-pressed:border-white/35 aria-pressed:bg-white/15 transition-transform duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Overlap files
            </button>
          </div>

          <svg ref={stageRef} aria-hidden viewBox="0 0 320 180" className="relative mx-auto mt-1 block h-auto w-full max-w-[360px] overflow-visible">
            <defs>
              <clipPath id={clip}>
                <circle cx={CX_TRAIN} cy={CY} r={R_TRAIN} />
              </clipPath>
              <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="5" fill="white" fillOpacity="0.28" />
                <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeOpacity="0.55" strokeWidth="1.6" />
              </pattern>
              <radialGradient id={`orb-${uid}`} cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="white" stopOpacity="0.16" />
                <stop offset="1" stopColor="white" stopOpacity="0.02" />
              </radialGradient>
            </defs>

            {/* train: fixed */}
            <circle cx={CX_TRAIN} cy={CY} r={R_TRAIN} fill={`url(#orb-${uid})`} stroke="white" strokeOpacity="0.4" />
            <text x={CX_TRAIN - 18} y={CY - 6} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              train
            </text>
            <text x={CX_TRAIN - 18} y={CY + 12} textAnchor="middle" className="fill-foreground text-[15px] font-semibold">
              {LOANS.trainRows}
            </text>

            {/* test: slides left; its overlap with train is filled via the train clip path. */}
            <g className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ transform: `translateX(${shift}px)` }}>
              <circle cx={cxTest} cy={CY} r={R_TEST} fill={`url(#orb-${uid})`} stroke="white" strokeOpacity="0.6" strokeDasharray="3 3" />
              <text x={cxTest + R_TEST + 8} y={CY - 4} className="fill-muted font-mono text-[10px]">
                test
              </text>
              <text x={cxTest + R_TEST + 8} y={CY + 13} className="fill-foreground text-[15px] font-semibold">
                {LOANS.testRows}
              </text>
            </g>
            <g clipPath={`url(#${clip})`}>
              <g className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ transform: `translateX(${shift}px)` }}>
                <circle cx={cxTest} cy={CY} r={R_TEST} fill={`url(#${hatch})`} />
              </g>
            </g>

            {/* callout, shown once the files overlap */}
            <g className={cn('transition-opacity duration-500', joined ? 'opacity-100 delay-300' : 'opacity-0')}>
              <line x1={CX_TRAIN + JOINED - R_TEST + 9} y1={CY - 22} x2={CX_TRAIN + JOINED - R_TEST + 9} y2="22" stroke="white" strokeOpacity="0.5" />
              <circle cx={CX_TRAIN + JOINED - R_TEST + 9} cy={CY - 22} r="2" fill="white" />
              <text x={CX_TRAIN + JOINED - R_TEST + 15} y="20" className="fill-foreground text-[13px] font-semibold">
                {LOANS.sharedRows} shared
              </text>
              <text x={CX_TRAIN + JOINED - R_TEST + 15} y="34" className="fill-muted font-mono text-[10px]">
                {LOANS.sharedPctOfTest} of test
              </text>
            </g>
          </svg>

          <p className="relative mt-1 text-center text-[11px] text-subtle">Circle areas to scale with row counts.</p>
        </Stage>
      }
    >
      {LOANS.sharedRows} of the {LOANS.testRows} test rows are also in the {LOANS.trainRows}-row training file, so{' '}
      {LOANS.sharedPctOfTest} of the test set is rows the model may have memorised. Rows are matched on every shared column, ignoring
      case and surrounding spaces.
    </FeatureCard>
  );
}
