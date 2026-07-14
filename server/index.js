import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import extractRoute from './routes/extract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/extract', extractRoute());
app.get('/api/health', (req, res) => res.json({ ok: true }));

// In production, serve the built client alongside the API.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Engagement OS server listening on :${port}`));
