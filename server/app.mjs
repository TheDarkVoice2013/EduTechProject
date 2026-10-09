import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt as rawScrypt, timingSafeEqual, randomInt } from 'node:crypto';
import { promisify, isDeepStrictEqual } from 'node:util';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';

const scrypt = promisify(rawScrypt);
const token = () => randomBytes(32).toString('base64url');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const DEFAULT_STORAGE_LIMITS = Object.freeze({
  maxSessions: 2000,
  maxExams: 500,
  maxExamSnapshotBytes: 120 * 1024,
  maxTotalExamSnapshotBytes: 12 * 1024 * 1024,
  maxQuestions: 1000,
  maxQuestionBytes: 10 * 1024 * 1024,
  maxRevisions: 5000,
  maxRevisionBytes: 25 * 1024 * 1024,
  maxAuditEntries: 10000,
  completedExamRetentionDays: 7,
  expiredSessionRetentionHours: 24,
});
const STORAGE_ENV = {
  maxSessions: 'MAX_SESSIONS', maxExams: 'MAX_EXAMS', maxExamSnapshotBytes: 'MAX_EXAM_SNAPSHOT_BYTES',
  maxTotalExamSnapshotBytes: 'MAX_TOTAL_EXAM_SNAPSHOT_BYTES', maxQuestions: 'MAX_QUESTIONS',
  maxQuestionBytes: 'MAX_QUESTION_BYTES', maxRevisions: 'MAX_REVISIONS', maxRevisionBytes: 'MAX_REVISION_BYTES',
  maxAuditEntries: 'MAX_AUDIT_ENTRIES', completedExamRetentionDays: 'COMPLETED_EXAM_RETENTION_DAYS',
  expiredSessionRetentionHours: 'EXPIRED_SESSION_RETENTION_HOURS',
};
function resolveLimits(overrides = {}) {
  const limits = { ...DEFAULT_STORAGE_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!(name in DEFAULT_STORAGE_LIMITS) || !Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid storage limit: ${name}`);
  }
  return limits;
}
export function storageLimitsFromEnv(env = process.env) {
  return resolveLimits(Object.fromEntries(Object.entries(STORAGE_ENV).filter(([, key]) => env[key] !== undefined).map(([name, key]) => [name, Number(env[key])])));
}
function storageLimit(message) {
  const error = new Error(message);
  error.status = 503; error.storageLimit = true;
  return error;
}
function checkContentBudget(db, limits, { questionCount = 0, questionBytes = 0, revisions = [] } = {}) {
  const questions = db.prepare('SELECT count(*) AS count,coalesce(sum(length(CAST(data AS BLOB))),0) AS bytes FROM questions').get();
  const history = db.prepare('SELECT count(*) AS count,coalesce(sum(length(CAST(data AS BLOB))),0) AS bytes FROM question_revisions').get();
  const audits = db.prepare('SELECT count(*) AS count FROM audit').get();
  if (questions.count + questionCount > limits.maxQuestions || questions.bytes + questionBytes > limits.maxQuestionBytes) throw storageLimit('Question storage is at capacity. Ask the administrator to review the content limits.');
  if (history.count + revisions.length > limits.maxRevisions || history.bytes + revisions.reduce((n, data) => n + Buffer.byteLength(data), 0) > limits.maxRevisionBytes || audits.count + revisions.length > limits.maxAuditEntries) throw storageLimit('Revision storage is at capacity. Ask the administrator to archive history before editing.');
}

// Maintenance only deletes expired-session data or completed exams beyond retention.
// Valid sessions and active exams are never evicted to admit another visitor.
export function pruneStorage(db, { now = Date.now(), limits: overrides = {} } = {}) {
  const limits = resolveLimits(overrides);
  return transaction(db, () => {
    const completed = db.prepare("DELETE FROM exams WHERE status='completed' AND coalesce(completed_at,created_at)<?").run(now - limits.completedExamRetentionDays * 24 * 60 * 60_000).changes;
    const expired = now - limits.expiredSessionRetentionHours * 60 * 60_000;
    const exams = db.prepare('DELETE FROM exams WHERE session_id IN (SELECT id FROM sessions WHERE expires_at<?)').run(expired).changes;
    const sessions = db.prepare('DELETE FROM sessions WHERE expires_at<?').run(expired).changes;
    return { completed, exams, sessions };
  });
}
const slug = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const plain = (max = 1500) => z.string().max(max).refine((s) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s) && !/<\s*\/?\s*[a-z!][^>]*>/i.test(s), 'Use plain text, not HTML');
const math = plain(1200).refine((s) => !/\\(?:href|url|html\w*|includegraphics|class|style|cssId|def|gdef|newcommand|renewcommand|catcode|require)\b/i.test(s), 'Unsafe math command');
const optionId = z.enum(['a', 'b', 'c', 'd']);
const translatedQuestion = z.object({
  prompt: plain(1500).refine((s) => s.trim().length > 0, 'Translated prompt is required'),
  options: z.array(z.object({ id: optionId, text: plain(800), math: math.optional() }).strict()).min(2).max(4),
  hint: plain(1500).refine(s => s.trim().length > 0, 'Translated hint is required'),
  explanation: z.array(plain(2500).refine(s => s.trim().length > 0, 'Translated explanation is required')).min(1).max(15),
  misconception: plain(1500).refine(s => s.trim().length > 0, 'Translated misconception is required'),
}).strict();
export const questionSchema = z.object({
  id: slug,
  topic: z.enum(['equations', 'logarithms']),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: plain(1500).refine((s) => s.trim().length > 0, 'Prompt is required'),
  math: math.optional(),
  options: z.array(z.object({ id: optionId, text: plain(800), math: math.optional() }).strict()).min(2).max(4),
  correctOptionId: optionId,
  hint: plain(1500),
  explanation: z.array(plain(2500)).min(1).max(15),
  misconception: plain(1500),
  sourceTags: z.array(z.enum(['otten', 'ngu', 'rittle', 'weber', 'kenney', 'chua'])).max(6),
  published: z.boolean(),
  translations: z.object({ nl: translatedQuestion.optional() }).strict().optional(),
}).strict().superRefine((q, ctx) => {
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length) ctx.addIssue({ code: 'custom', message: 'Option IDs must be unique' });
  if (!q.options.some((o) => o.id === q.correctOptionId)) ctx.addIssue({ code: 'custom', message: 'Correct option must exist' });
  if (q.translations?.nl && !isDeepStrictEqual(q.options.map(o => o.id), q.translations.nl.options.map(o => o.id))) ctx.addIssue({ code: 'custom', message: 'Translated options must use the same IDs and order as English' });
  if (q.translations?.nl?.options.some(o => !o.text.trim() && !o.math?.trim())) ctx.addIssue({ code: 'custom', message: 'Translated options require text or math' });
});

export function createDatabase({ filename, questions = [], limits: overrides = {} }) {
  const limits = resolveLimits(overrides);
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_size_limit=1048576;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','moderator')), created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, csrf TEXT NOT NULL, user_id TEXT REFERENCES users(id), expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS question_revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL, user_id TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, username TEXT NOT NULL, action TEXT NOT NULL, question_id TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), topic TEXT NOT NULL, seconds INTEGER NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '[]', current_index INTEGER NOT NULL DEFAULT 0, deadline INTEGER, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')), created_at INTEGER NOT NULL, completed_at INTEGER);
    CREATE INDEX IF NOT EXISTS exams_owner ON exams(session_id, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_exam ON exams(session_id) WHERE status='active';
  `);
  if (!db.prepare('PRAGMA table_info(exams)').all().some((column) => column.name === 'completed_at')) db.exec('ALTER TABLE exams ADD COLUMN completed_at INTEGER');
  const valid = questions.map((q) => questionSchema.parse(q));
  transaction(db, () => {
    const missing = valid.filter((q) => !db.prepare('SELECT id FROM questions WHERE id=?').get(q.id));
    if (missing.length) checkContentBudget(db, limits, { questionCount: missing.length, questionBytes: missing.reduce((n, q) => n + Buffer.byteLength(JSON.stringify(q)), 0) });
    const insert = db.prepare('INSERT OR IGNORE INTO questions(id,data,updated_at) VALUES(?,?,?)');
    for (const q of valid) insert.run(q.id, JSON.stringify(q), Date.now());
    // Add the first Dutch translation only to untouched original seeds. Never
    // replace moderator-authored text, translations, revisions or exam snapshots.
    for (const q of valid.filter(item => item.translations?.nl)) {
      const row = db.prepare('SELECT data,revision FROM questions WHERE id=?').get(q.id);
      const old = JSON.parse(row.data);
      const { translations, ...english } = q;
      if (old.translations || row.revision !== 1 || !isDeepStrictEqual(old, english) || db.prepare('SELECT id FROM question_revisions WHERE question_id=? LIMIT 1').get(q.id)) continue;
      const data = JSON.stringify(q);
      checkContentBudget(db, limits, { questionBytes: Buffer.byteLength(data) - Buffer.byteLength(row.data), revisions: [row.data, data] });
      const time = Date.now();
      const saveRevision = db.prepare('INSERT INTO question_revisions(question_id,revision,data,user_id,created_at) VALUES(?,?,?,NULL,?)');
      saveRevision.run(q.id, 1, row.data, time); saveRevision.run(q.id, 2, data, time);
      db.prepare('UPDATE questions SET data=?,revision=2,updated_at=? WHERE id=?').run(data, time, q.id);
      db.prepare('INSERT INTO audit(user_id,username,action,question_id,created_at) VALUES(NULL,?,?,?,?)').run('system', 'question.translation', q.id, time);
    }
  });
  return db;
}

