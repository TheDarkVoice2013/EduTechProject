import { t, useLanguage, LanguageProvider, LanguageSwitch } from './i18n';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3, GraduationCap, Home, Leaf, LockKeyhole, Menu, PencilLine, RotateCcw, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { api, errorText, rememberSession } from './api';
import { ErrorNotice, Loading, MathText } from './components';
import type { Lesson, Progress, Session, Source } from './types';
import { Lessons } from './Lessons';
import { Practice } from './Practice';
import { Exam } from './Exam';
import { Moderator } from './Moderator';
import { Glossary, VocabularyProvider } from './Vocabulary';
import './beginner.css';

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
  return <LanguageProvider><VocabularyProvider><AppContent /></VocabularyProvider></LanguageProvider>;
}

function AppContent() {
  const { language } = useLanguage();
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
      } catch (e) { if (alive) setError(errorText(e)); }
    }
    void init();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!session) return;
    let alive = true;
    setError('');
    // Keep the screen mounted: language changes must not discard an exam or editor draft.
    api<{ lessons: Lesson[]; sources: Source[] }>('content').then(data => {
      if (alive) setContent(data);
    }).catch(e => { if (alive) setError(errorText(e)); });
    return () => { alive = false; };
  }, [language, !!session]);
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
    const label = stages.find(stage => stage.id === page)?.title || ({ home: t("Your learning path"), glossary: language === 'nl' ? 'Woordenlijst' : 'Word list', sources: t("Our teaching approach"), moderator: t("Moderator workspace") }[page]) || t("Your learning path");
    document.title = `${t(label)} · EduTech`;
  }, [page, language]);

  if (error && (!content || !session)) return <main className="boot-screen"><LanguageSwitch /><div className="brand"><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></div><h1>{t("A small pause in learning.")}</h1><ErrorNotice message={error} /><p>{t("We couldn’t connect to the learning service. Please try again in a moment.")}</p><button className="button primary" onClick={() => location.reload()}>{t("Try again")} <RotateCcw size={16} /></button></main>;
  if (!content || !session) return <main className="boot-screen"><div className="brand"><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></div><Loading label={t("Opening your learning space…")} /></main>;

  const doneCount = content.lessons.filter(lesson => progress.lessons.includes(lesson.id)).length;
  const percentage = content.lessons.length ? Math.round(doneCount / content.lessons.length * 100) : 0;
  const pageName = stages.find(stage => stage.id === page)?.title || ({ home: t("Your learning path"), glossary: language === 'nl' ? 'Woordenlijst' : 'Word list', sources: t("Our teaching approach"), moderator: t("Moderator workspace") }[page]) || t("Your learning path");

  function resetProgress() {
    if (window.confirm(t("Reset lesson completion, practice history and exam summaries saved in this browser? This won’t end an active exam."))) setProgress(emptyProgress());
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t("Skip to content")}</a>
    <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label={t("Learning navigation")}>
      <div className="sidebar-top"><a href="#home" className="brand" aria-label={t("EduTech home")}><span className="brand-mark">e<span>·</span></span>EduTech<span className="brand-dot">.</span></a><button className="icon-button close-nav" onClick={() => setMobileOpen(false)} aria-label={t("Close navigation")}><X size={22} /></button></div>
      <p className="brand-caption">{t("Understand the next step.")}</p>
      <nav>
        <a className={`nav-link overview-link ${page === 'home' ? 'active' : ''}`} href="#home" aria-current={page === 'home' ? 'page' : undefined}><Home size={18} />{t("Overview")}</a>
        <div className="nav-label">{t("YOUR LEARNING PATH")}</div>
        {stages.map(stage => <a key={stage.id} className={`nav-link stage-nav ${page === stage.id ? 'active' : ''}`} href={`#${stage.id}`} aria-current={page === stage.id ? 'page' : undefined}><span className="nav-number">{stage.number}</span><span>{t(stage.title)}</span>{page === stage.id && <span className="active-dot" />}</a>)}
        <div className="nav-separator" />
        <a className={`nav-link ${page === 'glossary' ? 'active' : ''}`} href="#glossary" aria-current={page === 'glossary' ? 'page' : undefined}><BookOpen size={18} />{language === 'nl' ? 'Woordenlijst' : 'Word list'}</a>
        <a className={`nav-link ${page === 'sources' ? 'active' : ''}`} href="#sources" aria-current={page === 'sources' ? 'page' : undefined}><CircleHelp size={18} />{t("Why we teach this way")}</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="progress-card"><div className="progress-top"><span>{t("Your understanding, growing")}</span><Leaf size={17} /></div><div className="progress-track" role="progressbar" aria-label={t("Lessons completed")} aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={content.lessons.length || 1}><span style={{ width: `${percentage}%` }} /></div><p><strong>{doneCount}</strong> {t("of")} {content.lessons.length} {t("lessons completed")}</p><span className="local-label"><LockKeyhole size={11} /> {t("Saved on this browser")}</span></div>
        <a className={`nav-link moderator-link ${page === 'moderator' ? 'active' : ''}`} href="#moderator"><ShieldCheck size={17} />{session.user ? session.user.username : t("Moderator access")}</a>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label={t("Open navigation")} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu size={21} /></button><span>{t("Learning space")}</span><ChevronRight size={13} /><strong>{t(pageName)}</strong></div><span className="topbar-note"><span className="little-dot" />{t("Small steps. Real understanding.")}</span><LanguageSwitch /></header>
      <main id="main-content" tabIndex={-1} className={`main-content ${page === 'moderator' ? 'wide-content' : ''}`}>
        {error && <ErrorNotice message={error} />}
        {!storageAvailable && <div className="notice info" role="status">{t("Browser storage isn’t available. Your progress will last for this visit only.")}</div>}
        {page === 'equations' || page === 'logarithms' ? <Lessons key={page} topic={page} lessons={content.lessons.filter(lesson => lesson.topic === page)} sources={content.sources} selectedId={route.split('/')[1]} completed={progress.lessons} onComplete={id => setProgress(current => ({ ...current, lessons: [...new Set([...current.lessons, id])] }))} /> :
          page === 'practice' ? <Practice sources={content.sources} onResult={(id, correct) => setProgress(current => ({ ...current, practice: { ...current.practice, [id]: current.practice[id] || correct } }))} /> :
          page === 'exam' ? <Exam onComplete={(result, id) => { const key = `edutech-exam-recorded-${id}`; try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, 'yes'); } catch { /* Progress remains usable if storage is blocked. */ } setProgress(current => ({ ...current, exams: [...current.exams, { ...result, date: new Date().toISOString() }].slice(-100) })); }} /> :
          page === 'sources' ? <Methodology sources={content.sources} /> :
          page === 'glossary' ? <Glossary selectedId={route.split('/')[1]} /> :
          page === 'moderator' ? <Moderator session={session} onSession={setSession} sources={content.sources} /> :
          <Overview lessons={content.lessons} progress={progress} />}
        <footer className="footer"><span>{t("Made for the moment it clicks.")}</span><div><a href="#sources">{t("Research & approach")}</a><details className="privacy-details"><summary>{t("Privacy & progress")}</summary><div className="privacy-popover"><strong>{t("Your learning stays yours.")}</strong><p>{t("No student account or analytics trackers. Completed lessons, practice progress and exam summaries are stored in this browser, not synced between devices. An essential session cookie connects you to the service; timed exams and answers are stored on the server for continuity. Moderators’ changes are logged for accountability.")}</p><button className="text-button" onClick={resetProgress}><RotateCcw size={13} /> {t("Reset browser progress")}</button></div></details></div></footer>
      </main>
    </div>
  </div>;
}

