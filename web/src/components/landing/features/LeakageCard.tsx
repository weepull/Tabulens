'use client';

import { animate, useInView, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { prefersReducedMotion } from '@/components/ui/useReducedMotionSafe';
import { FeatureCard, Stage } from './FeatureCard';
import { DEFAULTED, LOANS, RISK_SCORE_MILLI } from './loansData';

const N = RISK_SCORE_MILLI.length;
const BEST = LOANS.leakage.threshold;
// Plot rows (viewBox units, 0..100 tall): defaulted = 0 on top, 1 below.
const ROW_Y = [32, 70];
const JITTER = 11;

/** Deterministic jitter so server and client draw the same dots. */
function jitter(i: number) {
  return ((((i * 9301 + 49297) % 233280) / 233280) * 2 - 1) * JITTER;
}

/** Cuts sit halfway between thousandths, like the analyzer's midpoints, so no dot is ever on the line. */
function cutOf(v: number) {
  return Math.min(999, Math.max(0, Math.floor(v * 1000)));
}

function pct(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

export function LeakageCard({ className }: { className?: string }) {
  const points = useMemo(
    () => RISK_SCORE_MILLI.map((x, i) => ({ x, y: DEFAULTED[i] === '1' ? 1 : 0, py: ROW_Y[DEFAULTED[i] === '1' ? 1 : 0] + jitter(i) })),
    [],
  );
  // One path per class: zero-length round-capped segments draw circles that
  // stay round even though the SVG stretches to the card's width.
  const dotPaths = useMemo(
    () =>
      [0, 1].map((cls) =>
        points
          .filter((p) => p.y === cls)
          .map((p) => `M${p.x} ${p.py.toFixed(1)}h0`)
          .join(''),
      ),
    [points],
  );

  const gradId = `leak${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const value = useMotionValue<number>(BEST);
  const [cut, setCut] = useState(cutOf(BEST));
  useMotionValueEvent(value, 'change', (v) => setCut(cutOf(v)));

  const { accuracy, leftClass, rightClass, wrongPath, wrong } = useMemo(() => {
    const left = [0, 0];
    const right = [0, 0];
    for (const p of points) (p.x <= cut ? left : right)[p.y]++;
    const lc = left[1] > left[0] ? 1 : 0;
    const rc = right[1] > right[0] ? 1 : 0;
    const miss = points.filter((p) => (p.x <= cut ? lc : rc) !== p.y);
    return {
      accuracy: (Math.max(...left) + Math.max(...right)) / N,
      leftClass: lc,
      rightClass: rc,
      wrong: miss.length,
      wrongPath: miss.map((p) => `M${p.x} ${p.py.toFixed(1)}h0`).join(''),
    };
  }, [cut, points]);

  const threshold = (cut + 0.5) / 1000;
  const isBest = cut === cutOf(BEST);

  const plotRef = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const dragging = useRef(false);
  const inView = useInView(plotRef, { once: true, amount: 0.6 });

  function stop() {
    anim.current?.stop();
    window.clearTimeout(settleTimer.current);
  }

  function settle(delay: number) {
    stop();
    if (prefersReducedMotion()) {
      settleTimer.current = window.setTimeout(() => value.set(BEST), delay);
      return;
    }
    settleTimer.current = window.setTimeout(() => {
      anim.current = animate(value, BEST, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] });
    }, delay);
  }

  // First time it scrolls into view, sweep the cut across the data and settle on the best one.
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    anim.current = animate(value, [BEST, 0.18, 0.9, BEST], {
      duration: 3.2,
      times: [0, 0.32, 0.72, 1],
      ease: 'easeInOut',
    });
    return () => anim.current?.stop();
  }, [inView, value]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  function setFromPointer(e: PointerEvent<HTMLDivElement>) {
    const el = plotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    value.set(Math.min(0.9995, Math.max(0, (e.clientX - r.left) / r.width)));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    stop();
    dragging.current = true;
    if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    // Mouse: the cut follows the cursor. Touch/pen: only while dragging.
    if (e.pointerType !== 'mouse' && !dragging.current) return;
    stop();
    setFromPointer(e);
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (e.pointerType !== 'mouse') settle(1400);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01, PageDown: -0.1, PageUp: 0.1 }[e.key];
    let next: number | null = step === undefined ? null : threshold + step;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 0.9995;
    if (e.key === 'Enter' || e.key === ' ') next = BEST;
    if (next === null) return;
    e.preventDefault();
    stop();
    value.set(Math.min(0.9995, Math.max(0, next)));
  }

  return (
    <FeatureCard
      className={className}
      check="Target leakage"
      severity="high"
      title="One column that already knows the answer"
      demo={
        <Stage className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
          <div className="relative flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <p className="font-mono text-[11px] tracking-wide whitespace-nowrap text-subtle">risk_score → defaulted</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="chrome-text text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {pct(accuracy)}
                </span>
                <span className="text-xs text-muted">accuracy</span>
              </p>
            </div>
            <p className="text-xs leading-snug text-muted sm:text-right">
              <span className="block font-mono text-foreground tabular-nums">cut ≤ {threshold.toFixed(4)}</span>
              <span className="block">
                {wrong} of {N} rows wrong
              </span>
              <span className="block text-subtle">guess 0: {pct(LOANS.leakage.baseline)}</span>
            </p>
          </div>

          <div className="relative mt-4 flex gap-2">
            <div aria-hidden className="flex w-4 shrink-0 flex-col justify-around py-1 font-mono text-[10px] text-subtle">
              <span>0</span>
              <span>1</span>
            </div>
            <div
              ref={plotRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onMouseLeave={() => {
                dragging.current = false;
                settle(500);
              }}
              // Vertical swipes still scroll the page; horizontal ones move the cut.
              className="relative h-28 flex-1 cursor-ew-resize touch-pan-y select-none sm:h-32"
            >
              <svg aria-hidden viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                <defs>
                  <linearGradient id={gradId} x1="0" x2="1">
                    <stop offset="0" stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="white" stopOpacity="0.07" />
                  </linearGradient>
                </defs>
                <line x1="0" x2="1000" y1={ROW_Y[0]} y2={ROW_Y[0]} stroke="white" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
                <line x1="0" x2="1000" y1={ROW_Y[1]} y2={ROW_Y[1]} stroke="white" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
                <rect x="0" y="0" width={threshold * 1000} height="100" fill={`url(#${gradId})`} />
                <path d={dotPaths[0]} stroke="white" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={dotPaths[1]} stroke="white" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {/* Misclassified rows: a tinted ring around the dot. */}
                <path d={wrongPath} className="stroke-sev-high" strokeWidth="11" strokeOpacity="0.9" strokeLinecap="round" vectorEffect="non-scaling-stroke" fill="none" />
                <path d={wrongPath} className="stroke-background" strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={wrongPath} className="stroke-sev-high" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <line x1={threshold * 1000} x2={threshold * 1000} y1="-6" y2="106" stroke="white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>

              {/* Handle: moved with transform only; it is the keyboard-operable slider. */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-full"
                style={{ transform: `translateX(${threshold * 100}%)` }}
              >
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Cut on risk_score"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={Number(threshold.toFixed(4))}
                  aria-valuetext={`risk_score at most ${threshold.toFixed(4)}: ${pct(accuracy)} accuracy${isBest ? ', the best single cut' : ''}`}
                  onKeyDown={onKeyDown}
                  onFocus={stop}
                  className="pointer-events-auto absolute -top-2 left-0 h-5 w-5 -translate-x-1/2 cursor-ew-resize rounded-full bg-[linear-gradient(180deg,white,rgb(255_255_255/0.72))] shadow-[0_0_0_4px_rgb(255_255_255/0.08),0_4px_14px_rgb(0_0_0/0.6)] transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
                />
              </div>
            </div>
          </div>

          <div aria-hidden className="mt-2 ml-6 flex justify-between font-mono text-[10px] text-subtle">
            <span>0.0</span>
            <span className="hidden sm:inline">
              left: predict {leftClass} · right: predict {rightClass}
            </span>
            <span>1.0</span>
          </div>
        </Stage>
      }
    >
      Drag the cut across the real <code className="font-mono text-foreground">risk_score</code> values in the loans
      example. One untuned threshold separates <code className="font-mono text-foreground">defaulted</code>{' '}
      {pct(LOANS.leakage.accuracy)} of the time, against {pct(LOANS.leakage.baseline)} for always guessing 0. That is a
      leak, not a feature.
    </FeatureCard>
  );
}