function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { try { db.exec('ROLLBACK'); } catch { /* SQLite may already have rolled back after SQLITE_FULL. */ } throw error; }
}

export async function passwordHash(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 256) throw new Error('Password must contain 14–256 characters');
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password, encoded) {
  // Use the same expensive KDF for missing users to reduce account-enumeration timing.
  const [, cost, salt, expected] = (encoded || 'scrypt$32768$00000000000000000000000000000000$' + '0'.repeat(128)).split('$');
  const derived = await scrypt(password, salt, 64, { N: Number(cost), r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return safeEqual(derived.toString('hex'), expected);
}

export async function provisionUser(db, { username, password, role = 'moderator', reset = false }) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,47}$/.test(username)) throw new Error('Username must be 3–48 letters, numbers, dots, underscores or hyphens');
  if (!['admin', 'moderator'].includes(role)) throw new Error('Invalid role');
  const encoded = await passwordHash(password);
  const existing = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (existing && !reset) throw new Error('User already exists; use reset explicitly');
  transaction(db, () => {
    if (existing) {
      db.prepare('UPDATE users SET password_hash=?,role=? WHERE id=?').run(encoded, role, existing.id);
      // Invalidate all authenticated sessions after a credential reset.
      db.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(existing.id);
    } else db.prepare('INSERT INTO users(id,username,password_hash,role,created_at) VALUES(?,?,?,?,?)').run(randomUUID(), username, encoded, role, Date.now());
    db.prepare('INSERT INTO audit(user_id,username,action,question_id,created_at) VALUES(NULL,?,?,NULL,?)').run(username, existing ? 'user.reset' : 'user.create', Date.now());
  });
}

