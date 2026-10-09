import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronLeft, Save, ShieldCheck } from 'lucide-react';
import { api, errorText } from './api';
import { ErrorNotice, MathText, RichText, TopicTag } from './components';
import { t, useLanguage, type Language } from './i18n';
import type { Question, QuestionTranslation, Source } from './types';

const blankQuestion = (): Question => ({ id: '', topic: 'equations', difficulty: 1, prompt: '', math: '', options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: '', math: '' })), correctOptionId: 'a', hint: '', explanation: [''], misconception: '', sourceTags: [], published: false });
const blankTranslation = (question: Question): QuestionTranslation => ({ prompt: '', options: question.options.map(option => ({ id: option.id, text: '', math: option.math || '' })), hint: '', explanation: [''], misconception: '' });

export function QuestionEditor({ initial, sources, onCancel, onSaved }: { initial?: Question; sources: Source[]; onCancel: () => void; onSaved: (question: Question) => void }) {
  const { language } = useLanguage();
  const [question, setQuestion] = useState<Question>(() => initial ? structuredClone(initial) : blankQuestion());
  const [dutch, setDutch] = useState<QuestionTranslation>(() => initial?.translations?.nl ? structuredClone(initial.translations.nl) : blankTranslation(initial || blankQuestion()));
  const [includeDutch, setIncludeDutch] = useState(!initial || !!initial.translations?.nl);
  const [contentLanguage, setContentLanguage] = useState<Language>(initial && !initial.translations?.nl ? 'en' : language);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const view: QuestionTranslation = contentLanguage === 'nl' ? dutch : question;
  const explanation = view.explanation.join('\n');

  function update<K extends keyof Question>(key: K, value: Question[K]) { setQuestion(current => ({ ...current, [key]: value })); setDirty(true); }
  function updateText<K extends keyof QuestionTranslation>(key: K, value: QuestionTranslation[K]) {
    if (contentLanguage === 'nl') setDutch(current => ({ ...current, [key]: value }));
    else setQuestion(current => ({ ...current, [key]: value }));
    setDirty(true);
  }
  function toggleDutch(enabled: boolean) {
    setIncludeDutch(enabled); setDirty(true);
    setContentLanguage(enabled ? 'nl' : 'en');
    // Keep the Dutch draft in memory when switched off so it can be restored.
  }
  function cancel() { if (!dirty || window.confirm(t('Leave this editor and discard unsaved changes?'))) onCancel(); }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!question.sourceTags.length) { setError(t('Select at least one research source for this question.')); return; }
    const englishSteps = question.explanation.map(step => step.trim()).filter(Boolean);
    const dutchSteps = dutch.explanation.map(step => step.trim()).filter(Boolean);
    if (!question.prompt.trim() || !question.hint.trim() || !question.misconception.trim() || !englishSteps.length) {
      setContentLanguage('en'); setError(t('Complete the English prompt, hint, explanation and misconception.')); return;
    }
    if (includeDutch && (!dutch.prompt.trim() || !dutch.hint.trim() || !dutch.misconception.trim() || !dutchSteps.length)) {
      setContentLanguage('nl'); setError(t('Complete the Dutch prompt, hint, explanation and misconception, or turn off the Dutch translation.')); return;
    }
    if ((includeDutch ? [question, dutch] : [question]).some(item => item.options.some(option => !option.text.trim() && !option.math?.trim()))) {
      setError(t('Each answer option needs text or math in every enabled language.')); return;
    }
    if ((includeDutch ? [englishSteps, dutchSteps] : [englishSteps]).some(steps => steps.length > 15 || steps.some(step => step.length > 2500))) {
      setError(t('Use no more than 15 explanation steps, each below 2,500 characters.')); return;
    }
    const { language: _language, requestedLanguage: _requestedLanguage, translations: _previousTranslations, ...canonical } = question;
    const payload: Question = { ...canonical, explanation: englishSteps, ...(includeDutch ? { translations: { nl: { ...dutch, explanation: dutchSteps } } } : {}) };
    setBusy(true);
    try {
      const result = await api<{ question: Question }>(initial ? `mod/questions/${encodeURIComponent(initial.id)}` : 'mod/questions', payload, initial ? 'PUT' : 'POST');
      setDirty(false); onSaved(result.question);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  return <>
    <button className="inline-link text-button back-link" onClick={cancel}><ChevronLeft size={16} />{t('Back to question bank')}</button>
    <form onSubmit={save} className="editor-layout">
      <section className="question-editor">
        <div className="editor-heading"><h2>{t(initial ? 'Refine the question.' : 'Create a clear question.')}</h2><p>{t('Every explanation should name the operation and justify why it is valid. Drafts are not visible to students.')}</p></div>
        <div className="form-grid">
          <label className="form-field"><span>{t('Question ID')}</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} disabled={!!initial || busy} value={question.id} onChange={e => update('id', e.target.value)} placeholder="equation-undo-addition-01" /><small>{t('Unique lowercase slug. Can’t be changed after creation.')}</small></label>
          <label className="form-field"><span>{t('Topic')}</span><select disabled={busy} value={question.topic} onChange={e => update('topic', e.target.value as Question['topic'])}><option value="equations">{t('Equations')}</option><option value="logarithms">{t('Logarithms')}</option></select></label>
          <label className="form-field"><span>{t('Difficulty')}</span><select disabled={busy} value={question.difficulty} onChange={e => update('difficulty', Number(e.target.value) as Question['difficulty'])}><option value={1}>{t('1 — Foundation')}</option><option value={2}>{t('2 — Building fluency')}</option><option value={3}>{t('3 — Stretch')}</option></select></label>
        </div>
        <label className="form-field"><span>{t('Equation / mathematical expression')} <small>{t('Optional · KaTeX')}</small></span><input disabled={busy} value={question.math || ''} maxLength={1200} onChange={e => update('math', e.target.value)} placeholder="3x + 5 = 20" /></label>
        <div className="editor-language-note"><p>{t('The buttons below edit separate Dutch and English versions. Update both when the meaning changes. The question formula and correct answer are shared; answer wording and formulas are edited per language.')}</p><strong>{t('English is required. Complete Dutch when its translation is enabled. Nothing is translated automatically.')}</strong></div>
        <label className="translation-toggle"><input type="checkbox" disabled={busy} checked={includeDutch} onChange={e => toggleDutch(e.target.checked)} /><span><strong>{t('Include Dutch translation')}</strong><small>{t('Switching this off keeps your Dutch draft here until you leave. Saving while off removes the Dutch version from this question.')}</small></span></label>
        {!includeDutch && <p className="notice info">{t('Dutch is turned off: students will see the English version, with a notice. You can still edit and save this question.')}</p>}
        <div className="editor-language-tabs" role="group" aria-label={t('Content language')}>
          <button type="button" lang="nl" disabled={busy || !includeDutch} aria-pressed={contentLanguage === 'nl'} className={`button ${contentLanguage === 'nl' ? 'primary' : 'secondary'}`} onClick={() => setContentLanguage('nl')}>Nederlands</button>
          <button type="button" lang="en" disabled={busy} aria-pressed={contentLanguage === 'en'} className={`button ${contentLanguage === 'en' ? 'primary' : 'secondary'}`} onClick={() => setContentLanguage('en')}>English</button>
        </div>
        <h3>{t(contentLanguage === 'nl' ? 'Dutch content' : 'English content')}</h3>
        <fieldset disabled={busy} className="language-fields" lang={contentLanguage}>
          <legend className="sr-only">{t(contentLanguage === 'nl' ? 'Dutch content' : 'English content')}</legend>
          <label className="form-field"><span>{t('Question prompt')}</span><textarea rows={3} required maxLength={1500} value={view.prompt} onChange={e => updateText('prompt', e.target.value)} /></label>
          <fieldset className="editor-options"><legend>{t('Answer options')}</legend><p>{t('Select the radio button beside the correct answer. Every option needs text or math.')}</p>{view.options.map((option, i) => <div key={option.id} className="editor-option"><label className="correct-option"><input type="radio" name="correct-option" checked={question.correctOptionId === option.id} onChange={() => update('correctOptionId', option.id)} /><span>{option.id.toUpperCase()}</span><span className="sr-only">{t('Mark option')} {option.id.toUpperCase()} {t('correct')}</span></label><div>
            <label className="form-field"><span className="sr-only">{t('Option')} {option.id.toUpperCase()} {t('text')}</span><input placeholder={t('Answer text (optional if math is provided)')} value={option.text} maxLength={800} onChange={e => updateText('options', view.options.map((o, j) => i === j ? { ...o, text: e.target.value } : o))} /></label>
            <label className="form-field"><span className="sr-only">{t('Option')} {option.id.toUpperCase()} {t('math')}</span><input className="math-input" placeholder={t('KaTeX expression (optional)')} value={option.math || ''} maxLength={1200} onChange={e => updateText('options', view.options.map((o, j) => i === j ? { ...o, math: e.target.value } : o))} /></label>
          </div></div>)}</fieldset>
          <label className="form-field"><span>{t('Hint')}</span><textarea required rows={2} maxLength={1500} value={view.hint} onChange={e => updateText('hint', e.target.value)} /><small>{t('A helpful nudge, not the answer.')}</small></label>
          <label className="form-field"><span>{t('Worked explanation')}</span><textarea required rows={6} maxLength={16000} value={explanation} onChange={e => updateText('explanation', e.target.value.split('\n'))} placeholder={t('One reasoning step per line.\nUse $x=5$ for inline mathematics.')} /><small>{t('One step per line. Explain which operation is used and why it preserves equality.')}</small></label>
          <label className="form-field"><span>{t('Misconception addressed')}</span><textarea required rows={3} maxLength={1500} value={view.misconception} onChange={e => updateText('misconception', e.target.value)} /><small>{t('Explain the likely misunderstanding without assuming you know the learner’s reasoning.')}</small></label>
        </fieldset>
        <fieldset className="source-checkboxes" disabled={busy}><legend>{t('Research informing the design')}</legend>{sources.map(source => <label key={source.id}><input type="checkbox" checked={question.sourceTags.includes(source.id)} onChange={e => update('sourceTags', e.target.checked ? [...question.sourceTags, source.id] : question.sourceTags.filter(id => id !== source.id))} /><span>{source.authors} ({source.year})<small>{source.title}</small></span></label>)}</fieldset>
        <label className="publish-toggle"><input disabled={busy} type="checkbox" checked={question.published} onChange={e => update('published', e.target.checked)} /><div><strong>{t('Publish this question')}</strong><span>{t('Make it available in guided practice and future exams. Existing exam snapshots stay unchanged.')}</span></div></label>
        {error && <ErrorNotice message={error} />}
        <div className="editor-actions"><button type="button" className="button secondary" disabled={busy} onClick={cancel}>{t('Cancel')}</button><button className="button primary" disabled={busy} type="submit"><Save size={16} />{t(busy ? 'Saving…' : question.published ? 'Save & publish' : 'Save draft')}</button></div>
      </section>
      <aside className="editor-preview"><span className="eyebrow">{t('LIVE CONTENT PREVIEW')} · {contentLanguage === 'nl' ? 'Nederlands' : 'English'}</span>
        <div className="preview-card" lang={contentLanguage}><TopicTag topic={question.topic} /><h3><RichText text={view.prompt || t('Your question appears here.')} /></h3>{question.math && <MathText value={question.math} block />}<div className="preview-options">{view.options.map(option => <div key={option.id} className={question.correctOptionId === option.id ? 'correct' : ''}><span>{option.id.toUpperCase()}</span><div><RichText text={option.text} />{option.math && <MathText value={option.math} />}{!option.text && !option.math && <span className="muted">{t('Answer option')}</span>}</div>{question.correctOptionId === option.id && <CheckCircle2 size={15} />}</div>)}</div></div>
        <div className="preview-reasoning" lang={contentLanguage}><strong>{t('Worked explanation')}</strong>{view.explanation.filter(Boolean).map((step, i) => <p key={i}><RichText text={step} /></p>)}{!explanation && <p className="muted">{t('Your reasoning steps will appear here.')}</p>}</div>
        <div className="notice info"><ShieldCheck size={17} /><span>{t('Plain text and safe math only. HTML, scripts and arbitrary file uploads are not supported.')}</span></div>
      </aside>
    </form>
  </>;
}
