import { useState, type ReactNode } from 'react';
import katex from 'katex';
import { useLanguage } from './i18n';
import './lesson-visuals.css';

function Formula({ value }: { value: string }) {
  // Author-written mathematics only; KaTeX still runs without trusted commands.
  return <span className="lv-math" dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { trust: false, throwOnError: false, strict: 'warn', maxExpand: 100, maxSize: 15, output: 'htmlAndMathml' }) }} />;
}

function Frame({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  const { language } = useLanguage();
  return <figure className="lesson-visual"><figcaption><span className="lv-eyebrow">{language === 'nl' ? 'In beeld' : 'See it'}</span><strong>{title}</strong>{intro && <p>{intro}</p>}</figcaption>{children}</figure>;
}

function StepControls({ step, max, onChange }: { step: number; max: number; onChange: (step: number) => void }) {
  const { language } = useLanguage();
  const nl = language === 'nl';
  return <div className="lv-controls"><button type="button" className="lv-button" onClick={() => onChange(step - 1)} disabled={step === 0}>{nl ? 'Vorige stap' : 'Previous step'}</button><span className="lv-step-count">{nl ? 'Stap' : 'Step'} {step + 1} / {max + 1}</span><button type="button" className="lv-button lv-button-primary" onClick={() => onChange(step + 1)} disabled={step === max}>{nl ? 'Volgende stap' : 'Next step'}</button>{step === max && <button type="button" className="lv-button" onClick={() => onChange(0)}>{nl ? 'Opnieuw' : 'Start again'}</button>}</div>;
}

function Balance() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [step, setStep] = useState(0);
  const removed = step === 1;
  const description = removed
    ? (nl ? 'Haal aan beide kanten twee blokjes weg. De onbekende doos x weegt evenveel als drie blokjes.' : 'Remove two blocks from both sides. The unknown box x weighs the same as three blocks.')
    : (nl ? 'Links staan een onbekende doos x en twee blokjes. Rechts staan vijf blokjes. Beide kanten wegen evenveel.' : 'An unknown box x and two blocks are on the left. Five blocks are on the right. Both sides weigh the same.');
  return <Frame title={nl ? 'Het =-teken zegt: evenveel' : 'The = sign means: the same amount'} intro={nl ? 'Eén blokje stelt 1 voor. Houd de weegschaal in evenwicht.' : 'One block stands for 1. Keep the scale balanced.'}>
    <div className="lv-main-equation"><Formula value={removed ? 'x=3' : 'x+2=5'} /></div>
    <svg className="lv-balance" viewBox="0 0 420 200" role="img" aria-label={description}>
      <path d="M210 106 L178 184 H242 Z" fill="#dbe5d1" stroke="#344f3f" strokeWidth="3" />
      <path d="M47 106 H373 M48 106 V137 M184 106 V137 M236 106 V137 M372 106 V137 M40 139 Q116 172 192 139 Z M228 139 Q304 172 380 139 Z" fill="#eef3e6" stroke="#344f3f" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="210" cy="106" r="7" fill="#244c41" />
      <rect x="59" y="55" width="58" height="46" rx="7" fill="#244c41" />
      <text x="88" y="86" textAnchor="middle" fill="white" fontSize="28" fontFamily="Georgia,serif">x</text>
      {!removed && [126, 154].map(x => <g key={x}><rect x={x} y="74" width="23" height="27" rx="4" fill="#d4e6b4" stroke="#425f30" strokeWidth="1.5" /><text x={x + 11.5} y="94" textAnchor="middle" fill="#243c34" fontSize="17">1</text></g>)}
      {Array.from({ length: removed ? 3 : 5 }, (_, i) => <g key={i}><rect x={removed ? 264 + i * 28 : 238 + i * 28} y="74" width="23" height="27" rx="4" fill="#d4e6b4" stroke="#425f30" strokeWidth="1.5" /><text x={(removed ? 264 : 238) + i * 28 + 11.5} y="94" textAnchor="middle" fill="#243c34" fontSize="17">1</text></g>)}
      <text x="116" y="30" textAnchor="middle" fill="#243c34" fontSize="17">{removed ? 'x' : 'x + 2'}</text>
      <text x="304" y="30" textAnchor="middle" fill="#243c34" fontSize="17">{removed ? '3' : '5'}</text>
      <text x="210" y="69" textAnchor="middle" fill="#243c34" fontSize="30">=</text>
    </svg>
    <p className="lv-narration" aria-live="polite">{description}</p>
    <StepControls step={step} max={1} onChange={setStep} />
    <p className="lv-footnote">{nl ? 'De doos is een beeld voor een onbekend getal. Later kan x ook nul of een negatief getal zijn.' : 'The box is a picture of an unknown number. Later, x can also be zero or a negative number.'}</p>
  </Frame>;
}

