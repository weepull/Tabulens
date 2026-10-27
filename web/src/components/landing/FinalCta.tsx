import { Button } from '@/components/ui/Button';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { Magnetic } from '@/components/ui/Magnetic';
import { Reveal } from '@/components/ui/Reveal';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { ArrowRight } from '@/components/ui/icons';
import { StatStack } from './bottom/StatStack';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="relative isolate overflow-hidden pt-4 pb-4 sm:pt-8">
      <Container>
        <Reveal y={28}>
          <GlassCard className="overflow-hidden rounded-[32px] px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]">
              <div className="bg-grid absolute inset-0" />
              <div className="light-leak absolute -top-48 left-[-10%] h-[520px] w-[760px]" />
              <div className="light-leak absolute -right-40 -bottom-56 h-[480px] w-[620px] opacity-70" />
            </div>
            <ChromeSparkle size={96} rotate={-12} parallax={14} float className="absolute top-8 right-8 hidden lg:block" />
            <ChromeSparkle size={40} rotate={18} parallax={22} className="absolute top-7 right-6 sm:right-10 lg:hidden" />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <SectionBadge>Try it</SectionBadge>
                <h2
                  id="final-cta-heading"
                  className="chrome-text mt-5 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
                >
                  See your data before your model does.
                </h2>
                <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
                  Upload a CSV, name the target column, and read the evidence behind every finding. No sign-up,
                  nothing stored.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Magnetic>
                    <Button href="/analyze" size="lg" icon={<ArrowRight />}>
                      Analyze a CSV
                    </Button>
                  </Magnetic>
                  {/* Goes to the analyzer's upload panel, where the example buttons are. */}
                  <Button href="/analyze#upload-heading" size="lg" variant="glass">
                    Pick an example
                  </Button>
                </div>
                <p className="mt-6 text-xs text-subtle">
                  The bundled loans example scores 0/100. The clean study example scores 90.
                </p>
              </div>
              <StatStack />
            </div>
          </GlassCard>
        </Reveal>
      </Container>
    </section>
  );
}