function localizeQuestion(q, language) {
  const translated = language === 'nl' ? q.translations?.nl : null;
  return { ...q, ...(translated || {}), language: translated ? 'nl' : 'en', requestedLanguage: language };
}
function publicQuestion(q, exam = false, language = 'en') {
  const { correctOptionId, explanation, misconception, translations, ...safe } = localizeQuestion(q, language);
  return exam ? { ...safe, hint: '' } : safe;
}
function snapshotQuestion(q) {
  const safe = { ...publicQuestion(q, true, 'en'), correctOptionId: q.correctOptionId };
  // Keep both display variants immutable, but never duplicate learning feedback
  // into exams. Locale changes only select a display variant, not a new attempt.
  if (q.translations?.nl) safe.translations = { nl: { prompt: q.translations.nl.prompt, options: q.translations.nl.options, hint: '' } };
  return safe;
}

export function createApp({ db, lessons = [], sources = [], lessonsNl = lessons, sourcesNl = sources, basePath = '', appOrigin = 'http://localhost:5173', secureCookies = true, trustProxy = false, distDir, now = Date.now, enableRateLimits = true, limits: overrides = {} }) {
  const limits = resolveLimits(overrides);
  let lastPrune = -Infinity;
  function maybePrune(force = false) {
    if (!force && now() - lastPrune < 60_000) return;
    try { pruneStorage(db, { now: now(), limits }); lastPrune = now(); }
    catch (error) { console.error('Storage maintenance failed:', error.code || error.name); throw storageLimit('Storage maintenance is temporarily unavailable. Please try again later.'); }
  }
  const app = express();
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', trustProxy);
  const base = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  if (base && !/^\/[a-zA-Z0-9/_-]+$/.test(base)) throw new Error('Invalid BASE_PATH');
  const origin = new URL(appOrigin).origin;
  const cookieName = secureCookies ? '__Secure-edutech_session' : 'edutech_session';
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: `${base}/`, maxAge: 7 * 24 * 60 * 60 * 1000 };
  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], fontSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], upgradeInsecureRequests: secureCookies ? [] : null } },
    strictTransportSecurity: secureCookies ? { maxAge: 31536000 } : false,
    referrerPolicy: { policy: 'no-referrer' },
  }));
  const router = express.Router();
  app.use(base || '/', router);
  router.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  if (enableRateLimits) router.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please wait a minute.' } }));
  router.use('/api', express.json({ limit: '512kb', strict: true, type: 'application/json' }));
  router.use('/api', (req, _res, next) => {
    const cookie = (req.headers.cookie || '').split(';').map((p) => p.trim()).find((p) => p.startsWith(`${cookieName}=`));
    const raw = cookie?.slice(cookieName.length + 1);
    if (raw && /^[A-Za-z0-9_-]{43}$/.test(raw)) {
      req.session = db.prepare('SELECT s.*,u.username,u.role FROM sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(raw), now());
    }
    next();
  });
  function establishSession(req, res, user = null, rotate = false) {
    const raw = token(); const csrf = token(); const time = now();
    const expiry = time + (user ? 12 * 60 * 60_000 : 7 * 24 * 60 * 60_000);
    const id = rotate && req.session ? req.session.id : randomUUID();
    if (rotate && req.session) db.prepare('UPDATE sessions SET token_hash=?,csrf=?,user_id=?,expires_at=? WHERE id=?').run(hash(raw), csrf, user?.id || null, expiry, id);
    else {
      maybePrune();
      transaction(db, () => {
        if (db.prepare('SELECT count(*) AS count FROM sessions').get().count >= limits.maxSessions) throw storageLimit('The site has reached its visitor capacity. Please try again later; existing sessions can continue.');
        db.prepare('INSERT INTO sessions(id,token_hash,csrf,user_id,expires_at,created_at) VALUES(?,?,?,?,?,?)').run(id, hash(raw), csrf, user?.id || null, expiry, time);
      });
    }
    req.session = { id, csrf, user_id: user?.id || null, username: user?.username, role: user?.role };
    res.cookie(cookieName, raw, { ...cookieOptions, maxAge: expiry - time });
  }
  const sessionPayload = (session) => ({ csrfToken: session.csrf, user: session.user_id ? { username: session.username, role: session.role } : null });
  const sessionLimit = rateLimit({ windowMs: 60_000, limit: 30, skip: (req) => !!req.session || !enableRateLimits, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many new sessions. Please wait a minute.' } });
  router.get('/api/session', sessionLimit, (req, res) => { if (!req.session) establishSession(req, res); res.json(sessionPayload(req.session)); });
  router.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Same-origin request required' });
    if (!req.session || !safeEqual(req.headers['x-csrf-token'], req.session.csrf)) return res.status(403).json({ error: 'Invalid or expired security token. Reload and try again.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Use application/json' });
    next();
  });
  const needSession = (req, res, next) => req.session ? next() : res.status(401).json({ error: 'Session required. Reload and try again.' });
  const needModerator = (req, res, next) => req.session?.user_id && ['moderator', 'admin'].includes(req.session.role) ? next() : res.status(403).json({ error: 'Moderator access required' });
  const validated = (schema, data, res) => { const parsed = schema.safeParse(data); if (!parsed.success) { res.status(400).json({ error: `Invalid request: ${parsed.error.issues.slice(0, 3).map((i) => i.message).join('; ')}` }); return null; } return parsed.data; };
  const questionsList = () => db.prepare('SELECT data FROM questions ORDER BY id').all().map((r) => JSON.parse(r.data));
  const getQuestion = (id) => { const row = db.prepare('SELECT data,revision FROM questions WHERE id=?').get(id); return row ? { ...row, question: JSON.parse(row.data) } : null; };
  router.use('/api', (req, res, next) => {
    if (req.query.lang !== undefined && !['nl', 'en'].includes(req.query.lang)) return res.status(400).json({ error: 'Invalid language' });
    req.contentLanguage = req.query.lang === 'en' ? 'en' : 'nl';
    next();
  });
  router.get('/api/content', (req, res) => res.json(req.contentLanguage === 'nl' ? { lessons: lessonsNl, sources: sourcesNl } : { lessons, sources }));
  router.get('/api/questions', (req, res) => {
    if (req.query.topic && !['equations', 'logarithms'].includes(req.query.topic)) return res.status(400).json({ error: 'Invalid topic' });
    res.json({ questions: questionsList().filter((q) => q.published && (!req.query.topic || q.topic === req.query.topic)).map((q) => publicQuestion(q, false, req.contentLanguage)) });
  });
  router.post('/api/practice/:id/answer', (req, res) => {
    const body = validated(z.object({ optionId }).strict(), req.body, res); if (!body) return;
    const q = getQuestion(req.params.id)?.question;
    if (!q?.published) return res.status(404).json({ error: 'Question not found' });
    if (!q.options.some((o) => o.id === body.optionId)) return res.status(400).json({ error: 'Unknown option' });
    const localized = localizeQuestion(q, req.contentLanguage);
    res.json({ correct: body.optionId === q.correctOptionId, correctOptionId: q.correctOptionId, explanation: localized.explanation, misconception: localized.misconception, sourceTags: q.sourceTags, language: localized.language, requestedLanguage: req.contentLanguage });
  });
  if (enableRateLimits) router.use('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Try again in 15 minutes.' } }));
  // An account-level throttle complements IP limits, including attempts from changing IPs.
  const failedUsers = new Map();
  let activePasswordChecks = 0;
  router.post('/api/auth/login', async (req, res) => {
    const body = validated(z.object({ username: z.string().min(1).max(48), password: z.string().min(1).max(256) }).strict(), req.body, res); if (!body) return;
    const name = body.username.toLowerCase(); const attempt = failedUsers.get(name);
    if (enableRateLimits && attempt && attempt.until > now() && attempt.count >= 8) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(body.username);
    if (activePasswordChecks >= 2) return res.status(503).json({ error: 'Login is busy. Please try again shortly.' });
    activePasswordChecks += 1;
    let valid;
    try { valid = await verifyPassword(body.password, user?.password_hash); }
    finally { activePasswordChecks -= 1; }
    if (!user || !valid) {
      if (failedUsers.size > 10000) failedUsers.clear();
      failedUsers.set(name, { count: attempt && attempt.until > now() ? attempt.count + 1 : 1, until: now() + 15 * 60_000 });
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    failedUsers.delete(name);
    establishSession(req, res, user, true);
    res.json(sessionPayload(req.session));
  });
  router.post('/api/auth/logout', (req, res) => {
    if (!validated(z.object({}).strict(), req.body, res)) return;
    establishSession(req, res, null, true); res.json(sessionPayload(req.session));
  });

  const loadExam = (req, id) => {
    const row = db.prepare('SELECT * FROM exams WHERE id=? AND session_id=?').get(id, req.session.id);
    return row ? { ...row, snapshot: JSON.parse(row.snapshot), answers: JSON.parse(row.answers) } : null;
  };
  function saveExam(exam) {
    db.prepare('UPDATE exams SET answers=?,current_index=?,deadline=?,status=?,completed_at=coalesce(completed_at,?) WHERE id=?').run(JSON.stringify(exam.answers), exam.current_index, exam.deadline, exam.status, exam.status === 'completed' ? now() : null, exam.id);
  }
  function advance(exam, selectedOptionId, timedOut = false) {
    exam.answers.push({ selectedOptionId: timedOut ? null : selectedOptionId, timedOut });
    exam.current_index += 1;
    if (exam.current_index >= exam.snapshot.length) { exam.status = 'completed'; exam.deadline = null; }
    else exam.deadline = now() + exam.seconds * 1000;
    saveExam(exam);
  }
  function expire(exam) { if (exam.status === 'active' && now() >= exam.deadline) advance(exam, null, true); return exam; }
  function examState(exam, language) {
    const state = { id: exam.id, status: exam.status, topic: exam.topic, total: exam.snapshot.length, index: exam.current_index, secondsPerQuestion: exam.seconds, serverNow: now(), deadline: exam.deadline, question: exam.status === 'active' ? publicQuestion(exam.snapshot[exam.current_index], true, language) : null, answered: exam.answers.length };
    if (exam.status === 'completed') {
      const answers = exam.snapshot.map((q, i) => ({ question: publicQuestion(q, true, language), selectedOptionId: exam.answers[i]?.selectedOptionId || null, correctOptionId: q.correctOptionId, correct: exam.answers[i]?.selectedOptionId === q.correctOptionId && !exam.answers[i]?.timedOut, timedOut: !!exam.answers[i]?.timedOut }));
      state.result = { correct: answers.filter((a) => a.correct).length, total: exam.snapshot.length, answers };
    }
    return state;
  }
  router.use('/api/exams', needSession);
  const examLimit = rateLimit({ windowMs: 60 * 60_000, limit: 40, skip: (req) => !enableRateLimits || req.method !== 'POST' || req.path !== '/', standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Exam creation limit reached. Please try again later.' } });
  router.use('/api/exams', examLimit);
  router.post('/api/exams', (req, res) => {
    const body = validated(z.object({ topic: z.enum(['mixed', 'equations', 'logarithms']), count: z.union([z.literal(10), z.literal(20)]), secondsPerQuestion: z.union([z.literal(60), z.literal(90), z.literal(120)]) }).strict(), req.body, res); if (!body) return;
    maybePrune();
    const active = db.prepare("SELECT id FROM exams WHERE session_id=? AND status='active'").get(req.session.id);
    if (active) return res.status(409).json({ error: 'An exam is already active. Resume or finish it first.' });
    const bank = questionsList().filter((q) => q.published && (body.topic === 'mixed' || q.topic === body.topic));
    if (bank.length < body.count) return res.status(409).json({ error: `Not enough published questions for this exam. Available: ${bank.length}.` });
    for (let i = bank.length - 1; i > 0; i--) { const j = randomInt(i + 1); [bank[i], bank[j]] = [bank[j], bank[i]]; }
    const id = randomUUID(); const time = now();
    // Exams never need hints or explanations; do not duplicate those fields on disk.
    const snapshot = JSON.stringify(bank.slice(0, body.count).map(snapshotQuestion));
    const snapshotBytes = Buffer.byteLength(snapshot);
    if (snapshotBytes > limits.maxExamSnapshotBytes) throw storageLimit('The selected exam content exceeds the size limit. Please contact a moderator or choose fewer questions.');
    transaction(db, () => {
      const usage = db.prepare('SELECT count(*) AS count,coalesce(sum(length(CAST(snapshot AS BLOB))),0) AS bytes FROM exams').get();
      if (usage.count >= limits.maxExams || usage.bytes + snapshotBytes > limits.maxTotalExamSnapshotBytes) throw storageLimit('Exam storage is at capacity. Please try again later; existing exams can continue.');
      db.prepare('INSERT INTO exams(id,session_id,topic,seconds,snapshot,deadline,created_at) VALUES(?,?,?,?,?,?,?)').run(id, req.session.id, body.topic, body.secondsPerQuestion, snapshot, time + body.secondsPerQuestion * 1000, time);
    });
    res.status(201).json(examState(loadExam(req, id), req.contentLanguage));
  });
  router.get('/api/exams/current', (req, res) => {
    const active = db.prepare("SELECT id FROM exams WHERE session_id=? AND status='active' ORDER BY created_at DESC LIMIT 1").get(req.session.id);
    res.json(active ? examState(expire(loadExam(req, active.id)), req.contentLanguage) : { exam: null });
  });
  router.get('/api/exams/:id', (req, res) => {
    const exam = loadExam(req, req.params.id); if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(examState(expire(exam), req.contentLanguage));
  });
  router.post('/api/exams/:id/answer', (req, res) => {
    const body = validated(z.object({ questionId: slug, optionId: optionId.nullable() }).strict(), req.body, res); if (!body) return;
    const exam = loadExam(req, req.params.id); if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status !== 'active') return res.status(409).json({ error: 'Exam is already completed' });
    const question = exam.snapshot[exam.current_index];
    if (question.id !== body.questionId) return res.status(409).json({ error: 'Question is no longer current. Refresh the exam.' });
    if (body.optionId && !question.options.some((o) => o.id === body.optionId)) return res.status(400).json({ error: 'Unknown option' });
    advance(exam, body.optionId, now() >= exam.deadline); res.json(examState(exam, req.contentLanguage));
  });
  router.post('/api/exams/:id/finish', (req, res) => {
    if (!validated(z.object({}).strict(), req.body, res)) return;
    const exam = loadExam(req, req.params.id); if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status === 'active') {
      const currentExpired = now() >= exam.deadline;
      while (exam.answers.length < exam.snapshot.length) exam.answers.push({ selectedOptionId: null, timedOut: currentExpired && exam.answers.length === exam.current_index });
      exam.current_index = exam.snapshot.length; exam.status = 'completed'; exam.deadline = null; saveExam(exam);
    }
    res.json(examState(exam, req.contentLanguage));
  });

  router.use('/api/mod', needModerator);
  router.get('/api/mod/questions', (_req, res) => res.json({ questions: questionsList() }));
  function auditQuestion(req, q, revision, action) {
    db.prepare('INSERT INTO question_revisions(question_id,revision,data,user_id,created_at) VALUES(?,?,?,?,?)').run(q.id, revision, JSON.stringify(q), req.session.user_id, now());
    db.prepare('INSERT INTO audit(user_id,username,action,question_id,created_at) VALUES(?,?,?,?,?)').run(req.session.user_id, req.session.username, action, q.id, now());
  }
  router.post('/api/mod/questions', (req, res) => {
    const q = validated(questionSchema, req.body, res); if (!q) return;
    if (getQuestion(q.id)) return res.status(409).json({ error: 'Question ID already exists' });
    transaction(db, () => {
      const data = JSON.stringify(q);
      checkContentBudget(db, limits, { questionCount: 1, questionBytes: Buffer.byteLength(data), revisions: [data] });
      db.prepare('INSERT INTO questions(id,data,updated_at) VALUES(?,?,?)').run(q.id, data, now()); auditQuestion(req, q, 1, 'question.create');
    });
    res.status(201).json({ question: q });
  });
  router.put('/api/mod/questions/:id', (req, res) => {
    const q = validated(questionSchema, req.body, res); if (!q) return;
    if (q.id !== req.params.id) return res.status(400).json({ error: 'Question ID cannot be changed' });
    const previous = getQuestion(q.id); if (!previous) return res.status(404).json({ error: 'Question not found' });
    transaction(db, () => {
      const snapshotPrevious = !db.prepare('SELECT id FROM question_revisions WHERE question_id=? AND revision=?').get(q.id, previous.revision);
      const data = JSON.stringify(q);
      checkContentBudget(db, limits, { questionBytes: Buffer.byteLength(data) - Buffer.byteLength(previous.data), revisions: snapshotPrevious ? [previous.data, data] : [data] });
      // Keep the pre-edit seed too, so the complete change is recoverable in audit storage.
      if (snapshotPrevious) auditQuestion(req, previous.question, previous.revision, 'question.snapshot');
      db.prepare('UPDATE questions SET data=?,revision=revision+1,updated_at=? WHERE id=?').run(data, now(), q.id);
      auditQuestion(req, q, previous.revision + 1, 'question.update');
    });
    res.json({ question: q });
  });
  router.post('/api/mod/import', (req, res) => {
    const body = validated(z.object({ questions: z.array(questionSchema).min(1).max(100) }).strict(), req.body, res); if (!body) return;
    const ids = body.questions.map((q) => q.id);
    if (new Set(ids).size !== ids.length || ids.some((id) => getQuestion(id))) return res.status(409).json({ error: 'Import contains duplicate or existing IDs. No questions were imported.' });
    transaction(db, () => {
      const data = body.questions.map((q) => JSON.stringify(q));
      checkContentBudget(db, limits, { questionCount: body.questions.length, questionBytes: data.reduce((n, q) => n + Buffer.byteLength(q), 0), revisions: data });
      for (const q of body.questions) { db.prepare('INSERT INTO questions(id,data,updated_at) VALUES(?,?,?)').run(q.id, JSON.stringify(q), now()); auditQuestion(req, q, 1, 'question.import'); }
    });
    res.status(201).json({ imported: body.questions.length });
  });
  router.get('/api/mod/audit', (_req, res) => res.json({ entries: db.prepare('SELECT id,username,action,question_id AS questionId,created_at AS createdAt FROM audit ORDER BY id DESC LIMIT 200').all() }));
  router.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  router.use((req, res, next) => {
    if (/(?:^|\/)(?:\.[^/]*|server|content|data|node_modules|tests)(?:\/|$)/i.test(req.path) || /\/(?:package(?:-lock)?\.json|CONTRACT\.md|README\.md)$/i.test(req.path)) return res.status(404).json({ error: 'Not found' });
    next();
  });
  if (distDir) {
    router.use(express.static(distDir, { index: false, dotfiles: 'deny', maxAge: '1h' }));
    router.get(/.*/, (_req, res, next) => res.sendFile(path.join(distDir, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }, (error) => error && next(error)));
  }
  app.use((error, _req, res, _next) => {
    const diskFull = error.errcode === 13 || error.code === 'SQLITE_FULL' || error.code === 'ENOSPC';
    const code = error.storageLimit || diskFull ? 503 : error.status === 413 ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    if (code === 500) console.error('Request failed:', error.name, error.code || 'internal');
    if (code === 503) res.set('Retry-After', '300');
    res.status(code).json({ error: error.storageLimit ? error.message : diskFull ? 'Storage is temporarily unavailable. Please try again later.' : code === 413 ? 'Request is too large' : code === 400 ? 'Invalid JSON' : 'An internal error occurred' });
  });
  return app;
}
