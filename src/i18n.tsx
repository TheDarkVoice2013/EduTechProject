import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { messages } from './ui-messages';
import './language.css';

export type Language = 'nl' | 'en';
type Params = Record<string, string | number>;
const STORAGE_KEY = 'edutech-language-v1';
let currentLanguage: Language = (() => {
  try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'nl'; }
  catch { return 'nl'; }
})();
export function getLanguage(): Language { return currentLanguage; }
export function translate(text: string, language: Language, params: Params = {}) {
  const translated = language === 'nl' ? messages[text] ?? text : text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(params[key] ?? match));
}
export function t(text: string, params?: Params) { return translate(text, currentLanguage, params); }
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: typeof t };
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(getLanguage);
  const value = useMemo(() => ({ language, setLanguage: (next: Language) => {
    currentLanguage = next;
    updateLanguage(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Language still works for this visit. */ }
  }, t: (text: string, params?: Params) => translate(text, language, params) }), [language]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is missing.');
  return context;
}
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label={t('Choose language')}>
    <button type="button" lang="nl" aria-pressed={language === 'nl'} onClick={() => setLanguage('nl')}>Nederlands</button>
    <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
  </div>;
}
