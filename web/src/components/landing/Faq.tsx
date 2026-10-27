import { Button } from '@/components/ui/Button';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ArrowRight } from '@/components/ui/icons';
import { FaqAccordion, type FaqItem } from './bottom/FaqAccordion';

// Every answer here is checked against the README, thresholds.js and score.js.
const ITEMS: FaqItem[] = [
  {
    q: 'Do you store my file?',
    a: (
      <p>
        <strong>No.</strong> The upload is held in memory for the length of one request, analyzed, and dropped. It is
        never written to disk. The preview table you see before analyzing is parsed in your browser.
      </p>
    ),
  },
  {
    q: 'How big can a file be?',
    a: (
      <p>
        <strong>20&nbsp;MB per file</strong>, for the main CSV and the optional test CSV. Anything larger is rejected
        with a clear error rather than half-processed. Streaming larger files is on the workbench below.
      </p>
    ),
  },
  {
    q: 'How does leakage detection work?',
    a: (
      <>
        <p>
          It asks how well <strong>one column on its own</strong> predicts the target. For a numeric column it tries
          every single threshold and keeps the best split; above 98% accuracy is flagged. For a categorical column it
          groups rows by value and checks whether the target is essentially constant inside every group (99% purity).
        </p>
        <p className="mt-3">
          It is a heuristic, not proof: a genuinely strong feature can trip it. Under about 200 rows, small samples
          produce perfect splits by accident, so those findings are downgraded and say why. In the loans example,{' '}
          <strong>risk_score predicts defaulted 99.1% of the time</strong>.
        </p>
      </>
    ),
  },
  {
    q: 'What does the score mean?',
    a: (
      <>
        <p>
          Start at 100, subtract <strong>25 per high</strong>, <strong>10 per medium</strong> and{' '}
          <strong>3 per low</strong> finding, and stop at 0. It is deliberately crude: a severity-weighted deduction,
          not a statistical measure.
        </p>
        <p className="mt-3">
          The loans example scores <strong>0/100, poor</strong>; the clean study example scores{' '}
          <strong>90, clean</strong>. The number is a headline. Read the findings.
        </p>
      </>
    ),
  },
  {
    q: "What's train/test contamination?",
    a: (
      <>
        <p>
          Rows that appear in both your training file and your test file. When that happens, your test score is partly
          a memory test: the model has already seen those answers. The check compares whole rows, and also rows with
          the target left out, after normalizing case and whitespace.
        </p>
        <p className="mt-3">
          In the loans example, <strong>14 test rows are also in training: 13.5% of the test set</strong>. Matching is
          exact after normalization, so a reformatted date still slips through.
        </p>
      </>
    ),
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative isolate overflow-clip py-24 sm:py-32">
      <div aria-hidden className="section-fade pointer-events-none absolute inset-0 -z-10">
        <div className="light-leak absolute top-10 -left-40 h-[520px] w-[620px]" />
      </div>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative lg:sticky lg:top-28 lg:self-start">
            <ChromeSparkle
              size={52}
              rotate={-10}
              parallax={12}
              float
              className="absolute top-12 right-10 hidden xl:block"
            />
            <Reveal>
              <SectionHeading
                id="faq-heading"
                badge="FAQ"
                title="Your questions, answered"
                lead="Straight answers to the common questions."
              />
            </Reveal>
            <Reveal delay={120} className="mt-8 hidden lg:block">
              <div>
                <p className="max-w-xs text-sm text-subtle">
                  The fastest way to judge it: run the loans example and read the evidence behind each finding.
                </p>
                <div className="mt-5">
                  <Button href="/analyze" variant="glass" size="sm" icon={<ArrowRight />}>
                    Try the example
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={80}>
            <FaqAccordion items={ITEMS} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
