import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ctxFor, table } from './helpers.js';
import * as duplicateRows from '../src/lib/checks/duplicateRows.js';
import * as contamination from '../src/lib/checks/contamination.js';
import * as missingValues from '../src/lib/checks/missingValues.js';
import * as constantColumns from '../src/lib/checks/constantColumns.js';
import * as idLikeColumns from '../src/lib/checks/idLikeColumns.js';
import * as mixedTypes from '../src/lib/checks/mixedTypes.js';
import * as dirtyCategories from '../src/lib/checks/dirtyCategories.js';
import * as classImbalance from '../src/lib/checks/classImbalance.js';

const run = (check, rows, opts) => check.run(ctxFor(check, rows, opts));

test('duplicate-rows: ignores case and whitespace, flags only the repeats', () => {
  const rows = [
    { a: 'Mumbai', b: '1' },
    { a: ' mumbai ', b: '1' },
    { a: 'Delhi', b: '2' },
  ];
  const [f] = run(duplicateRows, rows);
  assert.equal(f.id, 'duplicate-rows');
  assert.deepEqual(f.rowIndexes, [1]);
  assert.equal(run(duplicateRows, [{ a: '1' }, { a: '2' }]).length, 0);
});

test('contamination: finds test rows that also appear in training', () => {
  const rows = table(20, (i) => ({ x: String(i), y: String(i % 2) }));
  const testRows = [{ x: '3', y: '1' }, { x: '99', y: '0' }];
  const out = run(contamination, rows, { testRows });
  assert.equal(out.length, 1);
  assert.equal(out[0].severity, 'high');
  assert.equal(out[0].totalRows, 1);
  const clean = run(contamination, rows, { testRows: [{ x: '99', y: '0' }] });
  assert.deepEqual(clean.map((f) => f.severity), ['info']);
});

test('missing-values: severity scales with the missing ratio', () => {
  const rows = table(100, (i) => ({ few: i < 10 ? '' : '1', most: i < 70 ? 'NA' : '1', none: '1' }));
  const byCol = Object.fromEntries(run(missingValues, rows).map((f) => [f.columns[0], f]));
  assert.equal(byCol.none, undefined);
  assert.equal(byCol.most.severity, 'high');
  assert.ok(['low', 'medium'].includes(byCol.few.severity));
});

test('constant-columns: flags a single-valued column', () => {
  const rows = table(100, (i) => ({ country: 'IN', v: String(i % 7) }));
  const out = run(constantColumns, rows);
  assert.deepEqual(out.map((f) => f.columns[0]), ['country']);
});

test('id-like-columns: flags unique-per-row columns but not tiny files', () => {
  const rows = table(100, (i) => ({ id: `A${i}`, v: String(i % 3) }));
  assert.deepEqual(run(idLikeColumns, rows).map((f) => f.columns[0]), ['id']);
  assert.equal(run(idLikeColumns, rows.slice(0, 10)).length, 0);
});

test('mixed-types: flags a mostly-numeric column with stray text', () => {
  const rows = table(100, (i) => ({ n: i < 20 ? 'lots' : String(i), ok: String(i) }));
  assert.deepEqual(run(mixedTypes, rows).map((f) => f.columns[0]), ['n']);
});

test('mixed-types: totalRows counts every offender, not just the first 50', () => {
  const rows = table(1000, (i) => ({ n: i % 10 === 0 ? 'lots' : String(i) }));
  const [f] = run(mixedTypes, rows);
  assert.equal(f.totalRows, 100);
  assert.equal(f.rowIndexes.length, 100);
  const [g] = run(mixedTypes, table(2000, (i) => ({ n: i % 10 === 0 ? 'lots' : String(i) })));
  assert.equal(g.totalRows, 200);
  assert.equal(g.rowIndexes.length, 100);
});

test('dirty-categories: groups case/whitespace variants of one category', () => {
  const cities = ['Pune', 'pune', 'PUNE ', 'Delhi'];
  const rows = table(40, (i) => ({ city: cities[i % 4] }));
  const [f] = run(dirtyCategories, rows);
  assert.deepEqual(f.columns, ['city']);
  assert.equal(run(dirtyCategories, table(40, (i) => ({ city: i % 2 ? 'Pune' : 'Delhi' }))).length, 0);
});

test('class-imbalance: severity follows the minority share', () => {
  const at = (minority) => table(1000, (i) => ({ y: i < minority ? '1' : '0' }));
  const sev = (rows) => run(classImbalance, rows, { target: 'y' })[0].severity;
  assert.equal(sev(at(5)), 'high');
  assert.equal(sev(at(50)), 'medium');
  assert.equal(sev(at(500)), 'info');
});
