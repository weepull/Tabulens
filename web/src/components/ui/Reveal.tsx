'use client';

import { useInView } from 'motion/react';
import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from './cn';

/**
 * Fades and rises its children in when they scroll into view (once).
 * The transition lives in CSS (.reveal), so reduced motion shows the content
 * immediately and server and client markup always match.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  y = 18,
  amount = 0.2,
  className,
  children,
}: {
  as?: ElementType;
  /** ms */
  delay?: number;
  /** Starting offset in px. */
  y?: number;
  /** Fraction of the element that must be visible. */
  amount?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const shown = useInView(ref, { once: true, amount });
  const style = { '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` } as CSSProperties;
  return (
    <Tag ref={ref} className={cn('reveal', className)} style={style} data-shown={shown ? '' : undefined}>
      {children}
    </Tag>
  );
}
