import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'mundial2026.db');
export const db = new Database(dbPath);

// Modo WAL para que las lecturas en la app no bloqueen las escrituras del cron
db.pragma('journal_mode = WAL');