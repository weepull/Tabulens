'use client';

import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe';

export type Step = { title: string; body: ReactNode; visual: ReactNode };

/** Hairline from this step's node to the next one; fills in as the list scrolls through view. */
function Connector({ progress, index, count, still }: { progress: MotionValue<number>; index: number; count: number; still: boolean }) {
  const span = 1 / (count - 1);
  const scale = useTransform(progress, [index * span, (index + 1) * span], [0, 1]);
  const style = still ? undefined : { scaleX: scale };
  const styleY = still ? undefined : { scaleY: scale };
  return (
    // Absolute, so it takes no space in the step's flex layout.
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {/* Vertical on phones: node centre to the next node centre, across the 1.5rem gap. */}
      <span className="absolute top-7 left-7 h-[calc(100%+1.5rem)] w-px bg-white/10 md:hidden">
        <motion.span style={styleY} className="absolute inset-0 origin-top bg-gradient-to-b from-white to-white/40" />
      </span>
      {/* Horizontal from md up. */}
      <span className="absolute top-7 left-7 hidden h-px w-[calc(100%+1.5rem)] bg-white/10 md:block">
        <motion.span style={style} className="absolute inset-0 origin-left bg-gradient-to-r from-white to-white/40" />
      </span>
    </span>
  );
}

function Node({ n, progress, index, count, still }: { n: number; progress: MotionValue<number>; index: number; count: number; still: boolean }) {
  const at = index / (count - 1);
  const lit = useTransform(progress, [Math.max(0, at - 0.08), at], [0, 1]);
  return (
    <span className="brushed specular relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/15 font-mono text-sm font-semibold text-foreground">
      <motion.span
        aria-hidden
        style={still ? undefined : { opacity: lit }}
        className="absolute -inset-2 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.35),transparent)]"
      />
      <span className="sr-only">Step </span>
      {String(n).padStart(2, '0')}
    </span>
  );
}

export function HowSteps({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] });

  return (
    <ol ref={ref} className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 md:flex-col md:gap-6">
          {i < steps.length - 1 && <Connector progress={scrollYProgress} index={i} count={steps.length} still={reduce} />}
          <Node n={i + 1} progress={scrollYProgress} index={i} count={steps.length} still={reduce} />
          <GlassCard tilt maxTilt={3} className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
            <div className="mt-2 text-sm leading-relaxed text-muted">{s.body}</div>
            <div className="mt-auto pt-5">{s.visual}</div>
          </GlassCard>
        </li>
      ))}
    </ol>
  );
}
