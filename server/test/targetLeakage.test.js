import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ctxFor, table } from './helpers.js';
import * as targetLeakage from '../src/lib/checks/targetLeakage.js';
import { bestNumericSplit, groupPurity } from '../src/lib/checks/targetLeakage.js';

test('bestNumericSplit finds a perfect threshold between classes', () => {
  const pairs = [1, 2, 3, 10, 11, 12].map((x) => ({ x, y: x < 5 ? 'a' : 'b' }));
  const r = bestNumericSplit(pairs, ['a', 'b']);
  assert.equal(r.accuracy, 1);
  assert.equal(r.threshold, 6.5);
});

test('bestNumericSplit never cuts between equal values', () => {
  const pairs = [{ x: 1, y: 'a' }, { x: 1, y: 'b' }, { x: 1, y: 'a' }];
  const r = bestNumericSplit(pairs, ['a', 'b']);
  assert.equal(r.threshold, null);
  assert.equal(r.accuracy, 2 / 3);
});

test('groupPurity measures how constant the target is within each value', () => {
  const pairs = [
    { x: 'p', y: 1 }, { x: 'p', y: 1 },
    { x: 'q', y: 0 }, { x: 'q', y: 1 },
  ];
  assert.deepEqual(groupPurity(pairs), { purity: 3 / 4, groups: 2 });
});

const run = (rows) => targetLeakage.run(ctxFor(targetLeakage, rows, { target: 'y' }));

test('flags a numeric column computed from the target', () => {
  // `score` is a noisy copy of y; `noise` is unrelated to it.
  const rows = table(400, (i) => {
    const y = i % 3 === 0 ? '1' : '0';
    return { score: String((y === '1' ? 0.8 : 0.2) + ((i * 7) % 10) / 100), noise: String((i * 37) % 101), y };
  });
  const out = run(rows);
  assert.deepEqual(out.map((f) => f.columns[0]), ['score']);
  assert.equal(out[0].severity, 'high');
});

test('flags a categorical column that encodes the target', () => {
  const rows = table(400, (i) => {
    const y = i % 2 ? 'yes' : 'no';
    return { status: y === 'yes' ? 'closed' : 'open', region: ['n', 's', 'e', 'w'][(i >> 1) % 4], y };
  });
  assert.deepEqual(run(rows).map((f) => f.columns[0]), ['status']);
});

test('small files get a caveat instead of full confidence', () => {
  const rows = table(60, (i) => ({ score: String(i), y: i < 30 ? '0' : '1' }));
  const [f] = run(rows);
  assert.ok(f, 'expected a finding');
  assert.ok(f.caveat, 'expected a small-sample caveat');
});
