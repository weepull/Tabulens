'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus } from '@/components/ui/icons';
import { cn } from '@/components/ui/cn';

export type FaqItem = { q: string; a: ReactNode };

/**
 * Single-open accordion. Panels open and close with the grid-rows 0fr -> 1fr
 * switch, set instantly: animating it would relayout everything below on each
 * frame. Only the answer's opacity and a small slide animate. Closed panels are
 * `inert` and `invisible`, which keeps them out of the tab order and the
 * accessibility tree.
 */
export function FaqAccordion({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const uid = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  // Arrow keys / Home / End move between questions (WAI-ARIA accordion pattern).
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = items.length - 1;
    const next =
      e.key === 'ArrowDown' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowUp' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    buttons.current[next]?.focus();
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${uid}-q${i}`;
        const panelId = `${uid}-a${i}`;
        return (
          <li key={item.q}>
            <GlassCard
              solid
              className={cn(
                'rounded-2xl transition-[background-color,box-shadow] duration-300',
                // glass-solid paints an opaque gradient, so the open state swaps the image, not the colour.
                isOpen &&
                  'bg-surface bg-[linear-gradient(180deg,rgb(255_255_255/0.09),rgb(255_255_255/0.035))] shadow-[0_24px_60px_-30px_rgb(255_255_255/0.18)]',
              )}
            >
              <h3 className="relative z-[1]">
                <button
                  ref={(el) => {
                    buttons.current[i] = el;
                  }}
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-[15px] font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-6 sm:py-5 sm:text-base"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'specular flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,color,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-active:scale-90',
                      isOpen
                        ? 'rotate-45 border-transparent bg-foreground text-background'
                        : 'border-white/10 bg-white/5 text-foreground group-hover:border-white/25 group-hover:bg-white/10',
                    )}
                  >
                    <Plus />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                inert={!isOpen}
                className={cn(
                  'relative z-[1] grid',
                  isOpen ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <div
                    className={cn(
                      'px-5 pb-5 text-sm leading-relaxed text-muted transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:px-6 sm:pb-6 sm:text-[15px] [&_strong]:font-medium [&_strong]:text-foreground',
                      isOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
                    )}
                  >
                    {item.a}
                  </div>
                </div>
              </div>
            </GlassCard>
          </li>
        );
      })}
    </ul>
  );
}
