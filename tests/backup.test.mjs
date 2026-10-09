import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const script = fileURLToPath(new URL('../scripts/backup.mjs', import.meta.url));

test('backup verifies a copy and removes only its new destination on failure', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'edutech-backup-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'edutech.sqlite');
  const db = new DatabaseSync(source);
  try { db.exec("CREATE TABLE evidence(value TEXT); INSERT INTO evidence VALUES('preserve me');"); }
  finally { db.close(); }
  const options = { env: { ...process.env, DATA_DIR: directory } };
  const completed = await run(process.execPath, [script], options);
  assert.match(completed.stdout, /Backup verified:/);
  const backups = path.join(directory, 'backups');
  const names = await readdir(backups);
  assert.equal(names.length, 1);
  const saved = path.join(backups, names[0]);
  const before = await readFile(saved);
  const check = new DatabaseSync(saved, { readOnly: true });
  try { assert.equal(check.prepare('SELECT value FROM evidence').get().value, 'preserve me'); }
  finally { check.close(); }

  // A missing source fails after reserving a destination: no partial file may remain.
  await rename(source, path.join(directory, 'source-preserved.sqlite'));
  await assert.rejects(run(process.execPath, [script], options));
  assert.deepEqual(await readdir(backups), names);
  assert.deepEqual(await readFile(saved), before);
});
