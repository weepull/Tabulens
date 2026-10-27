import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMissing, toNumber, classify, normalize, profileColumn } from '../src/lib/infer.js';

test('isMissing recognises nullish spellings case-insensitively', () => {
  for (const v of [null, undefined, '', '  ', 'NA', 'n/a', 'NULL', 'NaN', '-', '?', 'Unknown']) {
    assert.equal(isMissing(v), true, `expected ${JSON.stringify(v)} to be missing`);
  }
  for (const v of ['0', 'no', 'x']) assert.equal(isMissing(v), false);
});

test('toNumber strips currency, percent and thousands separators', () => {
  assert.equal(toNumber('42'), 42);
  assert.equal(toNumber('-3.5'), -3.5);
  assert.equal(toNumber('1,234,567'), 1234567);
  assert.equal(toNumber('$1,200.50'), 1200.5);
  assert.equal(toNumber('15%'), 15);
  assert.equal(toNumber('1e3'), 1000);
  assert.equal(toNumber('12abc'), null);
  assert.equal(toNumber('abc'), null);
});

test('classify picks boolean before number and keeps dates narrow', () => {
  assert.equal(classify('yes'), 'boolean');
  assert.equal(classify('7'), 'number');
  assert.equal(classify('2024-01-31'), 'date');
  assert.equal(classify('31/01/2024'), 'date');
  assert.equal(classify('5'), 'number', 'a bare digit must not be read as a date');
  assert.equal(classify('hello'), 'string');
  assert.equal(classify('N/A'), 'missing');
});

test('normalize trims, lowercases and collapses whitespace', () => {
  assert.equal(normalize('  New   York '), 'new york');
  assert.equal(normalize('NA'), '');
});

test('profileColumn reports dominant type, confidence and missing rows', () => {
  const p = profileColumn('x', ['1', '2', '2', 'oops', '', 'NA']);
  assert.equal(p.type, 'number');
  assert.equal(p.confidence, 3 / 4);
  assert.equal(p.missing, 2);
  assert.deepEqual(p.missingRows, [4, 5]);
  assert.equal(p.unique, 3);
  assert.equal(p.topValue, '2');
  assert.equal(p.topCount, 2);
});

test('profileColumn of an all-missing column is empty', () => {
  const p = profileColumn('x', ['', 'NA']);
  assert.equal(p.type, 'empty');
  assert.equal(p.confidence, 0);
  assert.equal(p.uniqueRatio, 0);
});
