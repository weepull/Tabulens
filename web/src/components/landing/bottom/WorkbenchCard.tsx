import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

/**
 * A "not built yet" card. The preview starts frosted and hatched like a locked
 * panel and clears on hover or focus. The clear is a crossfade between a
 * pre-blurred copy and a sharp copy, so only opacity animates.
 * Not a tab stop (it has no action); on touch screens, which can't hover, the
 * preview is simply shown uncovered.
 */
export function WorkbenchCard({
  id,
  title,
  body,
  art,
}: {
  id: string;
  title: string;
  body: ReactNode;
  art: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <GlassCard
      as="article"
      tilt
      maxTilt={5}
      aria-labelledby={headingId}
      className="group h-full p-3"
    >
      <div
        aria-hidden
        className="relative h-32 overflow-hidden rounded-[18px] border border-white/[0.06] bg-background/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
      >
        <div className="bg-grid absolute inset-0 [background-size:20px_20px] [mask-image:none] opacity-60" />
        <div className="light-leak absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2" />

        {/* Frosted copy: shown while locked. */}
        <div className="absolute inset-0 flex items-center justify-center opacity-70 blur-[3px] transition-opacity duration-500 group-hover:opacity-0 [@media(hover:none)]:opacity-0">
          {art}
        </div>
        {/* Sharp copy: revealed on hover, always shown on touch. */}
        <div className="absolute inset-0 flex scale-[0.98] items-center justify-center opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-100 group-hover:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100">
          {art}
        </div>

        {/* Hatching + lock: the "under construction" texture. */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.05)_0_1px,transparent_1px_7px)] transition-opacity duration-500 group-hover:opacity-0 [@media(hover:none)]:opacity-0" />
        <div className="absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-500 group-hover:scale-90 group-hover:opacity-0 [@media(hover:none)]:hidden">
          <span className="glass flex h-9 w-9 items-center justify-center rounded-full text-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
        </div>
      </div>

      <div className="px-3 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 id={headingId} className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <span className="brushed specular shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground">
            Soon
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </GlassCard>
  );
}
