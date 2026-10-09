import { t } from './i18n';
import { useMemo } from 'react';
import katex from 'katex';
import { ArrowUpRight, BookOpen, Check, CircleAlert, LoaderCircle } from 'lucide-react';
import type { PublicQuestion, Source } from './types';
import { VocabularyText } from './Vocabulary';

export function MathText({ value, block = false }: { value: string; block?: boolean }) {
  // Only KaTeX-generated markup reaches this sink. Untrusted HTML is never rendered.
  // trust:false disables HTML/URL commands; bounded expansion prevents expensive macros.
  const result = useMemo(() => {
    try { return katex.renderToString(value, { displayMode: block, throwOnError: true, trust: false, strict: 'warn', maxExpand: 100, maxSize: 15, output: 'htmlAndMathml' }); }
    catch { return null; }
  }, [value, block]);
  if (!result) return <code className="math-fallback">{value}</code>;
  return <span className={block ? 'math-block' : 'math-inline'} dangerouslySetInnerHTML={{ __html: result }} />;
}

export function RichText({ text, definitions = false }: { text: string; definitions?: boolean }) {
  return <>{text.split(/(\$[^$\n]+\$)/g).map((part, i) => part.startsWith('$') && part.endsWith('$') && part.length > 2 ? <MathText key={i} value={part.slice(1, -1)} /> : definitions ? <VocabularyText key={i} text={part} /> : <span key={i}>{part}</span>)}</>;
}

export function ErrorNotice({ message }: { message: string }) {
  return <div className="notice error" role="alert"><CircleAlert size={19} aria-hidden="true" /><span>{t(message)}</span></div>;
}

export function Loading({ label = t("Getting things ready…") }: { label?: string }) {
  return <div className="loading" role="status"><LoaderCircle className="spin" size={24} aria-hidden="true" /><span>{label}</span></div>;
}

export function SourcesNote({ tags, sources }: { tags: string[]; sources: Source[] }) {
  const matched = sources.filter(source => tags.includes(source.id));
  if (!matched.length) return null;
  return <details className="research-note"><summary><BookOpen size={15} aria-hidden="true" /> {t("Why we teach it this way")} <span>{t("Research notes")}</span></summary><div className="research-body">{matched.map(source => <div key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.authors} ({source.year}) <ArrowUpRight size={14} aria-hidden="true" /></a><p>{source.application}</p><p className="muted">{t("Research limit:")} {source.limitation}</p></div>)}</div></details>;
}

export function QuestionOptions({ question, selected, onSelect, disabled = false, correctId, name }: { question: PublicQuestion; selected: string | null; onSelect: (id: string) => void; disabled?: boolean; correctId?: string; name: string }) {
  return <fieldset className="answer-options"><legend className="sr-only">{t("Choose one answer")}</legend>{question.options.map(option => {
    const isRight = correctId === option.id;
    const isWrong = Boolean(correctId && selected === option.id && !isRight);
    return <label className={`answer-option ${selected === option.id ? 'selected' : ''} ${isRight ? 'answer-right' : ''} ${isWrong ? 'answer-wrong' : ''}`} key={option.id}>
      <input type="radio" name={name} value={option.id} checked={selected === option.id} disabled={disabled} onChange={() => onSelect(option.id)} />
      <span className="option-letter" aria-hidden="true">{option.id.toUpperCase()}</span>
      <span className="option-content"><RichText text={option.text} />{option.math && <MathText value={option.math} />}</span>
      {isRight && <><Check size={19} aria-hidden="true" /><span className="sr-only">{t("Correct answer")}</span></>}
      {isWrong && <span className="option-status">{t("Your answer")}</span>}
    </label>;
  })}</fieldset>;
}

export function TopicTag({ topic }: { topic: string }) { return <span className={`tag ${topic === 'logarithms' ? 'lavender' : ''}`}>{topic === 'equations' ? t("Equations") : topic === 'logarithms' ? t("Logarithms") : t("Mixed topics")}</span>; }
export const difficultyLabel = (value: number) => [t("Foundation"), t("Building fluency"), t("Stretch")][value - 1] || t("Foundation");
