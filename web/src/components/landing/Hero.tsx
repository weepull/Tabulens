import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Magnetic } from '@/components/ui/Magnetic';
import { ArrowRight, Check } from '@/components/ui/icons';
import { FormatMarquee } from './hero/FormatMarquee';
import { HeroSpotlight } from './hero/HeroSpotlight';
import { SparkleCluster } from './hero/SparkleCluster';

const FACTS = ['Files up to 20 MB', 'Processed in memory, never stored'];

// Staggered entrance. Pure CSS so it runs before hydration; reduced motion cuts it to nothing.
const enter = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden pt-10 pb-16 sm:pt-24 sm:pb-20">
      <div aria-hidden className="section-fade-b pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="light-leak absolute -top-72 left-1/2 h-[720px] w-[1100px] -translate-x-1/2" />
        <div className="light-leak absolute top-40 -left-60 h-[420px] w-[520px] opacity-60" />
        <div className="vignette absolute inset-0" />
        {/* Hand off to the next section without a hard edge. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>
      <HeroSpotlight />

      <Container className="relative">
        <SparkleCluster variant="desktop" className="absolute top-0 right-6 hidden h-[380px] w-[480px] lg:block xl:right-8" />
        <SparkleCluster variant="mobile" className="ml-auto h-24 w-48 lg:hidden" />

        <div className="relative max-w-[50rem]">
          <p
            className="glass inline-flex max-w-full animate-fade-up items-center gap-2.5 rounded-full py-1 pr-3.5 pl-1 text-xs font-medium text-foreground sm:text-sm"
            style={enter(0)}
          >
            <span className="btn-primary shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
              Free
            </span>
            No sign-up. Drop a CSV and go.
          </p>

          <h1
            id="hero-heading"
            className="mt-6 animate-fade-up text-[clamp(2rem,9.4vw,3.75rem)] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
            style={enter(80)}
          >
            {/* One gradient per line (clone), so a wrapped line doesn't come out half grey. */}
            <span className="chrome-text [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
              Catch what&apos;s quietly
            </span>
            <br />
            <span className="chrome-text [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
              wrong with your data
            </span>
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-muted sm:text-lg" style={enter(160)}>
            Find leakage, contamination and dirty data before you train.
          </p>

          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3" style={enter(240)}>
            <Magnetic className="w-full sm:w-auto">
              <Button href="/analyze" size="lg" icon={<ArrowRight />} className="w-full sm:w-auto">
                Analyze a CSV
              </Button>
            </Magnetic>
            <Magnetic className="w-full sm:w-auto">
              <Button href="#how" size="lg" variant="glass" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Magnetic>
          </div>

          <ul className="mt-8 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-sm text-subtle" style={enter(320)}>
            {FACTS.map((f) => (
              <li key={f} className="inline-flex items-center gap-2">
                <Check className="text-muted" width={14} height={14} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="mt-20 animate-fade-up sm:mt-24" style={enter(420)}>
        <FormatMarquee />
      </div>
    </section>
  );
}
