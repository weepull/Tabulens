import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  CliArt,
  DelimiterArt,
  FuzzyArt,
  MultiLeakArt,
  NumericLeakArt,
  StreamingArt,
} from './bottom/WorkbenchArt';
import { WorkbenchCard } from './bottom/WorkbenchCard';

// From ROADMAP.md ("Later" and step 3). None of these exist yet; no dates are promised.
const ITEMS = [
  {
    id: 'wb-fuzzy',
    title: 'Fuzzy duplicate matching',
    body: 'Catch the same record typed twice: a reformatted date, a nickname, a typo like “Mumbia”. Today matching is exact after normalization.',
    art: <FuzzyArt />,
  },
  {
    id: 'wb-multi',
    title: 'Multi-column leakage',
    body: 'Find columns that give the answer away only in combination. The current check looks at one column at a time.',
    art: <MultiLeakArt />,
  },
  {
    id: 'wb-numeric',
    title: 'Leakage for numeric targets',
    body: 'Correlation-based leakage checks when the target is a number, like a price or a duration, not a class.',
    art: <NumericLeakArt />,
  },
  {
    id: 'wb-stream',
    title: 'Files over 20 MB',
    body: 'A streaming parse, so large files are read in chunks instead of held in memory all at once.',
    art: <StreamingArt />,
  },
  {
    id: 'wb-delim',
    title: 'Delimiter & encoding detection',
    body: 'Work out whether a file uses commas, semicolons or tabs, and which text encoding, instead of assuming comma and UTF-8.',
    art: <DelimiterArt />,
  },
  {
    id: 'wb-cli',
    title: 'A command-line version',
    body: 'The same checks from a terminal, so a dataset can be screened in a script before training starts.',
    art: <CliArt />,
  },
];

export function ComingNext() {
  return (
    <section id="next" aria-labelledby="next-heading" className="relative isolate overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="section-fade pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="light-leak absolute top-0 right-[-10%] h-[560px] w-[760px]" />
        <div className="vignette absolute inset-0" />
      </div>
      <Container className="relative">
        <ChromeSparkle size={88} rotate={14} parallax={16} float className="absolute top-2 right-10 hidden md:block" />
        <ChromeSparkle size={34} rotate={-8} parallax={26} className="absolute top-32 right-44 hidden opacity-80 md:block" />
        <Reveal>
          <SectionHeading
            id="next-heading"
            badge="Coming next"
            title="On the workbench"
            lead="Next on the roadmap. No dates promised."
          />
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {ITEMS.map((item, i) => (
            <Reveal as="li" key={item.id} delay={i * 80} className="h-full">
              <WorkbenchCard id={item.id} title={item.title} body={item.body} art={item.art} />
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-xs text-subtle">Hover, focus or tap a card to look under the cover.</p>
      </Container>
    </section>
  );
}
