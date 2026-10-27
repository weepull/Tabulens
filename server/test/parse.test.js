import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/lib/parse.js';

const csv = (s) => Buffer.from(s, 'utf8');

test('parses headers, strips BOM and trims header names', () => {
  const r = parseCsv(csv('﻿ a ,b\n1,2\n3,4\n'), { filename: 'x.csv' });
  assert.deepEqual(r.columns, ['a', 'b']);
  assert.equal(r.rows.length, 2);
  assert.equal(r.filename, 'x.csv');
});

test('keeps values as strings so inference stays in control', () => {
  const r = parseCsv(csv('id,v\n007,NA\n'));
  assert.equal(r.rows[0].id, '007');
  assert.equal(r.rows[0].v, 'NA');
});

test('skips blank lines', () => {
  const r = parseCsv(csv('a\n1\n\n   \n2\n'));
  assert.equal(r.rows.length, 2);
});

test('reports ragged rows instead of hiding them', () => {
  const r = parseCsv(csv('a,b\n1,2\n3\n4,5,6\n'));
  assert.equal(r.parseIssues.raggedCount, 2);
  assert.deepEqual(r.parseIssues.ragged.map((e) => e.code).sort(), ['TooFewFields', 'TooManyFields']);
});

test('an empty file is a 400', () => {
  assert.throws(() => parseCsv(csv('')), (err) => err.status === 400);
});

test('reports duplicate headers that papaparse renamed', () => {
  const r = parseCsv(csv('a,a,y,a\n1,2,3,4\n'));
  assert.deepEqual(r.columns, ['a', 'a_1', 'y', 'a_2']);
  assert.deepEqual(r.parseIssues.dupeHeaders, ['a']);
  assert.deepEqual(r.parseIssues.renamedHeaders, { a_1: 'a', a_2: 'a' });
  assert.deepEqual(parseCsv(csv('a,b\n1,2\n')).parseIssues.dupeHeaders, []);
});