function UndoMachine() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [step, setStep] = useState(0);
  const labels = nl
    ? ['Begin met 3x + 5 = 20. Wat is er met x gebeurd? Eerst ×3, daarna +5.', 'Draai de laatste stap terug: trek aan beide kanten 5 af. Nu staat er 3x = 15.', 'Draai ×3 terug: deel beide kanten door 3. Nu staat x alleen: x = 5.']
    : ['Start with 3x + 5 = 20. What happened to x? First ×3, then +5.', 'Undo the last step: subtract 5 from both sides. Now 3x = 15.', 'Undo ×3: divide both sides by 3. Now x is on its own: x = 5.'];
  return <Frame title={nl ? 'Draai de stappen terug' : 'Undo the steps'} intro={nl ? 'Terugrekenen gaat in omgekeerde volgorde.' : 'Work backwards in the reverse order.'}>
    <div className="lv-direction-label">{nl ? 'Heen: wat gebeurt er met x?' : 'Forward: what happens to x?'}</div>
    <div className="lv-flow" aria-label={nl ? 'x, maal 3, daarna plus 5, geeft 20' : 'x, times 3, then plus 5, gives 20'}><span className="lv-tile">x</span><span className="lv-arrow">×3 →</span><span className="lv-tile">3x</span><span className="lv-arrow">+5 →</span><span className="lv-tile">20</span></div>
    <div className="lv-direction-label">{nl ? 'Terug: maak de stappen ongedaan' : 'Backwards: undo those steps'}</div>
    <div className="lv-flow"><span className="lv-tile">20</span><span className={`lv-arrow ${step < 1 ? 'lv-pending' : ''}`}>−5 →</span><span className={`lv-tile ${step < 1 ? 'lv-pending' : 'lv-tile-active'}`}>{step < 1 ? '?' : '15'}</span><span className={`lv-arrow ${step < 2 ? 'lv-pending' : ''}`}>÷3 →</span><span className={`lv-tile ${step < 2 ? 'lv-pending' : 'lv-tile-active'}`}>{step < 2 ? '?' : '5'}</span></div>
    <div className="lv-main-equation"><Formula value={['3x+5=20', '3x=15', 'x=5'][step]} /></div>
    <p className="lv-narration" aria-live="polite">{labels[step]}</p><StepControls step={step} max={2} onChange={setStep} />
  </Frame>;
}

function BothSides() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const steps = [
    { math: '3x+2=x+8', text: nl ? 'x staat aan beide kanten.' : 'x appears on both sides.' },
    { math: '2x+2=8', text: nl ? 'Trek aan beide kanten x af.' : 'Subtract x from both sides.' },
    { math: '2x=6', text: nl ? 'Trek aan beide kanten 2 af.' : 'Subtract 2 from both sides.' },
    { math: 'x=3', text: nl ? 'Deel beide kanten door 2.' : 'Divide both sides by 2.' },
  ];
  return <Frame title={nl ? 'Aan beide kanten dezelfde stap' : 'The same move on both sides'} intro={nl ? 'Een term springt niet zomaar over het =-teken. Jij doet aan beide kanten hetzelfde.' : 'A term does not magically jump across the = sign. You make the same change to both sides.'}>
    <ol className="lv-step-list">{steps.map((item, i) => <li key={item.math}><span className="lv-step-number" aria-hidden="true">{i + 1}</span><div><Formula value={item.math} /><p>{item.text}</p></div></li>)}</ol>
  </Frame>;
}

