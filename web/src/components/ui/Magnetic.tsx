'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';
import { canHover, prefersReducedMotion } from './useReducedMotionSafe';
import { cn } from './cn';

/**
 * Pulls its child a few px towards the cursor while hovered and springs back
 * on leave. No-op for touch and reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.3,
  max = 10,
  className,
}: {
  children: ReactNode;
  /** Fraction of the cursor's offset from centre to follow. */
  strength?: number;
  /** Cap on the shift, in px. */
  max?: number;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 });

  function onMove(e: PointerEvent<HTMLSpanElement>) {
    if (e.pointerType !== 'mouse' || !canHover() || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-max, Math.min(max, v));
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      className={cn('inline-flex', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.span>
  );
}
