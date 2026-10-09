import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Clock3, Lightbulb, PencilLine } from 'lucide-react';
import type { Lesson, Source, Topic } from './types';
import { MathText, RichText, SourcesNote } from './components';

export function Lessons({ topic, lessons, sources, selectedId, completed, onComplete }: { topic: Topic; lessons: Lesson[]; sources: Source[]; selectedId?: string; completed: string[]; onComplete: (id: string) => void }) {
  const lesson = lessons.find(item => item.id === selectedId) || lessons[0];
  const currentIndex = lessons.findIndex(item => item.id === lesson?.id);
  if (!lesson) return <section className="empty-state"><h1>Lessons are on their way.</h1><p>There are no published lessons in this topic yet. You can explore the other phases.</p><a href="#home" className="button secondary">Back to your learning path</a></section>;
  return <>
    <div className="page-heading lesson-heading"><span className="eyebrow">PHASE {topic === 'equations' ? '01' : '02'} / LEARN THE IDEA</span><h1>{topic === 'equations' ? <>Both sides.<br />One understanding.</> : <>Find the power.<br />See the connection.</>}</h1><p>{topic === 'equations' ? 'Understand equality, undo operations and learn why each step brings x into focus.' : 'A logarithm asks a question about an exponent. Start there, and the rules begin to make sense.'}</p></div>
    <nav className="lesson-tabs" aria-label={`${topic} lessons`}>{lessons.map((item, index) => <a className={`lesson-tab ${item.id === lesson.id ? 'active' : ''}`} href={`#${topic}/${item.id}`} key={item.id} aria-current={item.id === lesson.id ? 'step' : undefined}><span>{completed.includes(item.id) ? <Check size={14} aria-label="Completed" /> : String(index + 1).padStart(2, '0')}</span><div>{item.title}<small>{item.minutes} min</small></div></a>)}</nav>
    <LessonReader key={lesson.id} lesson={lesson} sources={sources} index={currentIndex} count={lessons.length} completed={completed.includes(lesson.id)} onComplete={() => onComplete(lesson.id)} next={lessons[currentIndex + 1]} />
  </>;
}

function LessonReader({ lesson, sources, index, count, completed, onComplete, next }: { lesson: Lesson; sources: Source[]; index: number; count: number; completed: boolean; onComplete: () => void; next?: Lesson }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === lesson.checkpoint.correct;
  const canComplete = checked && correct;
  const nextHref = next ? `#${next.topic}/${next.id}` : lesson.topic === 'equations' ? '#logarithms' : '#practice';
  return <article className="lesson-reader">
    <header className="reader-header"><div className="reader-meta"><span>LESSON {index + 1} OF {count}</span><span><Clock3 size={13} /> {lesson.minutes} min read</span>{completed && <span className="completed-label"><CheckCircle2 size={14} /> Completed</span>}</div><h2>{lesson.title}</h2><p>{lesson.summary}</p></header>
    {lesson.sections.map((section, sectionIndex) => <section className="lesson-section" key={`${lesson.id}-${sectionIndex}`}><h3><span className="section-count">{String(sectionIndex + 1).padStart(2, '0')}</span>{section.title}</h3><div className="lesson-prose">{section.body.map((paragraph, i) => <p key={i}><RichText text={paragraph} /></p>)}</div>{section.math && <div className="standalone-math"><MathText value={section.math} block /></div>}
      {section.example && <div className="worked-example"><div className="example-label"><PencilLine size={14} /> LET’S WALK THROUGH IT</div><p className="example-prompt"><RichText text={section.example.prompt} /></p><ol className="worked-steps">{section.example.steps.map((step, i) => <li key={i}><span className="step-number">{i + 1}</span><MathText value={step.math} /><span className="step-reason"><RichText text={step.reason} /></span></li>)}</ol>{section.example.check && <div className="example-check"><CheckCircle2 size={17} /><span><RichText text={section.example.check} /></span></div>}</div>}
      {/* Comparing valid methods is informed by Rittle-Johnson & Star (2009),
          https://doi.org/10.1037/a0014224. This interface is our own synthesis. */}
      {section.comparison && <div className="comparison"><div className="example-label">TWO WAYS. THE SAME UNDERSTANDING.</div><div className="comparison-columns">{[section.comparison.left, section.comparison.right].map((method, methodIndex) => <div className="comparison-method" key={methodIndex}><span className="method-letter">{methodIndex ? 'B' : 'A'}</span><h4>{method.title}</h4><ol>{method.steps.map((step, stepIndex) => <li key={stepIndex}><RichText text={step} /></li>)}</ol></div>)}</div><p className="comparison-question"><Lightbulb size={16} /> Which method feels simpler here? Explain why both keep the equation equivalent.</p></div>}
      <SourcesNote tags={section.sourceTags} sources={sources} />
    </section>)}
    <section className="checkpoint"><div className="checkpoint-header"><span className="checkpoint-icon"><Lightbulb size={21} /></span><div><span className="eyebrow">A SMALL CHECK-IN</span><h3>Does the idea click?</h3></div></div><p className="checkpoint-prompt"><RichText text={lesson.checkpoint.prompt} /></p><fieldset className="checkpoint-options"><legend className="sr-only">Choose your checkpoint answer</legend>{lesson.checkpoint.options.map((option, i) => <label key={i} className={`checkpoint-option ${selected === i ? 'selected' : ''} ${checked && selected === i ? correct ? 'right' : 'wrong' : ''}`}><input name={`checkpoint-${lesson.id}`} type="radio" checked={selected === i} onChange={() => { setSelected(i); setChecked(false); }} /><span><RichText text={option} /></span>{checked && selected === i && correct && <Check size={18} />}</label>)}</fieldset><button className="button secondary" disabled={selected === null || checked} onClick={() => setChecked(true)}>Check my understanding <ArrowRight size={16} /></button>{checked && <div className={`checkpoint-feedback ${correct ? 'correct' : ''}`} role="status"><strong>{correct ? 'Yes—that’s the connection.' : 'Not quite. Let’s look at the reasoning.'}</strong><p><RichText text={lesson.checkpoint.explanation} /></p>{!correct && <span>Choose another answer when you’re ready.</span>}</div>}</section>
    <SourcesNote tags={lesson.sourceTags} sources={sources} />
    <div className="lesson-end"><div><span className="eyebrow">ONE STEP FURTHER</span><h3>{completed ? 'This idea is part of your toolkit.' : 'Ready to take the next step?'}</h3><p>{completed ? 'You can revisit any lesson, any time.' : 'Answer the check-in correctly to mark this lesson complete.'}</p></div><div className="lesson-end-actions">{!completed && <button className="button primary" disabled={!canComplete} onClick={onComplete}>Mark lesson complete <Check size={17} /></button>}{completed && <a className="button primary" href={nextHref}>{next ? 'Next lesson' : lesson.topic === 'equations' ? 'Explore logarithms' : 'Try guided practice'}<ArrowRight size={17} /></a>}{!completed && <a className="text-button" href={nextHref}>Explore the next lesson <ArrowRight size={14} /></a>}</div></div>
    <a href="#home" className="inline-link back-link"><ArrowLeft size={15} /> Back to your learning path</a>
  </article>;
}