function BracketGroups() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  return <Frame title={nl ? 'Haakjes maken een groep' : 'Brackets make a group'} intro={nl ? '2(x + 3) betekent: twee keer de hele groep x + 3.' : '2(x + 3) means: two copies of the whole group x + 3.'}>
    <div className="lv-groups">{[1, 2].map(group => <div className="lv-group" key={group}><span className="lv-group-label">{nl ? 'Groep' : 'Group'} {group}</span><div className="lv-group-items"><span className="lv-x-box">x</span><span aria-hidden="true">+</span>{[1, 2, 3].map(unit => <span className="lv-unit" key={unit}>1</span>)}</div></div>)}</div>
    <div className="lv-down-arrow" aria-hidden="true">↓</div><div className="lv-main-equation"><Formula value="2(x+3)=2x+6" /></div>
    <p className="lv-narration">{nl ? 'Tel samen: twee x-dozen en zes losse blokjes. De 2 vermenigvuldigt dus zowel x als 3.' : 'Count them together: two x boxes and six single blocks. The 2 multiplies both x and 3.'}</p>
  </Frame>;
}

function SolutionChoices() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const choices = [
    { icon: '1', title: nl ? 'Eén getal werkt' : 'One number works', math: 'x+2=5', result: 'x=3', text: nl ? 'Alleen 3 maakt beide kanten gelijk.' : 'Only 3 makes both sides equal.' },
    { icon: '∞', title: nl ? 'Elk getal werkt' : 'Every number works', math: 'x+2=x+2', result: '2=2', text: nl ? 'Na x aftrekken blijft een ware uitspraak over: 2 = 2.' : 'Subtract x and a true statement remains: 2 = 2.' },
    { icon: '∅', title: nl ? 'Geen getal werkt' : 'No number works', math: 'x+2=x+3', result: '2=3', text: nl ? 'Na x aftrekken blijft iets onmogelijks over: 2 is niet 3.' : 'Subtract x and something impossible remains: 2 is not 3.' },
  ];
  return <Frame title={nl ? 'Een vergelijking heeft niet altijd één antwoord' : 'An equation does not always have one answer'}><div className="lv-choice-grid">{choices.map(choice => <div className="lv-choice" key={choice.icon}><span className="lv-choice-icon" aria-hidden="true">{choice.icon}</span><h4>{choice.title}</h4><Formula value={choice.math} /><div className="lv-choice-result"><Formula value={choice.result} /></div><p>{choice.text}</p></div>)}</div></Frame>;
}

