import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

export const DB_PATH      = process.env.DB_PATH      ?? '/data/gap_jobs.db';
export const UPLOADS_DIR  = process.env.UPLOADS_DIR  ?? '/data/uploads';

mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(UPLOADS_DIR,      { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS gap_jobs (
    id           TEXT    PRIMARY KEY,
    status       TEXT    NOT NULL DEFAULT 'pending',
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL,
    mime_type    TEXT    NOT NULL DEFAULT 'image/png',
    file_path    TEXT,
    context      TEXT    NOT NULL DEFAULT '',
    steps        TEXT    NOT NULL DEFAULT '[]',
    components   TEXT,
    analysis     TEXT,
    answers      TEXT    NOT NULL DEFAULT '[]',
    report       TEXT,
    error        TEXT,
    retry_count  INTEGER NOT NULL DEFAULT 0,
    progress     INTEGER NOT NULL DEFAULT 0
  )
`);

// On startup, un-stick any jobs left in processing/retrying from a previous crash
db.prepare(`
  UPDATE gap_jobs
  SET status = 'failed', error = 'Server restarted during processing'
  WHERE status IN ('processing', 'retrying', 'generating_report')
`).run();

export default db;
