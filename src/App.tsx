import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3, GraduationCap, Home, Leaf, LockKeyhole, Menu, PencilLine, RotateCcw, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { api, errorText, rememberSession } from './api';
import { ErrorNotice, Loading, MathText } from './components';
import type { Lesson, Progress, Session, Source } from './types';
import { Lessons } from './Lessons';
import { Practice } from './Practice';
import { Exam } from './Exam';
import { Moderator } from './Moderator';

const STORAGE_KEY = 'edutech-progress-v1';
const emptyProgress = (): Progress => ({ lessons: [], practice: {}, exams: [] });
function readProgress(): Progress {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || !Array.isArray(data.lessons) || !data.practice || typeof data.practice !== 'object' || !Array.isArray(data.exams)) return emptyProgress();
    return {
      lessons: data.lessons.filter((id: unknown) => typeof id === 'string').slice(0, 500),
      practice: Object.fromEntries(Object.entries(data.practice).filter(([, value]) => typeof value === 'boolean').slice(0, 1000)) as Record<string, boolean>,
      exams: data.exams.filter((e: { correct?: unknown; total?: unknown; date?: unknown }) => typeof e.correct === 'number' && typeof e.total === 'number' && typeof e.date === 'string').slice(-100),
    };
  } catch { return emptyProgress(); }
}

const stages = [
  { id: 'equations', number: '01', title: 'Equations', subtitle: 'Make both sides make sense', icon: BookOpen },
  { id: 'logarithms', number: '02', title: 'Logarithms', subtitle: 'Think backwards. Find the power.', icon: Sparkles },
  { id: 'practice', number: '03', title: 'Guided practice', subtitle: 'Try, reflect, understand', icon: PencilLine },
  { id: 'exam', number: '04', title: 'Test yourself', subtitle: 'Your knowledge. Your next step.', icon: Clock3 },
];

