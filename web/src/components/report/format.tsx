import type { ReactNode } from 'react';
import type { Severity } from '@/lib/types';

/** Same rounding as the server's pct(), so numbers in the UI match the finding text. */
export function pct(x: number): string {
  return `${(x * 100).toFixed(x < 0.01 && x > 0 ? 2 : 1)}%`;
}

export function num(x: number): string {
  return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/**
 * Finding titles and details mark column names with `backticks`. Render those
 * as <code> instead of showing raw markdown.
 */
export function inlineCode(text: string): ReactNode[] {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded-md border border-white/[0.06] bg-white/[0.05] px-1 py-0.5 font-mono text-[0.9em] break-all">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

// Full class strings, not built by concatenation, so Tailwind's scanner sees them.
// The tint is a quiet accent; the label is always shown next to it.
export const SEV_STYLE: Record<
  Severity,
  { label: string; text: string; soft: string; border: string; dot: string; ring: string }
> = {
  high: { label: 'High', text: 'text-sev-high', soft: 'bg-sev-high-soft', border: 'border-sev-high', dot: 'bg-sev-high', ring: 'border-sev-high/30' },
  medium: { label: 'Medium', text: 'text-sev-medium', soft: 'bg-sev-medium-soft', border: 'border-sev-medium', dot: 'bg-sev-medium', ring: 'border-sev-medium/30' },
  low: { label: 'Low', text: 'text-sev-low', soft: 'bg-sev-low-soft', border: 'border-sev-low', dot: 'bg-sev-low', ring: 'border-sev-low/30' },
  info: { label: 'Info', text: 'text-sev-info', soft: 'bg-sev-info-soft', border: 'border-sev-info', dot: 'bg-sev-info', ring: 'border-sev-info/30' },
};

export const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Small uppercase label used above panels inside cards. */
export const EYEBROW = 'text-[0.6875rem] font-medium tracking-[0.14em] text-subtle uppercase';