function PowerSteps() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [power, setPower] = useState(3);
  return <Frame title={nl ? 'Een macht telt vermenigvuldigingen' : 'A power counts multiplications'} intro={nl ? 'Begin bij 1. Elke stap vermenigvuldigt het getal met 2.' : 'Start at 1. Each step multiplies the number by 2.'}>
    <fieldset className="lv-power-options"><legend>{nl ? 'Kies het aantal ×2-stappen' : 'Choose the number of ×2 steps'}</legend><div>{[0, 1, 2, 3, 4].map(n => <button type="button" key={n} className={`lv-button ${n === power ? 'lv-button-primary' : ''}`} aria-pressed={power === n} onClick={() => setPower(n)}>{n}</button>)}</div></fieldset>
    <div className="lv-power-chain" aria-hidden="true"><span className="lv-power-number">1</span>{Array.from({ length: power }, (_, i) => <span className="lv-power-pair" key={i}><span className="lv-power-arrow">×2<br />→</span><span className="lv-power-number">{2 ** (i + 1)}</span></span>)}</div>
    <div className="lv-main-equation"><Formula value={`2^{${power}}=${2 ** power}`} /></div>
    <p className="lv-narration" aria-live="polite">{power === 0 ? (nl ? 'Nul stappen: je begint bij 1 en verandert niets. Daarom is 2⁰ = 1, niet 0.' : 'Zero steps: start at 1 and change nothing. So 2⁰ = 1, not 0.') : (nl ? `${power} ${power === 1 ? 'stap' : 'stappen'} van ×2 vanaf 1 geeft ${2 ** power}. De kleine ${power} is de exponent: het aantal stappen.` : `${power} ${power === 1 ? 'step' : 'steps'} of ×2 from 1 gives ${2 ** power}. The small ${power} is the exponent: the number of steps.`)}</p>
    <p className="lv-footnote">{nl ? 'Een logaritme stelt de vraag andersom: hoeveel ×2-stappen zijn nodig om vanaf 1 bij dit getal te komen? Dit plaatje toont hele stappen; later kunnen antwoorden ook gebroken of negatief zijn.' : 'A logarithm asks the reverse question: how many ×2 steps take you from 1 to this number? This picture shows whole steps; later, answers can also be fractional or negative.'}</p>
  </Frame>;
}

function DomainGates() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  return <Frame title={nl ? 'Kijk eerst wat in de logaritme staat' : 'Check what is inside the logarithm first'} intro={nl ? 'Bij log₂(x − 3) moet x − 3 groter zijn dan 0. Dus x moet groter zijn dan 3.' : 'In log₂(x − 3), x − 3 must be greater than 0. So x must be greater than 3.'}>
    <div className="lv-main-equation"><Formula value="x-3>0\quad\Longrightarrow\quad x>3" /></div>
    <svg className="lv-number-line" viewBox="0 0 420 120" role="img" aria-label={nl ? 'Getallenlijn: een open cirkel bij 3 en een pijl naar rechts. Alle getallen groter dan 3 mogen; 3 zelf niet.' : 'Number line: an open circle at 3 and an arrow to the right. All numbers greater than 3 are allowed; 3 itself is not.'}>
      <line x1="30" y1="51" x2="393" y2="51" stroke="#8b9782" strokeWidth="2" />
      <line x1="175" y1="51" x2="385" y2="51" stroke="#244c41" strokeWidth="7" />
      <path d="M385 42 L400 51 L385 60" fill="#244c41" />
      {[1, 2, 3, 4, 5, 6].map(n => <g key={n}><line x1={n * 60 - 5} y1="44" x2={n * 60 - 5} y2="58" stroke="#344f3f" strokeWidth="2" /><text x={n * 60 - 5} y="83" textAnchor="middle" fontSize="19" fill="#243c34">{n}</text></g>)}
      <circle cx="175" cy="51" r="9" fill="#f4f7ee" stroke="#244c41" strokeWidth="3" />
      <text x="287" y="25" textAnchor="middle" fontSize="16" fill="#243c34">{nl ? 'toegestaan: x > 3' : 'allowed: x > 3'}</text>
    </svg>
    <div className="lv-domain-grid"><div className="lv-check-card lv-check-no"><strong>x = 2</strong><span>2 − 3 = −1</span><span>{nl ? 'Nee: negatief' : 'No: negative'}</span></div><div className="lv-check-card lv-check-no"><strong>x = 3</strong><span>3 − 3 = 0</span><span>{nl ? 'Nee: nul' : 'No: zero'}</span></div><div className="lv-check-card lv-check-yes"><strong>x = 4</strong><span>4 − 3 = 1</span><span>{nl ? 'Ja: positief' : 'Yes: positive'}</span></div></div>
    <p className="lv-footnote">{nl ? 'De open cirkel betekent: 3 hoort er niet bij. Je mag wel ieder getal groter dan 3 gebruiken, ook 3,1.' : 'The open circle means: 3 is not included. Any number greater than 3 is allowed, including 3.1.'}</p>
  </Frame>;
}

