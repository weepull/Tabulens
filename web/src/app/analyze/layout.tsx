import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analyze a CSV',
  description: 'Upload a CSV (and optionally a test set) and get every defect that would quietly break training.',
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
