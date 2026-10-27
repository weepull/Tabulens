'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useId } from 'react';
import { canHover, prefersReducedMotion } from './useReducedMotionSafe';
import { cn } from './cn';

// A 4-point star in a 100x100 box, split into 8 facets (two per arm) so each
// can catch light differently, the way a bevelled chrome ornament does.
const OUTLINE = 'M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z';
const FACETS: Array<[d: string, shade: 'hi' | 'mid' | 'lo' | 'dark']> = [
  ['M50 50L36.25 36.25C44 28.5 48 17 50 0Z', 'hi'], // top arm, left
  ['M50 50L50 0C52 17 56 28.5 63.75 36.25Z', 'mid'], // top arm, right
  ['M50 50L63.75 36.25C71.5 44 83 48 100 50Z', 'hi'], // right arm, top
  ['M50 50L100 50C83 52 71.5 56 63.75 63.75Z', 'lo'], // right arm, bottom
  ['M50 50L63.75 63.75C56 71.5 52 83 50 100Z', 'dark'], // bottom arm, right
  ['M50 50L50 100C48 83 44 71.5 36.25 63.75Z', 'lo'], // bottom arm, left
  ['M50 50L36.25 63.75C28.5 56 17 52 0 50Z', 'mid'], // left arm, bottom
  ['M50 50L0 50C17 48 28.5 44 36.25 36.25Z', 'hi'], // left arm, top
];

// Light comes from the top left. Each shade is a diagonal gradient with a
// reflective band in it; the bands land at different places per facet group.
const SHADES = {
  hi: [['0', '#ffffff'], ['0.45', '#d9d9d9'], ['0.62', '#8c8c8c'], ['1', '#f2f2f2']],
  mid: [['0', '#bdbdbd'], ['0.4', '#f7f7f7'], ['0.7', '#6e6e6e'], ['1', '#c9c9c9']],
  lo: [['0', '#7a7a7a'], ['0.5', '#3d3d3d'], ['0.75', '#a6a6a6'], ['1', '#4d4d4d']],
  dark: [['0', '#4a4a4a'], ['0.55', '#1c1c1c'], ['0.8', '#6b6b6b'], ['1', '#262626']],
} as const;

/**
 * Glossy chrome 4-point star. Decorative: always aria-hidden.
 * `parallax` makes it drift up to that many px towards the cursor (mouse only,
 * off with reduced motion); `float` adds a slow bob.
 */
export function ChromeSparkle({
  size = 64,
  rotate = 0,
  parallax = 0,
  float = false,
  glow = true,
  className,
}: {
  size?: number;
  rotate?: number;
  parallax?: number;
  float?: boolean;
  glow?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `cs-${uid}-${name}`;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 18 });
  const sy = useSpring(y, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (!parallax) return;
    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || !canHover() || prefersReducedMotion()) return;
      x.set(((e.clientX / window.innerWidth) * 2 - 1) * parallax);
      y.set(((e.clientY / window.innerHeight) * 2 - 1) * parallax);
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [parallax, x, y]);

  return (
    <motion.div
      aria-hidden
      className={cn('pointer-events-none select-none', className)}
      style={{ width: size, height: size, x: sx, y: sy }}
    >
      <div className={cn('h-full w-full', float && 'animate-float')}>
        <svg
          viewBox="-4 -4 108 108"
          width={size}
          height={size}
          style={{
            transform: `rotate(${rotate}deg)`,
            filter: glow
              ? 'drop-shadow(0 12px 18px rgb(0 0 0 / 0.7)) drop-shadow(0 0 14px rgb(255 255 255 / 0.12))'
              : 'drop-shadow(0 8px 12px rgb(0 0 0 / 0.6))',
            overflow: 'visible',
          }}
        >
          <defs>
            {Object.entries(SHADES).map(([name, stops]) => (
              <linearGradient key={name} id={id(name)} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                {stops.map(([offset, color]) => (
                  <stop key={offset} offset={offset} stopColor={color} />
                ))}
              </linearGradient>
            ))}
            <linearGradient id={id('edge')} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id={id('spec')} cx="38" cy="30" r="22" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('core')} cx="50" cy="50" r="9" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <clipPath id={id('clip')}>
              <path d={OUTLINE} />
            </clipPath>
          </defs>

          {FACETS.map(([d, shade]) => (
            <path key={d} d={d} fill={`url(#${id(shade)})`} />
          ))}
          <g clipPath={`url(#${id('clip')})`}>
            {/* Specular bloom on the upper-left and a hot spot at the centre. */}
            <ellipse cx="38" cy="30" rx="22" ry="14" fill={`url(#${id('spec')})`} opacity="0.55" />
            <circle cx="50" cy="50" r="9" fill={`url(#${id('core')})`} opacity="0.9" />
            {/* Fine seams between facets read as bevel ridges. */}
            <path d="M50 0V100M0 50H100" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.5" />
          </g>
          <path d={OUTLINE} fill="none" stroke={`url(#${id('edge')})`} strokeWidth="0.9" />
        </svg>
      </div>
    </motion.div>
  );
}
