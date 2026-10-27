'use client';

import { useId, useRef, useState, type DragEvent } from 'react';
import { MAX_BYTES } from '@/lib/api';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { cn } from '@/components/ui/cn';
import { Check } from '@/components/ui/icons';
import { formatBytes } from './formatBytes';

const ACCEPT = '.csv,.tsv,.txt';
const ACCEPT_RE = /\.(csv|tsv|txt)$/i;

/**
 * One file slot: drag-and-drop or click to browse, then filename, size and a
 * remove button once chosen. The size cap and extension are checked here so
 * an obviously bad file never reaches the parser or the server.
 */
export function DropZone(props: {
  label: string;
  hint: string;
  /** Optional "01"-style step number shown before the label. */
  step?: string;
  file: File | null;
  disabled?: boolean;
  onFile(f: File | null): void | Promise<void>;
}) {
  const { label, hint, step, file, disabled, onFile } = props;
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(f: File | undefined) {
    if (!f) return;
    // The accept attribute only filters the browse dialog; drops bypass it.
    if (!ACCEPT_RE.test(f.name)) {
      setError(`"${f.name}" is not a CSV. Choose a .csv, .tsv or .txt file.`);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`"${f.name}" is ${formatBytes(f.size)}. The limit is ${formatBytes(MAX_BYTES)}.`);
      return;
    }
    setError(null);
    // Choosing a file swaps the focused input for the file card, which would
    // drop keyboard focus to <body>. Hand it to the Remove button instead.
    const hadFocus = document.activeElement === inputRef.current;
    const done = onFile(f);
    if (!hadFocus) return;
    requestAnimationFrame(() => removeRef.current?.focus());
    // If the file could not be read, the slot empties again; refocus the input.
    const refocus = () =>
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) (removeRef.current ?? inputRef.current)?.focus();
      });
    Promise.resolve(done).then(refocus, refocus);
  }

  // The handlers sit on the whole slot, empty or filled, and stay attached while
  // disabled. Without preventDefault the browser opens the dropped file in the
  // tab and the page (and any report) is lost.
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) accept(e.dataTransfer.files[0]);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (disabled) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    // dragleave also fires when moving between children of the slot.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  }

  function remove() {
    setError(null);
    onFile(null);
    // Return focus somewhere sensible now that the remove button is gone.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const active = dragging && !disabled;

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="flex min-w-0 flex-col"
    >
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="flex items-baseline gap-2.5 font-medium">
          {step && (
            <span aria-hidden className="font-mono text-xs text-subtle">
              {step}
            </span>
          )}
          {label}
        </span>
        <span className="text-xs text-subtle">Max {formatBytes(MAX_BYTES)}</span>
      </div>

      {file ? (
        <div
          className={cn(
            'glass-solid flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-[border-color,box-shadow] duration-300',
            active && 'border-white/30 ring-4 ring-white/[0.04]',
          )}
        >
          <span aria-hidden className="brushed specular grid h-11 w-11 shrink-0 place-items-center rounded-xl">
            <FileIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              {active ? (
                'Drop to replace this file'
              ) : (
                <>
                  <Check width={14} height={14} className="text-ok" />
                  {formatBytes(file.size)}
                </>
              )}
            </p>
          </div>
          <button
            ref={removeRef}
            type="button"
            onClick={remove}
            disabled={disabled}
            aria-label={`Remove ${file.name}`}
            className="btn-glass inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            'group/drop relative isolate flex min-h-48 flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-white/[0.02] px-5 py-8 text-center',
            'transition-[transform,background-color] duration-300 ease-out',
            // The input is visually hidden, so its focus ring is drawn on the label.
            'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/[0.035]',
            active && 'scale-[1.012] bg-white/[0.05]',
          )}
        >
          <DashedBorder active={active} hoverable={!disabled} />
          {/* Glow behind the icon: fades in on hover and while a file is dragged over. */}
          <span
            aria-hidden
            className={cn(
              'light-leak pointer-events-none absolute top-1/2 left-1/2 -z-10 h-72 w-[30rem] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500',
              active ? 'opacity-100' : disabled ? 'opacity-0' : 'opacity-0 group-hover/drop:opacity-60',
            )}
          />
          <span
            aria-hidden
            className={cn(
              'glass relative mb-3 grid h-14 w-14 place-items-center rounded-full transition-transform duration-300 ease-out',
              active ? '-translate-y-1 scale-110' : !disabled && 'group-hover/drop:-translate-y-0.5',
            )}
          >
            <UploadIcon />
            <ChromeSparkle size={24} rotate={14} glow={false} float={active} className="absolute -top-2.5 -right-2.5" />
          </span>
          <span className="font-medium">
            {active ? 'Drop to upload' : (
              <>
                Drag a file here or{' '}
                <span className="text-foreground underline decoration-white/40 underline-offset-4 group-hover/drop:decoration-white">
                  browse
                </span>
              </>
            )}
          </span>
          <span id={hintId} className="max-w-xs text-sm text-muted">
            {hint}
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            disabled={disabled}
            aria-describedby={error && !file ? `${hintId} ${errorId}` : hintId}
            className="sr-only"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              // Clear so choosing the same file again still fires onChange.
              e.target.value = '';
            }}
          />
        </label>
      )}

      {/* Shown with or without a file: a bad drop onto a filled slot keeps the old file. */}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm break-words text-sev-high">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Dashed chrome outline. Drawn in SVG because CSS dashed borders cannot take a
 * gradient. The stroke is 2px and centred on the edge, and the label clips the
 * outer half, which leaves a 1px line that follows the rounded corners.
 */
function DashedBorder({ active, hoverable }: { active: boolean; hoverable: boolean }) {
  const id = `dz-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="16" fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeDasharray="7 6" />
      <rect
        width="100%"
        height="100%"
        rx="16"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeDasharray="7 6"
        className={cn(
          'transition-opacity duration-300',
          active ? 'opacity-100' : hoverable ? 'opacity-0 group-hover/drop:opacity-50' : 'opacity-0',
        )}
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
