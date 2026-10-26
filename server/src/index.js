import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeRouter, MAX_BYTES } from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * CORS: the frontend is a separate origin (localhost:3000 in dev, a Vercel
 * domain in production), so the browser will not let it call this API unless we
 * say so explicitly. Allowlist from an env var rather than using "*", because
 * "*" is a habit worth not forming.
 */
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin(origin, cb) {
    // No origin header: curl, server-to-server, health checks. Allow those.
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`Origin not allowed: ${origin}`));
  },
}));

app.use(express.json({ limit: '1mb' }));

// Render and Cloud Run both poll an endpoint to decide if the process is alive.
app.get('/health', (_req, res) => res.json({ ok: true, maxBytes: MAX_BYTES }));

app.use('/api', analyzeRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/**
 * Error handler. Express identifies this as one by the four arguments, so
 * `next` has to stay even though it is unused.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? `File is too large. The limit is ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`
      : err.message;
    return res.status(413).json({ error: msg, code: err.code });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`csv-smell-detector api on http://localhost:${PORT}`);
  console.log(`allowed origins: ${allowed.join(', ')}`);
});
