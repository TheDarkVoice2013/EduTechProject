import { t, useLanguage } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, FileJson, LockKeyhole, LogOut, Plus, RefreshCw, Search, ShieldCheck, Upload } from 'lucide-react';
import { api, errorText } from './api';
import { ErrorNotice, Loading, MathText, RichText, TopicTag } from './components';
import type { Audit, Question, Session, Source } from './types';
import { QuestionEditor } from './QuestionEditor';

function auditLabel(action: string) {
  const labels: Record<string, string> = { 'question.create': 'Created question', 'question.update': 'Updated question', 'question.import': 'Imported question', 'question.snapshot': 'Saved previous version', 'question.translation': 'Added Dutch translation', 'user.create': 'Created account', 'user.reset': 'Reset account password' };
  return t(labels[action] || action.replaceAll('_', ' ').replaceAll('.', ' '));
}

export function Moderator({ session, onSession, sources }: { session: Session; onSession: (session: Session) => void; sources: Source[] }) {
  const { language } = useLanguage();
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
      if (json.length > 250_000) throw new Error(t("This import is too large. Keep it below 250 KB and 100 questions."));
      const parsed = JSON.parse(json);
      const items = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error(t("Provide a JSON array of 1–100 questions, or an object with a questions array."));
      const result = await api<{ imported: number }>('mod/import', { questions: items });
      setMessage(t('{count} questions imported.', { count: result.imported })); setJson('');
      await refresh();
    } catch (e) { setError(e instanceof SyntaxError ? t("This isn’t valid JSON. Check brackets, quotes and commas, then try again.") : errorText(e)); }
    finally { setBusy(false); }
  }
  async function readFile(file?: File) {
    setError('');
    if (!file) return;
    if (file.size > 250_000) { setError(t("Choose a JSON file smaller than 250 KB.")); return; }
    try { setJson(await file.text()); } catch { setError(t("The file couldn’t be read. You can paste its JSON below instead.")); }
    if (uploadRef.current) uploadRef.current.value = '';
  }

  if (!session.user) return <><div className="page-heading"><span className="eyebrow">{t("FOR THE PEOPLE BEHIND THE LESSONS")}</span><h1>{t("A thoughtful space")}<br />{t("to keep learning better.")}</h1><p>{t("Moderator access is for approved content editors. Students can use the entire learning path without an account.")}</p></div><div className="login-layout"><form className="login-form" onSubmit={login}><span className="login-symbol"><LockKeyhole size={25} /></span><h2>{t("Welcome back.")}</h2><p>{t("Sign in to review and edit the question bank.")}</p><label className="form-field"><span>{t("Username")}</span><input autoComplete="username" required maxLength={100} value={username} onChange={e => setUsername(e.target.value)} /></label><label className="form-field"><span>{t("Password")}</span><input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <ErrorNotice message={error} />}<button className="button primary" disabled={busy} type="submit">{busy ? t("Signing in…") : t("Sign in securely")}<ArrowRight size={17} /></button><div className="login-note"><ShieldCheck size={15} /><span>{t("Accounts are provisioned by the site administrator. There is no public registration.")}</span></div></form><aside className="moderator-values"><span className="eyebrow">{t("CONTENT THAT EARNS TRUST")}</span><h3>{t("Clear questions.")}<br />{t("Careful explanations.")}<br />{t("Traceable changes.")}</h3><p>{t("Every question includes a worked explanation, a misconception to address, and the research that informed its design.")}</p><p>{t("Drafts stay private until published. Editor changes are recorded in an audit log.")}</p></aside></div></>;

  const filtered = questions.filter(question => `${question.id} ${question.prompt} ${question.translations?.nl?.prompt || ''} ${question.topic} ${t(question.topic === 'equations' ? 'Equations' : 'Logarithms')}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="moderator-heading"><div className="page-heading"><span className="eyebrow">{t("MODERATOR WORKSPACE")}</span><h1>{t("Keep the next step clear.")}</h1><p>{t("Signed in as")} <strong>{session.user.username}</strong> · {t(session.user.role === 'admin' ? 'administrator' : 'moderator')}</p></div><button className="button secondary" onClick={logout} disabled={busy}><LogOut size={16} />{t("Sign out")}</button></div>
    {editing !== null ? <QuestionEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} sources={sources} onCancel={() => setEditing(null)} onSaved={async question => { setEditing(null); setMessage(t('{status} “{id}” saved.', { status: t(question.published ? 'Published question' : 'Draft'), id: question.id })); await refresh(); }} /> : <>
      <div className="moderator-toolbar"><div className="segmented">{[{ id: 'questions', label: t('Questions ({count})', { count: questions.length }) }, { id: 'import', label: t("Import JSON") }, { id: 'audit', label: t("Change history") }].map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? 'selected' : ''} onClick={() => { setTab(item.id as typeof tab); setError(''); setMessage(''); }}>{item.label}</button>)}</div><button className="button primary" onClick={() => { setEditing('new'); setMessage(''); }}><Plus size={16} />{t("New question")}</button></div>
      {error && <ErrorNotice message={error} />}{message && <div className="notice success" role="status"><CheckCircle2 size={18} /><span>{message}</span></div>}
      {tab === 'questions' && <><div className="question-list-tools"><label className="search-input"><Search size={17} /><span className="sr-only">{t("Search questions")}</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search questions, IDs or topics…")} /></label><button className="text-button" disabled={loading} onClick={refresh}><RefreshCw size={15} />{t("Refresh")}</button></div>{loading ? <Loading label={t("Loading the question bank…")} /> : <div className="moderator-question-list">{filtered.length ? filtered.map(question => <button className="moderator-question-row" onClick={() => setEditing(question)} key={question.id}><div><span className="question-id">{question.id}</span><h3><RichText text={language === 'nl' ? question.translations?.nl?.prompt || question.prompt : question.prompt} /></h3><div className="moderator-question-meta"><TopicTag topic={question.topic} /><span>{t("Level")} {question.difficulty}</span><span>{question.options.length} {t("options")}</span><span>{t(question.translations?.nl ? 'Dutch and English' : 'English only — Dutch translation needed')}</span></div></div><span className={`publication-badge ${question.published ? 'published' : ''}`}><span className="little-dot" />{question.published ? t("Published") : t("Draft")}</span><ArrowRight size={18} /></button>) : <div className="empty-state"><h3>{search ? t("No matches here.") : t("A fresh question bank.")}</h3><p>{search ? t("Try a different search term.") : t("Create a question or import a validated JSON batch.")}</p></div>}</div>}</>}
      {tab === 'import' && <form className="import-panel" onSubmit={importQuestions}><div className="setup-title"><FileJson size={24} /><h2>{t("Bring your questions in.")}</h2></div><p>{t("Import up to 100 new questions at once. Every record is validated; if one fails, nothing is saved. Existing IDs are rejected, not overwritten.")}</p><div className="import-file-row"><input ref={uploadRef} type="file" accept=".json,application/json" id="question-import-file" onChange={e => void readFile(e.target.files?.[0])} /><label className="button secondary" htmlFor="question-import-file"><Upload size={16} />{t("Choose JSON file")}</label><span>{t("Maximum 250 KB · Read as text only")}</span></div><label className="form-field"><span>{t("Question JSON")}</span><textarea className="code-input" rows={17} spellCheck={false} value={json} onChange={e => setJson(e.target.value)} required placeholder={'[\n  { "id": "your-question-id", ... }\n]'} /></label><details className="schema-help"><summary>{t("View the required question format")}</summary><p>{t("Use the exact keys below. Text is plain text. Math fields contain KaTeX; inline math in explanations is wrapped in dollar signs. Option IDs must be a, b, c or d. Research IDs:")} {sources.map(source => source.id).join(', ')}.</p><pre>{JSON.stringify(exampleQuestion, null, 2)}</pre></details><button className="button primary" disabled={busy || !json.trim()} type="submit">{busy ? t("Validating & importing…") : t("Validate & import")}<Upload size={16} /></button></form>}
      {tab === 'audit' && <section className="audit-panel"><div className="section-heading"><div><span className="eyebrow">{t("ACCOUNTABILITY, BUILT IN")}</span><h2>{t("Change history")}</h2></div><button className="text-button" disabled={loading} onClick={refresh}><RefreshCw size={15} />{t("Refresh")}</button></div>{loading ? <Loading /> : !audit.length ? <div className="empty-state"><ClipboardList size={30} /><h3>{t("No content changes yet.")}</h3><p>{t("Question edits and imports will appear here.")}</p></div> : <div className="table-scroll"><table><thead><tr><th>{t("When")}</th><th>{t("Editor")}</th><th>{t("Action")}</th><th>{t("Question")}</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString(language === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{entry.username}</td><td>{auditLabel(entry.action)}</td><td>{entry.questionId || '—'}</td></tr>)}</tbody></table></div>}</section>}
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
  translations: { nl: {
    prompt: 'Welk getal kun je voor x invullen zodat links en rechts evenveel is?',
    options: [{ id: 'a', text: '', math: 'x = 4' }, { id: 'b', text: '', math: 'x = 10' }, { id: 'c', text: '', math: 'x = 3' }, { id: 'd', text: '', math: 'x = 7' }],
    hint: 'Welke rekenstap maakt 3 erbij ongedaan?',
    explanation: ['Haal aan beide kanten 3 weg: $x=7-3=4$.', 'Vul 4 in op de plek van x en controleer: $4+3=7$.'],
    misconception: 'Als je nog eens 3 erbij doet, maak je de eerdere optelling niet ongedaan.',
  } },
};
