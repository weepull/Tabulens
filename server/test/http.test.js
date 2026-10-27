import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { MAX_BYTES } from '../src/routes/analyze.js';

const ORIGIN = 'http://allowed.test';
let server;
let base;

before(async () => {
  server = createApp({ allowedOrigins: ORIGIN }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((r) => server.close(r)));

const example = (name) =>
  readFileSync(fileURLToPath(new URL(`../../examples/${name}`, import.meta.url)));

function form(fields) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value && value.buffer) fd.append(key, new Blob([value.buffer], { type: value.type ?? 'text/csv' }), value.name);
    else fd.append(key, value);
  }
  return fd;
}

const analyze = (fields, headers = {}) =>
  fetch(`${base}/api/analyze`, { method: 'POST', body: form(fields), headers });

test('GET /health reports the upload cap', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, maxBytes: MAX_BYTES });
});

test('unknown routes are a JSON 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

test('POST /api/analyze with train, test and target returns a full report', async () => {
  const res = await analyze({
    file: { buffer: example('loans_train.csv'), name: 'loans_train.csv' },
    test: { buffer: example('loans_test.csv'), name: 'loans_test.csv' },
    target: ' defaulted ',
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.meta.filename, 'loans_train.csv');
  assert.equal(body.meta.target, 'defaulted', 'target is trimmed');
  assert.equal(body.findings.length, 9);
  assert.ok(Number.isInteger(body.score.value));
});

test('missing file is a 400', async () => {
  const res = await analyze({ target: 'x' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /No file uploaded/);
});

test('non-CSV upload is a 415', async () => {
  const res = await analyze({ file: { buffer: Buffer.from('\x89PNG'), name: 'pic.png', type: 'image/png' } });
  assert.equal(res.status, 415);
});

test('unknown target column is a 400 that lists the real columns', async () => {
  const res = await analyze({ file: { buffer: example('study_clean.csv'), name: 's.csv' }, target: 'nope' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /student_id/);
});

test('header-only garbage is a 400, not a crash', async () => {
  const res = await analyze({ file: { buffer: Buffer.from(''), name: 'empty.csv' } });
  assert.equal(res.status, 400);
});

test('files over the cap are a 413', async () => {
  const res = await analyze({ file: { buffer: Buffer.alloc(MAX_BYTES + 1, 'a'), name: 'big.csv' } });
  assert.equal(res.status, 413);
  assert.equal((await res.json()).code, 'LIMIT_FILE_SIZE');
});

test('CORS: allowed origin gets the header, others get a 403', async () => {
  const ok = await fetch(`${base}/health`, { headers: { Origin: ORIGIN } });
  assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);

  const bad = await fetch(`${base}/health`, { headers: { Origin: 'http://evil.test' } });
  assert.equal(bad.status, 403);
});
