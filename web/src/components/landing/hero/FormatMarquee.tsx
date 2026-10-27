import { Container } from '@/components/ui/Container';

// Where the files people bring usually come from. Text only: no logos, nothing implying endorsement.
// Excel and Sheets are listed as exports because it reads the CSV they save, not .xlsx.
const SOURCES = [
  'CSV',
  'TSV',
  'Excel CSV exports',
  'Google Sheets exports',
  'pandas to_csv',
  'Kaggle datasets',
  'SQL exports',
];

function Separator() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" width={10} height={10} className="shrink-0 text-white/30">
      <path d="M5 0C5.4 3.4 6.6 4.6 10 5C6.6 5.4 5.4 6.6 5 10C4.6 6.6 3.4 5.4 0 5C3.4 4.6 4.6 3.4 5 0Z" fill="currentColor" />
    </svg>
  );
}

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : 'Files it reads'}
      className={
        hidden
          ? 'flex shrink-0 items-center motion-reduce:hidden'
          : 'flex shrink-0 items-center motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3'
      }
    >
      {SOURCES.map((s) => (
        <li key={s} className="flex items-center gap-8 pl-8 sm:gap-10 sm:pl-10">
          <span className="text-base font-semibold tracking-tight whitespace-nowrap text-muted transition-colors duration-300 hover:text-foreground sm:text-lg">
            {s}
          </span>
          <Separator />
        </li>
      ))}
    </ul>
  );
}

/**
 * Slow text marquee of the sources it reads. Two identical rows slide by -50%
 * for a seamless loop. Always running, by design: no pause control. Reduced
 * motion (an OS setting) still gets one static, wrapped row.
 */
export function FormatMarquee() {
  return (
    <Container size="wide" className="relative">
      <p className="text-center text-xs font-medium tracking-[0.2em] text-subtle uppercase">
        Reads the tables you already export
      </p>
      <div className="relative mt-6 overflow-hidden border-y border-white/[0.06] py-5 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-marquee motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
          <Row />
          <Row hidden />
        </div>
      </div>
    </Container>
  );
}
