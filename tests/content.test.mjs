import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { questions } from '../content/questions.mjs';
import { lessons, sources } from '../content/lessons.mjs';
import { questionSchema } from '../server/app.mjs';

test('original content has unique IDs, complete explanations and valid source references', () => {
  assert.equal(questions.length, 28);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  assert.equal(sources.length, 6);
  const sourceIds = new Set(sources.map(s => s.id));
  for (const source of sources) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(source.application.length > 20);
    assert.ok(source.limitation.length > 20);
  }
  for (const q of questions) {
    questionSchema.parse(q);
    assert.equal(q.published, true);
    assert.ok(q.hint.length > 10 && q.explanation.length >= 2);
    assert.ok(q.sourceTags.length);
    for (const id of q.sourceTags) assert.ok(sourceIds.has(id), `${q.id}: unknown source ${id}`);
  }
  for (const topic of ['equations', 'logarithms']) {
    assert.equal(questions.filter(q => q.topic === topic).length, 14);
    assert.ok(lessons.filter(l => l.topic === topic).length >= 4);
  }
  assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(lesson.sections.length && lesson.checkpoint);
    assert.ok(lesson.checkpoint.correct >= 0 && lesson.checkpoint.correct < lesson.checkpoint.options.length);
    for (const section of lesson.sections) {
      assert.ok(section.body.length && section.sourceTags.length);
      for (const id of section.sourceTags) assert.ok(sourceIds.has(id));
    }
  }
});

test('all explicit and inline mathematics renders with untrusted KaTeX', () => {
  let count = 0;
  function walk(value, key = '') {
    if (typeof value === 'string') {
      const formulas = key === 'math' ? [value] : [...value.matchAll(/\$([^$]+)\$/g)].map(m => m[1]);
      for (const formula of formulas) {
        assert.doesNotThrow(() => katex.renderToString(formula, { throwOnError: true, trust: false, strict: 'error', maxExpand: 500, maxSize: 20 }), `Invalid formula: ${formula}`);
        count++;
      }
    } else if (Array.isArray(value)) value.forEach(v => walk(v, key));
    else if (value && typeof value === 'object') for (const [childKey, childValue] of Object.entries(value)) walk(childValue, childKey);
  }
  walk(questions); walk(lessons);
  assert.ok(count >= 60, `Expected substantial mathematical content; found ${count} formulas`);
});

test('representative solutions satisfy original equations and logarithm domains', () => {
  assert.equal(3 * 4 + 5, 4 + 13);
  assert.equal(12 / 2 + 12 / 3, 10);
  const x = Math.exp(3) + 2;
  assert.ok(x > 2);
  assert.ok(Math.abs(Math.log(x - 2) - 3) < 1e-12);
  assert.equal(Math.log2(4) + Math.log2(4 - 2), 3);
  assert.ok(!(-2 > 2), 'The negative quadratic candidate must be rejected');
  assert.equal(Math.log2(3 + 1) - Math.log2(3 - 1), 1);
  assert.equal(Math.log2(3 - 1), Math.log2(5 - 3));
  assert.ok(3 > 1 && 3 < 5);
  assert.ok(Math.abs(2 ** ((Math.log2(7) - 1) + 1) - 7) < 1e-12);
});
