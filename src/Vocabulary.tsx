import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import katex from 'katex';
import { BookOpen, Search, X } from 'lucide-react';
import glossaryData from '../content/glossary.json';
import { useLanguage, type Language } from './i18n';
import { splitVocabulary } from './vocabulary-match';
import './vocabulary.css';

type Definition = { term: string; aliases: string[]; meaning: string; example: string; math?: string };
type Entry = { id: string; nl: Definition; en: Definition };
const glossary: Entry[] = glossaryData;
const entryById = new Map(glossary.map(entry => [entry.id, entry]));
type VocabularyContextValue = { openDefinition: (id: string, trigger?: HTMLElement) => void };
const VocabularyContext = createContext<VocabularyContextValue | null>(null);

function ExampleMath({ value }: { value: string }) {
  const html = useMemo(() => katex.renderToString(value, { trust: false, throwOnError: false, strict: 'warn', maxExpand: 100, maxSize: 15, output: 'htmlAndMathml' }), [value]);
  return <div className="vocabulary-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

function DefinitionBody({ entry, language }: { entry: Entry; language: Language }) {
  const definition = entry[language];
  return <><p className="vocabulary-meaning">{definition.meaning}</p><div className="vocabulary-example"><strong>{language === 'nl' ? 'Bijvoorbeeld' : 'For example'}</strong><p>{definition.example}</p>{definition.math && <ExampleMath value={definition.math} />}</div></>;
}

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogTitle = useId();
  const entry = selectedId ? entryById.get(selectedId) : null;
  const value = useMemo(() => ({ openDefinition: (id: string, trigger?: HTMLElement) => {
    if (!entryById.has(id)) return;
    triggerRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSelectedId(id);
  } }), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry && !dialog.open) {
      // Native modal dialogs provide inert background content, a keyboard focus
      // trap, Escape dismissal and touch support without changing the URL.
      dialog.showModal();
      titleRef.current?.focus({ preventScroll: true });
    }
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  function restoreReader() {
    setSelectedId(null);
    // preventScroll keeps the reading position instead of jumping to a glossary.
    if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    triggerRef.current = null;
  }

  return <VocabularyContext.Provider value={value}>{children}<dialog ref={dialogRef} className="vocabulary-dialog" aria-labelledby={dialogTitle} onClose={restoreReader} onClick={event => { if (event.target === event.currentTarget) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
  } }}>
    {entry && <div className="vocabulary-dialog-content"><div className="vocabulary-dialog-top"><span className="vocabulary-kicker"><BookOpen size={16} aria-hidden="true" />{nl ? 'Even opzoeken' : 'A quick definition'}</span><button type="button" className="vocabulary-close" aria-label={nl ? 'Definitie sluiten' : 'Close definition'} onClick={() => dialogRef.current?.close()}><X size={21} aria-hidden="true" /></button></div><h2 id={dialogTitle} ref={titleRef} tabIndex={-1}>{entry[language].term}</h2><p className="vocabulary-translation" lang={nl ? 'en' : 'nl'}>{nl ? 'English' : 'Nederlands'}: {entry[nl ? 'en' : 'nl'].term}</p><DefinitionBody entry={entry} language={language} /><div className="vocabulary-dialog-actions"><button type="button" className="button primary" onClick={() => dialogRef.current?.close()}>{nl ? 'Terug naar mijn les' : 'Back to my lesson'}</button><a href={`#glossary/${entry.id}`} className="vocabulary-list-link" onClick={() => dialogRef.current?.close()}>{nl ? 'Bekijk de hele woordenlijst' : 'Open the full word list'} →</a></div></div>}
  </dialog></VocabularyContext.Provider>;
}

/** Use only around lesson/practice prose; exam content intentionally opts out. */
export function VocabularyText({ text }: { text: string }) {
  const { language } = useLanguage();
  const context = useContext(VocabularyContext);
  const segments = useMemo(() => splitVocabulary(text, glossary.map(entry => ({
    id: entry.id,
    aliases: [entry[language].term, ...entry[language].aliases],
  }))), [text, language]);
  if (!context) return <>{text}</>;
  const linked = new Set<string>();
  return <>{segments.map((segment, index) => {
    if (!segment.id || linked.has(segment.id)) return <span key={index}>{segment.text}</span>;
    linked.add(segment.id);
    const id = segment.id;
    const term = entryById.get(id)?.[language].term ?? segment.text;
    return <button key={index} type="button" className="vocabulary-word" aria-haspopup="dialog" aria-label={language === 'nl' ? `${segment.text}: bekijk de betekenis van ${term}` : `${segment.text}: see the meaning of ${term}`} onClick={event => context.openDefinition(id, event.currentTarget)}>{segment.text}</button>;
  })}</>;
}

export function VocabularyHint() {
  const { language } = useLanguage();
  return <p className="vocabulary-hint"><BookOpen size={15} aria-hidden="true" /><span>{language === 'nl' ? 'Een woord niet duidelijk? Klik of tik op een onderstreept woord voor uitleg, zonder je plek in de les te verliezen.' : 'Not sure about a word? Click or tap an underlined word for a definition without losing your place in the lesson.'}</span></p>;
}

