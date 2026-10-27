import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';
import type { DeckCheck, DeckSeverity } from './checks';

const SEVERITY: Record<DeckSeverity, { label: string; pill: string; dot: string }> = {
  high: { label: 'High', pill: 'bg-sev-high-soft text-sev-high', dot: 'bg-sev-high' },
  medium: { label: 'Medium', pill: 'bg-sev-medium-soft text-sev-medium', dot: 'bg-sev-medium' },
  low: { label: 'Low', pill: 'bg-sev-low-soft text-sev-low', dot: 'bg-sev-low' },
  info: { label: 'Info', pill: 'bg-sev-info-soft text-sev-info', dot: 'bg-sev-info' },
  none: { label: 'No finding', pill: 'bg-white/[0.04] text-ok', dot: 'bg-ok' },
};

// 24px line glyphs, one per check. Decorative: the name is always written next to them.
const GLYPHS: Record<string, ReactNode> = {
  leakage: <path d="M12 3.5c3.2 4.2 6 7.6 6 10.9a6 6 0 0 1-12 0c0-3.3 2.8-6.7 6-10.9ZM9.2 14.6a2.9 2.9 0 0 0 2.4 2.6" />,
  contamination: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
  duplicates: (
    <>
      <rect x="8" y="8" width="11.5" height="11.5" rx="2" />
      <path d="M16 8V6.5a2 2 0 0 0-2-2H6.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8" />
    </>
  ),
  constant: <path d="M3.5 12h17M6.5 12v.01M12 12v.01M17.5 12v.01M3.5 7.5h17M3.5 16.5h17" strokeOpacity="1" />,
  id: <path d="M9.5 4 8 20M16 4l-1.5 16M4.5 9h15.5M4 15h15.5" />,
  dirty: (
    <>
      <path d="M3.5 17 7.5 7l4 10M5 13.5h5" />
      <path d="M14 13.5c1.4-1.6 2.6-1.6 3.4 0s2 1.6 3.1 0M14 17c1.4-1.6 2.6-1.6 3.4 0s2 1.6 3.1 0" />
    </>
  ),
  missing: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" strokeDasharray="3 2.6" />
      <path d="M10 10l4 4M14 10l-4 4" />
    </>
  ),
  imbalance: <path d="M12 4.5v15M8 19.5h8M5 8h14M5 8l-2.5 5.5h5L5 8ZM19 8l-2.5 5.5h5L19 8Z" />,
  mixed: (
    <>
      <path d="M4.5 9.5 7 8v8.5" />
      <path d="M12 16.5 15.5 7.5l3.5 9M13.3 13.3h4.4" />
    </>
  ),
};

export function CheckGlyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {GLYPHS[name]}
    </svg>
  );
}

export function SeverityPill({ severity }: { severity: DeckSeverity }) {
  const s = SEVERITY[severity];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium', s.pill)}>
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      <span>
        <span className="sr-only">Severity: </span>
        {s.label}
      </span>
    </span>
  );
}

function Result({ parts }: { parts: DeckCheck['result'] }) {
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <code key={i} className="rounded bg-white/[0.06] px-1 py-px font-mono text-[0.88em] text-foreground">
            {p.code}
          </code>
        ),
      )}
    </>
  );
}

// Both faces sit in the same box; the one turned away from the viewer is hidden.
const FACE = '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]';

/** Shared shell for both faces: chrome hairline, opaque glass, faint grid, cursor spotlight (reads --mx/--my). */
function FaceShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('chrome-border glass-solid absolute inset-0 overflow-hidden rounded-3xl', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(260px_circle_at_var(--mx,-100%)_var(--my,-100%),rgb(255_255_255/0.08),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
      {children}
    </div>
  );
}

/**
 * Face-down side: index, glyph medallion and name. Purely visual (aria-hidden);
 * the back face carries the name as a real heading, so nothing is read twice.
 * `sheen` is an optional moving highlight layer supplied by the scroll deck.
 * `peek` shows the loans result on the front below sm, so a phone's column of
 * face-down cards still carries the numbers.
 */
export function CardFront({
  check,
  index,
  sheen,
  compact = false,
  peek = false,
}: {
  check: DeckCheck;
  index: number;
  sheen?: ReactNode;
  compact?: boolean;
  peek?: boolean;
}) {
  return (
    <FaceShell className={FACE}>
      <div aria-hidden className={cn('relative flex h-full flex-col justify-between', compact ? 'p-4' : 'p-5')}>
        {/* Faint grid + soft glow, like the section backdrops but card-sized. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_70%_20%,#000,transparent_75%)]" />
        <div className="light-leak pointer-events-none absolute -top-16 -right-10 h-48 w-48" />
        {sheen}
        {/* --label-o lets the scroll deck hide these on cards buried in the stack. */}
        <div className="relative flex items-center justify-between font-mono text-[11px] tracking-wider text-subtle opacity-[var(--label-o,1)]">
          <span>{String(index + 1).padStart(2, '0')} / 09</span>
          <span className="tracking-[0.2em] uppercase">Check</span>
        </div>
        {peek && (
          <p className="relative text-[13px] leading-snug text-muted sm:hidden">
            <Result parts={check.result} />
          </p>
        )}
        <div className="relative flex items-end justify-between gap-3">
          <p className={cn('chrome-text leading-tight font-semibold tracking-tight', compact ? 'text-lg' : 'text-xl')}>
            {check.name}
          </p>
          <span className="brushed specular grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 text-foreground">
            <CheckGlyph name={check.key} className="h-6 w-6" />
          </span>
        </div>
      </div>
    </FaceShell>
  );
}

/** Face-up side: what the check catches and what it found in the loans example. */
export function CardBack({ check, compact = false }: { check: DeckCheck; compact?: boolean }) {
  return (
    <FaceShell className={cn(FACE, '[transform:rotateY(180deg)]')}>
      <div className={cn('relative flex h-full flex-col', compact ? 'p-4' : 'p-5')}>
        <div className="flex items-center justify-between gap-2">
          <SeverityPill severity={check.severity} />
          <CheckGlyph name={check.key} className="h-4 w-4 text-subtle" />
        </div>
        <h3 className={cn('leading-snug font-semibold text-foreground', compact ? 'mt-2 text-sm' : 'mt-3 text-[15px]')}>{check.name}</h3>
        <p className={cn('mt-1 leading-snug text-muted', compact ? 'text-xs' : 'text-[13px]')}>{check.catches}</p>
        <div className={cn('mt-auto border-t border-white/[0.07]', compact ? 'pt-2' : 'pt-3')}>
          <p className="text-[10px] font-medium tracking-[0.16em] text-subtle uppercase">In the loans example</p>
          <p className={cn('mt-1 leading-snug text-foreground', compact ? 'text-[13px]' : 'text-sm')}>
            <Result parts={check.result} />
          </p>
        </div>
      </div>
    </FaceShell>
  );
}
