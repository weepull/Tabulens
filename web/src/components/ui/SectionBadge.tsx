import type { ReactNode } from 'react';
import { cn } from './cn';

/** Small "● Label" pill that sits above a section heading. */
export function SectionBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide text-foreground',
        className,
      )}
    >
      <span aria-hidden className="relative flex h-1.5 w-1.5">
        <span className="absolute inset-0 animate-pulse-dot rounded-full bg-foreground" />
        <span className="absolute -inset-1 rounded-full bg-foreground/20 blur-[2px]" />
      </span>
      {children}
    </span>
  );
}