function Overview({ lessons, progress }: { lessons: Lesson[]; progress: Progress }) {
  const { language } = useLanguage();
  const nextLesson = lessons.find(lesson => !progress.lessons.includes(lesson.id));
  const correctPractice = Object.values(progress.practice).filter(Boolean).length;
  const lastExam = progress.exams.at(-1);
  return <>
    <section className="welcome-section"><div className="welcome-copy"><span className="eyebrow"><span className="little-dot" /> {t("A CLEARER WAY TO LEARN MATH")}</span><h1>{t("Don’t just find")} <em>x.</em><br />{t("Understand")} <em>{t("why.")}</em></h1><p>{t("From your first equation to your next logarithm.")}<br className="desktop-break" /> {t("Build understanding, practise with purpose, and put it all together.")}</p><a className="button primary" href={nextLesson ? `#${nextLesson.topic}/${nextLesson.id}` : '#practice'}>{progress.lessons.length ? t("Continue learning") : t("Start with equations")}<ArrowRight size={18} /></a><span className="welcome-note">{t("Free to learn. No account needed.")}</span></div>
      <div className="equation-art" aria-label={t("An equation solved through three justified steps")}><div className="art-heading"><span className="little-dot" /> {t("ONE IDEA, THREE SMALL STEPS")} <Sparkles size={16} /></div><div className="art-equation"><MathText value="3x + 5 = 20" /></div><div className="art-operation"><span /> {t("subtract 5 from both sides")} <span /></div><div className="art-equation middle"><MathText value="3x = 15" /></div><div className="art-operation"><span /> {t("divide both sides by 3")} <span /></div><div className="art-answer"><MathText value="x = 5" /><span><Check size={14} /> {t("Now it makes sense.")}</span></div><div className="art-scribble">{t("Same value. Both sides. Every step.")}</div></div>
    </section>
    <section className="beginner-start"><div className="beginner-start-icon"><BookOpen size={23} aria-hidden="true" /></div><div><h2>{language === 'nl' ? 'Nieuw met algebra? Je kunt hier beginnen.' : 'New to algebra? You can start here.'}</h2><p>{language === 'nl' ? 'Kun je optellen, aftrekken, vermenigvuldigen en delen? Dat is genoeg om te beginnen. We laten met plaatjes zien wat x en = betekenen. Moeilijke woorden kun je meteen opzoeken.' : 'Can you add, subtract, multiply and divide? That is enough to begin. Pictures show what x and = mean, and unfamiliar words have a definition just a click away.'}</p><div className="beginner-start-links"><a className="inline-link" href="#equations/equations-equality">{language === 'nl' ? 'Begin bij de basis' : 'Start with the basics'} <ArrowRight size={15} /></a><a className="inline-link" href="#glossary">{language === 'nl' ? 'Bekijk de woordenlijst' : 'Explore the word list'} <ArrowRight size={15} /></a></div></div></section>
    <div className="section-heading"><div><span className="eyebrow">{t("THE BIG PICTURE")}</span><h2>{t("One path. Four phases.")}</h2></div><span className="section-aside">{t("At your pace, in your order.")}</span></div>
    <div className="overview-columns"><section className="learning-path" aria-label={t("Four learning phases")}>{stages.map(stage => {
      const stageLessons = lessons.filter(lesson => lesson.topic === stage.id);
      const done = stageLessons.filter(lesson => progress.lessons.includes(lesson.id)).length;
      const Icon = stage.icon;
      return <a key={stage.id} href={`#${stage.id}`} className={`path-step path-${stage.id}`}><div className="path-number">{stage.number}</div><div className="path-step-content"><div className="path-step-title"><h3>{t(stage.title)}</h3><span className="path-type">{stage.number === '01' || stage.number === '02' ? t("LEARN") : stage.number === '03' ? t("APPLY") : t("ASSESS")}</span></div><p>{t(stage.subtitle)}</p><div className="path-meta"><Icon size={13} />{stageLessons.length ? t('{count} lessons · {minutes} min', { count: stageLessons.length, minutes: stageLessons.reduce((sum, lesson) => sum + lesson.minutes, 0) }) + (done ? t(' · {count} completed', { count: done }) : '') : stage.id === 'practice' ? t("Hints, worked solutions & the reason behind each step") : t("10 or 20 questions · Your choice of pace")}</div></div><ArrowRight className="path-arrow" size={20} /></a>;
    })}</section>
      <aside className="approach-aside"><div className="approach-symbol"><GraduationCap size={25} /></div><span className="eyebrow">{t("UNDERSTANDING FIRST")}</span><h3>{t("There’s a reason")}<br />{t("behind every step.")}</h3><p>{t("We connect the rules to their meaning, compare different solutions, and use mistakes as a starting point.")}</p><p className="small-text">{t("Our lesson design draws on research in mathematics education. We show our sources—and their limits.")}</p><a href="#sources" className="inline-link">{t("Meet the thinking behind it")} <ArrowUpRight size={15} /></a><div className="aside-bottom"><span className="little-dot" /> {t("Research-informed. Human-paced.")}</div></aside>
    </div>
    {(Object.keys(progress.practice).length > 0 || lastExam) && <section className="your-progress"><div><Target size={20} /><h3>{t("A little progress adds up.")}</h3></div><p>{Object.keys(progress.practice).length > 0 && <span>{correctPractice} {t("of")} {Object.keys(progress.practice).length} {t("attempted practice questions answered correctly at least once.")}</span>}{lastExam && <span>{t("Last completed exam:")} {lastExam.correct}/{lastExam.total}.</span>}</p></section>}
    <div className="quiet-note"><Leaf size={17} /><span>{t("You don’t need to be “a maths person.” Just curious about the next step.")}</span></div>
  </>;
}

