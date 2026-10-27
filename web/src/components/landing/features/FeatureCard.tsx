import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/components/ui/cn';

export type Severity = 'high' | 'medium' | 'low' | 'info';

const SEV_TEXT: Record<Severity, string> = {
  high: 'text-sev-high',
  medium: 'text-sev-medium',
  low: 'text-sev-low',
  info: 'text-sev-info',
};

/** Severity as a word, with only a quiet tinted dot for colour. */
export function SeverityTag({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium capitalize', SEV_TEXT[severity], className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
      <span className="sr-only"> severity</span>
    </span>
  );
}

/** Inset "screen" that holds a card's mini demo. */
export function Stage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'specular relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(255_255_255/0.06),transparent_60%)]" />
      {children}
    </div>
  );
}

/** Bento cell: demo on top, copy underneath. */
export function FeatureCard({
  check,
  severity,
  title,
  children,
  demo,
  className,
  ...rest
}: {
  check: string;
  severity?: Severity;
  title: string;
  children: ReactNode;
  demo: ReactNode;
  className?: string;
} & Record<string, unknown>) {
  return (
    <GlassCard as="article" tilt maxTilt={2.5} className={cn('flex h-full flex-col p-3 sm:p-4', className)} {...rest}>
      {demo}
      <div className="flex flex-1 flex-col px-2 pt-5 pb-2 sm:px-3">
        <p className="flex flex-wrap items-center gap-x-2 text-xs tracking-wide text-subtle uppercase">
          <span>{check}</span>
          {severity && (
            <>
              <span aria-hidden>·</span>
              <SeverityTag severity={severity} />
            </>
          )}
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </GlassCard>
  );
}
