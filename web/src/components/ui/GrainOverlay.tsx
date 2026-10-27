/** Fixed film-grain layer over the whole page. Static, so it costs one composite layer. */
export function GrainOverlay() {
  return <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[100]" />;
}
