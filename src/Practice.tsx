import { t, useLanguage } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, RefreshCw, Sprout, X } from 'lucide-react';
import { api, errorText } from './api';
import { difficultyLabel, ErrorNotice, Loading, MathText, QuestionOptions, RichText, SourcesNote, TopicTag } from './components';
import type { PracticeResult, PublicQuestion, Source } from './types';

export function Practice({ sources, onResult }: { sources: Source[]; onResult: (id: string, correct: boolean) => void }) {
  const { language } = useLanguage();
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
  const requestEpoch = useRef(0);
  const previousTopic = useRef(topic);
  const activeQuestion = useRef<string | undefined>(undefined);
  const question = questions[index];
  activeQuestion.current = question?.id;

  useEffect(() => {
    let alive = true;
    requestEpoch.current += 1;
    const keepId = previousTopic.current === topic ? activeQuestion.current : undefined;
    previousTopic.current = topic;
    setLoading(true); setBusy(false); setError(''); setSelected(null); setResult(null); setHintOpen(false);
    api<{ questions: PublicQuestion[] }>(`questions${topic === 'all' ? '' : `?topic=${topic}`}`).then(data => { if (alive) { setQuestions(data.questions); setIndex(Math.max(0, data.questions.findIndex(item => item.id === keepId))); } }).catch(e => { if (alive) { setQuestions([]); setError(errorText(e)); } }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [topic, reload, language]);

  function changeQuestion(next: number) { setIndex(next); setSelected(null); setResult(null); setHintOpen(false); setError(''); }
  async function checkAnswer() {
    if (!selected || !question || busy) return;
    const epoch = requestEpoch.current;
    setBusy(true); setError('');
    try {
      const next = await api<PracticeResult>(`practice/${encodeURIComponent(question.id)}/answer`, { optionId: selected });
      if (epoch !== requestEpoch.current) return;
      setResult(next); onResult(question.id, next.correct);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } catch (e) { if (epoch === requestEpoch.current) setError(errorText(e)); }
    finally { if (epoch === requestEpoch.current) setBusy(false); }
  }

  return <>
    <div className="page-heading"><span className="eyebrow">{t("PHASE 03 / APPLY THE IDEA")}</span><h1>{t("A place to try.")}<br />{t("A little room to grow.")}</h1><p>{t("No timer. No pressure. Give it a go, ask for a hint, and explore the reasoning behind the answer.")}</p></div>
    <div className="practice-toolbar"><div className="segmented" aria-label={t("Question topic")}>{[{ value: 'all', label: t("All topics") }, { value: 'equations', label: t("Equations") }, { value: 'logarithms', label: t("Logarithms") }].map(item => <button key={item.value} disabled={busy} aria-pressed={topic === item.value} className={topic === item.value ? 'selected' : ''} onClick={() => setTopic(item.value)}>{item.label}</button>)}</div><span className="section-aside"><Sprout size={15} /> {t("Mistakes are part of the process.")}</span></div>
    {loading ? <Loading label={t("Finding your practice questions…")} /> : !question ? <div className="empty-state">{error ? <ErrorNotice message={error} /> : <><h2>{t("A little space for new questions.")}</h2><p>{t("No published questions in this topic yet. Try another topic or come back soon.")}</p></>}<button className="button secondary" onClick={() => setReload(reload + 1)}><RefreshCw size={15} /> {t("Refresh questions")}</button></div> : <div className="practice-layout"><section className="question-panel"><div className="question-panel-top"><div><TopicTag topic={question.topic} /><span className="difficulty">{difficultyLabel(question.difficulty)}</span></div><span className="question-count">{t("Question")} {index + 1} <span>/ {questions.length}</span></span></div><div className="question-prompt">{language === 'nl' && question.language === 'en' && <p className="notice info">{t('This question is currently available in English only.')}</p>}<h2><RichText text={question.prompt} definitions /></h2>{question.math && <MathText value={question.math} block />}</div><QuestionOptions question={question} selected={selected} onSelect={setSelected} disabled={busy || !!result} correctId={result?.correctOptionId} name={`practice-${question.id}`} />
      {hintOpen && <div className="hint-box" id="practice-hint"><Lightbulb size={19} /><div><strong>{t("A nudge in the right direction")}</strong><p><RichText text={question.hint} definitions /></p></div></div>}
      {error && <ErrorNotice message={error} />}
      <div className="question-actions"><button className="text-button" aria-expanded={hintOpen} aria-controls="practice-hint" onClick={() => setHintOpen(!hintOpen)}><Lightbulb size={17} />{hintOpen ? t("Hide hint") : t("I’d like a hint")}</button>{!result ? <button className="button primary" disabled={!selected || busy} onClick={checkAnswer}>{busy ? t("Checking…") : t("Check answer")}<ArrowRight size={17} /></button> : <button className="button primary" onClick={() => changeQuestion((index + 1) % questions.length)}>{index + 1 === questions.length ? t("Back to first question") : t("Next question")}<ArrowRight size={17} /></button>}</div>
      {/* Error-specific feedback is inspired by Chua & Wood (2005),
          https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf.
          Kenney & Kastberg (2013) informs explanations of legal log operations:
          https://files.eric.ed.gov/fulltext/EJ1093384.pdf. */}
      {result && <div className={`practice-feedback ${result.correct ? 'correct' : 'try-again'}`} ref={feedbackRef} tabIndex={-1} aria-live="polite"><div className="feedback-title">{result.correct ? <CheckCircle2 size={23} /> : <Lightbulb size={23} />}<div><span className="eyebrow">{result.correct ? t("YOU’VE GOT IT") : t("A USEFUL MOMENT TO LEARN")}</span><h3>{result.correct ? t("That’s right. Here’s why.") : t("Not quite. Let’s work through it.")}</h3></div></div><ol className="explanation-steps">{result.explanation.map((step, i) => <li key={i}><span>{i + 1}</span><p><RichText text={step} definitions /></p></li>)}</ol>{!result.correct && result.misconception && <div className="misconception"><strong>{t("A common mix-up")}</strong><p><RichText text={result.misconception} definitions /></p></div>}<SourcesNote tags={result.sourceTags} sources={sources} /></div>}
      <div className="question-pagination"><button className="text-button" disabled={index === 0 || busy} onClick={() => changeQuestion(index - 1)}><ChevronLeft size={16} />{t("Previous")}</button><span>{t("Work at your own pace")}</span><button className="text-button" disabled={index === questions.length - 1 || busy} onClick={() => changeQuestion(index + 1)}>{t("Skip to next")}<ChevronRight size={16} /></button></div>
    </section><aside className="practice-aside"><span className="eyebrow">{t("A GOOD WAY TO PRACTISE")}</span><h3>{t("Say the reason")}<br />{t("out loud.")}</h3><p>{t("Before choosing an answer, ask yourself:")}</p><ol><li>{t("What is happening to x?")}</li><li>{t("Which operation would undo it?")}</li><li>{t("Why is that step allowed?")}</li><li>{t("Does my answer fit the original equation?")}</li></ol><div className="aside-divider" /><p className="small-text">{t("For logs, remember to check the domain: each logarithm’s input must be positive.")}</p><a href={question.topic === 'equations' ? '#equations' : '#logarithms'} className="inline-link">{t("Revisit the idea")}<ArrowRight size={14} /></a></aside></div>}
  </>;
}
