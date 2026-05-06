import { Router } from 'express';
import { randomUUID }  from 'crypto';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import db, { UPLOADS_DIR } from '../db.js';
import { processJob, refineJob, generateReport } from '../worker.js';

export const gapRouter = Router();

const MIME_EXT = {
  'image/png':   '.png',
  'image/jpeg':  '.jpg',
  'image/jpg':   '.jpg',
  'image/gif':   '.gif',
  'image/webp':  '.webp',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
};

function jobView(row) {
  if (!row) return null;
  return {
    id:         row.id,
    status:     row.status,
    progress:   row.progress,
    steps:      JSON.parse(row.steps),
    components: row.components  ? JSON.parse(row.components)  : null,
    analysis:   row.analysis    ? JSON.parse(row.analysis)    : null,
    answers:    JSON.parse(row.answers),
    report:     row.report  ?? null,
    error:      row.error   ?? null,
    mimeType:   row.mime_type,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

// ── POST /api/gap/jobs ─────────────────────────────────────────────────────────

gapRouter.post('/jobs', (req, res) => {
  const { imageBase64, mimeType = 'image/png', context = '' } = req.body;

  if (!imageBase64)            return res.status(400).json({ error: 'imageBase64 is required' });
  if (!MIME_EXT[mimeType])     return res.status(400).json({ error: 'Unsupported file type. Accepted: PNG, JPG, GIF, WebP, PDF, Word (.docx)' });

  const id       = randomUUID();
  const ext      = MIME_EXT[mimeType];
  const filePath = join(UPLOADS_DIR, `${id}${ext}`);

  try {
    writeFileSync(filePath, Buffer.from(imageBase64, 'base64'));
  } catch (err) {
    return res.status(500).json({ error: `Failed to save file: ${err.message}` });
  }

  const now = Date.now();
  db.prepare(`
    INSERT INTO gap_jobs (id, status, created_at, updated_at, mime_type, file_path, context, steps, answers)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, '[]', '[]')
  `).run(id, now, now, mimeType, filePath, context);

  setImmediate(() => processJob(id));

  res.json({ jobId: id, status: 'pending' });
});

// ── GET /api/gap/jobs ──────────────────────────────────────────────────────────

gapRouter.get('/jobs', (_req, res) => {
  const rows = db.prepare(
    'SELECT id, status, progress, created_at, updated_at, mime_type, error FROM gap_jobs ORDER BY created_at DESC LIMIT 20'
  ).all();
  res.json(rows);
});

// ── GET /api/gap/jobs/:id ──────────────────────────────────────────────────────

gapRouter.get('/jobs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM gap_jobs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  res.json(jobView(row));
});

// ── GET /api/gap/jobs/:id/file ─────────────────────────────────────────────────

gapRouter.get('/jobs/:id/file', (req, res) => {
  const row = db.prepare('SELECT file_path, mime_type FROM gap_jobs WHERE id = ?').get(req.params.id);
  if (!row || !row.file_path || !existsSync(row.file_path)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.setHeader('Content-Type', row.mime_type);
  res.send(readFileSync(row.file_path));
});

// ── POST /api/gap/jobs/:id/answer ─────────────────────────────────────────────

gapRouter.post('/jobs/:id/answer', (req, res) => {
  const { questionId, question, answer } = req.body;
  const row = db.prepare('SELECT * FROM gap_jobs WHERE id = ?').get(req.params.id);

  if (!row)    return res.status(404).json({ error: 'Job not found' });
  if (!answer) return res.status(400).json({ error: 'answer is required' });

  const answers = JSON.parse(row.answers);
  answers.push({ questionId, question, answer, ts: Date.now() });
  db.prepare('UPDATE gap_jobs SET answers = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(answers), Date.now(), row.id);

  setImmediate(() => refineJob(row.id, questionId, question, answer));

  res.json({ ok: true });
});

// ── POST /api/gap/jobs/:id/report ─────────────────────────────────────────────

gapRouter.post('/jobs/:id/report', (req, res) => {
  const row = db.prepare('SELECT id, status FROM gap_jobs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Job not found' });

  setImmediate(() => generateReport(row.id));

  res.json({ ok: true });
});

// ── POST /api/gap/jobs/:id/retry ──────────────────────────────────────────────

gapRouter.post('/jobs/:id/retry', (req, res) => {
  const row = db.prepare('SELECT id, status FROM gap_jobs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  if (!['failed','retrying'].includes(row.status)) {
    return res.status(400).json({ error: 'Job is not in a failed state' });
  }

  db.prepare(
    "UPDATE gap_jobs SET status='pending', retry_count=0, error=NULL, steps='[]', progress=0, updated_at=? WHERE id=?"
  ).run(Date.now(), row.id);

  setImmediate(() => processJob(row.id));

  res.json({ ok: true });
});
