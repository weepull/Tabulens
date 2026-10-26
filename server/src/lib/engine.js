import { profileTable } from './infer.js';
import { makeFinding, SEVERITIES } from './finding.js';
import { scoreReport } from './score.js';
import { CHECKS } from './registry.js';

/**
 * Run every registered check over a parsed table.
 *
 * Deliberately framework-free: this takes plain data and returns plain data, so
 * it can be unit tested without starting a server, and reused from a CLI later
 * without touching Express.
 *
 * A check that throws is caught and reported as a finding rather than taking
 * down the whole request. One broken check should not cost the user the other
 * eight.
 */
export function analyze({ primary, test = null, target = null }) {
  const started = Date.now();

  if (target && !primary.columns.includes(target)) {
    const err = new Error(`Target column "${target}" is not in the file. Columns: ${primary.columns.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const profile = profileTable(primary.rows, primary.columns);

  const ctx = {
    rows: primary.rows,
    columns: primary.columns,
    profile,
    target,
    testRows: test ? test.rows : null,
    testColumns: test ? test.columns : null,
  };

  const findings = [];
  for (const check of CHECKS) {
    const needs = check.needs || {};
    if (needs.target && !target) continue;
    if (needs.test && !test) continue;
    try {
      findings.push(...check.run({ ...ctx, finding: makeFinding(check.id) }));
    } catch (cause) {
      findings.push({
        id: check.id,
        severity: 'info',
        title: `The "${check.label || check.id}" check failed to run`,
        detail: String(cause.message || cause),
        why: 'Reported rather than swallowed so a bug here is visible instead of looking like a clean result.',
        caveat: null,
        evidence: {},
        columns: [],
        examples: [],
        rowIndexes: [],
        totalRows: 0,
      });
    }
  }

  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));

  return {
    meta: {
      filename: primary.filename,
      rows: primary.rows.length,
      columns: primary.columns.length,
      target,
      testFilename: test ? test.filename : null,
      testRows: test ? test.rows.length : null,
      ms: Date.now() - started,
      parseIssues: primary.parseIssues,
    },
    columns: primary.columns.map((name) => {
      const c = profile.get(name);
      return {
        name,
        type: c.type,
        confidence: Number(c.confidence.toFixed(4)),
        missing: c.missing,
        missingRatio: Number(c.missingRatio.toFixed(4)),
        unique: c.unique,
        uniqueRatio: Number(c.uniqueRatio.toFixed(4)),
        sampleValues: [...c.counts.keys()].slice(0, 3),
      };
    }),
    findings,
    counts: SEVERITIES.reduce((acc, s) => {
      acc[s] = findings.filter((f) => f.severity === s).length;
      return acc;
    }, {}),
    score: scoreReport(findings),
  };
}
