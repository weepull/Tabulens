'use client';

import { Container } from '@/components/ui/Container';
import { useMediaQuery, useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe';
import { ScrollDeck } from './ScrollDeck';
import { StaticDeck } from './StaticDeck';

// Below this height the scroll deck's cards get too short to show their results.
const ROOMY = '(min-width: 768px) and (min-height: 700px)';

/**
 * Picks the deck for the viewer. Below md the static grid is shown by CSS (no
 * flash on phones); with reduced motion, or on a short window, the scroll deck
 * is not rendered at all.
 */
export function Deck() {
  const reduce = useReducedMotionSafe();
  const roomy = useMediaQuery(ROOMY, true);
  const scroll = !reduce && roomy;
  return (
    <>
      <Container className={scroll ? 'mt-10 md:hidden' : 'mt-12'}>
        <StaticDeck />
      </Container>
      {scroll && (
        <div className="hidden md:block">
          <ScrollDeck />
        </div>
      )}
    </>
  );
}
