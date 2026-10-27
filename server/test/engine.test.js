import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/lib/engine.js';
import { SEVERITIES } from '../src/lib/finding.js';
import { readExample } from './helpers.js';

const train = readExample('loans_train.csv');
const testSet = readExample('loans_test.csv');

test('loans fixture: every planted defect is found, nothing else', () => {
  const r = analyze({ primary: train, test: testSet, target: 'defaulted' });
  const got = r.findings.map((f) => `${f.id}:${f.columns.join(',')}`).sort();
  assert.deepEqual(got, [
    'class-imbalance:defaulted',
    'constant-columns:country',
    'dirty-categories:city',
    'dirty-categories:employment_type',
    'duplicate-rows:',
    'id-like-columns:application_id',
    'missing-values:income',
    'target-leakage:risk_score',
    'train-test-contamination:',
  ]);
  const by = (id) => r.findings.find((f) => f.id === id);
  assert.equal(by('duplicate-rows').totalRows, 3);
  assert.equal(by('train-test-contamination').totalRows, 14);
  assert.equal(by('target-leakage').severity, 'high');
});

test('findings are sorted by severity and counts match', () => {
  const r = analyze({ primary: train, test: testSet, target: 'defaulted' });
  const ranks = r.findings.map((f) => SEVERITIES.indexOf(f.severity));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
  for (const s of SEVERITIES) {
    assert.equal(r.counts[s], r.findings.filter((f) => f.severity === s).length);
  }
});

test('checks that need a target or test file are skipped without them', () => {
  const ids = analyze({ primary: train }).findings.map((f) => f.id);
  for (const id of ['target-leakage', 'class-imbalance', 'train-test-contamination']) {
    assert.ok(!ids.includes(id), `${id} should not run`);
  }
});

test('clean fixture only reports the ID column and balance info', () => {
  const r = analyze({ primary: readExample('study_clean.csv'), target: 'passed' });
  assert.deepEqual(r.findings.map((f) => f.id).sort(), ['class-imbalance', 'id-like-columns']);
  assert.equal(r.score.grade, 'clean');
});

test('an unknown target column is a 400', () => {
  assert.throws(() => analyze({ primary: train, target: 'nope' }), (err) => err.status === 400);
});

test('report metadata and column profiles', () => {
  const r = analyze({ primary: train, test: testSet, target: 'defaulted' });
  assert.equal(r.meta.rows, 323);
  assert.equal(r.meta.target, 'defaulted');
  assert.equal(r.meta.testFilename, 'loans_test.csv');
  assert.equal(r.columns.length, train.columns.length);
  const income = r.columns.find((c) => c.name === 'income');
  assert.equal(income.type, 'number');
  assert.ok(income.missing > 0);
});
