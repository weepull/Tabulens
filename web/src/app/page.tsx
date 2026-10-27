import { CheckDeck } from '@/components/landing/CheckDeck';
import { ComingNext } from '@/components/landing/ComingNext';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { FinalCta } from '@/components/landing/FinalCta';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';

/** Landing page. The analyzer itself lives at /analyze; nav and footer come from the root layout. */
export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Features />
      <CheckDeck />
      <HowItWorks />
      <Faq />
      <ComingNext />
      <FinalCta />
    </main>
  );
}