export default function App() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSessionState] = useState<Session | null>(null);
  const [content, setContent] = useState<{ lessons: Lesson[]; sources: Source[] } | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const page = route.split('/')[0];

  function setSession(next: Session) { rememberSession(next); setSessionState(next); }
  useEffect(() => {
    let alive = true;
    async function init() {
      try {
        const next = await api<Session>('session');
        if (!alive) return;
        setSession(next);
        const data = await api<{ lessons: Lesson[]; sources: Source[] }>('content');
        if (alive) setContent(data);
      } catch (e) { if (alive) setError(errorText(e)); }
    }
    void init();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    function navigate() { setRoute(location.hash.slice(1) || 'home'); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { setStorageAvailable(false); }
  }, [progress]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLButtonElement>('.close-nav')?.focus();
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        document.querySelector<HTMLButtonElement>('.mobile-menu')?.focus();
      }
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll<HTMLElement>('.sidebar a, .sidebar button')];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    window.addEventListener('keydown', dismiss);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', dismiss); };
  }, [mobileOpen]);
  useEffect(() => {
    const label = stages.find(stage => stage.id === page)?.title || ({ home: 'Your learning path', sources: 'Our teaching approach', moderator: 'Moderator workspace' }[page]) || 'Your learning path';
    document.title = `${label} · EduTech`;
  }, [page]);

  if (error) return <main className="boot-screen"><div className="brand"><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></div><h1>A small pause in learning.</h1><ErrorNotice message={error} /><p>We couldn’t connect to the learning service. Please try again in a moment.</p><button className="button primary" onClick={() => location.reload()}>Try again <RotateCcw size={16} /></button></main>;
  if (!content || !session) return <main className="boot-screen"><div className="brand"><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></div><Loading label="Opening your learning space…" /></main>;

  const doneCount = content.lessons.filter(lesson => progress.lessons.includes(lesson.id)).length;
  const percentage = content.lessons.length ? Math.round(doneCount / content.lessons.length * 100) : 0;
  const pageName = stages.find(stage => stage.id === page)?.title || ({ home: 'Your learning path', sources: 'Our teaching approach', moderator: 'Moderator workspace' }[page]) || 'Your learning path';

  function resetProgress() {
    if (window.confirm('Reset lesson completion, practice history and exam summaries saved in this browser? This won’t end an active exam.')) setProgress(emptyProgress());
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Learning navigation">
      <div className="sidebar-top"><a href="#home" className="brand" aria-label="EduTech home"><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></a><button className="icon-button close-nav" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={22} /></button></div>
      <p className="brand-caption">Understand the next step.</p>
      <nav>
        <a className={`nav-link overview-link ${page === 'home' ? 'active' : ''}`} href="#home" aria-current={page === 'home' ? 'page' : undefined}><Home size={18} />Overview</a>
        <div className="nav-label">YOUR LEARNING PATH</div>
        {stages.map(stage => <a key={stage.id} className={`nav-link stage-nav ${page === stage.id ? 'active' : ''}`} href={`#${stage.id}`} aria-current={page === stage.id ? 'page' : undefined}><span className="nav-number">{stage.number}</span><span>{stage.title}</span>{page === stage.id && <span className="active-dot" />}</a>)}
        <div className="nav-separator" />
        <a className={`nav-link ${page === 'sources' ? 'active' : ''}`} href="#sources" aria-current={page === 'sources' ? 'page' : undefined}><CircleHelp size={18} />Why we teach this way</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="progress-card"><div className="progress-top"><span>Your understanding, growing</span><Leaf size={17} /></div><div className="progress-track" role="progressbar" aria-label="Lessons completed" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={content.lessons.length || 1}><span style={{ width: `${percentage}%` }} /></div><p><strong>{doneCount}</strong> of {content.lessons.length} lessons completed</p><span className="local-label"><LockKeyhole size={11} /> Saved on this browser</span></div>
        <a className={`nav-link moderator-link ${page === 'moderator' ? 'active' : ''}`} href="#moderator"><ShieldCheck size={17} />{session.user ? session.user.username : 'Moderator access'}</a>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu size={21} /></button><span>Learning space</span><ChevronRight size={13} /><strong>{pageName}</strong></div><span className="topbar-note"><span className="little-dot" />Small steps. Real understanding.</span></header>
      <main id="main-content" tabIndex={-1} className={`main-content ${page === 'moderator' ? 'wide-content' : ''}`}>
        {!storageAvailable && <div className="notice info" role="status">Browser storage isn’t available. Your progress will last for this visit only.</div>}
        {page === 'equations' || page === 'logarithms' ? <Lessons key={page} topic={page} lessons={content.lessons.filter(lesson => lesson.topic === page)} sources={content.sources} selectedId={route.split('/')[1]} completed={progress.lessons} onComplete={id => setProgress(current => ({ ...current, lessons: [...new Set([...current.lessons, id])] }))} /> :
          page === 'practice' ? <Practice sources={content.sources} onResult={(id, correct) => setProgress(current => ({ ...current, practice: { ...current.practice, [id]: current.practice[id] || correct } }))} /> :
          page === 'exam' ? <Exam onComplete={(result, id) => { const key = `edutech-exam-recorded-${id}`; try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, 'yes'); } catch { /* Progress remains usable if storage is blocked. */ } setProgress(current => ({ ...current, exams: [...current.exams, { ...result, date: new Date().toISOString() }].slice(-100) })); }} /> :
          page === 'sources' ? <Methodology sources={content.sources} /> :
          page === 'moderator' ? <Moderator session={session} onSession={setSession} sources={content.sources} /> :
          <Overview lessons={content.lessons} progress={progress} />}
        <footer className="footer"><span>Made for the moment it clicks.</span><div><a href="#sources">Research & approach</a><details className="privacy-details"><summary>Privacy & progress</summary><div className="privacy-popover"><strong>Your learning stays yours.</strong><p>No student account or analytics trackers. Completed lessons, practice progress and exam summaries are stored in this browser, not synced between devices. An essential session cookie connects you to the service; timed exams and answers are stored on the server for continuity. Moderators’ changes are logged for accountability.</p><button className="text-button" onClick={resetProgress}><RotateCcw size={13} /> Reset browser progress</button></div></details></div></footer>
      </main>
    </div>
  </div>;
}

