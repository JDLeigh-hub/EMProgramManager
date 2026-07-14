import { Router } from 'express';
import { runExtract, ExtractError } from '../lib/extract.js';

const router = Router();

export default function extractRoute() {
  router.post('/', async (req, res) => {
    const { fileName, text, context } = req.body || {};
    try {
      const data = await runExtract({ fileName, text, context });
      res.json({ data });
    } catch (err) {
      const status = err instanceof ExtractError ? err.status : 500;
      const message = err instanceof ExtractError && status === 503
        ? err.message + ' Add it to server/.env and restart.'
        : err.message;
      res.status(status).json({ error: message || 'Auto-fill failed.' });
    }
  });
  return router;
}