export function WordPreview({ ids }: { ids: string[] }) {
  const { language } = useLanguage();
  const context = useContext(VocabularyContext);
  const entries = [...new Set(ids)].map(id => entryById.get(id)).filter((entry): entry is Entry => Boolean(entry));
  if (!entries.length) return null;
  function cards(items: Entry[]) { return <div className="word-preview-grid">{items.map(entry => <div className="word-preview-card" key={entry.id}>{context ? <button type="button" className="word-preview-term" aria-haspopup="dialog" onClick={event => context.openDefinition(entry.id, event.currentTarget)}>{entry[language].term}<span aria-hidden="true"> ↗</span></button> : <a className="word-preview-term" href={`#glossary/${entry.id}`}>{entry[language].term}</a>}<p>{entry[language].meaning}</p></div>)}</div>; }
  return <section className="word-preview" aria-label={language === 'nl' ? 'Woorden voor deze les' : 'Words for this lesson'}><div className="word-preview-heading"><BookOpen size={18} aria-hidden="true" /><strong>{language === 'nl' ? 'Drie woorden om je op weg te helpen' : 'Three words to get you started'}</strong></div>{cards(entries.slice(0, 3))}{entries.length > 3 && <details className="word-preview-more"><summary>{language === 'nl' ? `Nog ${entries.length - 3} woorden uit deze les bekijken` : `See ${entries.length - 3} more words from this lesson`}</summary>{cards(entries.slice(3))}</details>}</section>;
}

export function Glossary({ selectedId }: { selectedId?: string }) {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [query, setQuery] = useState('');
  const selectedRef = useRef<HTMLElement>(null);
  const queryId = useId();
  const selectedEntry = selectedId ? entryById.get(selectedId) : null;
  const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const needle = normalize(query.trim());
  const matches = useMemo(() => glossary.filter(entry => !needle || [entry.nl.term, ...entry.nl.aliases, entry.en.term, ...entry.en.aliases, entry[language].meaning].some(value => normalize(value).includes(needle))).sort((a, b) => a[language].term.localeCompare(b[language].term, language)), [needle, language]);

  useEffect(() => {
    if (!selectedEntry) return;
    setQuery('');
    // Full-list links deliberately navigate; inline definitions never scroll.
    const frame = requestAnimationFrame(() => selectedRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [selectedEntry]);

  return <div className="glossary-page"><header className="page-heading"><span className="eyebrow"><BookOpen size={15} aria-hidden="true" /> {nl ? 'Even opzoeken' : 'A quick reference'}</span><h1>{nl ? 'Wiskunde in gewone woorden.' : 'Maths in everyday words.'}</h1><p>{nl ? 'Je hoeft de vaktaal niet al te kennen. Zoek een Nederlands of Engels woord en bekijk een eenvoudig voorbeeld.' : 'You do not need to know the vocabulary already. Search a Dutch or English word and see a simple example.'}</p></header>
    <div className="glossary-search"><label htmlFor={queryId}>{nl ? 'Zoek een woord' : 'Find a word'}</label><div><Search size={19} aria-hidden="true" /><input id={queryId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={nl ? 'Bijvoorbeeld: invullen, expression, logaritme…' : 'For example: substitute, uitdrukking, logarithm…'} autoComplete="off" /></div><p role="status">{matches.length} {nl ? 'woorden gevonden' : 'words found'}</p></div>
    {selectedId && !selectedEntry && <p className="glossary-empty">{nl ? 'Dit woord staat nog niet in de woordenlijst. Probeer de zoekbalk.' : 'This word is not in the word list yet. Try searching above.'}</p>}
    {selectedEntry && !needle && <section className="glossary-featured" ref={selectedRef} tabIndex={-1} aria-label={nl ? 'Gekozen woord' : 'Selected word'}><span className="vocabulary-kicker">{nl ? 'Je zocht dit woord' : 'The word you opened'}</span><h2>{selectedEntry[language].term}</h2><p className="vocabulary-translation" lang={nl ? 'en' : 'nl'}>{nl ? 'English' : 'Nederlands'}: {selectedEntry[nl ? 'en' : 'nl'].term}</p><DefinitionBody entry={selectedEntry} language={language} /></section>}
    {!matches.length ? <p className="glossary-empty">{nl ? 'Geen woord gevonden. Probeer een korter woord of de andere taal.' : 'No words found. Try a shorter word or the other language.'}</p> : <div className="glossary-grid">{matches.map(entry => <article className="glossary-card" key={entry.id} id={`word-${entry.id}`}><h2><a href={`#glossary/${entry.id}`}>{entry[language].term}<span className="sr-only">{nl ? ': open directe link' : ': open direct link'}</span></a></h2><p className="vocabulary-translation" lang={nl ? 'en' : 'nl'}>{nl ? 'English' : 'Nederlands'}: {entry[nl ? 'en' : 'nl'].term}</p><DefinitionBody entry={entry} language={language} /></article>)}</div>}
    <p className="glossary-return"><a className="button secondary" href="#equations">{nl ? 'Naar de lessen over vergelijkingen' : 'Go to equation lessons'}</a></p>
  </div>;
}
