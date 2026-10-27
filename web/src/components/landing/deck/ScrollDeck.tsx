'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { Container } from '@/components/ui/Container';
import { cn } from '@/components/ui/cn';
import { ArrowRight } from '@/components/ui/icons';
import { canHover, prefersReducedMotion } from '@/components/ui/useReducedMotionSafe';
import { CardBack, CardFront } from './CardFaces';
import { DECK_CHECKS, type DeckCheck } from './checks';

const N = DECK_CHECKS.length;

// Timeline in scroll progress (0..1 over the track). Card k leaves the stack at
// START + k*STEP, flies for MOVE, and turns over during FLIP, starting
// FLIP_DELAY after it leaves so the turn overlaps the end of the flight.
const START = 0.08;
const STEP = 0.088;
const MOVE = 0.15;
const FLIP_DELAY = 0.06;
const FLIP = 0.12;

// Cards sit in the grid in DECK_CHECKS order (row-major, matching their numbers).
// The stack sits in the centre slot, so that card (index 4) is dealt last and just
// turns over in place. DEAL_ORDER lists card indices in the order they leave the stack.
const DEAL_ORDER = [0, 1, 2, 3, 5, 6, 7, 8, 4];
const DEAL_POS = DECK_CHECKS.map((_, k) => DEAL_ORDER.indexOf(k));

// Small hand-picked irregularities so the stack looks dropped, not generated.
const JITTER = [0, 3, -2, 4, -3, 2, -4, 1, -1];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, from: number, len: number) => clamp01((p - from) / len);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Point (in progress) at which the d-th card dealt counts as dealt: halfway through its turn. */
const dealtAt = (d: number) => START + d * STEP + FLIP_DELAY + FLIP / 2;
const countDealt = (p: number) => DECK_CHECKS.reduce((n, _, d) => n + (p >= dealtAt(d) ? 1 : 0), 0);

type Geometry = { cardW: number; cardH: number; gap: number };

function measure(w: number, h: number): Geometry {
  const gap = w >= 760 ? 18 : 14;
  const cardW = Math.min((w - 2 * gap) / 3, 300);
  // Landscape cards when there is room; never taller than a third of the stage.
  const cardH = Math.min((h - 2 * gap) / 3, Math.max(cardW / 1.28, 206));
  return { cardW: Math.floor(cardW), cardH: Math.floor(cardH), gap };
}

/**
 * Desktop deck: a sticky stage in a tall track. Scroll progress (spring-smoothed)
 * deals the nine cards from a tilted stack into a 3x3 grid and turns each over.
 * Native scroll is never intercepted; only transform and opacity animate.
 */
