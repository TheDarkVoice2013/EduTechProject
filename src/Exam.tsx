import { getLanguage, t, useLanguage } from './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleHelp, Clock3, Flag, ListChecks, RotateCcw, ShieldCheck, Target } from 'lucide-react';
import { api, ApiError, errorText } from './api';
import { ErrorNotice, Loading, MathText, QuestionOptions, RichText, TopicTag } from './components';
import type { ExamState } from './types';

export function Exam({ onComplete }: { onComplete: (result: { correct: number; total: number }, id: string) => void }) {
  const { language } = useLanguage();
  const [exam, setExam] = useState<ExamState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [topic, setTopic] = useState('mixed');
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(90);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [clockEnabled, setClockEnabled] = useState(true);
  const submitting = useRef(false);
  const attemptedExpiry = useRef('');
  const reported = useRef(new Set<string>());
  const completionCallback = useRef(onComplete);
  const examRef = useRef(exam);
  const requestEpoch = useRef(0);
  examRef.current = exam;
  completionCallback.current = onComplete;

  useEffect(() => {
    // The initial bank has 14 questions per topic; 20-question exams are mixed.
    // The server also checks the current published pool, which editors can change.
    if (topic !== 'mixed' && count === 20) setCount(10);
  }, [topic, count]);

  const acceptExam = useCallback((next: ExamState | null) => {
    setExam(next); setSelected(null); setConfirmFinish(false); setClockEnabled(true);
    if (next) { setOffset(next.serverNow - Date.now()); setNow(Date.now()); }
  }, []);

  useEffect(() => {
    if (submitting.current) return; // The mutation refreshes its response if language changed.
    let alive = true;
    const epoch = ++requestEpoch.current;
    const previous = examRef.current;
    const path = previous ? `exams/${encodeURIComponent(previous.id)}` : 'exams/current';
    api<ExamState | { exam: null }>(path).then(data => {
      if (!alive || epoch !== requestEpoch.current) return;
      const next = 'exam' in data ? null : data;
      if (next?.question?.id === previous?.question?.id && next?.status === previous?.status) {
        setExam(next);
        if (next) { setOffset(next.serverNow - Date.now()); setNow(Date.now()); }
      } else acceptExam(next);
    }).catch(e => { if (alive && epoch === requestEpoch.current) setError(errorText(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [acceptExam, language]);
  useEffect(() => {
    if (exam?.status !== 'active') return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [exam?.status]);
  useEffect(() => {
    if (exam?.status === 'completed' && exam.result && !reported.current.has(exam.id)) {
      reported.current.add(exam.id);
      completionCallback.current({ correct: exam.result.correct, total: exam.result.total }, exam.id);
    }
  }, [exam]);

  const remaining = exam?.deadline ? Math.max(0, Math.ceil((exam.deadline - now - offset) / 1000)) : 0;
  const expired = exam?.status === 'active' && remaining === 0;

  const submitAnswer = useCallback(async (optionId: string | null) => {
    if (!exam?.question || submitting.current) return;
    submitting.current = true; requestEpoch.current += 1; setBusy(true); setError('');
    try {
      const next = await requestLocalizedExam(`exams/${encodeURIComponent(exam.id)}/answer`, { questionId: exam.question.id, optionId });
      acceptExam(next);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        try { acceptExam(await requestLocalizedExam(`exams/${encodeURIComponent(exam.id)}`)); }
        catch (refreshError) { setError(errorText(refreshError)); setClockEnabled(false); }
      } else { setError(errorText(e)); setClockEnabled(false); }
    } finally { submitting.current = false; setBusy(false); }
  }, [exam, acceptExam]);

  useEffect(() => {
    if (expired && !busy && clockEnabled && exam?.question) {
      const key = `${exam.id}:${exam.question.id}:${exam.deadline}`;
      if (attemptedExpiry.current !== key) { attemptedExpiry.current = key; void submitAnswer(null); }
    }
  }, [expired, busy, clockEnabled, exam, submitAnswer]);

  async function start() {
    if (busy) return;
    submitting.current = true; requestEpoch.current += 1; setBusy(true); setError('');
    try { acceptExam(await requestLocalizedExam('exams', { topic, count, secondsPerQuestion: seconds })); }
    catch (e) { setError(errorText(e)); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function finish() {
    if (!exam || submitting.current) return;
    submitting.current = true; requestEpoch.current += 1; setBusy(true); setError('');
    try { acceptExam(await requestLocalizedExam(`exams/${encodeURIComponent(exam.id)}/finish`, {})); }
    catch (e) { setError(errorText(e)); }
    finally { submitting.current = false; setBusy(false); }
  }
  function newExam() {
    // Ignore a completed-results language refresh that was already in flight.
    requestEpoch.current += 1;
    acceptExam(null); setError('');
  }

  if (loading) return <Loading label={t("Checking for an unfinished exam…")} />;
  if (exam?.status === 'completed' && exam.result) {
    const result = exam.result;
    const score = Math.round(result.correct / result.total * 100);
    return <><div className="page-heading"><span className="eyebrow">{t("PHASE 04 / A MOMENT TO REFLECT")}</span><h1>{t("A snapshot.")}<br />{t("Not a label.")}</h1><p>{t("This result shows where you are today. Use it to choose what to practise next.")}</p></div><section className="exam-result"><div className="score-circle" style={{ '--score': `${score}%` } as React.CSSProperties}><div><strong>{result.correct}<span>/{result.total}</span></strong><span>{t("correct answers")}</span></div></div><div className="exam-result-copy"><span className="eyebrow">{t("EXAM COMPLETE")}</span><h2>{score >= 80 ? t("Your understanding is showing.") : score >= 50 ? t("You’re building the connections.") : t("You have a starting point.")}</h2><p>{score >= 80 ? t("Keep practising different forms of the same idea. Being able to explain a step matters just as much as recognising an answer.") : t("Return to the lessons and try a few guided questions. A clear explanation can change how the next problem feels.")}</p><div className="result-actions"><a className="button primary" href="#practice">{t("Back to guided practice")}<ArrowRight size={16} /></a><button className="button secondary" onClick={newExam}>{t("New exam")}<RotateCcw size={15} /></button></div></div></section>
      <div className="section-heading"><div><span className="eyebrow">{t("YOUR ANSWERS")}</span><h2>{t("See where to focus.")}</h2></div><span className="section-aside">{t("No worked explanations in exam mode")}</span></div><div className="exam-review">{result.answers.map((answer, i) => <details key={`${answer.question.id}-${i}`}><summary><span className={`review-status ${answer.correct ? 'right' : ''}`}>{answer.correct ? <Check size={15} /> : <span>—</span>}</span><span>{t("Question")} {i + 1}<small>{answer.question.topic === 'equations' ? t("Equations") : t("Logarithms")}</small></span><span className="review-outcome">{answer.correct ? t("Correct") : answer.timedOut ? t("Time expired") : answer.selectedOptionId ? t("Incorrect") : t("Not answered")}</span></summary><div className="review-body"><p><RichText text={answer.question.prompt} /></p>{answer.question.math && <MathText value={answer.question.math} block />}<QuestionOptions question={answer.question} selected={answer.selectedOptionId} onSelect={() => {}} disabled correctId={answer.correctOptionId} name={`review-${i}`} /></div></details>)}</div><p className="quiet-note"><CircleHelp size={17} /> {t("Looking for the reasoning? Explore the same topics in guided practice.")}</p></>;
  }

  if (exam?.status === 'active' && exam.question) {
    const question = exam.question;
    return <><div className="exam-active-heading"><div><span className="eyebrow">{t("PHASE 04 / TEST YOURSELF")}</span><h1>{t("One question at a time.")}</h1></div><div className={`exam-timer ${remaining <= 15 ? 'urgent' : ''}`} role="timer" aria-label={t('{seconds} seconds remaining', { seconds: remaining })}><Clock3 size={21} /><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong><span>{t("this question")}</span></div></div><div className="exam-progress-meta"><span>{t("Question")} <strong>{exam.index + 1}</strong> {t("of")} {exam.total}</span><span>{exam.answered} {t("answered · No hints in exam mode")}</span></div><div className="exam-progress-track" role="progressbar" aria-label={t("Exam progress")} aria-valuenow={exam.answered} aria-valuemin={0} aria-valuemax={exam.total}><span style={{ width: `${exam.answered / exam.total * 100}%` }} /></div>
      <section className="question-panel exam-question" key={question.id}><div className="question-panel-top"><TopicTag topic={question.topic} /><span className="exam-mode-label"><ShieldCheck size={14} /> {t("Focus mode")}</span></div><div className="question-prompt">{language === 'nl' && question.language === 'en' && <p className="notice info">{t('This question is currently available in English only.')}</p>}<h2><RichText text={question.prompt} /></h2>{question.math && <MathText value={question.math} block />}</div><QuestionOptions question={question} selected={selected} onSelect={setSelected} disabled={busy || !!expired} name={`exam-${question.id}`} />{error && <ErrorNotice message={error} />}{expired && <div className="notice info" role="status">{t("Time is up for this question.")} {busy ? t("Moving to the next question…") : t("Reconnect to continue; this answer cannot count after the deadline.")}</div>}<div className="question-actions"><button className="text-button" disabled={busy} onClick={() => void submitAnswer(null)}>{expired ? t("Reconnect & continue") : t("Skip question")}<ChevronRightIcon /></button><button className="button primary" disabled={!selected || busy || !!expired} onClick={() => void submitAnswer(selected)}>{busy ? t("Saving…") : exam.index + 1 === exam.total ? t("Submit & see result") : t("Submit & continue")}<ArrowRight size={17} /></button></div></section>
      <div className="exam-bottom"><p><LockIcon />{t("Your exam resumes on this browser. Leaving won’t pause the current timer.")}</p><button className="text-button" disabled={busy} onClick={() => setConfirmFinish(!confirmFinish)}><Flag size={15} />{t("End exam early")}</button></div>{confirmFinish && <div className="finish-confirm" role="alert"><div><strong>{t("Finish this exam now?")}</strong><p>{t("All remaining questions will count as unanswered.")}</p></div><button className="button secondary" disabled={busy} onClick={() => setConfirmFinish(false)}>{t("Keep going")}</button><button className="button danger" disabled={busy} onClick={finish}>{t("Finish exam")}</button></div>}
    </>;
  }
  return <><div className="page-heading"><span className="eyebrow">{t("PHASE 04 / PUT IT TOGETHER")}</span><h1>{t("See what’s clicked.")}<br />{t("Find what’s next.")}</h1><p>{t("A focused check of your understanding. Choose your topic and pace, then work without hints or explanations.")}</p></div><div className="exam-setup-layout"><section className="exam-setup"><div className="setup-title"><Target size={24} /><h2>{t("Make it your exam.")}</h2></div><fieldset><legend>{t("What would you like to work on?")}</legend><div className="choice-row">{[{ value: 'mixed', label: t("Both topics") }, { value: 'equations', label: t("Equations") }, { value: 'logarithms', label: t("Logarithms") }].map(item => <label className={`setup-choice ${topic === item.value ? 'selected' : ''}`} key={item.value}><input type="radio" name="exam-topic" value={item.value} checked={topic === item.value} onChange={() => setTopic(item.value)} /><span>{item.label}</span></label>)}</div></fieldset><fieldset><legend>{t("Number of questions")}</legend><div className="choice-row">{[10, 20].map(value => <label className={`setup-choice ${count === value ? 'selected' : ''}`} key={value}><input type="radio" name="exam-count" value={value} disabled={value === 20 && topic !== 'mixed'} checked={count === value} onChange={() => setCount(value)} /><span>{value} {t("questions")}</span>{value === 20 && topic !== 'mixed' && <small>{t("Mixed topics only")}</small>}</label>)}</div></fieldset><fieldset><legend>{t("Time for each question")}</legend><div className="choice-row">{[60, 90, 120].map(value => <label className={`setup-choice ${seconds === value ? 'selected' : ''}`} key={value}><input type="radio" name="exam-time" value={value} checked={seconds === value} onChange={() => setSeconds(value)} /><span>{value} {t("seconds")}</span>{value === 90 && <small>{t("A balanced pace")}</small>}</label>)}</div></fieldset><div className="exam-summary"><Clock3 size={16} /><span>{t("Up to")} <strong>{count * seconds / 60} {t("minutes")}</strong> · {count} {t("questions · Timer starts when you begin")}</span></div>{error && <ErrorNotice message={error} />}<button className="button primary start-exam" disabled={busy} onClick={start}>{busy ? t("Preparing your exam…") : t("I’m ready. Start exam.")}<ArrowRight size={18} /></button></section><aside className="exam-instructions"><span className="instruction-symbol"><ListChecks size={26} /></span><h3>{t("A quick heads-up.")}</h3><ul><li>{t("One question at a time, with its own timer.")}</li><li>{t("Submit or skip to move on. You can’t go back.")}</li><li>{t("When time runs out, the question counts as incorrect.")}</li><li>{t("No hints or worked explanations—even on the results screen.")}</li><li>{t("Your score appears at the end. There’s no pass or fail label.")}</li></ul><div className="aside-divider" /><p>{t("The timer is checked by the server. Refreshing or leaving this page won’t reset it.")}</p><a href="#practice" className="inline-link">{t("Want a warm-up first?")}<ArrowRight size={14} /></a></aside></div></>;
}
function ChevronRightIcon() { return <ArrowRight size={14} />; }
function LockIcon() { return <ShieldCheck size={14} aria-hidden="true" />; }

async function requestLocalizedExam(path: string, body?: unknown): Promise<ExamState> {
  // POST exactly once. Subsequent requests only read the same immutable attempt,
  // including when another language switch happens while a refresh is in flight.
  for (;;) {
    const requestedLanguage = getLanguage();
    const next = await api<ExamState>(path, body);
    if (requestedLanguage === getLanguage()) return next;
    path = `exams/${encodeURIComponent(next.id)}`;
    body = undefined;
  }
}
