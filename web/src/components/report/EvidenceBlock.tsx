import { num, pct } from './format';

// Keys whose 0..1 values are proportions; those also get a percentage.
const PROPORTION = /ratio|share|accuracy|purity|baseline|lift|confidence/i;

function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function Value({ name, value }: { name: string; value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted">none</span>;
  if (typeof value === 'number') {
    const showPct = PROPORTION.test(name) && value >= 0 && value <= 1;
    return (
      <span className="font-mono">
        {num(value)}
        {showPct && <span className="text-muted"> ({pct(value)})</span>}
      </span>
    );
  }
  if (typeof value === 'boolean') return <span>{value ? 'yes' : 'no'}</span>;
  if (typeof value === 'string') return <span className="font-mono break-all">{value === '' ? '(empty)' : value}</span>;
  return <Json value={value} />;
}

export function Json({ value }: { value: unknown }) {
  return (
    <code className="block max-h-48 overflow-auto rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-foreground">
      {JSON.stringify(value)}
    </code>
  );
}

/** The raw numbers behind a finding, as a readable key/value list. */
export function EvidenceBlock({ evidence }: { evidence: Record<string, unknown> }) {
  const entries = Object.entries(evidence);
  if (entries.length === 0) return <p className="text-sm text-muted">No numeric evidence for this finding.</p>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[minmax(8rem,max-content)_1fr] sm:gap-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted" title={key}>
            {humanize(key)}
          </dt>
          <dd className="min-w-0">
            <Value name={key} value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
