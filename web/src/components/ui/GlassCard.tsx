'use client';

import { useRef, type ElementType, type PointerEvent, type ReactNode } from 'react';
import { canHover, prefersReducedMotion } from './useReducedMotionSafe';
import { cn } from './cn';

/**
 * Frosted card with a chrome hairline border, a cursor-follow spotlight and an
 * optional 3D tilt. Pointer position is written to CSS variables on the
 * element (--mx/--my, --rx/--ry), so moving the mouse never re-renders React.
 */
export function GlassCard({
  as: Tag = 'div',
  tilt = false,
  maxTilt = 6,
  spotlight = true,
  solid = false,
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  /** Rotate towards the cursor (mouse only, off with reduced motion). */
  tilt?: boolean;
  /** Max rotation in degrees. */
  maxTilt?: number;
  spotlight?: boolean;
  /** Opaque background instead of backdrop blur; use in long lists. */
  solid?: boolean;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);

  function onMove(e: PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    el.style.setProperty('--mx', `${px}px`);
    el.style.setProperty('--my', `${py}px`);
    el.dataset.active = '';
    if (tilt && canHover() && !prefersReducedMotion()) {
      el.style.setProperty('--ry', `${((px / r.width - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-(py / r.height - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
    }
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.active;
    el.style.setProperty('--mx', '-100%');
    el.style.setProperty('--my', '-100%');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        'chrome-border relative rounded-3xl border-0',
        solid ? 'glass-solid' : 'glass',
        spotlight && 'spotlight',
        tilt && 'tilt',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