function LogRules() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  return <Frame title={nl ? 'Vermenigvuldigen voegt ×2-stappen samen' : 'Multiplying joins ×2 steps together'} intro={nl ? '8 kost drie ×2-stappen vanaf 1. Nog twee ×2-stappen vermenigvuldigen dat met 4.' : '8 takes three ×2 steps from 1. Two more ×2 steps multiply that by 4.'}>
    <div className="lv-log-run" aria-label={nl ? 'Van 1 naar 8: 3 stappen. Van 8 naar 32: nog 2 stappen. Samen 5 stappen.' : 'From 1 to 8: 3 steps. From 8 to 32: 2 more steps. 5 steps in total.'}><div><span className="lv-log-dots" aria-hidden="true">● ● ●</span><Formula value="8=2^3" /><strong>{nl ? '3 stappen' : '3 steps'}</strong></div><span className="lv-join" aria-hidden="true">+</span><div><span className="lv-log-dots lv-log-dots-alt" aria-hidden="true">● ●</span><Formula value="4=2^2" /><strong>{nl ? '2 stappen' : '2 steps'}</strong></div><span className="lv-join" aria-hidden="true">=</span><div><span className="lv-log-dots" aria-hidden="true">● ● ● ● ●</span><Formula value="32=2^5" /><strong>{nl ? '5 stappen' : '5 steps'}</strong></div></div>
    <div className="lv-main-equation"><Formula value="\log_2(8\cdot4)=\log_2(8)+\log_2(4)=3+2" /></div>
    <p className="lv-narration">{nl ? 'De getallen worden vermenigvuldigd: 8 × 4. Hun aantallen stappen worden opgeteld: 3 + 2.' : 'The numbers multiply: 8 × 4. Their step counts add: 3 + 2.'}</p>
    <div className="lv-caution"><strong>{nl ? 'Let op: dit geldt niet voor 8 + 4.' : 'Careful: this does not work for 8 + 4.'}</strong><span><Formula value="\log_2(8+4)\ne\log_2(8)+\log_2(4)" /></span><p>{nl ? 'Links staat de logaritme van 12; rechts staat 5. Omdat 2⁵ = 32, niet 12, zijn die niet gelijk.' : 'The left is the logarithm of 12; the right is 5. Since 2⁵ = 32, not 12, they are not equal.'}</p></div>
  </Frame>;
}

function LogUndo() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [step, setStep] = useState(0);
  const equations = ['\ln(x-2)=3', 'x-2=e^3', 'x=e^3+2'];
  const text = nl ? ['ln is een logaritme met grondtal e. De vraag is: e tot welke macht geeft x − 2?', 'De logaritme zegt dat de macht 3 is. Schrijf daarom x − 2 = e³.', 'Tel aan beide kanten 2 op. Antwoord: x = e³ + 2, ongeveer 22,09.'] : ['ln is a logarithm with base e. It asks: e to what power gives x − 2?', 'The logarithm says that the power is 3. So write x − 2 = e³.', 'Add 2 to both sides. Answer: x = e³ + 2, about 22.09.'];
  return <Frame title={nl ? 'Logaritme en macht draaien elkaar terug' : 'Logarithms and powers undo each other'} intro={nl ? 'e is een vast getal: ongeveer 2,718. Het is hier geen onbekende.' : 'e is a fixed number: about 2.718. It is not an unknown here.'}>
    <div className="lv-inverse-pair"><div><span>{nl ? 'Logaritme' : 'Logarithm'}</span><Formula value="\ln(A)=3" /></div><span className="lv-inverse-arrow" aria-label={nl ? 'betekent hetzelfde als' : 'means the same as'}>⇄</span><div><span>{nl ? 'Macht' : 'Power'}</span><Formula value="A=e^3" /></div></div>
    <p className="lv-footnote">{nl ? 'A is hier een korte naam voor het hele stukje x − 2.' : 'Here A is a short name for the whole piece x − 2.'}</p>
    <div className="lv-main-equation"><Formula value={equations[step]} /></div><p className="lv-narration" aria-live="polite">{text[step]}</p><StepControls step={step} max={2} onChange={setStep} />
    {step === 2 && <p className="lv-footnote">{nl ? 'Controle: x − 2 = e³ is positief, dus de oorspronkelijke logaritme mag.' : 'Check: x − 2 = e³ is positive, so the original logarithm is allowed.'}</p>}
  </Frame>;
}

