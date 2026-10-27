'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Magnetic } from '@/components/ui/Magnetic';
import { ArrowRight } from '@/components/ui/icons';
import { DropZone } from './DropZone';
import { Spinner } from './Spinner';
import { ExampleButtons } from './ExampleButtons';

export function UploadPanel(props: {
  file: File | null;
  test: File | null;
  columns: string[];
  target: string | null;
  busy: boolean;
  /** A chosen file is still being read and parsed in the browser. */
  parsingFile: boolean;
  parsingTest: boolean;
  error: string | null;
  // page.tsx's handlers are async (they parse the file); examples await them.
  onFile(f: File | null): void | Promise<void>;
  onTest(f: File | null): void | Promise<void>;
  onTarget(t: string | null): void;
  onAnalyze(): void;
}) {
  const { file, test, columns, target, busy, parsingFile, parsingTest, error, onFile, onTest, onTarget, onAnalyze } =
    props;
  const targetId = useId();
  const targetHintId = useId();
  const [loadingExample, setLoadingExample] = useState(false);
  const locked = busy || loadingExample;
  const parsing = parsingFile || parsingTest;
  const canAnalyze = Boolean(file) && !locked && !parsing;
  const status = busy
    ? 'Running checks on the server…'
    : loadingExample
      ? 'Loading example…'
      : parsing
        ? `Reading ${parsingFile ? file?.name ?? 'file' : test?.name ?? 'test file'}…`
        : !file
          ? 'Choose a dataset to analyze.'
          : '';

  return (
    <GlassCard as="section" solid aria-labelledby="upload-heading" className="animate-fade-up p-5 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="upload-heading" tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
            Choose a dataset
          </h2>
          <p className="mt-1 text-sm text-muted">A file, an optional test split, and the column you want to predict.</p>
        </div>
        <ExampleButtons
          disabled={busy}
          onLoading={setLoadingExample}
          onFile={onFile}
          onTest={onTest}
          onTarget={onTarget}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <DropZone
          step="01"
          label="Dataset (required)"
          hint="CSV with a header row. Parsed in your browser for the preview."
          file={file}
          disabled={locked}
          onFile={onFile}
        />
        <DropZone
          step="02"
          label="Test set (optional)"
          hint="Add your held-out split to check for rows that also appear in training (contamination)."
          file={test}
          disabled={locked}
          onFile={onTest}
        />
      </div>

      <div aria-hidden className="my-7 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div>
        <label htmlFor={targetId} className="mb-2.5 flex items-baseline gap-2.5 font-medium">
          <span aria-hidden className="font-mono text-xs text-subtle">
            03
          </span>
          Target column
        </label>
        <div className="relative w-full max-w-md">
          <select
            id={targetId}
            value={target ?? ''}
            onChange={(e) => onTarget(e.target.value || null)}
            disabled={!file || locked || columns.length === 0}
            aria-describedby={targetHintId}
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/[0.03] pr-10 pl-4 text-sm shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] transition-colors hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/10 [&>option]:bg-surface"
          >
            <option value="">No target</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <p id={targetHintId} className="mt-2 text-sm text-muted">
          {parsingFile
            ? 'Reading the file. Its columns will appear here once it has been parsed.'
            : file
            ? 'The column your model will predict. Choosing it enables the target-leakage and class-imbalance checks.'
            : 'Choose a file first. The target enables the target-leakage and class-imbalance checks.'}
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-sev-high/30 bg-sev-high-soft px-4 py-3 text-sm">
          <span className="font-semibold text-sev-high">Error: </span>
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Magnetic strength={0.2} max={6}>
          <Button
            size="lg"
            // aria-disabled rather than disabled while busy: a disabled button
            // drops keyboard focus to <body> the moment it is pressed.
            onClick={() => {
              if (canAnalyze) onAnalyze();
            }}
            disabled={!file}
            aria-disabled={!canAnalyze}
            aria-busy={busy}
            icon={busy ? <Spinner /> : <ArrowRight />}
            className="min-w-36"
          >
            {busy ? 'Analyzing…' : 'Analyze'}
          </Button>
        </Magnetic>
        {/* Announced to screen readers; the button label change alone may not be. */}
        <span aria-live="polite" className="text-sm text-muted">
          {status}
        </span>
      </div>
    </GlassCard>
  );
}
