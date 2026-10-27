'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';
import { ChromeSparkle } from './ChromeSparkle';
import { Container } from './Container';
import { ArrowRight, Close, Menu } from './icons';
import { NAV_LINKS } from './nav';

const LINK =
  'rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${className ?? ''}`}
    >
      <ChromeSparkle size={22} glow={false} />
      <span>Tabulens</span>
    </Link>
  );
}

/** Sticky glass nav. Below lg the links collapse into a menu button. */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    // The panel is gone at lg and up; close it so it isn't open when the window shrinks again.
    const mq = window.matchMedia('(min-width: 1024px)');
    const onWide = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50"
      // Close the menu once focus moves on into the page, so it never covers what is focused.
      // A null relatedTarget (e.g. Safari not focusing a tapped link) is ignored so taps still land.
      onBlur={(e) => {
        const next = e.relatedTarget;
        if (open && next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        Skip to content
      </a>
      <div className="border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Wordmark />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={LINK}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Wrapped: Button's own inline-flex would beat a `hidden` passed in className. */}
            <div className="hidden sm:block">
              <Button href="/analyze" size="sm" icon={<ArrowRight />}>
                Analyze a CSV
              </Button>
            </div>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
              className="btn-glass inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </Container>
      </div>

      {/* Overlays the page instead of pushing it down, so opening it never shifts layout. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-white/[0.06] bg-background/95 backdrop-blur-xl lg:hidden"
      >
        <Container as="nav" className="animate-fade-up py-4">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base text-foreground hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href="/analyze" icon={<ArrowRight />} className="mt-3 w-full" onClick={() => setOpen(false)}>
            Analyze a CSV
          </Button>
        </Container>
      </div>
    </header>
  );
}
