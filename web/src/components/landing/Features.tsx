import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContaminationCard } from './features/ContaminationCard';
import { DirtyCategoriesCard } from './features/DirtyCategoriesCard';
import { LeakageCard } from './features/LeakageCard';
import { ShowWorkCard } from './features/ShowWorkCard';

/** Bento of four live mini-demos, each driven by the analyzer's real output for the loans example. */
export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="relative isolate overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="section-fade pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="light-leak absolute top-40 -left-40 h-[520px] w-[720px]" />
        <div className="light-leak absolute right-[-200px] bottom-0 h-[480px] w-[640px] opacity-60" />
      </div>

      <Container className="relative">
        <ChromeSparkle size={88} rotate={-10} parallax={16} float className="absolute top-2 right-10 hidden md:block" />
        <ChromeSparkle size={36} rotate={18} parallax={26} className="absolute top-28 right-40 hidden md:block" />

        <SectionHeading
          id="features-heading"
          badge="Features"
          title="A data check that shows its work"
          lead="Four checks, live on the loans example. Drag, hover and click."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-5">
          <Reveal className="md:col-span-2 lg:col-span-3">
            <LeakageCard />
          </Reveal>
          <Reveal delay={80} className="lg:col-span-2">
            <ContaminationCard />
          </Reveal>
          <Reveal delay={80} className="lg:col-span-2">
            <DirtyCategoriesCard />
          </Reveal>
          <Reveal delay={160} className="md:col-span-2 lg:col-span-3">
            <ShowWorkCard />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
