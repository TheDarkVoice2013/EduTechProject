import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleHelp, Clock3, Flag, ListChecks, RotateCcw, ShieldCheck, Target } from 'lucide-react';
import { api, ApiError, errorText } from './api';
import { ErrorNotice, Loading, MathText, QuestionOptions, RichText, TopicTag } from './components';
import type { ExamState } from './types';

export function Exam({ onComplete }: { onComplete: (result: { correct: number; total: number }, id: string) => void }) {
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
    let alive = true;
    api<ExamState | { exam: null }>('exams/current').then(data => { if (alive) acceptExam('exam' in data ? null : data); }).catch(e => { if (alive) setError(errorText(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [acceptExam]);
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
    submitting.current = true; setBusy(true); setError('');
    try {
      const next = await api<ExamState>(`exams/${encodeURIComponent(exam.id)}/answer`, { questionId: exam.question.id, optionId });
      acceptExam(next);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        try { acceptExam(await api<ExamState>(`exams/${encodeURIComponent(exam.id)}`)); }
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
    setBusy(true); setError('');
    try { acceptExam(await api<ExamState>('exams', { topic, count, secondsPerQuestion: seconds })); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (!exam || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try { acceptExam(await api<ExamState>(`exams/${encodeURIComponent(exam.id)}/finish`, {})); }
    catch (e) { setError(errorText(e)); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (loading) return <Loading label="Checking for an unfinished exam…" />;
  if (exam?.status === 'completed' && exam.result) {
    const result = exam.result;
    const score = Math.round(result.correct / result.total * 100);
    return <><div className="page-heading"><span className="eyebrow">PHASE 04 / A MOMENT TO REFLECT</span><h1>A snapshot.<br />Not a label.</h1><p>This result shows where you are today. Use it to choose what to practise next.</p></div><section className="exam-result"><div className="score-circle" style={{ '--score': `${score}%` } as React.CSSProperties}><div><strong>{result.correct}<span>/{result.total}</span></strong><span>correct answers</span></div></div><div className="exam-result-copy"><span className="eyebrow">EXAM COMPLETE</span><h2>{score >= 80 ? 'Your understanding is showing.' : score >= 50 ? 'You’re building the connections.' : 'You have a starting point.'}</h2><p>{score >= 80 ? 'Keep practising different forms of the same idea. Being able to explain a step matters just as much as recognising an answer.' : 'Return to the lessons and try a few guided questions. A clear explanation can change how the next problem feels.'}</p><div className="result-actions"><a className="button primary" href="#practice">Back to guided practice<ArrowRight size={16} /></a><button className="button secondary" onClick={() => { setExam(null); setError(''); }}>New exam<RotateCcw size={15} /></button></div></div></section>
      <div className="section-heading"><div><span className="eyebrow">YOUR ANSWERS</span><h2>See where to focus.</h2></div><span className="section-aside">No worked explanations in exam mode</span></div><div className="exam-review">{result.answers.map((answer, i) => <details key={`${answer.question.id}-${i}`}><summary><span className={`review-status ${answer.correct ? 'right' : ''}`}>{answer.correct ? <Check size={15} /> : <span>—</span>}</span><span>Question {i + 1}<small>{answer.question.topic === 'equations' ? 'Equations' : 'Logarithms'}</small></span><span className="review-outcome">{answer.correct ? 'Correct' : answer.timedOut ? 'Time expired' : answer.selectedOptionId ? 'Incorrect' : 'Not answered'}</span></summary><div className="review-body"><p><RichText text={answer.question.prompt} /></p>{answer.question.math && <MathText value={answer.question.math} block />}<QuestionOptions question={answer.question} selected={answer.selectedOptionId} onSelect={() => {}} disabled correctId={answer.correctOptionId} name={`review-${i}`} /></div></details>)}</div><p className="quiet-note"><CircleHelp size={17} /> Looking for the reasoning? Explore the same topics in guided practice.</p></>;
  }

  if (exam?.status === 'active' && exam.question) {
    const question = exam.question;
    return <><div className="exam-active-heading"><div><span className="eyebrow">PHASE 04 / TEST YOURSELF</span><h1>One question at a time.</h1></div><div className={`exam-timer ${remaining <= 15 ? 'urgent' : ''}`} role="timer" aria-label={`${remaining} seconds remaining`}><Clock3 size={21} /><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong><span>this question</span></div></div><div className="exam-progress-meta"><span>Question <strong>{exam.index + 1}</strong> of {exam.total}</span><span>{exam.answered} answered · No hints in exam mode</span></div><div className="exam-progress-track" role="progressbar" aria-label="Exam progress" aria-valuenow={exam.answered} aria-valuemin={0} aria-valuemax={exam.total}><span style={{ width: `${exam.answered / exam.total * 100}%` }} /></div>
      <section className="question-panel exam-question" key={question.id}><div className="question-panel-top"><TopicTag topic={question.topic} /><span className="exam-mode-label"><ShieldCheck size={14} /> Focus mode</span></div><div className="question-prompt"><h2><RichText text={question.prompt} /></h2>{question.math && <MathText value={question.math} block />}</div><QuestionOptions question={question} selected={selected} onSelect={setSelected} disabled={busy || !!expired} name={`exam-${question.id}`} />{error && <ErrorNotice message={error} />}{expired && <div className="notice info" role="status">Time is up for this question. {busy ? 'Moving to the next question…' : 'Reconnect to continue; this answer cannot count after the deadline.'}</div>}<div className="question-actions"><button className="text-button" disabled={busy} onClick={() => void submitAnswer(null)}>{expired ? 'Reconnect & continue' : 'Skip question'}<ChevronRightIcon /></button><button className="button primary" disabled={!selected || busy || !!expired} onClick={() => void submitAnswer(selected)}>{busy ? 'Saving…' : exam.index + 1 === exam.total ? 'Submit & see result' : 'Submit & continue'}<ArrowRight size={17} /></button></div></section>
      <div className="exam-bottom"><p><LockIcon />Your exam resumes on this browser. Leaving won’t pause the current timer.</p><button className="text-button" disabled={busy} onClick={() => setConfirmFinish(!confirmFinish)}><Flag size={15} />End exam early</button></div>{confirmFinish && <div className="finish-confirm" role="alert"><div><strong>Finish this exam now?</strong><p>All remaining questions will count as unanswered.</p></div><button className="button secondary" disabled={busy} onClick={() => setConfirmFinish(false)}>Keep going</button><button className="button danger" disabled={busy} onClick={finish}>Finish exam</button></div>}
    </>;
  }
  return <><div className="page-heading"><span className="eyebrow">PHASE 04 / PUT IT TOGETHER</span><h1>See what’s clicked.<br />Find what’s next.</h1><p>A focused check of your understanding. Choose your topic and pace, then work without hints or explanations.</p></div><div className="exam-setup-layout"><section className="exam-setup"><div className="setup-title"><Target size={24} /><h2>Make it your exam.</h2></div><fieldset><legend>What would you like to work on?</legend><div className="choice-row">{[{ value: 'mixed', label: 'Both topics' }, { value: 'equations', label: 'Equations' }, { value: 'logarithms', label: 'Logarithms' }].map(item => <label className={`setup-choice ${topic === item.value ? 'selected' : ''}`} key={item.value}><input type="radio" name="exam-topic" value={item.value} checked={topic === item.value} onChange={() => setTopic(item.value)} /><span>{item.label}</span></label>)}</div></fieldset><fieldset><legend>Number of questions</legend><div className="choice-row">{[10, 20].map(value => <label className={`setup-choice ${count === value ? 'selected' : ''}`} key={value}><input type="radio" name="exam-count" value={value} disabled={value === 20 && topic !== 'mixed'} checked={count === value} onChange={() => setCount(value)} /><span>{value} questions</span>{value === 20 && topic !== 'mixed' && <small>Mixed topics only</small>}</label>)}</div></fieldset><fieldset><legend>Time for each question</legend><div className="choice-row">{[60, 90, 120].map(value => <label className={`setup-choice ${seconds === value ? 'selected' : ''}`} key={value}><input type="radio" name="exam-time" value={value} checked={seconds === value} onChange={() => setSeconds(value)} /><span>{value} seconds</span>{value === 90 && <small>A balanced pace</small>}</label>)}</div></fieldset><div className="exam-summary"><Clock3 size={16} /><span>Up to <strong>{count * seconds / 60} minutes</strong> · {count} questions · Timer starts when you begin</span></div>{error && <ErrorNotice message={error} />}<button className="button primary start-exam" disabled={busy} onClick={start}>{busy ? 'Preparing your exam…' : 'I’m ready. Start exam.'}<ArrowRight size={18} /></button></section><aside className="exam-instructions"><span className="instruction-symbol"><ListChecks size={26} /></span><h3>A quick heads-up.</h3><ul><li>One question at a time, with its own timer.</li><li>Submit or skip to move on. You can’t go back.</li><li>When time runs out, the question counts as incorrect.</li><li>No hints or worked explanations—even on the results screen.</li><li>Your score appears at the end. There’s no pass or fail label.</li></ul><div className="aside-divider" /><p>The timer is checked by the server. Refreshing or leaving this page won’t reset it.</p><a href="#practice" className="inline-link">Want a warm-up first?<ArrowRight size={14} /></a></aside></div></>;
}
function ChevronRightIcon() { return <ArrowRight size={14} />; }
function LockIcon() { return <ShieldCheck size={14} aria-hidden="true" />; }