function Methodology({ sources }: { sources: Source[] }) {
  return <><div className="page-heading"><span className="eyebrow">{t("THE THINKING BEHIND THE TEACHING")}</span><h1>{t("Understanding is")}<br />{t("the whole point.")}</h1><p>{t("These papers informed how we designed the lessons, examples and feedback. They don’t validate this particular website, and no single teaching method works best in every setting.")}</p></div>
    <div className="method-principles"><div><span>01</span><h3>{t("Meaning before shorthand")}</h3><p>{t("Connect equality to equivalent operations. Then introduce efficient notation without losing the reason it works.")}</p></div><div><span>02</span><h3>{t("More than one way")}</h3><p>{t("Compare worked solutions. Explain why both are valid, and decide which is simpler for this problem.")}</p></div><div><span>03</span><h3>{t("Mistakes are information")}</h3><p>{t("Use feedback to identify the assumption behind an error, then test a better idea.")}</p></div></div>
    <div className="section-heading"><div><span className="eyebrow">{t("OUR READING LIST")}</span><h2>{t("Research, with context.")}</h2></div><span className="section-aside">{t("Original papers linked below")}</span></div>
    <div className="source-list">{sources.map((source, index) => <article className="source-entry" key={source.id} id={`source-${source.id}`}><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div><div className="source-citation">{source.authors} · {source.year}</div><h3><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={17} /></a></h3><div className="source-detail"><strong>{t("How we use it")}</strong><p>{source.application}</p></div><div className="source-detail source-limit"><strong>{t("What not to assume")}</strong><p>{source.limitation}</p></div></div></article>)}</div>
    <div className="notice info"><BookOpen size={21} /><div><strong>{t("Our design choices are a synthesis.")}</strong><p>{t("Progressive hints, checkpoints and the four-phase learning path are implementation choices. Timed exams are for self-assessment, not a diagnosis of mathematical ability. All learning content is written for this site; research is attributed, not reproduced.")}</p></div></div>
  </>;
}
