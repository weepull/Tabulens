import type { CSSProperties } from 'react';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { cn } from '@/components/ui/cn';

type Star = {
  size: number;
  rotate: number;
  parallax: number;
  /** Position inside the cluster box. */
  style: CSSProperties;
  /** Float timing, so the three never bob in step. */
  duration: string;
  delay: string;
};

// Big, medium, small. Smaller stars drift further with the cursor, which reads as depth.
// Laid out around the headline at lg/xl: big star clear of its right edge, the
// other two above and below it, so parallax drift never crosses the text.
const DESKTOP: Star[] = [
  { size: 210, rotate: 6, parallax: 14, style: { top: 30, right: 20 }, duration: '8s', delay: '-1s' },
  { size: 112, rotate: -12, parallax: 24, style: { top: 250, right: 270 }, duration: '6.5s', delay: '-3.2s' },
  { size: 54, rotate: 18, parallax: 30, style: { top: -34, right: 262 }, duration: '5.5s', delay: '-2s' },
];

const MOBILE: Star[] = [
  { size: 84, rotate: 6, parallax: 0, style: { top: 4, right: 8 }, duration: '8s', delay: '-1s' },
  { size: 46, rotate: -12, parallax: 0, style: { top: 0, right: 104 }, duration: '6.5s', delay: '-3.2s' },
  { size: 24, rotate: 18, parallax: 0, style: { top: 70, right: 96 }, duration: '5.5s', delay: '-2s' },
];

// Tiny pin-prick glints around the big stars.
const GLINTS: Array<{ style: CSSProperties; size: number; delay: string }> = [
  { style: { top: 10, right: 150 }, size: 5, delay: '0s' },
  { style: { top: 290, right: 120 }, size: 4, delay: '-1.4s' },
  { style: { top: 380, right: 230 }, size: 5, delay: '-2.6s' },
  { style: { top: 250, right: 0 }, size: 4, delay: '-0.7s' },
];

/** The hero's chrome star cluster. Decorative only. */
export function SparkleCluster({ variant, className }: { variant: 'desktop' | 'mobile'; className?: string }) {
  const stars = variant === 'desktop' ? DESKTOP : MOBILE;
  return (
    <div aria-hidden className={cn('pointer-events-none', variant === 'mobile' && 'relative', className)}>
      {/* Soft pool of light behind the big star, so the chrome has something to reflect. */}
      <div
        className={cn(
          'light-leak absolute',
          variant === 'desktop' ? 'top-[-20px] right-[-60px] h-[420px] w-[460px]' : 'top-[-30px] right-[-20px] h-[160px] w-[220px]',
        )}
      />
      {stars.map((s) => (
        <div key={s.size} className="absolute" style={s.style}>
          <div className="animate-float" style={{ animationDuration: s.duration, animationDelay: s.delay }}>
            <ChromeSparkle size={s.size} rotate={s.rotate} parallax={s.parallax} />
          </div>
        </div>
      ))}
      {variant === 'desktop' &&
        GLINTS.map((g, i) => (
          <span
            key={i}
            className="absolute animate-twinkle rounded-full bg-foreground shadow-[0_0_10px_2px_rgb(255_255_255/0.45)]"
            style={{ ...g.style, width: g.size, height: g.size, animationDelay: g.delay }}
          />
        ))}
    </div>
  );
}
