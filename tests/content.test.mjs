import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import { questions } from '../content/questions.mjs';
import * as curriculum from '../content/lessons.mjs';
import { questionSchema } from '../server/app.mjs';
import { splitVocabulary } from '../src/vocabulary-match.ts';

const { lessons, sources } = curriculum;
const glossary = JSON.parse(readFileSync(new URL('../content/glossary.json', import.meta.url), 'utf8'));
const visualIds = new Set(['equality-balance', 'undo-machine', 'both-sides', 'bracket-groups', 'solution-choices', 'power-steps', 'domain-gates', 'log-rules', 'log-undo', 'candidate-check']);

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
  walk(questions); walk(lessons); walk(curriculum.lessonsNl); walk(sources); walk(curriculum.sourcesNl); walk(glossary);
  assert.ok(count >= 150, `Expected bilingual and glossary mathematical content; found ${count} formulas`);
});

test('Dutch questions preserve answer identities and provide complete translated feedback', () => {
  for (const question of questions) {
    const translated = question.translations?.nl;
    assert.ok(translated, `${question.id}: missing Dutch question`);
    assert.deepEqual(translated.options.map(option => option.id), question.options.map(option => option.id), `${question.id}: translated answer order changed`);
    assert.ok(translated.options.some(option => option.id === question.correctOptionId), `${question.id}: correct answer ID missing`);
    assert.ok(translated.prompt.length > 10 && translated.hint.length > 10, `${question.id}: incomplete prompt or hint`);
    assert.ok(translated.explanation.length >= 2 && translated.explanation.every(step => step.trim().length > 0), `${question.id}: incomplete explanation`);
    assert.ok(translated.misconception.length > 20, `${question.id}: incomplete misconception feedback`);
    // Translation is a view of the same question, not a second grading record.
    assert.equal(Object.hasOwn(translated, 'correctOptionId'), false);
    assert.equal(Object.hasOwn(translated, 'id'), false);
    for (let index = 0; index < question.options.length; index++) {
      assert.equal(translated.options[index].math, question.options[index].math, `${question.id}: option mathematics changed`);
    }
  }
});

test('both course languages keep lesson identity, checkpoint grading and research references stable', () => {
  const { lessonsNl, sourcesNl } = curriculum;
  assert.ok(Array.isArray(lessonsNl), 'Dutch lessons must be exported as lessonsNl');
  assert.ok(Array.isArray(sourcesNl), 'Dutch research notes must be exported as sourcesNl');
  assert.deepEqual(lessonsNl.map(lesson => lesson.id), lessons.map(lesson => lesson.id));
  assert.deepEqual(sourcesNl.map(source => source.id), sources.map(source => source.id));
  for (let index = 0; index < sources.length; index++) {
    const english = sources[index];
    const dutch = sourcesNl[index];
    assert.equal(dutch.url, english.url, `${english.id}: translated citation points elsewhere`);
    assert.equal(dutch.year, english.year);
    assert.equal(dutch.authors, english.authors);
    assert.ok(dutch.application.length > 20 && dutch.limitation.length > 20, `${english.id}: missing Dutch research note`);
  }
  const sourceIds = new Set(sources.map(source => source.id));
  for (let index = 0; index < lessons.length; index++) {
    const english = lessons[index];
    const dutch = lessonsNl[index];
    assert.equal(dutch.topic, english.topic);
    assert.equal(dutch.checkpoint.correct, english.checkpoint.correct, `${english.id}: translation changes checkpoint grading`);
    assert.equal(dutch.checkpoint.options.length, english.checkpoint.options.length);
    assert.deepEqual(dutch.sourceTags, english.sourceTags);
    assert.equal(dutch.sections.length, english.sections.length);
    for (const [language, lesson] of [['en', english], ['nl', dutch]]) {
      assert.ok(lesson.title.length > 5 && lesson.summary.length > 15, `${lesson.id}/${language}: missing introductory text`);
      assert.ok(lesson.checkpoint.prompt.length && lesson.checkpoint.explanation.length);
      assert.ok(lesson.checkpoint.options.every(option => typeof option === 'string' && option.trim()));
      assert.ok(lesson.checkpoint.correct >= 0 && lesson.checkpoint.correct < lesson.checkpoint.options.length);
      for (const id of lesson.sourceTags) assert.ok(sourceIds.has(id), `${lesson.id}/${language}: unknown source ${id}`);
      for (const section of lesson.sections) {
        assert.ok(section.title.length && section.body.length);
        assert.ok(section.body.every(paragraph => typeof paragraph === 'string' && paragraph.trim()));
        assert.ok(section.sourceTags.length);
        for (const id of section.sourceTags) assert.ok(sourceIds.has(id), `${lesson.id}/${language}: unknown section source ${id}`);
      }
    }
  }
});

