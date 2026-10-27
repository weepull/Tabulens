import type { ReactNode } from 'react';

/*
 * Small decorative previews for the "Coming next" cards. They are sketches of
 * features that do not exist yet, so they deliberately carry no numbers that
 * could be read as results. All aria-hidden by their parent.
 */

const MONO = 'font-mono text-[11px] leading-none';

function Chip({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={
        strong
          ? `${MONO} specular rounded-md bg-foreground px-2 py-1.5 text-background`
          : `${MONO} specular rounded-md border border-white/10 bg-white/[0.06] px-2 py-1.5 text-foreground`
      }
    >
      {children}
    </span>
  );
}

/** Same record, typed two ways. */
export function FuzzyArt() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Chip>Jon Smith</Chip>
        <Chip>2024-03-01</Chip>
      </div>
      <div className="flex items-center gap-2 pl-6">
        <Chip>John  Smith</Chip>
        <Chip>01/03/2024</Chip>
        <span className="text-lg leading-none text-foreground">&asymp;</span>
      </div>
    </div>
  );
}

/** Two columns that only leak together. */
export function MultiLeakArt() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-2">
        <Chip>col_a</Chip>
        <Chip>col_b</Chip>
      </div>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="shrink-0 text-foreground">
        <path d="M2 10C22 10 22 22 42 22M2 34C22 34 22 22 42 22" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.25" />
        <circle cx="42" cy="22" r="2" fill="currentColor" />
      </svg>
      <Chip strong>target</Chip>
    </div>
  );
}

// Fixed scatter so server and client render the same thing.
const DOTS = [
  [8, 50], [14, 44], [20, 46], [26, 38], [32, 40], [38, 31], [44, 34], [50, 26],
  [56, 27], [62, 20], [68, 22], [74, 14], [80, 16], [86, 9], [22, 52], [60, 32],
];

/** A numeric target that one column tracks too closely. */
export function NumericLeakArt() {
  return (
    <svg viewBox="0 0 96 60" className="h-16 w-28 text-foreground" fill="none">
      <path d="M4 4V56H92" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" />
      <path d="M6 54L90 6" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1" strokeDasharray="3 3" />
      {DOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="currentColor" fillOpacity="0.85" />
      ))}
    </svg>
  );
}

/** A big file read in chunks instead of all at once. */
export function StreamingArt() {
  return (
    <div className="flex w-full max-w-[220px] flex-col gap-2.5">
      <div className="flex gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="h-5 flex-1 rounded-[3px] border border-white/10 bg-white/[0.06]"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`${MONO} text-muted`}>chunk by chunk</span>
        <span className={`${MONO} text-foreground`}>&gt; 20 MB</span>
      </div>
    </div>
  );
}

/** Sniffing which separator and text encoding a file uses. */
export function DelimiterArt() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {[',', ';', '\\t', '|'].map((d, i) => (
          <Chip key={d} strong={i === 1}>
            {d}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Chip>UTF-8</Chip>
        <Chip>Latin-1</Chip>
      </div>
    </div>
  );
}

/** Same checks from a terminal. */
export function CliArt() {
  return (
    <div className={`${MONO} flex flex-col gap-2 text-muted`}>
      <span>
        <span className="text-foreground">$</span> analyze loans_train.csv \
      </span>
      <span className="pl-3">--target defaulted</span>
      <span className="flex items-center gap-1">
        <span className="text-foreground">$</span>
        <span className="inline-block h-3 w-1.5 animate-pulse-dot bg-foreground" />
      </span>
    </div>
  );
}
