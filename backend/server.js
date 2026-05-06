import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai.js';
import { assessRouter } from './routes/assessmentChat.js';
import { gapRouter } from './routes/gapAnalysis.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, model: process.env.BEDROCK_MODEL_ID }));
app.use('/api', aiRouter);
app.use('/api/assess', assessRouter);
app.use('/api/gap', gapRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] listening on port ${PORT}`);
  console.log(`[api] region : ${process.env.AWS_REGION ?? 'eu-west-2'}`);
  console.log(`[api] model  : ${process.env.BEDROCK_MODEL_ID ?? 'eu.anthropic.claude-opus-4-7-v1:0'}`);
});
