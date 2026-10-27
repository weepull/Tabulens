/**
 * Landing sections, in page order. Absolute (/#id) so they also work from /analyze.
 * Rendered as plain <a>, not next/link: the browser scrolls to a fragment by itself,
 * so these keep working even when client JS is stale or still loading.
 */
export const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#checks', label: 'Checks' },
  { href: '/#how', label: 'How it works' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#next', label: 'Coming next' },
] as const;
