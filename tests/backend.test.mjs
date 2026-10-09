import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createApp, createDatabase, provisionUser, questionSchema, pruneStorage, storageLimitsFromEnv } from '../server/app.mjs';

const question = (id = 'q1', topic = 'equations') => ({
  id, topic, difficulty: 1, prompt: 'Solve for x.', math: 'x+2=5',
  options: [{ id: 'a', text: 'Three', math: '3' }, { id: 'b', text: 'Seven', math: '7' }],
  correctOptionId: 'a', hint: 'Undo the addition.', explanation: ['Subtract two from both sides.'],
  misconception: 'Moving is shorthand for an equivalent operation.', sourceTags: ['otten'], published: true,
});
const bank = () => Array.from({ length: 40 }, (_, i) => question(`q${i}`, i < 20 ? 'equations' : 'logarithms'));
const origin = 'https://edutech.example';
const base = '/edutechproject';
const password = 'A long test-only password!';

async function fixture(t, options = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'edutech-test-'));
  const filename = path.join(dir, 'test.sqlite');
  let clock = 1_800_000_000_000;
  const db = createDatabase({ filename, questions: options.questions || bank() });
  await provisionUser(db, { username: 'moderator', password, role: 'moderator' });
  const app = createApp({ db, basePath: base, appOrigin: origin, secureCookies: true, now: () => clock, enableRateLimits: options.rateLimits || false, limits: options.limits || {} });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}${base}`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); db.close(); rmSync(dir, { recursive: true, force: true }); });
  function client() {
    let cookie = ''; let csrfToken = '';
    return {
      get cookie() { return cookie; }, get csrfToken() { return csrfToken; },
      async request(route, { method = 'GET', body, headers = {}, security = true } = {}) {
        const requestHeaders = { ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(security && method !== 'GET' ? { Origin: origin, 'X-CSRF-Token': csrfToken } : {}), ...headers };
        const response = await fetch(url + route, { method, headers: requestHeaders, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
        const setCookie = response.headers.get('set-cookie'); if (setCookie) cookie = setCookie.split(';')[0];
        const data = await response.json(); if (data.csrfToken) csrfToken = data.csrfToken;
        return { status: response.status, data, headers: response.headers };
      },
      async init() { return this.request('/api/session'); },
      async login() { await this.init(); return this.request('/api/auth/login', { method: 'POST', body: { username: 'moderator', password } }); },
    };
  }
  return { db, filename, client, now: () => clock, clock: (advance) => { clock += advance; }, url };
}

test('public question DTO strips answers, explanations and misconceptions; headers and cookie are hardened', async (t) => {
  const f = await fixture(t); const c = f.client(); const session = await c.init();
  assert.match(session.headers.get('set-cookie'), /HttpOnly/);
  assert.match(session.headers.get('set-cookie'), /Secure/);
  assert.match(session.headers.get('set-cookie'), /SameSite=Strict/);
  assert.match(session.headers.get('set-cookie'), /Path=\/edutechproject\//);
  assert.equal(session.headers.get('cache-control'), 'no-store');
  assert.match(session.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(session.headers.get('x-powered-by'), null);
  const result = await c.request('/api/questions?topic=equations');
  assert.equal(result.data.questions.length, 20);
  assert.ok(result.data.questions.every((q) => !('correctOptionId' in q) && !('explanation' in q) && !('misconception' in q)));
  assert.equal((await c.request('/api/health')).data.status, 'ok');
  assert.equal((await c.request('/api/questions?topic=unknown')).status, 400);
  assert.equal((await c.request('/api/mod/questions')).status, 403);
  const stored = f.db.prepare('SELECT token_hash FROM sessions').get();
  assert.equal(stored.token_hash.length, 64);
  assert.ok(!c.cookie.includes(stored.token_hash));
});

test('mutations require session, CSRF and exact origin; malformed body does not expose internals', async (t) => {
  const f = await fixture(t); const c = f.client();
  assert.equal((await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a' } })).status, 403);
  await c.init();
  assert.equal((await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a' }, security: false })).status, 403);
  assert.equal((await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a' }, headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a' }, headers: { 'X-CSRF-Token': 'é'.repeat(43) } })).status, 403);
  assert.equal((await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a', extra: true } })).status, 400);
  const result = await c.request('/api/practice/q1/answer', { method: 'POST', body: { optionId: 'a' } });
  assert.equal(result.data.correct, true); assert.ok(Array.isArray(result.data.explanation));
});

test('login/logout rotate session and CSRF; identity survives safely and old token fails', async (t) => {
  const f = await fixture(t); const c = f.client(); await c.init();
  const oldCookie = c.cookie; const oldCsrf = c.csrfToken;
  assert.equal((await c.request('/api/auth/login', { method: 'POST', body: { username: 'moderator', password: 'wrong' } })).status, 401);
  const login = await c.login(); assert.equal(login.status, 200); assert.equal(login.data.user.role, 'moderator');
  assert.notEqual(c.cookie, oldCookie); assert.notEqual(c.csrfToken, oldCsrf);
  assert.equal((await c.request('/api/mod/questions')).status, 200);
  assert.equal((await c.request('/api/mod/questions', { headers: { cookie: oldCookie } })).status, 403);
  const newCookie = c.cookie;
  assert.equal((await c.request('/api/auth/logout', { method: 'POST', body: {} })).data.user, null);
  assert.notEqual(newCookie, c.cookie);
  assert.equal((await c.request('/api/mod/questions')).status, 403);
});

test('exam returns only current question without hints or answer keys and is session-owned', async (t) => {
  const f = await fixture(t); const c = f.client(); const other = f.client(); await c.init(); await other.init();
  const started = await c.request('/api/exams', { method: 'POST', body: { topic: 'mixed', count: 10, secondsPerQuestion: 60 } });
  assert.equal(started.status, 201);
  const exam = started.data;
  assert.equal(exam.question.hint, ''); assert.equal(exam.total, 10); assert.equal(exam.index, 0);
  assert.ok(!JSON.stringify(exam).includes('correctOptionId')); assert.ok(!('result' in exam));
  assert.equal((await c.request('/api/exams', { method: 'POST', body: { topic: 'mixed', count: 10, secondsPerQuestion: 60 } })).status, 409);
  assert.equal((await other.request(`/api/exams/${exam.id}`)).status, 404);
  assert.equal((await other.request(`/api/exams/${exam.id}/finish`, { method: 'POST', body: {} })).status, 404);
  assert.equal((await c.request('/api/exams/current')).data.id, exam.id);
  assert.equal((await c.request(`/api/exams/${exam.id}/answer`, { method: 'POST', body: { questionId: 'not-current', optionId: 'a' } })).status, 409);
  const answered = await c.request(`/api/exams/${exam.id}/answer`, { method: 'POST', body: { questionId: exam.question.id, optionId: 'a' } });
  assert.equal(answered.data.index, 1); assert.ok(!JSON.stringify(answered.data).includes('correctOptionId'));
  assert.equal((await c.request(`/api/exams/${exam.id}/answer`, { method: 'POST', body: { questionId: exam.question.id, optionId: 'a' } })).status, 409);
});

test('server deadline rejects late correctness, persists timeout, and never exposes exam explanations', async (t) => {
  const f = await fixture(t); const c = f.client(); await c.init();
  const { data: exam } = await c.request('/api/exams', { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 60 } });
  f.clock(60_001);
  const next = await c.request(`/api/exams/${exam.id}/answer`, { method: 'POST', body: { questionId: exam.question.id, optionId: 'a' } });
  assert.equal(next.data.index, 1); assert.equal(next.data.deadline - next.data.serverNow, 60_000);
  const finished = await c.request(`/api/exams/${exam.id}/finish`, { method: 'POST', body: {} });
  assert.equal(finished.data.result.correct, 0); assert.equal(finished.data.result.answers[0].timedOut, true);
  assert.equal(finished.data.result.answers[0].selectedOptionId, null);
  assert.ok(!JSON.stringify(finished.data).includes('explanation')); assert.ok(!JSON.stringify(finished.data).includes('misconception'));
  assert.equal((await c.request(`/api/exams/${exam.id}`)).data.status, 'completed');
  assert.equal((await c.request('/api/exams/current')).data.exam, null);
});

test('GET resumption advances an expired question exactly once and starts next deadline on access', async (t) => {
  const f = await fixture(t); const c = f.client(); await c.init();
  const { data: exam } = await c.request('/api/exams', { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 90 } });
  f.clock(3 * 24 * 60 * 60_000);
  const resumed = await c.request(`/api/exams/${exam.id}`);
  assert.equal(resumed.data.index, 1); assert.equal(resumed.data.deadline - resumed.data.serverNow, 90_000);
  assert.equal((await c.request(`/api/exams/${exam.id}`)).data.index, 1);
});

test('moderator edits do not mutate exam snapshots; audit history stores revisions and seed never overwrites', async (t) => {
  const f = await fixture(t); const student = f.client(); const mod = f.client(); await student.init(); await mod.login();
  const { data: exam } = await student.request('/api/exams', { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 60 } });
  const changed = { ...question(exam.question.id), prompt: 'A changed prompt', correctOptionId: 'b' };
  assert.equal((await mod.request(`/api/mod/questions/${changed.id}`, { method: 'PUT', body: changed })).status, 200);
  assert.equal((await student.request(`/api/exams/${exam.id}`)).data.question.prompt, 'Solve for x.');
  await student.request(`/api/exams/${exam.id}/answer`, { method: 'POST', body: { questionId: changed.id, optionId: 'a' } });
  const finished = await student.request(`/api/exams/${exam.id}/finish`, { method: 'POST', body: {} });
  assert.equal(finished.data.result.answers[0].correct, true);
  assert.equal(finished.data.result.correct, 1);
  const audit = await mod.request('/api/mod/audit'); assert.ok(audit.data.entries.some((e) => e.action === 'question.update' && e.questionId === changed.id));
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM question_revisions WHERE question_id=?').get(changed.id).n, 2);
  const secondConnection = createDatabase({ filename: f.filename, questions: bank() });
  assert.equal(JSON.parse(secondConnection.prepare('SELECT data FROM questions WHERE id=?').get(changed.id).data).prompt, 'A changed prompt');
  assert.equal(secondConnection.prepare('SELECT count(*) AS n FROM exams').get().n, 1);
  secondConnection.close();
});

test('moderator imports validate transactionally, reject unknown fields/HTML/duplicates, and create private drafts', async (t) => {
  const f = await fixture(t); const c = f.client(); await c.login();
  const before = f.db.prepare('SELECT count(*) AS n FROM questions').get().n;
  assert.equal((await c.request('/api/mod/import', { method: 'POST', body: { questions: [question('new1'), { ...question('new2'), correctOptionId: 'd' }] } })).status, 400);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM questions').get().n, before);
  assert.equal((await c.request('/api/mod/import', { method: 'POST', body: { questions: [question('new1'), question('q1')] } })).status, 409);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM questions').get().n, before);
  assert.equal((await c.request('/api/mod/questions', { method: 'POST', body: { ...question('xss'), prompt: '<img src=x onerror=alert(1)>' } })).status, 400);
  assert.equal((await c.request('/api/mod/questions', { method: 'POST', body: { ...question('bad'), admin: true } })).status, 400);
  assert.equal((await c.request('/api/mod/questions', { method: 'POST', body: { ...question('bad'), math: '\\href{https://evil.example}{x}' } })).status, 400);
  assert.equal((await c.request('/api/mod/import', { method: 'POST', body: { questions: [question('new1'), { ...question('new2'), published: false }] } })).data.imported, 2);
  assert.equal((await c.request('/api/questions')).data.questions.length, 41);
  assert.equal((await c.request('/api/practice/new2/answer', { method: 'POST', body: { optionId: 'a' } })).status, 404);
});

test('empty bank is handled without an exam; exact schemas reject arbitrary options', async (t) => {
  const f = await fixture(t, { questions: [] }); const c = f.client(); await c.init();
  assert.equal((await c.request('/api/exams', { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 60 } })).status, 409);
  assert.equal((await c.request('/api/exams/current')).data.exam, null);
  assert.equal(questionSchema.safeParse({ ...question(), options: [{ id: 'a', text: 'One' }, { id: 'a', text: 'Two' }] }).success, false);
});

test('credential resets invalidate existing moderator sessions', async (t) => {
  const f = await fixture(t); const c = f.client(); await c.login();
  await provisionUser(f.db, { username: 'moderator', password: 'A different secure test password!', reset: true });
  assert.equal((await c.request('/api/mod/questions')).status, 403);
});

test('global session admission cap cannot be bypassed with different clients or forwarding headers', async (t) => {
  const f = await fixture(t, { limits: { maxSessions: 2 } });
  const first = f.client(); const second = f.client(); const third = f.client();
  assert.equal((await first.init()).status, 200);
  assert.equal((await second.init()).status, 200);
  const denied = await third.request('/api/session', { headers: { 'X-Forwarded-For': '198.51.100.88' } });
  assert.equal(denied.status, 503); assert.match(denied.data.error, /visitor capacity/);
  assert.equal(denied.headers.get('retry-after'), '300');
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM sessions').get().n, 2);
  assert.equal((await first.init()).status, 200);
  // Capacity returns after retention-eligible data is pruned on admission.
  f.db.prepare('UPDATE sessions SET expires_at=?').run(f.now() - 25 * 60 * 60_000);
  f.clock(60_001);
  assert.equal((await third.init()).status, 200);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM sessions').get().n, 1);
});

test('global exam count cap preserves active and recent completed exams and blocks new sessions equally', async (t) => {
  const f = await fixture(t, { limits: { maxExams: 2 } });
  const clients = [f.client(), f.client(), f.client()];
  for (const c of clients) await c.init();
  const payload = { method: 'POST', body: { topic: 'mixed', count: 10, secondsPerQuestion: 60 } };
  const first = await clients[0].request('/api/exams', payload);
  assert.equal(first.status, 201);
  assert.equal((await clients[1].request('/api/exams', payload)).status, 201);
  const denied = await clients[2].request('/api/exams', { ...payload, headers: { 'X-Forwarded-For': '203.0.113.77' } });
  assert.equal(denied.status, 503); assert.match(denied.data.error, /Exam storage is at capacity/);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM exams').get().n, 2);
  // Existing exams remain writable even while admission is closed.
  assert.equal((await clients[0].request(`/api/exams/${first.data.id}/finish`, { method: 'POST', body: {} })).status, 200);
  assert.equal((await clients[2].request('/api/exams', payload)).status, 503);
  assert.equal((await clients[0].request(`/api/exams/${first.data.id}`)).data.status, 'completed');
});

test('per-exam and aggregate snapshot byte caps are enforced before persistent writes', async (t) => {
  const small = await fixture(t, { limits: { maxExamSnapshotBytes: 100 } }); const c = small.client(); await c.init();
  const payload = { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 60 } };
  assert.equal((await c.request('/api/exams', payload)).status, 503);
  assert.equal(small.db.prepare('SELECT count(*) AS n FROM exams').get().n, 0);
  // A ten-question compact fixture is about 3 KiB, so one fits but two do not.
  const aggregate = await fixture(t, { limits: { maxTotalExamSnapshotBytes: 4500 } });
  const one = aggregate.client(); const two = aggregate.client(); await one.init(); await two.init();
  assert.equal((await one.request('/api/exams', payload)).status, 201);
  const stored = aggregate.db.prepare('SELECT snapshot FROM exams').get().snapshot;
  assert.ok(!stored.includes('explanation')); assert.ok(!stored.includes('misconception')); assert.ok(!stored.includes('Undo the addition'));
  assert.equal((await two.request('/api/exams', payload)).status, 503);
  assert.equal(aggregate.db.prepare('SELECT count(*) AS n FROM exams').get().n, 1);
});

test('pruning removes only old completed exams or long-expired sessions and their exams', async (t) => {
  const f = await fixture(t); const clients = [f.client(), f.client(), f.client()];
  const payload = { method: 'POST', body: { topic: 'equations', count: 10, secondsPerQuestion: 60 } };
  const ids = [];
  for (const c of clients) { await c.init(); ids.push((await c.request('/api/exams', payload)).data.id); }
  const owner = (id) => f.db.prepare('SELECT session_id FROM exams WHERE id=?').get(id).session_id;
  const owners = ids.map(owner);
  f.db.prepare('UPDATE sessions SET expires_at=? WHERE id=?').run(f.now() - 25 * 60 * 60_000, owners[0]);
  f.db.prepare('UPDATE sessions SET expires_at=? WHERE id=?').run(f.now() - 23 * 60 * 60_000, owners[1]);
  await clients[2].request(`/api/exams/${ids[2]}/finish`, { method: 'POST', body: {} });
  f.db.prepare('UPDATE exams SET completed_at=? WHERE id=?').run(f.now() - 8 * 24 * 60 * 60_000, ids[2]);
  const result = pruneStorage(f.db, { now: f.now() });
  assert.deepEqual(result, { completed: 1, exams: 1, sessions: 1 });
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM exams').get().n, 1);
  assert.equal(f.db.prepare('SELECT id FROM exams WHERE id=?').get(ids[1]).id, ids[1]);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM sessions').get().n, 2);
  assert.equal((await clients[0].request(`/api/exams/${ids[0]}`)).status, 401);
  assert.equal((await clients[2].init()).status, 200);
});

test('question and revision quotas reject imports/edits atomically without truncating audit history', async (t) => {
  const f = await fixture(t, { limits: { maxQuestions: 41, maxRevisions: 2 } });
  const c = f.client(); await c.login();
  const importDenied = await c.request('/api/mod/import', { method: 'POST', body: { questions: [question('new1'), question('new2')] } });
  assert.equal(importDenied.status, 503);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM questions').get().n, 40);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM question_revisions').get().n, 0);
  const edit = { ...question('q1'), prompt: 'Updated once.' };
  assert.equal((await c.request('/api/mod/questions/q1', { method: 'PUT', body: edit })).status, 200);
  assert.equal((await c.request('/api/mod/questions/q1', { method: 'PUT', body: { ...edit, prompt: 'Should not persist.' } })).status, 503);
  assert.equal(JSON.parse(f.db.prepare('SELECT data FROM questions WHERE id=?').get('q1').data).prompt, 'Updated once.');
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM question_revisions').get().n, 2);
});

test('storage configuration rejects invalid caps and uses safe defaults', () => {
  assert.equal(storageLimitsFromEnv({}).maxExams, 500);
  assert.equal(storageLimitsFromEnv({ MAX_SESSIONS: '25' }).maxSessions, 25);
  assert.throws(() => storageLimitsFromEnv({ MAX_EXAMS: '-1' }), /Invalid storage limit/);
  assert.throws(() => storageLimitsFromEnv({ MAX_TOTAL_EXAM_SNAPSHOT_BYTES: 'NaN' }), /Invalid storage limit/);
});

test('content byte quotas count UTF-8 bytes and revision rejection leaves original questions intact', async (t) => {
  const seed = [question('q1')];
  const bytes = Buffer.byteLength(JSON.stringify(seed[0]));
  const f = await fixture(t, { questions: seed, limits: { maxQuestionBytes: bytes + 100 } });
  const c = f.client(); await c.login();
  // 50 Unicode characters occupy more than 100 UTF-8 bytes.
  const edit = { ...seed[0], prompt: '𝑥'.repeat(50) };
  assert.equal((await c.request('/api/mod/questions/q1', { method: 'PUT', body: edit })).status, 503);
  assert.equal(JSON.parse(f.db.prepare('SELECT data FROM questions WHERE id=?').get('q1').data).prompt, seed[0].prompt);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM question_revisions').get().n, 0);
  const revisionLimit = await fixture(t, { questions: seed, limits: { maxRevisionBytes: bytes } });
  const editor = revisionLimit.client(); await editor.login();
  assert.equal((await editor.request('/api/mod/questions/q1', { method: 'PUT', body: { ...seed[0], prompt: 'Edited.' } })).status, 503);
  assert.equal(revisionLimit.db.prepare('SELECT count(*) AS n FROM question_revisions').get().n, 0);
});