function Overview({ lessons, progress }: { lessons: Lesson[]; progress: Progress }) {
  const nextLesson = lessons.find(lesson => !progress.lessons.includes(lesson.id));
  const correctPractice = Object.values(progress.practice).filter(Boolean).length;
  const lastExam = progress.exams.at(-1);
  return <>
    <section className="welcome-section"><div className="welcome-copy"><span className="eyebrow"><span className="little-dot" /> A CLEARER WAY TO LEARN MATH</span><h1>Don’t just find <em>x.</em><br />Understand <em>why.</em></h1><p>From your first equation to your next logarithm.<br className="desktop-break" /> Build understanding, practise with purpose, and put it all together.</p><a className="button primary" href={nextLesson ? `#${nextLesson.topic}/${nextLesson.id}` : '#practice'}>{progress.lessons.length ? 'Continue learning' : 'Start with equations'}<ArrowRight size={18} /></a><span className="welcome-note">Free to learn. No account needed.</span></div>
      <div className="equation-art" aria-label="An equation solved through three justified steps"><div className="art-heading"><span className="little-dot" /> ONE IDEA, THREE SMALL STEPS <Sparkles size={16} /></div><div className="art-equation"><MathText value="3x + 5 = 20" /></div><div className="art-operation"><span /> subtract 5 from both sides <span /></div><div className="art-equation middle"><MathText value="3x = 15" /></div><div className="art-operation"><span /> divide both sides by 3 <span /></div><div className="art-answer"><MathText value="x = 5" /><span><Check size={14} /> Now it makes sense.</span></div><div className="art-scribble">Same value. Both sides. Every step.</div></div>
    </section>
    <div className="section-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h2>One path. Four phases.</h2></div><span className="section-aside">At your pace, in your order.</span></div>
    <div className="overview-columns"><section className="learning-path" aria-label="Four learning phases">{stages.map(stage => {
      const stageLessons = lessons.filter(lesson => lesson.topic === stage.id);
      const done = stageLessons.filter(lesson => progress.lessons.includes(lesson.id)).length;
      const Icon = stage.icon;
      return <a key={stage.id} href={`#${stage.id}`} className={`path-step path-${stage.id}`}><div className="path-number">{stage.number}</div><div className="path-step-content"><div className="path-step-title"><h3>{stage.title}</h3><span className="path-type">{stage.number === '01' || stage.number === '02' ? 'LEARN' : stage.number === '03' ? 'APPLY' : 'ASSESS'}</span></div><p>{stage.subtitle}</p><div className="path-meta"><Icon size={13} />{stageLessons.length ? `${stageLessons.length} lessons · ${stageLessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} min${done ? ` · ${done} completed` : ''}` : stage.id === 'practice' ? 'Hints, worked solutions & the reason behind each step' : '10 or 20 questions · Your choice of pace'}</div></div><ArrowRight className="path-arrow" size={20} /></a>;
    })}</section>
      <aside className="approach-aside"><div className="approach-symbol"><GraduationCap size={25} /></div><span className="eyebrow">UNDERSTANDING FIRST</span><h3>There’s a reason<br />behind every step.</h3><p>We connect the rules to their meaning, compare different solutions, and use mistakes as a starting point.</p><p className="small-text">Our lesson design draws on research in mathematics education. We show our sources—and their limits.</p><a href="#sources" className="inline-link">Meet the thinking behind it <ArrowUpRight size={15} /></a><div className="aside-bottom"><span className="little-dot" /> Research-informed. Human-paced.</div></aside>
    </div>
    {(Object.keys(progress.practice).length > 0 || lastExam) && <section className="your-progress"><div><Target size={20} /><h3>A little progress adds up.</h3></div><p>{Object.keys(progress.practice).length > 0 && <span>{correctPractice} of {Object.keys(progress.practice).length} attempted practice questions answered correctly at least once.</span>}{lastExam && <span>Last completed exam: {lastExam.correct}/{lastExam.total}.</span>}</p></section>}
    <div className="quiet-note"><Leaf size={17} /><span>You don’t need to be “a maths person.” Just curious about the next step.</span></div>
  </>;
}

function Methodology({ sources }: { sources: Source[] }) {
  return <><div className="page-heading"><span className="eyebrow">THE THINKING BEHIND THE TEACHING</span><h1>Understanding is<br />the whole point.</h1><p>These papers informed how we designed the lessons, examples and feedback. They don’t validate this particular website, and no single teaching method works best in every setting.</p></div>
    <div className="method-principles"><div><span>01</span><h3>Meaning before shorthand</h3><p>Connect equality to equivalent operations. Then introduce efficient notation without losing the reason it works.</p></div><div><span>02</span><h3>More than one way</h3><p>Compare worked solutions. Explain why both are valid, and decide which is simpler for this problem.</p></div><div><span>03</span><h3>Mistakes are information</h3><p>Use feedback to identify the assumption behind an error, then test a better idea.</p></div></div>
    <div className="section-heading"><div><span className="eyebrow">OUR READING LIST</span><h2>Research, with context.</h2></div><span className="section-aside">Original papers linked below</span></div>
    <div className="source-list">{sources.map((source, index) => <article className="source-entry" key={source.id} id={`source-${source.id}`}><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div><div className="source-citation">{source.authors} · {source.year}</div><h3><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={17} /></a></h3><div className="source-detail"><strong>How we use it</strong><p>{source.application}</p></div><div className="source-detail source-limit"><strong>What not to assume</strong><p>{source.limitation}</p></div></div></article>)}</div>
    <div className="notice info"><BookOpen size={21} /><div><strong>Our design choices are a synthesis.</strong><p>Progressive hints, checkpoints and the four-phase learning path are implementation choices. Timed exams are for self-assessment, not a diagnosis of mathematical ability. All learning content is written for this site; research is attributed, not reproduced.</p></div></div>
  </>;
}
