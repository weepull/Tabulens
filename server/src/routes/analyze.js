import { Router } from 'express';
import multer from 'multer';
import { parseCsv } from '../lib/parse.js';
import { analyze } from '../lib/engine.js';

export const MAX_BYTES = 20 * 1024 * 1024; // 20 MB, stated in the UI too.

/**
 * Files are held in memory, never written to disk.
 *
 * At a 20 MB cap that is a deliberate trade: it keeps the server stateless and
 * means we are not storing other people's data anywhere, which is the right
 * default for a tool strangers paste their spreadsheets into. The cost is that
 * concurrent large uploads use real RAM, so the cap is enforced rather than
 * suggested. If this ever needs to handle bigger files, the fix is streaming
 * the parse, not raising the limit.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 2 },
  fileFilter(_req, file, cb) {
    const ok = /\.(csv|tsv|txt)$/i.test(file.originalname) ||
      ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'text/tab-separated-values'].includes(file.mimetype);
    cb(ok ? null : Object.assign(new Error('Only .csv files are accepted'), { status: 415 }), ok);
  },
});

export const analyzeRouter = Router();

analyzeRouter.post(
  '/analyze',
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'test', maxCount: 1 }]),
  (req, res, next) => {
    try {
      const primaryFile = req.files?.file?.[0];
      if (!primaryFile) {
        return res.status(400).json({ error: 'No file uploaded. Send a CSV in the "file" field.' });
      }

      const primary = parseCsv(primaryFile.buffer, { filename: primaryFile.originalname });
      const testFile = req.files?.test?.[0];
      const test = testFile ? parseCsv(testFile.buffer, { filename: testFile.originalname }) : null;

      const target = req.body?.target?.trim() || null;
      res.json(analyze({ primary, test, target }));
    } catch (err) {
      next(err);
    }
  },
);
