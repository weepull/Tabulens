import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ArrowRight } from '@/components/ui/icons';
import { HowSteps, type Step } from './features/HowSteps';

const PILL = 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-foreground';

const STEPS: Step[] = [
  {
    title: 'Upload a CSV',
    body: (
      <>
        Drop in your training file, add an optional test file to check for contamination, and pick the target column.
        Up to 20 MB.
      </>
    ),
    visual: (
      <div aria-hidden className="flex flex-wrap gap-1.5">
        <span className={PILL}>loans_train.csv</span>
        <span className={PILL}>
          loans_test.csv <span className="text-subtle">optional</span>
        </span>
        <span className={`${PILL} bg-white/10`}>
          target <span className="text-subtle">=</span> defaulted
        </span>
      </div>
    ),
  },
  {
    title: 'Nine checks run in memory',
    body: (
      <>
        Leakage, contamination, duplicates, ID-like and constant columns, dirty categories, missing values, class
        imbalance and mixed types. Nothing is stored.
      </>
    ),
    visual: (
      <div aria-hidden className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse-dot rounded-full bg-foreground"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] whitespace-nowrap text-subtle">9 checks · in memory</span>
      </div>
    ),
  },
  {
    title: 'Read the report',
    body: (
      <>
        Every finding comes with its reasoning, the raw numbers and the exact rows. The loans example scores 0/100; the
        clean study example scores 90.
      </>
    ),
    visual: (
      <div aria-hidden className="flex flex-wrap gap-1.5">
        <span className={PILL}>
          loans <span className="text-foreground">0/100</span> <span className="text-sev-high">poor</span>
        </span>
        <span className={PILL}>
          study_clean <span className="text-foreground">90/100</span> <span className="text-ok">clean</span>
        </span>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="relative isolate overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="section-fade pointer-events-none absolute inset-0 -z-10">
        <div className="light-leak absolute top-10 left-1/2 h-[420px] w-[900px] -translate-x-1/2 opacity-70" />
      </div>
      <Container className="relative">
        <SectionHeading
          id="how-heading"
          badge="How it works"
          title="From file to findings in three steps"
          lead="Upload, check, read the evidence. Nothing is stored."
        />
        <div className="mt-12 sm:mt-16">
          <HowSteps steps={STEPS} />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button href="/analyze" variant="glass" size="sm" icon={<ArrowRight />}>
            Try the loans example
          </Button>
          <p className="text-sm text-subtle">
            On the analyzer, choose <span className="text-muted">Loans (planted defects)</span>.
          </p>
        </div>
      </Container>
    </section>
  );
}
