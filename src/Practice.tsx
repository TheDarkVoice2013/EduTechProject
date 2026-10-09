import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, RefreshCw, Sprout, X } from 'lucide-react';
import { api, errorText } from './api';
import { difficultyLabel, ErrorNotice, Loading, MathText, QuestionOptions, RichText, SourcesNote, TopicTag } from './components';
import type { PracticeResult, PublicQuestion, Source } from './types';

export function Practice({ sources, onResult }: { sources: Source[]; onResult: (id: string, correct: boolean) => void }) {
  const [topic, setTopic] = useState('all');
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const question = questions[index];

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setIndex(0); setSelected(null); setResult(null); setHintOpen(false);
    api<{ questions: PublicQuestion[] }>(`questions${topic === 'all' ? '' : `?topic=${topic}`}`).then(data => { if (alive) setQuestions(data.questions); }).catch(e => { if (alive) setError(errorText(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [topic, reload]);

  function changeQuestion(next: number) { setIndex(next); setSelected(null); setResult(null); setHintOpen(false); setError(''); }
  async function checkAnswer() {
    if (!selected || !question || busy) return;
    setBusy(true); setError('');
    try {
      const next = await api<PracticeResult>(`practice/${encodeURIComponent(question.id)}/answer`, { optionId: selected });
      setResult(next); onResult(question.id, next.correct);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  return <>
    <div className="page-heading"><span className="eyebrow">PHASE 03 / APPLY THE IDEA</span><h1>A place to try.<br />A little room to grow.</h1><p>No timer. No pressure. Give it a go, ask for a hint, and explore the reasoning behind the answer.</p></div>
    <div className="practice-toolbar"><div className="segmented" aria-label="Question topic">{[{ value: 'all', label: 'All topics' }, { value: 'equations', label: 'Equations' }, { value: 'logarithms', label: 'Logarithms' }].map(item => <button key={item.value} disabled={busy} aria-pressed={topic === item.value} className={topic === item.value ? 'selected' : ''} onClick={() => setTopic(item.value)}>{item.label}</button>)}</div><span className="section-aside"><Sprout size={15} /> Mistakes are part of the process.</span></div>
    {loading ? <Loading label="Finding your practice questions…" /> : !question ? <div className="empty-state">{error ? <ErrorNotice message={error} /> : <><h2>A little space for new questions.</h2><p>No published questions in this topic yet. Try another topic or come back soon.</p></>}<button className="button secondary" onClick={() => setReload(reload + 1)}><RefreshCw size={15} /> Refresh questions</button></div> : <div className="practice-layout"><section className="question-panel"><div className="question-panel-top"><div><TopicTag topic={question.topic} /><span className="difficulty">{difficultyLabel(question.difficulty)}</span></div><span className="question-count">Question {index + 1} <span>/ {questions.length}</span></span></div><div className="question-prompt"><h2><RichText text={question.prompt} /></h2>{question.math && <MathText value={question.math} block />}</div><QuestionOptions question={question} selected={selected} onSelect={setSelected} disabled={busy || !!result} correctId={result?.correctOptionId} name={`practice-${question.id}`} />
      {hintOpen && <div className="hint-box" id="practice-hint"><Lightbulb size={19} /><div><strong>A nudge in the right direction</strong><p><RichText text={question.hint} /></p></div></div>}
      {error && <ErrorNotice message={error} />}
      <div className="question-actions"><button className="text-button" aria-expanded={hintOpen} aria-controls="practice-hint" onClick={() => setHintOpen(!hintOpen)}><Lightbulb size={17} />{hintOpen ? 'Hide hint' : 'I’d like a hint'}</button>{!result ? <button className="button primary" disabled={!selected || busy} onClick={checkAnswer}>{busy ? 'Checking…' : 'Check answer'}<ArrowRight size={17} /></button> : <button className="button primary" onClick={() => changeQuestion((index + 1) % questions.length)}>{index + 1 === questions.length ? 'Back to first question' : 'Next question'}<ArrowRight size={17} /></button>}</div>
      {/* Error-specific feedback is inspired by Chua & Wood (2005),
          https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf.
          Kenney & Kastberg (2013) informs explanations of legal log operations:
          https://files.eric.ed.gov/fulltext/EJ1093384.pdf. */}
      {result && <div className={`practice-feedback ${result.correct ? 'correct' : 'try-again'}`} ref={feedbackRef} tabIndex={-1} aria-live="polite"><div className="feedback-title">{result.correct ? <CheckCircle2 size={23} /> : <Lightbulb size={23} />}<div><span className="eyebrow">{result.correct ? 'YOU’VE GOT IT' : 'A USEFUL MOMENT TO LEARN'}</span><h3>{result.correct ? 'That’s right. Here’s why.' : 'Not quite. Let’s work through it.'}</h3></div></div><ol className="explanation-steps">{result.explanation.map((step, i) => <li key={i}><span>{i + 1}</span><p><RichText text={step} /></p></li>)}</ol>{!result.correct && result.misconception && <div className="misconception"><strong>A common mix-up</strong><p><RichText text={result.misconception} /></p></div>}<SourcesNote tags={result.sourceTags} sources={sources} /></div>}
      <div className="question-pagination"><button className="text-button" disabled={index === 0 || busy} onClick={() => changeQuestion(index - 1)}><ChevronLeft size={16} />Previous</button><span>Work at your own pace</span><button className="text-button" disabled={index === questions.length - 1 || busy} onClick={() => changeQuestion(index + 1)}>Skip to next<ChevronRight size={16} /></button></div>
    </section><aside className="practice-aside"><span className="eyebrow">A GOOD WAY TO PRACTISE</span><h3>Say the reason<br />out loud.</h3><p>Before choosing an answer, ask yourself:</p><ol><li>What is happening to x?</li><li>Which operation would undo it?</li><li>Why is that step allowed?</li><li>Does my answer fit the original equation?</li></ol><div className="aside-divider" /><p className="small-text">For logs, remember to check the domain: each logarithm’s input must be positive.</p><a href={question.topic === 'equations' ? '#equations' : '#logarithms'} className="inline-link">Revisit the idea<ArrowRight size={14} /></a></aside></div>}
  </>;
}
