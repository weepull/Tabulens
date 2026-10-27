import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFinding, pct } from '../src/lib/finding.js';
import { scoreReport } from '../src/lib/score.js';
import { T } from '../src/lib/thresholds.js';

const finding = makeFinding('test-check');
const base = { title: 't', detail: 'd', why: 'w' };

test('a finding must explain itself', () => {
  assert.throws(() => finding({ title: 't', detail: 'd' }), /why are required/);
  assert.throws(() => finding({ ...base, severity: 'critical' }), /bad severity/);
});

test('rowIndexes and examples are capped but totalRows keeps the real count', () => {
  const rowIndexes = Array.from({ length: 250 }, (_, i) => i);
  const f = finding({ ...base, rowIndexes, examples: Array(20).fill('x') });
  assert.equal(f.id, 'test-check');
  assert.equal(f.rowIndexes.length, T.limits.rowIndexesPerFinding);
  assert.equal(f.examples.length, T.limits.examplesPerFinding);
  assert.equal(f.totalRows, 250);
});

test('pct shows extra precision for tiny ratios', () => {
  assert.equal(pct(0.5), '50.0%');
  assert.equal(pct(0.0012), '0.12%');
  assert.equal(pct(0), '0.0%');
});

test('score deducts by severity, clamps at 0 and grades', () => {
  assert.deepEqual(
    [scoreReport([]).value, scoreReport([]).grade],
    [100, 'clean'],
  );
  const s = scoreReport([{ severity: 'high' }, { severity: 'medium' }, { severity: 'info' }]);
  assert.equal(s.value, 100 - T.score.high - T.score.medium);
  assert.equal(s.grade, 'minor issues');
  assert.equal(scoreReport(Array(10).fill({ severity: 'high' })).value, 0);
});
