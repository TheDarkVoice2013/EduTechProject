import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ClipboardList, FileJson, LockKeyhole, LogOut, Plus, RefreshCw, Save, Search, ShieldCheck, Upload, X } from 'lucide-react';
import { api, errorText } from './api';
import { ErrorNotice, Loading, MathText, RichText, TopicTag } from './components';
import type { Audit, Question, Session, Source } from './types';

export function Moderator({ session, onSession, sources }: { session: Session; onSession: (session: Session) => void; sources: Source[] }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [tab, setTab] = useState<'questions' | 'import' | 'audit'>('questions');
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [json, setJson] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true); setError('');
    try {
      const [questionData, auditData] = await Promise.all([api<{ questions: Question[] }>('mod/questions'), api<{ entries: Audit[] }>('mod/audit')]);
      setQuestions(questionData.questions); setAudit(auditData.entries);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (session.user) void refresh(); }, [session.user?.username]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { onSession(await api<Session>('auth/login', { username: username.trim(), password })); setPassword(''); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { onSession(await api<Session>('auth/logout', {})); setQuestions([]); setAudit([]); setEditing(null); setMessage(''); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function importQuestions(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (json.length > 250_000) throw new Error('This import is too large. Keep it below 250 KB and 100 questions.');
      const parsed = JSON.parse(json);
      const items = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error('Provide a JSON array of 1–100 questions, or an object with a questions array.');
      const result = await api<{ imported: number }>('mod/import', { questions: items });
      setMessage(`${result.imported} question${result.imported === 1 ? '' : 's'} imported. All records were validated before saving.`); setJson('');
      await refresh();
    } catch (e) { setError(e instanceof SyntaxError ? 'This isn’t valid JSON. Check brackets, quotes and commas, then try again.' : errorText(e)); }
    finally { setBusy(false); }
  }
  async function readFile(file?: File) {
    setError('');
    if (!file) return;
    if (file.size > 250_000) { setError('Choose a JSON file smaller than 250 KB.'); return; }
    try { setJson(await file.text()); } catch { setError('The file couldn’t be read. You can paste its JSON below instead.'); }
    if (uploadRef.current) uploadRef.current.value = '';
  }

  if (!session.user) return <><div className="page-heading"><span className="eyebrow">FOR THE PEOPLE BEHIND THE LESSONS</span><h1>A thoughtful space<br />to keep learning better.</h1><p>Moderator access is for approved content editors. Students can use the entire learning path without an account.</p></div><div className="login-layout"><form className="login-form" onSubmit={login}><span className="login-symbol"><LockKeyhole size={25} /></span><h2>Welcome back.</h2><p>Sign in to review and edit the question bank.</p><label className="form-field"><span>Username</span><input autoComplete="username" required maxLength={100} value={username} onChange={e => setUsername(e.target.value)} /></label><label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <ErrorNotice message={error} />}<button className="button primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in securely'}<ArrowRight size={17} /></button><div className="login-note"><ShieldCheck size={15} /><span>Accounts are provisioned by the site administrator. There is no public registration.</span></div></form><aside className="moderator-values"><span className="eyebrow">CONTENT THAT EARNS TRUST</span><h3>Clear questions.<br />Careful explanations.<br />Traceable changes.</h3><p>Every question includes a worked explanation, a misconception to address, and the research that informed its design.</p><p>Drafts stay private until published. Editor changes are recorded in an audit log.</p></aside></div></>;

  const filtered = questions.filter(question => `${question.id} ${question.prompt} ${question.topic}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="moderator-heading"><div className="page-heading"><span className="eyebrow">MODERATOR WORKSPACE</span><h1>Keep the next step clear.</h1><p>Signed in as <strong>{session.user.username}</strong> · {session.user.role}</p></div><button className="button secondary" onClick={logout} disabled={busy}><LogOut size={16} />Sign out</button></div>
    {editing !== null ? <QuestionEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} sources={sources} onCancel={() => setEditing(null)} onSaved={async question => { setEditing(null); setMessage(`${question.published ? 'Published question' : 'Draft'} “${question.id}” saved.`); await refresh(); }} /> : <>
      <div className="moderator-toolbar"><div className="segmented">{[{ id: 'questions', label: `Questions (${questions.length})` }, { id: 'import', label: 'Import JSON' }, { id: 'audit', label: 'Change history' }].map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? 'selected' : ''} onClick={() => { setTab(item.id as typeof tab); setError(''); setMessage(''); }}>{item.label}</button>)}</div><button className="button primary" onClick={() => { setEditing('new'); setMessage(''); }}><Plus size={16} />New question</button></div>
      {error && <ErrorNotice message={error} />}{message && <div className="notice success" role="status"><CheckCircle2 size={18} /><span>{message}</span></div>}
      {tab === 'questions' && <><div className="question-list-tools"><label className="search-input"><Search size={17} /><span className="sr-only">Search questions</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions, IDs or topics…" /></label><button className="text-button" disabled={loading} onClick={refresh}><RefreshCw size={15} />Refresh</button></div>{loading ? <Loading label="Loading the question bank…" /> : <div className="moderator-question-list">{filtered.length ? filtered.map(question => <button className="moderator-question-row" onClick={() => setEditing(question)} key={question.id}><div><span className="question-id">{question.id}</span><h3><RichText text={question.prompt} /></h3><div className="moderator-question-meta"><TopicTag topic={question.topic} /><span>Level {question.difficulty}</span><span>{question.options.length} options</span></div></div><span className={`publication-badge ${question.published ? 'published' : ''}`}><span className="little-dot" />{question.published ? 'Published' : 'Draft'}</span><ArrowRight size={18} /></button>) : <div className="empty-state"><h3>{search ? 'No matches here.' : 'A fresh question bank.'}</h3><p>{search ? 'Try a different search term.' : 'Create a question or import a validated JSON batch.'}</p></div>}</div>}</>}
      {tab === 'import' && <form className="import-panel" onSubmit={importQuestions}><div className="setup-title"><FileJson size={24} /><h2>Bring your questions in.</h2></div><p>Import up to 100 new questions at once. Every record is validated; if one fails, nothing is saved. Existing IDs are rejected, not overwritten.</p><div className="import-file-row"><input ref={uploadRef} type="file" accept=".json,application/json" id="question-import-file" onChange={e => void readFile(e.target.files?.[0])} /><label className="button secondary" htmlFor="question-import-file"><Upload size={16} />Choose JSON file</label><span>Maximum 250 KB · Read as text only</span></div><label className="form-field"><span>Question JSON</span><textarea className="code-input" rows={17} spellCheck={false} value={json} onChange={e => setJson(e.target.value)} required placeholder={'[\n  { "id": "your-question-id", ... }\n]'} /></label><details className="schema-help"><summary>View the required question format</summary><p>Use the exact keys below. Text is plain text. Math fields contain KaTeX; inline math in explanations is wrapped in dollar signs. Option IDs must be a, b, c or d. Research IDs: {sources.map(source => source.id).join(', ')}.</p><pre>{JSON.stringify(exampleQuestion, null, 2)}</pre></details><button className="button primary" disabled={busy || !json.trim()} type="submit">{busy ? 'Validating & importing…' : 'Validate & import'}<Upload size={16} /></button></form>}
      {tab === 'audit' && <section className="audit-panel"><div className="section-heading"><div><span className="eyebrow">ACCOUNTABILITY, BUILT IN</span><h2>Change history</h2></div><button className="text-button" disabled={loading} onClick={refresh}><RefreshCw size={15} />Refresh</button></div>{loading ? <Loading /> : !audit.length ? <div className="empty-state"><ClipboardList size={30} /><h3>No content changes yet.</h3><p>Question edits and imports will appear here.</p></div> : <div className="table-scroll"><table><thead><tr><th>When</th><th>Editor</th><th>Action</th><th>Question</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{entry.username}</td><td>{entry.action.replaceAll('_', ' ')}</td><td>{entry.questionId || '—'}</td></tr>)}</tbody></table></div>}</section>}
    </>}
  </>;
}

const exampleQuestion: Question = {
  id: 'equation-your-new-id', topic: 'equations', difficulty: 1,
  prompt: 'Which value of x makes the equation true?', math: 'x + 3 = 7',
  options: [{ id: 'a', text: '', math: 'x = 4' }, { id: 'b', text: '', math: 'x = 10' }, { id: 'c', text: '', math: 'x = 3' }, { id: 'd', text: '', math: 'x = 7' }],
  correctOptionId: 'a', hint: 'Which operation undoes adding 3?',
  explanation: ['Subtract 3 from both sides: $x=7-3=4$.', 'Check in the original equation: $4+3=7$.'],
  misconception: 'Adding 3 again does not undo the original addition.', sourceTags: ['otten'], published: false,
};
const blankQuestion = (): Question => ({ id: '', topic: 'equations', difficulty: 1, prompt: '', math: '', options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: '', math: '' })), correctOptionId: 'a', hint: '', explanation: [''], misconception: '', sourceTags: [], published: false });

function QuestionEditor({ initial, sources, onCancel, onSaved }: { initial?: Question; sources: Source[]; onCancel: () => void; onSaved: (question: Question) => void }) {
  const [question, setQuestion] = useState<Question>(() => initial ? structuredClone(initial) : blankQuestion());
  const [explanation, setExplanation] = useState(initial?.explanation.join('\n') || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  function update<K extends keyof Question>(key: K, value: Question[K]) { setQuestion(current => ({ ...current, [key]: value })); setDirty(true); }
  function cancel() { if (!dirty || window.confirm('Leave this editor and discard unsaved changes?')) onCancel(); }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!question.sourceTags.length) { setError('Select at least one research source for this question.'); return; }
    if (question.options.some(option => !option.text.trim() && !option.math?.trim())) { setError('Each answer option needs text, a mathematical expression, or both.'); return; }
    const steps = explanation.split('\n').map(step => step.trim()).filter(Boolean);
    if (!steps.length) { setError('Add at least one explanation step.'); return; }
    if (steps.length > 15 || steps.some(step => step.length > 2500)) { setError('Use no more than 15 explanation steps, each below 2,500 characters.'); return; }
    const payload: Question = { ...question, explanation: steps };
    setBusy(true);
    try {
      const result = await api<{ question: Question }>(initial ? `mod/questions/${encodeURIComponent(initial.id)}` : 'mod/questions', payload, initial ? 'PUT' : 'POST');
      setDirty(false); onSaved(result.question);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <><button className="inline-link text-button back-link" onClick={cancel}><ChevronLeft size={16} />Back to question bank</button><form onSubmit={save} className="editor-layout"><section className="question-editor"><div className="editor-heading"><h2>{initial ? 'Refine the question.' : 'Create a clear question.'}</h2><p>Every explanation should name the operation and justify why it is valid. Drafts are not visible to students.</p></div><div className="form-grid"><label className="form-field"><span>Question ID</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} disabled={!!initial} value={question.id} onChange={e => update('id', e.target.value)} placeholder="equation-undo-addition-01" /><small>Unique lowercase slug. Can’t be changed after creation.</small></label><label className="form-field"><span>Topic</span><select value={question.topic} onChange={e => update('topic', e.target.value as Question['topic'])}><option value="equations">Equations</option><option value="logarithms">Logarithms</option></select></label><label className="form-field"><span>Difficulty</span><select value={question.difficulty} onChange={e => update('difficulty', Number(e.target.value) as Question['difficulty'])}><option value={1}>1 — Foundation</option><option value={2}>2 — Building fluency</option><option value={3}>3 — Stretch</option></select></label></div><label className="form-field"><span>Question prompt</span><textarea rows={3} required maxLength={1500} value={question.prompt} onChange={e => update('prompt', e.target.value)} /></label><label className="form-field"><span>Equation / mathematical expression <small>Optional · KaTeX</small></span><input value={question.math || ''} maxLength={1200} onChange={e => update('math', e.target.value)} placeholder="3x + 5 = 20" /></label>
      <fieldset className="editor-options"><legend>Answer options</legend><p>Select the radio button beside the correct answer. Every option needs text or math.</p>{question.options.map((option, i) => <div key={option.id} className="editor-option"><label className="correct-option"><input type="radio" name="correct-option" checked={question.correctOptionId === option.id} onChange={() => update('correctOptionId', option.id)} /><span>{option.id.toUpperCase()}</span><span className="sr-only">Mark option {option.id.toUpperCase()} correct</span></label><div><label className="form-field"><span className="sr-only">Option {option.id.toUpperCase()} text</span><input placeholder="Answer text (optional if math is provided)" value={option.text} maxLength={800} onChange={e => update('options', question.options.map((o, j) => i === j ? { ...o, text: e.target.value } : o))} /></label><label className="form-field"><span className="sr-only">Option {option.id.toUpperCase()} math</span><input className="math-input" placeholder="KaTeX expression (optional)" value={option.math || ''} maxLength={1200} onChange={e => update('options', question.options.map((o, j) => i === j ? { ...o, math: e.target.value } : o))} /></label></div></div>)}</fieldset>
      <label className="form-field"><span>Hint</span><textarea required rows={2} maxLength={1500} value={question.hint} onChange={e => update('hint', e.target.value)} /><small>A helpful nudge, not the answer.</small></label><label className="form-field"><span>Worked explanation</span><textarea required rows={6} maxLength={16000} value={explanation} onChange={e => { setExplanation(e.target.value); setDirty(true); }} placeholder={'One reasoning step per line.\nUse $x=5$ for inline mathematics.'} /><small>One step per line. Explain which operation is used and why it preserves equality.</small></label><label className="form-field"><span>Misconception addressed</span><textarea required rows={3} maxLength={1500} value={question.misconception} onChange={e => update('misconception', e.target.value)} /><small>Explain the likely misunderstanding without assuming you know the learner’s reasoning.</small></label>
      <fieldset className="source-checkboxes"><legend>Research informing the design</legend>{sources.map(source => <label key={source.id}><input type="checkbox" checked={question.sourceTags.includes(source.id)} onChange={e => update('sourceTags', e.target.checked ? [...question.sourceTags, source.id] : question.sourceTags.filter(id => id !== source.id))} /><span>{source.authors} ({source.year})<small>{source.title}</small></span></label>)}</fieldset><label className="publish-toggle"><input type="checkbox" checked={question.published} onChange={e => update('published', e.target.checked)} /><div><strong>Publish this question</strong><span>Make it available in guided practice and future exams. Existing exam snapshots stay unchanged.</span></div></label>{error && <ErrorNotice message={error} />}<div className="editor-actions"><button type="button" className="button secondary" disabled={busy} onClick={cancel}>Cancel</button><button className="button primary" disabled={busy} type="submit"><Save size={16} />{busy ? 'Saving…' : question.published ? 'Save & publish' : 'Save draft'}</button></div>
    </section><aside className="editor-preview"><span className="eyebrow">LIVE CONTENT PREVIEW</span><div className="preview-card"><TopicTag topic={question.topic} /><h3><RichText text={question.prompt || 'Your question appears here.'} /></h3>{question.math && <MathText value={question.math} block />}<div className="preview-options">{question.options.map(option => <div key={option.id} className={question.correctOptionId === option.id ? 'correct' : ''}><span>{option.id.toUpperCase()}</span><div><RichText text={option.text} />{option.math && <MathText value={option.math} />}{!option.text && !option.math && <span className="muted">Answer option</span>}</div>{question.correctOptionId === option.id && <CheckCircle2 size={15} />}</div>)}</div></div><div className="preview-reasoning"><strong>Worked explanation</strong>{explanation.split('\n').filter(Boolean).map((step, i) => <p key={i}><RichText text={step} /></p>)}{!explanation && <p className="muted">Your reasoning steps will appear here.</p>}</div><div className="notice info"><ShieldCheck size={17} /><span>Plain text and safe math only. HTML, scripts and arbitrary file uploads are not supported.</span></div></aside></form></>;
}
