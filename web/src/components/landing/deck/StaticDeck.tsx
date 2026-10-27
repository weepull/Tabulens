'use client';

import { useState, type PointerEvent } from 'react';
import { cn } from '@/components/ui/cn';
import { useMediaQuery } from '@/components/ui/useReducedMotionSafe';
import { CardBack, CardFront } from './CardFaces';
import { DECK_CHECKS, type DeckCheck } from './checks';

/**
 * Phones and reduced motion: no pinning, just a grid of cards that turn over
 * on tap (instantly under reduced motion, where transitions are cut globally).
 * "Show all results" turns every card at once so everything can be read in one pass.
 */
export function StaticDeck({ className }: { className?: string }) {
  const [shown, setShown] = useState<boolean[]>(() => DECK_CHECKS.map(() => false));
  const allShown = shown.every(Boolean);

  return (
    <div className={className}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-subtle">Tap or click a card to turn it over.</p>
        <button
          type="button"
          aria-pressed={allShown}
          onClick={() => setShown(DECK_CHECKS.map(() => !allShown))}
          className="btn-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            aria-hidden
            className={cn(
              'relative h-4 w-7 rounded-full border border-white/20 bg-white/5 transition-colors',
              allShown && 'bg-white/25',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-foreground transition-transform duration-300',
                allShown && 'translate-x-3',
              )}
            />
          </span>
          Show all results
        </button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DECK_CHECKS.map((check, k) => (
          <StaticCard
            key={check.key}
            check={check}
            index={k}
            flipped={shown[k]}
            onFlip={() => setShown((s) => s.map((v, i) => (i === k ? !v : v)))}
          />
        ))}
      </ul>
    </div>
  );
}

function StaticCard({
  check,
  index,
  flipped,
  onFlip,
}: {
  check: DeckCheck;
  index: number;
  flipped: boolean;
  onFlip: () => void;
}) {
  const compact = useMediaQuery('(max-width: 639px)', false);
  // Cursor light for mouse users (desktop with reduced motion); no tilt here.
  function onMove(e: PointerEvent<HTMLLIElement>) {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  return (
    // Shorter on phones (compact faces), so nine cards in one column don't run on for screens.
    <li className="relative h-44 [perspective:1100px] sm:h-52" onPointerMove={onMove}>
      <div
        className={cn(
          'absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        <CardFront check={check} index={index} compact={compact} peek />
        <CardBack check={check} compact={compact} />
      </div>
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={`Show result: ${check.name}`}
        onClick={onFlip}
        className="absolute inset-0 cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      />
    </li>
  );
}
