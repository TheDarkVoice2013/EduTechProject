import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, createDatabase, pruneStorage, storageLimitsFromEnv } from './app.mjs';
import { questions } from '../content/questions.mjs';
import { lessons, sources, lessonsNl, sourcesNl } from '../content/lessons.mjs';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const production = process.env.NODE_ENV === 'production';
const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
const secureCookies = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE !== 'false' : production;
if (production && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN is required in production');
if (production && (!secureCookies || !appOrigin.startsWith('https://'))) throw new Error('Production requires HTTPS and secure cookies');
if (secureCookies && !appOrigin.startsWith('https://')) throw new Error('Secure cookies require HTTPS; set COOKIE_SECURE=false only for local development or explicitly authorized HTTP');
const limits = storageLimitsFromEnv();
const db = createDatabase({ filename: path.join(process.env.DATA_DIR || path.join(projectDir, 'data'), 'edutech.sqlite'), questions, limits });
const app = createApp({ db, lessons, sources, lessonsNl, sourcesNl, basePath: process.env.BASE_PATH || '/edutechproject', appOrigin, secureCookies, trustProxy: process.env.TRUST_PROXY === 'loopback' ? 'loopback' : false, distDir: path.join(projectDir, 'dist'), limits });
const port = Number(process.env.PORT || 3101);
const server = app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`EduTechProject listening on ${process.env.HOST || '127.0.0.1'}:${port}`));
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
// Admission quotas are authoritative; cleanup failure must never terminate the service.
function maintenance() {
  try { pruneStorage(db, { limits }); db.exec('PRAGMA wal_checkpoint(PASSIVE)'); }
  catch (error) { console.error('Storage maintenance failed:', error.code || error.name); }
}
maintenance();
const cleanup = setInterval(maintenance, 15 * 60_000).unref();
function shutdown() { clearInterval(cleanup); server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(1), 10_000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
