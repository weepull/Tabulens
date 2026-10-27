'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { canHover, prefersReducedMotion } from '@/components/ui/useReducedMotionSafe';

const R = 320; // radius of the lit area, px
const SPRING = { stiffness: 140, damping: 22, mass: 0.6 };

/**
 * Cursor spotlight for the hero: a soft glow plus a brighter copy of the grid
 * that only shows inside the glow. Both move by transform alone; the inner
 * grid is counter-translated so its lines stay locked to the page grid.
 * Mouse only; nothing renders visibly for touch or reduced motion.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const so = useSpring(opacity, { stiffness: 120, damping: 24 });
  const ix = useTransform(sx, (v) => -v);
  const iy = useTransform(sy, (v) => -v);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    let first = true;
    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || !canHover() || prefersReducedMotion() || !host) return;
      const r = host.getBoundingClientRect();
      if (gridRef.current) {
        gridRef.current.style.width = `${r.width}px`;
        gridRef.current.style.height = `${r.height}px`;
      }
      const nx = e.clientX - r.left - R;
      const ny = e.clientY - r.top - R;
      // Jump straight to the first position so the light doesn't slide in from the corner.
      if (first) {
        sx.jump(nx);
        sy.jump(ny);
        first = false;
      }
      x.set(nx);
      y.set(ny);
      opacity.set(1);
    }
    function onLeave() {
      opacity.set(0);
    }
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [x, y, opacity, sx, sy]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 rounded-full"
        style={{
          x: sx,
          y: sy,
          opacity: so,
          width: R * 2,
          height: R * 2,
          background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.075), rgb(255 255 255 / 0.02) 60%, transparent)',
          maskImage: 'radial-gradient(closest-side, black 20%, transparent)',
          WebkitMaskImage: 'radial-gradient(closest-side, black 20%, transparent)',
        }}
      >
        <motion.div
          ref={gridRef}
          className="absolute top-0 left-0"
          style={{
            x: ix,
            y: iy,
            // Same 64px grid as .bg-grid (centred), just brighter.
            backgroundImage:
              'linear-gradient(to right, rgb(255 255 255 / 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.14) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            backgroundPosition: 'center top',
          }}
        />
      </motion.div>
    </div>
  );
}
