import Link from 'next/link';
import { Container } from './Container';
import { NAV_LINKS } from './nav';

const LINK =
  'rounded text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/[0.06]">
      <div aria-hidden className="light-leak pointer-events-none absolute -bottom-64 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />
      <Container className="relative pt-16">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="font-semibold tracking-tight">Tabulens</p>
            <p className="mt-3 text-sm text-muted">
              Catch the data defects that quietly break model training.
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Product</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/analyze" className={LINK}>
                  Analyze a CSV
                </Link>
              </li>
              {NAV_LINKS.slice(0, 2).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Learn</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.slice(2).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* Giant hollow wordmark, cropped by the bottom edge like an engraving. */}
      <p
        aria-hidden
        className="chrome-outline relative mt-16 -mb-[0.22em] text-center text-[19vw] leading-none font-semibold tracking-tighter whitespace-nowrap select-none"
      >
        Tabulens
      </p>

      <div className="relative border-t border-white/[0.06] bg-background">
        <Container className="py-4">
          <p className="text-center text-[11px] text-subtle">Built by Vipul Parmar</p>
        </Container>
      </div>
    </footer>
  );
}
