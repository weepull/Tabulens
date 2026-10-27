import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/components/ui/cn';

// Real figures only: the upload cap, the number of checks, the loans example's score.
// Later cards sit lower and in front, so each card keeps its text in its top half,
// which stays uncovered.
const STATS = [
  {
    value: '20 MB',
    label: 'per file, held in memory',
    place: 'left-0 top-0 -rotate-[8deg] group-hover/stack:-translate-x-2 group-hover/stack:-translate-y-1 group-hover/stack:-rotate-[12deg]',
  },
  {
    value: '9',
    label: 'checks, each shows its numbers',
    place: 'right-0 top-[92px] rotate-[6deg] group-hover/stack:translate-x-2 group-hover/stack:rotate-[10deg]',
  },
  {
    value: '0/100',
    label: 'loans example score: poor',
    place: 'left-[6%] top-[188px] -rotate-[3deg] group-hover/stack:translate-y-2 group-hover/stack:rotate-0',
  },
];

/**
 * Three tilted stat cards stacked like the reference's achievement cards; they
 * fan out a little when the stack is hovered.
 */
export function StatStack({ className }: { className?: string }) {
  return (
    <div className={cn('group/stack relative mx-auto h-[350px] w-full max-w-[330px]', className)}>
      {STATS.map((s) => (
        <div
          key={s.value}
          className={cn(
            'absolute w-[210px] transition-[translate,rotate] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            s.place,
          )}
        >
          <GlassCard
            solid
            tilt
            maxTilt={8}
            className="h-[150px] p-5 shadow-[0_30px_50px_-18px_rgb(0_0_0/0.95)]"
          >
            <p className="chrome-text text-4xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
            <span
              aria-hidden
              className="brushed specular absolute right-4 bottom-4 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            </span>
          </GlassCard>
        </div>
      ))}
    </div>
  );
}