export function ScrollDeck() {
  const trackRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.5, restDelta: 0.0005 });

  const [geo, setGeo] = useState<Geometry>({ cardW: 270, cardH: 212, gap: 18 });
  // Grid pitch as motion values so a resize repositions cards without waiting for a scroll event.
  const pitchX = useMotionValue(geo.cardW + geo.gap);
  const pitchY = useMotionValue(geo.cardH + geo.gap);

  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = measure(entry.contentRect.width, entry.contentRect.height);
      pitchX.set(next.cardW + next.gap);
      pitchY.set(next.cardH + next.gap);
      setGeo((g) => (g.cardW === next.cardW && g.cardH === next.cardH && g.gap === next.gap ? g : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pitchX, pitchY]);

  const [dealt, setDealt] = useState(0);
  useEffect(() => setDealt(countDealt(progress.get())), [progress]);
  useMotionValueEvent(progress, 'change', (p) => setDealt(countDealt(p)));

  const compact = geo.cardH < 214 || geo.cardW < 250;

  // Keyboard users who tab into the stack: scroll the track so that card is dealt and readable.
  function dealTo(d: number) {
    const track = trackRef.current;
    if (!track || scrollYProgress.get() >= dealtAt(d)) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const travel = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + Math.min(1, dealtAt(d) + FLIP / 2) * travel,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  return (
    // Pulled up under the section heading: the top of the stage is empty while the
    // cards are stacked, so the deck starts right below the lead instead of a viewport lower.
    <div ref={trackRef} className="relative -mt-[22svh] h-[320vh]">
      <div className="sticky top-0 flex h-svh flex-col pt-20 pb-6">
        <Container className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-12">
          <aside className="shrink-0 lg:flex lg:w-64 lg:flex-col lg:justify-center">
            <div className="flex items-end gap-5 lg:block">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-subtle uppercase">Dealt</p>
                <p className="mt-1 font-semibold tracking-tight tabular-nums">
                  <span aria-hidden className="chrome-text text-4xl lg:text-6xl">
                    {dealt}
                  </span>
                  <span aria-hidden className="text-2xl text-subtle lg:text-3xl">
                    /{N}
                  </span>
                  <span className="sr-only">
                    {dealt} of {N} cards dealt
                  </span>
                </p>
              </div>
              <div aria-hidden className="relative mb-3 h-px flex-1 overflow-hidden bg-white/10 lg:mt-5 lg:mb-0">
                <motion.div className="absolute inset-0 origin-left bg-foreground" style={{ scaleX: progress }} />
              </div>
            </div>

            <ol className="mt-6 hidden space-y-1.5 text-sm lg:block">
              {DECK_CHECKS.map((c, k) => (
                <li
                  key={c.key}
                  className={cn(
                    'flex items-center gap-3 transition-colors duration-300',
                    DEAL_POS[k] < dealt ? 'text-foreground' : 'text-subtle',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-300',
                      DEAL_POS[k] < dealt ? 'scale-100 bg-foreground' : 'scale-75 bg-white/20',
                    )}
                  />
                  {c.name}
                </li>
              ))}
            </ol>

            <p className="mt-6 hidden max-w-[16rem] text-xs leading-relaxed text-subtle lg:block">
              Scroll to deal, or Tab to a card to deal up to it. Click a dealt card, or press Enter on it, to turn
              it over yourself.
            </p>
            <a
              href="#how"
              className="group mt-4 hidden w-fit items-center gap-1.5 rounded-full text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:inline-flex"
            >
              Skip the deck
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </aside>

          <div ref={deckRef} className="relative isolate min-h-0 flex-1 [perspective:1400px]">
            {/* Backdrop: faint grid, a light leak behind the stack and a chrome sparkle. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
              <div className="light-leak absolute top-1/2 left-1/2 h-[560px] w-[760px] -translate-x-1/2 -translate-y-1/2" />
            </div>
            <ChromeSparkle size={64} rotate={14} parallax={22} float className="absolute -top-2 right-2 z-0" />

            {DECK_CHECKS.map((check, k) => (
              <DeckCard
                key={check.key}
                check={check}
                index={k}
                progress={progress}
                pitchX={pitchX}
                pitchY={pitchY}
                geo={geo}
                compact={compact}
                dealtByScroll={DEAL_POS[k] < dealt}
                onDealTo={dealTo}
              />
            ))}
          </div>
        </Container>
      </div>
    </div>
  );
}

function DeckCard({
  check,
  index: k,
  progress,
  pitchX,
  pitchY,
  geo,
  compact,
  dealtByScroll,
  onDealTo,
}: {
  check: DeckCheck;
  index: number;
  progress: MotionValue<number>;
  pitchX: MotionValue<number>;
  pitchY: MotionValue<number>;
  geo: Geometry;
  compact: boolean;
  dealtByScroll: boolean;
  onDealTo: (d: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const d = DEAL_POS[k];
  const col = (k % 3) - 1;
  const row = Math.floor(k / 3) - 1;
  const from = START + d * STEP;
  const [focused, setFocused] = useState(false);

  // Stack pose: lying back on a tilted plane, each card a little further up and
  // behind the one before, like the stacked stat cards in the reference.
  const sx = d * 9 - 36;
  const sy = 52 - d * 14;
  const srz = -24 + JITTER[d];

  const t = useTransform(progress, (p) => easeOut(seg(p, from, MOVE)));
  const x = useTransform([t, pitchX], ([v, px]: number[]) => lerp(sx, col * px, v));
  // A short arc on the way out so cards visibly lift off the stack.
  const y = useTransform([t, pitchY], ([v, py]: number[]) => lerp(sy, row * py, v) - Math.sin(v * Math.PI) * 36);
  const scale = useTransform(t, (v) => lerp(0.84, 1, v) + Math.sin(v * Math.PI) * 0.06);
  const rotateX = useTransform(t, (v) => lerp(52, 0, v));
  const rotate = useTransform(t, (v) => lerp(srz, 0, v));
  // Corner labels only on the top card of the stack; underneath they peek out as clipped fragments.
  const labelOpacity = useTransform(progress, (p) => (d === 0 ? 1 : clamp01((p - (from - STEP)) / 0.03)));

  // Manual flips add half a turn on top of the scroll-driven one, so a click always turns the card over.
  const [manual, setManual] = useState(false);
  const manualTurn = useSpring(0, { stiffness: 170, damping: 22 });
  useEffect(() => manualTurn.set(manual ? 180 : 0), [manual, manualTurn]);
  const rotateY = useTransform([progress, manualTurn], ([p, m]: number[]) => 180 * easeInOut(seg(p, from + FLIP_DELAY, FLIP)) + m);

  // The chrome sheen on the face-down side slides across as the page scrolls. It wraps
  // while out of view (outside -100%..200% of its own width), so the jump is never seen.
  const sheenX = useTransform(progress, (p) => `${-150 + ((p * 2.2 + d * 0.37) % 1) * 400}%`);

  const backShown = dealtByScroll !== manual;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    el.style.setProperty('--mx', `${px}px`);
    el.style.setProperty('--my', `${py}px`);
    if (canHover() && !prefersReducedMotion()) {
      el.style.setProperty('--ry', `${((px / r.width - 0.5) * 14).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-(py / r.height - 0.5) * 14).toFixed(2)}deg`);
    }
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    for (const v of ['--mx', '--my']) el.style.setProperty(v, '-100%');
    for (const v of ['--rx', '--ry']) el.style.setProperty(v, '0deg');
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group absolute top-1/2 left-1/2"
      style={{
        width: geo.cardW,
        height: geo.cardH,
        marginLeft: -geo.cardW / 2,
        marginTop: -geo.cardH / 2,
        // A focused card is raised so its focus ring is never covered.
        zIndex: focused ? 50 : N - d,
        ['--label-o' as string]: labelOpacity,
        x,
        y,
        scale,
        rotateX,
      }}
    >
      {/* Flat layer: spins the card in its own plane and gives the flip its perspective. */}
      <motion.div className="absolute inset-0 [perspective:1000px]" style={{ rotate }}>
        <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_translateZ(var(--lift,0px))] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:[--lift:18px] group-hover:duration-150">
          <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ rotateY }}>
            <CardFront
              check={check}
              index={k}
              compact={compact}
              sheen={
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(105deg,transparent_20%,rgb(255_255_255/0.09)_45%,rgb(255_255_255/0.16)_50%,rgb(255_255_255/0.09)_55%,transparent_80%)]"
                  style={{ x: sheenX }}
                />
              }
            />
            <CardBack check={check} compact={compact} />
          </motion.div>
        </div>
        <button
          type="button"
          aria-pressed={backShown}
          aria-label={`Show result: ${check.name}`}
          onFocus={() => {
            setFocused(true);
            onDealTo(d);
          }}
          onBlur={() => setFocused(false)}
          // A card still in the stack is dealt first; only a dealt card turns over by hand.
          onClick={() => (progress.get() < dealtAt(d) ? onDealTo(d) : setManual((m) => !m))}
          className="absolute inset-0 cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        />
      </motion.div>
    </motion.div>
  );
}
