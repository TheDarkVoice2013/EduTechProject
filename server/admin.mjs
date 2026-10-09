import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, provisionUser, storageLimitsFromEnv } from './app.mjs';

// Passwords are read only from stdin: never command arguments, logs, or environment.
const [command, username, role = 'moderator'] = process.argv.slice(2);
if (!['create', 'reset'].includes(command) || !username || !['moderator', 'admin'].includes(role)) {
  console.error('Usage: node server/admin.mjs create|reset USERNAME [moderator|admin]\nProvide a 14–256 character password via stdin (use a hidden-input shell prompt).');
  process.exit(1);
}
if (process.stdin.isTTY) { console.error('Refusing visible terminal password entry. Pipe a password from a hidden-input prompt to stdin.'); process.exit(1); }
let input = '';
for await (const chunk of process.stdin) { input += chunk.toString(); if (Buffer.byteLength(input) > 1024) { console.error('Password input too long'); process.exit(1); } }
const password = input.replace(/\r?\n$/, '');
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = createDatabase({ filename: path.join(process.env.DATA_DIR || path.join(projectDir, 'data'), 'edutech.sqlite'), limits: storageLimitsFromEnv() });
try { await provisionUser(db, { username, password, role, reset: command === 'reset' }); console.log(`Moderator identity ${command === 'reset' ? 'reset' : 'created'} successfully.`); }
catch (error) { console.error(error.message); process.exitCode = 1; }
finally { db.close(); }
