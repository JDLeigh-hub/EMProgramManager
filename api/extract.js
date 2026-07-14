// Vercel serverless function backing the Resource Library's "Auto-fill" feature
// in production. Shares its logic with the local Express server
// (server/routes/extract.js) via server/lib/extract.js so the two stay in sync.
import { runExtract, ExtractError } from '../server/lib/extract.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const { fileName, text, context } = req.body || {};
  try {
    const data = await runExtract({ fileName, text, context });
    res.status(200).json({ data });
  } catch (err) {
    const status = err instanceof ExtractError ? err.status : 500;
    const message = err instanceof ExtractError && status === 503
      ? err.message + ' Set it in the Vercel project’s Environment Variables.'
      : err.message;
    res.status(status).json({ error: message || 'Auto-fill failed.' });
  }
}
