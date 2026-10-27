import type { Report } from '@/lib/types';
import { SEVERITIES } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { GlassCard } from '@/components/ui/GlassCard';
import { EYEBROW, FOCUS, SEV_STYLE } from './format';

const GRADE_TEXT: Record<Report['score']['grade'], string> = {
  clean: 'text-ok',
  'minor issues': 'text-sev-low',
  'needs work': 'text-sev-medium',
  poor: 'text-sev-high',
};

const GRADE_DOT: Record<Report['score']['grade'], string> = {
  clean: 'bg-ok',
  'minor issues': 'bg-sev-low',
  'needs work': 'bg-sev-medium',
  poor: 'bg-sev-high',
};

export function ScoreSummary({ report, onReset }: { report: Report; onReset(): void }) {
  const { meta, score, counts } = report;

  return (
    <GlassCard as="section" aria-labelledby="report-heading" className="isolate animate-fade-up overflow-hidden p-5 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        <div className="light-leak absolute -top-32 -left-24 h-[420px] w-[420px]" />
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
        <ScoreGauge value={score.value} grade={score.grade} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={EYEBROW}>Report</p>
              <h2
                id="report-heading"
                tabIndex={-1}
                className="mt-1.5 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] outline-none sm:text-3xl"
              >
                {meta.filename}
              </h2>
            </div>
            <Button size="sm" onClick={onReset}>
              Analyze another file
            </Button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className={EYEBROW}>Size</dt>
              <dd className="mt-1 tabular-nums">
                {meta.rows.toLocaleString()} rows × {meta.columns.toLocaleString()} columns
              </dd>
            </div>
            {meta.testFilename && (
              <div className="min-w-0">
                <dt className={EYEBROW}>Test file</dt>
                <dd className="mt-1 [overflow-wrap:anywhere]">
                  {meta.testFilename}
                  {meta.testRows !== null && (
                    <span className="text-muted"> ({meta.testRows.toLocaleString()} rows)</span>
                  )}
                </dd>
              </div>
            )}
            <div className="min-w-0">
              <dt className={EYEBROW}>Target</dt>
              <dd className="mt-1 [overflow-wrap:anywhere]">
                {meta.target ? <code className="font-mono text-foreground">{meta.target}</code> : 'none chosen'}
              </dd>
            </div>
            <div>
              <dt className={EYEBROW}>Analysed in</dt>
              <dd className="mt-1 tabular-nums">{meta.ms.toLocaleString()} ms</dd>
            </div>
          </dl>

          {/* Shown verbatim: the score is a crude deduction and says so itself. */}
          <p className="mt-5 max-w-xl border-l border-white/15 pl-3 text-sm text-muted">{score.note}</p>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Findings per severity">
            {SEVERITIES.map((s) => {
              const style = SEV_STYLE[s];
              const n = counts[s] ?? 0;
              const body = (
                <>
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${n > 0 ? style.dot : 'bg-white/20'}`} />
                  <span className="font-semibold tabular-nums">{n}</span> {style.label}
                </>
              );
              const cls = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                n > 0 ? `${style.soft} ${style.text} ${style.ring}` : 'border-white/[0.06] bg-white/[0.02] text-muted'
              }`;
              return (
                <li key={s}>
                  {n > 0 ? (
                    <a
                      href={`#findings-${s}`}
                      className={`${cls} transition-transform duration-200 hover:-translate-y-px hover:underline active:scale-[0.97] ${FOCUS}`}
                    >
                      {body}
                    </a>
                  ) : (
                    <span className={cls}>{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}

const R = 84;
const C = 2 * Math.PI * R;
const TICKS = 60;

/**
 * Radial gauge: a chrome arc for the score inside a ring of fine ticks. The
 * number and grade are real text; the ring is decoration and hidden from
 * screen readers.
 */
function ScoreGauge({ value, grade }: { value: number; grade: Report['score']['grade'] }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative mx-auto h-52 w-52 shrink-0 sm:h-56 sm:w-56 md:mx-0">
      <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id="score-chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.4" stopColor="#bdbdbd" />
            <stop offset="0.7" stopColor="#6e6e6e" />
            <stop offset="1" stopColor="#e6e6e6" />
          </linearGradient>
          <radialGradient id="score-well" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="url(#score-well)" />
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * 2 * Math.PI;
          const major = i % 15 === 0;
          const r1 = major ? 92 : 94;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(a)}
              y1={100 + r1 * Math.sin(a)}
              x2={100 + 97 * Math.cos(a)}
              y2={100 + 97 * Math.sin(a)}
              stroke="#fff"
              strokeOpacity={major ? 0.4 : 0.12}
              strokeWidth={major ? 1.2 : 0.8}
            />
          );
        })}
        <circle cx="100" cy="100" r={R} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="10" />
        {clamped > 0 && (
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="url(#score-chrome)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * C} ${C}`}
          />
        )}
        {/* Inner bevel ring, for the machined-metal look. */}
        <circle cx="100" cy="100" r="72" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
      </svg>

      <ChromeSparkle size={30} rotate={-10} glow={false} className="absolute top-3 right-3" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="leading-none">
          <span className="chrome-text text-7xl font-semibold tracking-tighter tabular-nums">{value}</span>
          <span className="ml-0.5 text-base text-subtle">/100</span>
        </p>
        <p className={`mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold ${GRADE_TEXT[grade]}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${GRADE_DOT[grade]}`} />
          {grade}
        </p>
      </div>
    </div>
  );
}
