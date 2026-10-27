import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Deck } from './deck/Deck';

/** The nine checks, dealt as a deck of cards. The scroll-driven version is desktop only; see deck/Deck. */
export function CheckDeck() {
  return (
    // overflow-x: clip (not hidden) contains the 3D cards without breaking the sticky stage.
    <section id="checks" aria-labelledby="checks-heading" className="relative isolate overflow-x-clip pt-24 pb-24 md:pb-8">
      <Container>
        <SectionHeading
          id="checks-heading"
          badge="Checks"
          title="The nine checks"
          lead="One card per check. Turn each over to see what it found in the loans example."
        />
      </Container>
      <Deck />
    </section>
  );
}
