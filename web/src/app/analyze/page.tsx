'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_BYTES, analyze } from '@/lib/api';
import { parseCsvFile } from '@/lib/csv';
import type { ParsedCsv, Report as ReportData } from '@/lib/types';
import { UploadPanel } from '@/components/upload/UploadPanel';
import { formatBytes } from '@/components/upload/formatBytes';
import { PreviewTable } from '@/components/preview/PreviewTable';
import { Report } from '@/components/report/Report';
import { ChromeSparkle } from '@/components/ui/ChromeSparkle';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { Container } from '@/components/ui/Container';
import { Check } from '@/components/ui/icons';

// Each is true of the server: multer memoryStorage and MAX_BYTES in server/src/routes/analyze.js.
const FACTS = [`Up to ${formatBytes(MAX_BYTES)}`, 'Processed in memory, never stored'];

/**
 * One page, three states: choose files → preview → report.
 *
 * Files are parsed in the browser as soon as they are chosen. That parse feeds
 * the preview, the target picker, and later the row drill-down, which looks up
 * the report's `rowIndexes` in it. The server never sends rows back.
 */
export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [test, setTest] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [parsedTest, setParsedTest] = useState<ParsedCsv | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parsingTest, setParsingTest] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One counter per slot. Every choice (including Remove) bumps it, and a parse
  // only lands if its number is still current, so a slow parse of an earlier
  // file can never overwrite the data of the file chosen after it.
  const fileSeq = useRef(0);
  const testSeq = useRef(0);

  async function chooseFile(f: File | null) {
    const seq = ++fileSeq.current;
    setFile(f);
    setParsed(null);
    setReport(null);
    setError(null);
    setTarget(null);
    if (!f) {
      setParsingFile(false);
      return;
    }
    setParsingFile(true);
    try {
      const result = await parseCsvFile(f);
      if (seq === fileSeq.current) setParsed(result);
    } catch {
      if (seq !== fileSeq.current) return;
      setFile(null);
      setError(`Could not read ${f.name}. It may have been moved or deleted. Choose it again.`);
    } finally {
      if (seq === fileSeq.current) setParsingFile(false);
    }
  }

  async function chooseTest(f: File | null) {
    const seq = ++testSeq.current;
    setTest(f);
    setParsedTest(null);
    setReport(null);
    setError(null);
    if (!f) {
      setParsingTest(false);
      return;
    }
    setParsingTest(true);
    try {
      const result = await parseCsvFile(f);
      if (seq === testSeq.current) setParsedTest(result);
    } catch {
      if (seq !== testSeq.current) return;
      setTest(null);
      setError(`Could not read ${f.name}. It may have been moved or deleted. Choose it again.`);
    } finally {
      if (seq === testSeq.current) setParsingTest(false);
    }
  }

  async function run() {
    if (!file || parsingFile || parsingTest) return;
    setBusy(true);
    setError(null);
    try {
      setReport(await analyze({ file, test, target }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const showReport = Boolean(report && parsed);

  // Swapping between the upload panel and the report unmounts whatever had
  // focus. Move it to the heading of the view that replaced it.
  const shownBefore = useRef(showReport);
  useEffect(() => {
    if (shownBefore.current === showReport) return;
    shownBefore.current = showReport;
    document.getElementById(showReport ? 'report-heading' : 'upload-heading')?.focus();
  }, [showReport]);

  // A file dropped outside a drop zone would otherwise open in the tab and
  // throw away the page. Drop zones handle their own drops first.
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
    }
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  function reset() {
    fileSeq.current++;
    testSeq.current++;
    setParsingFile(false);
    setParsingTest(false);
    setFile(null);
    setTest(null);
    setParsed(null);
    setParsedTest(null);
    setTarget(null);
    setReport(null);
    setError(null);
  }

  return (
    <main id="main" className="relative isolate pt-10 pb-20 sm:pt-16 sm:pb-28">
      {/* Grid, glow and vignette behind the header only; the report below stays on a flat, readable background. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[640px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="bg-grid absolute inset-0" />
        <div className="light-leak absolute -top-56 left-1/2 h-[560px] w-[900px] -translate-x-1/2" />
        <div className="light-leak absolute top-24 -right-40 h-[360px] w-[460px] opacity-60" />
        <div className="vignette absolute inset-0" />
      </div>

      <Container className="relative">
        <ChromeSparkle size={72} rotate={12} parallax={10} float className="absolute top-0 right-6 hidden sm:block lg:right-10" />
        <ChromeSparkle size={28} rotate={-18} parallax={22} className="absolute top-24 right-28 hidden opacity-80 md:block lg:right-36" />

        <header className="mb-10 sm:mb-14">
          <SectionBadge>Analyzer</SectionBadge>
          <h1 className="chrome-text mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Analyze a CSV</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Find leakage, contamination and dirty data before you train.
          </p>
          <ul aria-label="How your file is handled" className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
            {FACTS.map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                <Check width={12} height={12} className="text-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </header>

        {/* Outside the conditional so it survives the swap and is announced. */}
        <p aria-live="polite" className="sr-only">
          {report && showReport
            ? `Analysis complete: ${report.findings.length} ${report.findings.length === 1 ? 'finding' : 'findings'}.`
            : ''}
        </p>

        {report && parsed ? (
          <Report report={report} primary={parsed} test={parsedTest} onReset={reset} />
        ) : (
          <div className="space-y-8">
            <UploadPanel
              file={file}
              test={test}
              columns={parsed?.columns ?? []}
              target={target}
              busy={busy}
              parsingFile={parsingFile}
              parsingTest={parsingTest}
              error={error}
              onFile={chooseFile}
              onTest={chooseTest}
              onTarget={setTarget}
              onAnalyze={run}
            />
            {parsed && <PreviewTable data={parsed} target={target} />}
          </div>
        )}
      </Container>
    </main>
  );
}