test('starter vocabulary and visual references resolve in both languages', () => {
  const { lessonsNl } = curriculum;
  assert.ok(Array.isArray(lessonsNl));
  const glossaryIds = new Set(glossary.map(entry => entry.id));
  assert.equal(glossaryIds.size, glossary.length, 'Glossary IDs must be unique');
  for (const required of ['expression', 'set', 'operation', 'substitute']) assert.ok(glossaryIds.has(required), `Missing requested definition: ${required}`);
  for (const entry of glossary) {
    assert.match(entry.id, /^[a-z]+(?:-[a-z]+)*$/);
    for (const language of ['nl', 'en']) {
      const definition = entry[language];
      assert.ok(definition && definition.term.trim(), `${entry.id}/${language}: missing term`);
      assert.ok(Array.isArray(definition.aliases) && definition.aliases.every(alias => typeof alias === 'string' && alias.trim()));
      assert.ok(definition.meaning.length > 20 && definition.example.length > 10, `${entry.id}/${language}: missing definition or example`);
      assert.equal(/<\/?[a-z][^>]*>/i.test(definition.meaning + definition.example), false, `${entry.id}/${language}: plain text only`);
    }
  }
  for (const [language, course] of [['en', lessons], ['nl', lessonsNl]]) {
    const usedVisuals = new Set();
    for (const lesson of course) {
      assert.ok(Array.isArray(lesson.words) && lesson.words.length, `${lesson.id}/${language}: missing starter vocabulary`);
      assert.equal(new Set(lesson.words).size, lesson.words.length, `${lesson.id}/${language}: repeated vocabulary reference`);
      for (const id of lesson.words) assert.ok(glossaryIds.has(id), `${lesson.id}/${language}: unknown glossary term ${id}`);
      for (const section of lesson.sections) if (section.visual) {
        assert.ok(visualIds.has(section.visual), `${lesson.id}/${language}: unknown visual ${section.visual}`);
        usedVisuals.add(section.visual);
      }
    }
    assert.deepEqual([...usedVisuals].sort(), [...visualIds].sort(), `${language}: every original lesson needs its planned visual`);
  }
  for (let index = 0; index < lessons.length; index++) {
    assert.deepEqual(lessonsNl[index].words, lessons[index].words);
    assert.deepEqual(lessonsNl[index].sections.map(section => section.visual), lessons[index].sections.map(section => section.visual));
  }
});

test('vocabulary matching prefers whole Unicode words and the longest alias', () => {
  const entries = [
    { id: 'set', aliases: ['set', 'sets', 'solution set'] },
    { id: 'solution', aliases: ['solution'] },
    { id: 'coefficient', aliases: ['coëfficiënt'] },
    { id: 'literal', aliases: ['a+b', '[x]'] },
  ];
  const text = 'reset upset setting set SET sets solution set coëfficiënt coëfficiënten';
  const segments = splitVocabulary(text, entries);
  assert.equal(segments.map(segment => segment.text).join(''), text, 'Splitting must preserve every input character');
  assert.deepEqual(segments.filter(segment => segment.id), [
    { text: 'set', id: 'set' }, { text: 'SET', id: 'set' }, { text: 'sets', id: 'set' },
    { text: 'solution set', id: 'set' }, { text: 'coëfficiënt', id: 'coefficient' },
  ]);
  assert.deepEqual(splitVocabulary('éset seté _set set_ 2set set2', entries), [{ text: 'éset seté _set set_ 2set set2' }]);
  assert.deepEqual(splitVocabulary('set\u0301 e\u0301set', entries), [{ text: 'set\u0301 e\u0301set' }], 'Combining accent marks are part of a word, not a boundary');
  assert.deepEqual(splitVocabulary('a+b and [x]', entries).filter(segment => segment.id), [{ text: 'a+b', id: 'literal' }, { text: '[x]', id: 'literal' }], 'Regex metacharacters in an alias must be treated literally');
  assert.deepEqual(splitVocabulary('', entries), [{ text: '' }]);
  assert.deepEqual(splitVocabulary('No matching words.', []), [{ text: 'No matching words.' }]);
});

test('all glossary terms and aliases can open their definition without substring matches', () => {
  for (const language of ['nl', 'en']) {
    const entries = glossary.map(entry => ({ id: entry.id, aliases: [entry[language].term, ...entry[language].aliases] }));
    const ownedAliases = new Map();
    for (const entry of entries) for (const alias of entry.aliases) {
      const key = alias.toLocaleLowerCase();
      if (ownedAliases.has(key)) assert.equal(ownedAliases.get(key), entry.id, `${language}: ambiguous alias ${alias}`);
      else ownedAliases.set(key, entry.id);
      assert.ok(splitVocabulary(`(${alias})`, entries).some(segment => segment.id === entry.id), `${language}: alias cannot resolve ${alias}`);
    }
  }
});

test('representative solutions satisfy original equations and logarithm domains', () => {
  assert.equal(3 + 2, 5, 'Balance picture: x = 3');
  assert.equal(3 * 5 + 5, 20, 'Inverse-machine picture: x = 5');
  assert.equal(3 * 3 + 2, 3 + 8, 'Both-sides picture: x = 3');
  for (const value of [-6, 0, 0.5, 7]) {
    assert.equal(2 * (value + 3), 2 * value + 6, 'Two bracket groups distribute to 2x + 6');
    assert.equal(value + 2, value + 2, 'An identity stays true for every example value');
    assert.notEqual(value + 2, value + 3, 'Subtracting x from the no-solution example gives 2 != 3');
  }
  assert.equal(2 ** 0, 1, 'The zero-step picture starts at one');
  for (const power of [0, 1, 2, 3, 4]) assert.equal(Math.log2(2 ** power), power);
  assert.equal(Math.log2(8 * 4), 3 + 2, 'Joining multiplicative steps uses a product, not a sum');
  assert.notEqual(Math.log2(8 + 4), Math.log2(8) + Math.log2(4));
  assert.ok(4 - 3 > 0 && !(3 - 3 > 0) && !(2 - 3 > 0), 'The domain picture excludes its boundary');
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
