'use client';

import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import { Spinner } from './Spinner';

interface Example {
  label: string;
  file: string;
  test: string | null;
  target: string;
  /** Dot before the label: tinted for the file with planted defects, pale green for the clean one. */
  dot: string;
}

// Served from public/examples/ (committed; refreshed by scripts/sync-examples.mjs).
const EXAMPLES: Example[] = [
  { label: 'Loans (planted defects)', file: 'loans_train.csv', test: 'loans_test.csv', target: 'defaulted', dot: 'bg-sev-high' },
  { label: 'Student study (clean)', file: 'study_clean.csv', test: null, target: 'passed', dot: 'bg-ok' },
];

async function fetchFile(name: string): Promise<File> {
  const res = await fetch(`/examples/${name}`);
  if (!res.ok) throw new Error(`Could not load example ${name} (status ${res.status}).`);
  return new File([await res.blob()], name, { type: 'text/csv' });
}

export function ExampleButtons(props: {
  disabled: boolean;
  onLoading(loading: boolean): void;
  onFile(f: File | null): void | Promise<void>;
  onTest(f: File | null): void | Promise<void>;
  onTarget(t: string | null): void;
}) {
  const { disabled, onLoading, onFile, onTest, onTarget } = props;
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(ex: Example) {
    if (disabled || loading !== null) return;
    setLoading(ex.label);
    onLoading(true);
    setError(null);
    try {
      const [file, test] = await Promise.all([fetchFile(ex.file), ex.test ? fetchFile(ex.test) : null]);
      // onFile resets the target and parses the file, so it must finish
      // before the target is set or the target would be wiped.
      await onFile(file);
      await onTest(test);
      onTarget(ex.target);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
      onLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div role="group" aria-label="Load an example dataset" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => load(ex)}
            // aria-disabled, not disabled: disabling the button the user just
            // pressed would drop keyboard focus to <body>. load() ignores the click.
            aria-disabled={disabled || loading !== null}
            className={cn(
              'btn-glass group relative isolate inline-flex h-9 items-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium whitespace-nowrap',
              'transition-[transform,border-color] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:translate-y-0',
            )}
          >
            <span aria-hidden className="btn-sheen opacity-40" />
            {loading === ex.label ? <Spinner className="relative" /> : <span aria-hidden className={`relative h-1.5 w-1.5 rounded-full ${ex.dot}`} />}
            <span className="relative">{loading === ex.label ? 'Loading…' : ex.label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-sev-high">
          {error}
        </p>
      )}
    </div>
  );
}