function CandidateCheck() {
  const { language } = useLanguage();
  const nl = language === 'nl';
  const [candidate, setCandidate] = useState(4);
  const valid = candidate === 4;
  return <Frame title={nl ? 'Een mogelijk antwoord moet nog door de controle' : 'A possible answer still needs a check'} intro={nl ? 'Bij het uitrekenen kom je 4 en −2 tegen. Test ze in de oorspronkelijke logaritmen, niet alleen in een latere regel.' : 'The calculation produces 4 and −2. Test them in the original logarithms, not only in a later line.'}>
    <div className="lv-main-equation"><Formula value="\log_2(x)+\log_2(x-2)=3" /></div>
    <fieldset className="lv-power-options"><legend>{nl ? 'Welk getal wil je controleren?' : 'Which number would you like to check?'}</legend><div>{[4, -2].map(value => <button key={value} type="button" className={`lv-button ${value === candidate ? 'lv-button-primary' : ''}`} aria-pressed={value === candidate} onClick={() => setCandidate(value)}>x = {value === -2 ? '−2' : value}</button>)}</div></fieldset>
    <div className="lv-candidate-inputs"><div><span>{nl ? 'In de eerste logaritme' : 'Inside the first logarithm'}</span><Formula value={`x=${candidate}`} /></div><div><span>{nl ? 'In de tweede logaritme' : 'Inside the second logarithm'}</span><Formula value={valid ? 'x-2=4-2=2' : 'x-2=-2-2=-4'} /></div></div>
    <div className={`lv-candidate-result ${valid ? 'lv-check-yes' : 'lv-check-no'}`} aria-live="polite"><strong>{valid ? (nl ? '4 is een oplossing.' : '4 is a solution.') : (nl ? '−2 valt af.' : '−2 must be rejected.')}</strong><p>{valid ? (nl ? '4 en 2 zijn positief. Bovendien geldt log₂(4) + log₂(2) = 2 + 1 = 3. Alles klopt.' : '4 and 2 are positive. Also, log₂(4) + log₂(2) = 2 + 1 = 3. Both checks pass.') : (nl ? '−2 en −4 zijn negatief. De oorspronkelijke logaritmen bestaan dan niet binnen de reële getallen. Stop hier: dit antwoord mag niet.' : '−2 and −4 are negative. The original logarithms do not exist in the real numbers. Stop here: this answer is not allowed.')}</p></div>
  </Frame>;
}

const visuals: Record<string, () => ReactNode> = {
  'equality-balance': Balance,
  'undo-machine': UndoMachine,
  'both-sides': BothSides,
  'bracket-groups': BracketGroups,
  'solution-choices': SolutionChoices,
  'power-steps': PowerSteps,
  'domain-gates': DomainGates,
  'log-rules': LogRules,
  'log-undo': LogUndo,
  'candidate-check': CandidateCheck,
};

export function LessonVisual({ kind }: { kind: string }) {
  const Visual = visuals[kind];
  return Visual ? <Visual key={kind} /> : null;
}
