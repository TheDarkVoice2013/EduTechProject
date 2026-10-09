import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir, open, readdir, unlink, stat } from 'node:fs/promises';
import path from 'node:path';

// SQLite's backup API produces a transactionally consistent copy even with WAL writes.
// https://nodejs.org/docs/latest-v24.x/api/sqlite.html#sqlitebackupsource-db-path-options
const dataDir = path.resolve(process.env.DATA_DIR || './data');
const directory = path.join(dataDir, 'backups');
await mkdir(directory, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(directory, `edutech-${stamp}.sqlite`);
// Reserve a new path exclusively so failure cleanup cannot remove an older backup.
const reservation = await open(destination, 'wx', 0o600);
try {
  await reservation.close();
  const db = new DatabaseSync(path.join(dataDir, 'edutech.sqlite'), { readOnly: true });
  try { await backup(db, destination); } finally { db.close(); }
  const check = new DatabaseSync(destination, { readOnly: true });
  try {
    const integrity = check.prepare('PRAGMA integrity_check').get();
    if (Object.values(integrity)[0] !== 'ok') throw new Error('Backup integrity check failed');
  } finally { check.close(); }
} catch (error) {
  // Remove only this invocation's incomplete copy; keep every prior verified copy.
  try { await reservation.close(); } catch { /* Already closed. */ }
  try { await unlink(destination); }
  catch (cleanupError) {
    if (cleanupError.code !== 'ENOENT') console.error('Incomplete backup cleanup failed:', destination, cleanupError.code || cleanupError.name);
  }
  throw error;
}
// On this small VPS, retain three daily copies. Never delete the live DB or foreign files.
// Off-server copies are still required for protection from server/disk loss.
const candidates = (await readdir(directory)).filter(name => /^edutech-\d{4}-\d{2}-\d{2}T[\d-]+Z\.sqlite$/.test(name)).sort().reverse();
for (const name of candidates.slice(3)) {
  const candidate = path.resolve(directory, name);
  if (path.dirname(candidate) !== directory) throw new Error('Unsafe backup path');
  if ((await stat(candidate)).isFile()) await unlink(candidate);
}
console.log(`Backup verified: ${destination}`);
