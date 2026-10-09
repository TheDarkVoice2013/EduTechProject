import assert from 'node:assert/strict';

const base = (process.argv[2] || 'http://127.0.0.1:3101/edutechproject').replace(/\/$/, '');
const origin = new URL(base).origin;
const get = async route => {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, `${route} should return 200`);
  return response;
};
assert.equal((await (await get('/api/health')).json()).status, 'ok');
const home = await get('/');
assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
assert.match(await home.text(), /EduTech/);
const content = await (await get('/api/content')).json();
assert.ok(content.lessons.length >= 10 && content.sources.length === 6);
const bank = await (await get('/api/questions')).json();
assert.ok(bank.questions.length >= 28);
assert.ok(bank.questions.every(q => !('correctOptionId' in q) && !('explanation' in q)));
const session = await get('/api/session');
const cookie = session.headers.get('set-cookie').split(';')[0];
const { csrfToken } = await session.json();
if (origin.startsWith('https:')) {
  assert.match(session.headers.get('set-cookie'), /Secure/);
  assert.match(session.headers.get('set-cookie'), /HttpOnly/);
}
assert.equal((await fetch(`${base}/api/mod/questions`, { headers: { cookie } })).status, 403);
const request = (route, body, requestOrigin = origin) => fetch(`${base}${route}`, { method: 'POST', headers: { cookie, Origin: requestOrigin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(body) });
assert.equal((await request('/api/exams', { topic: 'mixed', count: 10, secondsPerQuestion: 60 }, 'https://wrong-origin.example')).status, 403);
const start = await request('/api/exams', { topic: 'mixed', count: 10, secondsPerQuestion: 60 });
assert.equal(start.status, 201);
const exam = await start.json();
assert.equal(exam.status, 'active');
assert.ok(!('correctOptionId' in exam.question) && !exam.question.hint && !('explanation' in exam.question));
const finish = await request(`/api/exams/${exam.id}/finish`, {});
assert.equal(finish.status, 200);
const result = await finish.json();
assert.equal(result.result.total, 10);
assert.equal(result.result.correct, 0);
assert.ok(result.result.answers.every(a => !('explanation' in a.question)));
console.log(`PASS: ${content.lessons.length} lessons, ${bank.questions.length} questions, six sources, HTTPS headers, moderator isolation, CSRF, and timed-exam lifecycle at ${base}`);
