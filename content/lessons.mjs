// Original bilingual instructional text. Diagrams and vocabulary support are
// our teaching design, not interventions independently validated by the papers.
const math = String.raw;

export const sources = [
  {
    id: 'otten', authors: 'Mara Otten, Marja Van den Heuvel-Panhuizen & Michiel Veldhuis', year: 2019,
    title: 'The balance model for teaching linear equations: a systematic literature review',
    url: 'https://link.springer.com/article/10.1186/s40594-019-0183-2',
    application: 'Our equality lessons and balance picture explain why doing the same calculation on both sides keeps them equal. Each worked step names what changes and why.',
    limitation: 'This review of 34 articles did not identify a clear pattern establishing the best balance-model implementation. Physical balances are less helpful for negative quantities. Our diagrams and plain-language explanations are design choices, not a proven best method.',
  },
  {
    id: 'ngu', authors: 'Bing Hiong Ngu, Siu Fung Chung & Alexander Seeshing Yeung', year: 2015,
    title: 'Cognitive load in algebra: element interactivity in solving equations',
    url: 'https://doi.org/10.1080/01443410.2013.878019',
    application: 'An undo diagram and detailed steps show the reason for a calculation. A shorter written method is shown alongside the full version so learners can connect them.',
    limitation: 'In one experiment with 71 students, the inverse-method group performed better on more complex equations. Our explain-then-shorten sequence is a design synthesis, not a sequence this experiment directly established as best. Applying it to logarithms is our extension.',
  },
  {
    id: 'rittle', authors: 'Bethany Rittle-Johnson & Jon R. Star', year: 2009,
    title: 'Compared to what? The effects of different comparisons on conceptual knowledge and procedural flexibility for equation solving',
    url: 'https://dash.harvard.edu/entities/publication/73120378-9609-6bd4-e053-0100007fdf3b',
    application: 'Our side-by-side cards solve the same equation in two ways. Learners are asked why both work and which involves fewer or easier calculations.',
    limitation: 'The study involved 162 seventh- and eighth-grade students. Its results support comparing solution methods in that setting; they do not establish that every comparison activity or this website improves learning.',
  },
  {
    id: 'weber', authors: 'Keith Weber', year: 2002,
    title: 'Students’ Understanding of Exponential and Logarithmic Functions',
    url: 'https://files.eric.ed.gov/fulltext/ED477690.pdf',
    application: 'We first show repeated multiplication and explain what an exponent means. A logarithm then becomes a question about that exponent, with a picture connecting the two forms.',
    limitation: 'This research report distinguishes routine calculations from understanding powers and proposes instructional activities. Our original warm-ups and diagrams are inspired by those ideas, not a replication of a validated large-scale intervention.',
  },
  {
    id: 'kenney', authors: 'Rachael Kenney & Signe Kastberg', year: 2013,
    title: 'Links in learning logarithms', url: 'https://files.eric.ed.gov/fulltext/EJ1093384.pdf',
    application: 'We explain which calculation undoes a logarithm instead of saying “the log disappears.” We distinguish ln from base-10 logarithms and show which inputs are allowed throughout solutions.',
    limitation: 'This teacher-facing article discusses student thinking and instructional connections. It is not a large randomized trial, and it does not establish one mandatory teaching sequence.',
  },
  {
    id: 'chua', authors: 'Chua Boon Liang & Eric Wood', year: 2005,
    title: 'Working with Logarithms: Students’ Misconceptions and Errors',
    url: 'https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf',
    application: 'Examples and feedback address common mistakes: using the multiplication rule for addition, treating log as something you can divide out, and accepting an answer without checking the original inputs.',
    limitation: 'The study examined 81 students in two Singapore schools. A chosen wrong answer can suggest what to review, but it does not diagnose a learner with certainty. All our questions, diagrams and explanations are original.',
  },
];

// Dutch terminology cross-checked with SLO and Math4All; all explanations are
// original and introduce everyday wording before the mathematical name.
// https://content.math4all.nl/sec/content/hb-b1/hb-b14/hb-b14-theory.html
// https://www.slo.nl/thema/meer/tule/rekenen-wiskunde/kerndoel-27/
const dutchLessons = {
  'equations-equality': {
    title: 'Wat betekent x?', summary: 'Begin met een ontbrekend getal. Leer eerst een vergelijking lezen, dan oplossen.',
    sections: [
      {
        title: 'Begin hier: een ontbrekend getal',
        body: ['Je kent het rekenen dat we nodig hebben al: optellen, aftrekken, vermenigvuldigen en delen. Een letter staat op de plaats van een getal dat we nog niet weten. Dat noemen we de onbekende.', 'Lees x + 2 = 5 als: “welk getal plus 2 geeft 5?” Het antwoord is 3. De letter x is geen keerteken: × betekent vermenigvuldigen; x is het getal dat we zoeken.', 'Het teken = zegt dat de twee kanten dezelfde waarde hebben. Denk aan een weegschaal in evenwicht: haal aan beide kanten 2 weg. Dan blijft links x over en rechts 3.'],
      },
      {
        title: 'De woorden, met steeds een voorbeeld',
        body: ['Een uitdrukking is een stukje wiskundige tekst, zoals x + 2. Een vergelijking doet een uitspraak met een gelijkteken, zoals x + 2 = 5. Een bewerking is een rekenhandeling, bijvoorbeeld “tel 2 op”.', 'Een oplossing is een getal dat de vergelijking waar maakt. Invullen, ook wel substitueren genoemd, betekent dat je dit getal op de plaats van de letter zet. Vul 3 in voor x: 3 + 2 = 5. Dus 3 is inderdaad een oplossing.', 'We gebruiken reële getallen: getallen op de gewone getallenlijn, zoals negatieve getallen, nul, breuken en kommagetallen. Een verzameling is gewoon een groep. De oplossingsverzameling {3} zegt bijvoorbeeld dat alleen 3 werkt. Je hoeft deze woorden niet uit je hoofd te kennen om verder te gaan.'],
      },
      {
        title: 'Het antwoord hoeft niet rechts te staan',
        body: ['Aan beide kanten van = mogen berekeningen staan. Reken eerst de kant uit die je kent. Zoek daarna het getal waarmee de andere kant dezelfde waarde krijgt.', 'Bij 9 + 6 = x + 7 is de linkerkant 15. Dus x + 7 moet ook 15 zijn.'],
        example: { prompt: 'Zoek het ontbrekende getal in 9 + 6 = x + 7.', reasons: ['9 + 6 is 15, dus de andere kant moet ook 15 zijn.', 'Trek aan beide kanten 7 af. 8 = x betekent hetzelfde als x = 8.'], check: 'Vul 8 in voor x in de oorspronkelijke vraag. Beide kanten zijn 15.' },
      },
      {
        title: 'Verander de berekening, houd dezelfde antwoorden',
        body: ['Tel aan beide kanten hetzelfde op of trek hetzelfde af. Je mag beide kanten ook met hetzelfde getal vermenigvuldigen of door hetzelfde getal delen, zolang dat getal niet nul is. Dan blijven precies dezelfde oplossingen werken. We noemen de vergelijkingen gelijkwaardig.', 'De dubbele pijl hieronder betekent: “deze hebben dezelfde oplossingen”. Deel niet door nul. Als je beide kanten met nul vermenigvuldigt, raak je de informatie over x kwijt: elke vergelijking zou 0 = 0 worden.', 'De weegschaal helpt om aan gelijke hoeveelheden te denken. Bij negatieve getallen is het beeld minder bruikbaar: een echt gewicht kan niet negatief zijn. De rekenregel voor beide kanten blijft wel werken.'],
      },
    ],
    checkpoint: { prompt: 'Wat hoort op de lege plek: 10 + 5 = ___ + 6?', options: ['15', '21', '9', '5'], explanation: 'De linkerkant is 15. Op de lege plek moet 9 staan, want 9 + 6 = 15.' },
  },
  'equations-inverse-operations': {
    title: 'Reken terug om x te vinden', summary: 'Maak telkens één rekenstap ongedaan, totdat x alleen staat.',
    sections: [
      {
        title: 'Maak de laatste handeling als eerste ongedaan',
        body: ['3x betekent 3 × x. Bij 3x + 5 vermenigvuldig je x eerst met 3 en tel je daarna 5 op. Om terug te rekenen trek je dus eerst 5 af en deel je daarna door 3.', 'Een rekenhandeling die een andere ongedaan maakt heet een omgekeerde bewerking. x vrijmaken betekent dat x alleen aan één kant komt te staan. Elke stap voer je aan beide kanten uit.'],
        example: { prompt: 'Los 3x + 5 = 20 op.', reasons: ['Trek aan beide kanten 5 af om “tel 5 op” ongedaan te maken.', '+5 en −5 zijn samen nul. Rechts is 20 − 5 gelijk aan 15.', 'Deel beide kanten door 3 om “vermenigvuldig met 3” ongedaan te maken.', 'x staat nu alleen, dus we hebben het antwoord.'], check: 'Controleer door 5 voor x in te vullen: 3 × 5 + 5 = 20.' },
      },
      {
        title: 'Een kortere regel betekent hetzelfde',
        body: ['Misschien hoor je: “breng +7 naar de andere kant en verander het teken”. Wat er echt gebeurt, is dat je aan beide kanten 7 aftrekt. Niets springt vanzelf over het gelijkteken.', 'Vergelijk de twee manieren om dezelfde stappen op te schrijven. Gebruik de uitgebreide versie als je wilt zien waarom een stap klopt.'],
        comparison: { left: { title: 'Laat de berekening aan beide kanten zien', steps: ['$x+7=12$', '$x+7-7=12-7$', '$x=5$'] }, right: { title: 'Schrijf dezelfde stap korter op', steps: ['$x+7=12$', '$x=12-7$', '$x=5$'] } },
      },
      {
        title: 'Let op mintekens en hele groepen',
        body: ['Bij −4x wordt x vermenigvuldigd met −4. Dat getal heet de coëfficiënt. Houd het minteken erbij: bij −4x = 20 deel je beide kanten door −4. Dan krijg je x = −5.', 'Een breukstreep betekent delen. Bij (x − 2)/4 wordt de hele berekening x − 2 gedeeld door 4. Bij (x − 2)/4 = 3 vermenigvuldig je eerst beide kanten met 4: x − 2 = 12. Tel daarna aan beide kanten 2 op: x = 14.'],
      },
    ],
    checkpoint: { prompt: 'Bij 5x − 4 = 16: welke stap maakt “trek 4 af” als eerste ongedaan?', options: ['Tel aan beide kanten 4 op', 'Trek aan beide kanten 4 af', 'Deel alleen 5x door 5', 'Verander 16 in −16'], explanation: 'Tel aan beide kanten 4 op: 5x = 20. Deel daarna beide kanten door 5: x = 4.' },
  },
  'equations-both-sides': {
    title: 'Als x aan beide kanten staat', summary: 'Haal aan beide kanten evenveel x weg en reken daarna terug.',
    sections: [
      {
        title: 'Haal aan beide kanten dezelfde x weg',
        body: ['Elke x in dezelfde vergelijking staat voor hetzelfde getal. Bij 3x + 2 = x + 8 trek je aan beide kanten x af. Drie keer x min één keer x is twee keer x: 2x + 2 = 8.', 'Trek daarna aan beide kanten 2 af: 2x = 6. Deel beide kanten door 2: x = 3. Je hoeft x nog niet te kennen om het af te trekken: je haalt aan beide kanten dezelfde hoeveelheid weg.'],
      },
      {
        title: 'Een tweede voorbeeld, met elke stap',
        body: ['Een term is een deel dat buiten haakjes door + of − van andere delen wordt gescheiden. In 5x − 4 zijn de termen 5x en −4. “Gelijksoortige termen samennemen” betekent passende delen verzamelen: vijf keer x min twee keer x is drie keer x.', 'Het kan makkelijker rekenen als er een positief getal voor x overblijft. Een juiste aanpak met een negatief getal werkt ook.'],
        example: { prompt: 'Los 5x − 4 = 2x + 11 op.', reasons: ['Trek aan beide kanten 2x af.', 'Vijf keer x min twee keer x is drie keer x; 2x − 2x is nul.', 'Tel aan beide kanten 4 op.', 'Deel beide kanten door 3.'], check: 'Vul voor elke x het getal 5 in. De oorspronkelijke linker- en rechterkant geven allebei 21.' },
      },
      {
        title: 'Benoem de stap; controleer waar je begon',
        body: ['Van 3x + 5 = x + 13 naar 2x + 5 = 13 zeg je: “trek aan beide kanten x af”. Daarna naar 2x = 8 zeg je: “trek aan beide kanten 5 af”. Is een korte regel onduidelijk? Schrijf de rekenhandeling dan helemaal uit.', 'Controleer je antwoord door het in de oorspronkelijke vergelijking in te vullen, niet alleen in de laatste regel. Kloppen de twee kanten niet? Zoek de eerste stap waar je links iets anders deed dan rechts.'],
      },
    ],
    checkpoint: { prompt: 'Los 4x + 1 = 2x + 9 op.', options: ['x = 5', 'x = 4', 'x = 2', 'x = −4'], explanation: 'Trek aan beide kanten eerst 2x en daarna 1 af: 2x = 8. Dus x = 4. Beide oorspronkelijke kanten zijn dan 17.' },
  },
  'equations-choose-a-method': {
    title: 'Haakjes en breuken, stap voor stap', summary: 'Bekijk wat een groep betekent, vergelijk twee aanpakken en oefen met breukstrepen.',
    sections: [
      {
        title: 'Haakjes houden een groep bij elkaar',
        body: ['2(x + 3) betekent twee keer de hele groep x + 3. Je hebt twee keer x en twee keer 3, dus samen 2x + 6, niet 2x + 3. Dit noemen we haakjes wegwerken.', 'Een factor is iets dat wordt vermenigvuldigd. Hier zijn de factoren 2 en de hele groep (x + 3). De algemene regel is a(b + c) = ab + ac. Je kunt hiervoor ook de naam distributieve eigenschap tegenkomen.', 'Probeer x = 1: 2(1 + 3) is 8 en 2 × 1 + 6 is ook 8. De foutieve berekening 2 × 1 + 3 zou 5 geven.'],
      },
      {
        title: 'Twee juiste routes naar hetzelfde antwoord',
        body: ['Bij 3(x + 2) = 18 kun je eerst de haakjes wegwerken, of eerst beide kanten door 3 delen. Leg elke stap uit en kies daarna wat jij makkelijker vindt.', 'Hier kost eerst delen minder rekenwerk. Dat maakt eerst haakjes wegwerken niet fout; bij een andere vergelijking kan dat handiger zijn.'],
        comparison: { left: { title: 'Eerst de haakjes wegwerken', steps: ['$3x+6=18$', '$3x=12$', '$x=4$'] }, right: { title: 'Eerst beide kanten door 3 delen', steps: ['$x+2=6$', '$x=4$'] } },
      },
      {
        title: 'Volgende stap: breukstrepen wegwerken',
        body: ['Een breuk betekent: boven gedeeld door onder. Het bovenste deel heet de teller; het onderste deel heet de noemer. Bij x/2 deel je x door 2. Onderaan mag geen nul staan.', 'Bij x/2 + x/3 = 10 kun je alles met 6 vermenigvuldigen om beide delingen weg te werken: 6 ÷ 2 = 3 en 6 ÷ 3 = 2. Het getal 6 is een gemeenschappelijke noemer. Vermenigvuldig elk deel aan beide kanten.', 'Bij het optellen van breuken tel je de onderste getallen niet bij elkaar op. Bijvoorbeeld: 1/2 + 1/3 = 3/6 + 2/6 = 5/6, niet 2/5.'],
        example: { prompt: 'Los x/2 + x/3 = 10 op.', reasons: ['Vermenigvuldig de hele linker- en rechterkant met 6.', 'Vermenigvuldig beide breuken: 6 × x/2 is 3x en 6 × x/3 is 2x.', 'Drie keer x plus twee keer x is vijf keer x.', 'Deel beide kanten door 5.'], check: '12/2 + 12/3 = 6 + 4 = 10.' },
      },
    ],
    checkpoint: { prompt: 'Welke aanpak lost 4(x − 2) = 20 op zonder eerst de haakjes weg te werken?', options: ['Trek 2 af en deel daarna alleen x door 4', 'Deel alleen de linkerkant door 4', 'Maak van 4(x − 2) de berekening 4x − 2', 'Deel beide kanten door 4 en tel daarna aan beide kanten 2 op'], explanation: 'Na delen krijg je x − 2 = 5; na optellen x = 7. Eerst de haakjes wegwerken kan ook, als je elk deel binnen de haakjes vermenigvuldigt.' },
  },
  'equations-solution-sets': {
    title: 'Kan er geen antwoord zijn, of juist heel veel?', summary: 'Begrijp wat het betekent als x wegvalt en probeer daarna een formule te herschrijven.',
    sections: [
      {
        title: 'Niet elke vergelijking heeft precies één antwoord',
        body: ['Bij x + 2 = 5 werkt alleen 3. Andere vergelijkingen kunnen voor elk getal waar zijn, of voor elk getal onmogelijk. De oplossingsverzameling is gewoon de groep van alle antwoorden die werken.', 'Bij 2(x + 3) = 2x + 6 wordt de linkerkant na het wegwerken van de haakjes precies hetzelfde als de rechterkant. Elk reëel getal werkt, ook nul, negatieve getallen en breuken. Dit heet een identiteit.', 'Als je aan beide kanten dezelfde delen aftrekt, blijft 0 = 0 over. Dat zegt: “nul is gelijk aan nul”. Het zegt niet dat x nul moet zijn.'],
      },
      {
        title: 'Een onmogelijke uitspraak betekent geen oplossing',
        body: ['Trek bij 4x + 1 = 4x + 7 aan beide kanten 4x af. Je krijgt 1 = 7. Geen enkele keuze voor x kan dat waar maken, dus er is geen oplossing.', 'Als x verdwijnt, lees dan wat er overblijft. Een uitspraak die altijd waar is betekent dat elk toegestaan getal werkt. Een uitspraak die altijd onwaar is betekent dat er geen oplossing is.'],
      },
      {
        title: 'Verdieping: een antwoord met andere letters',
        body: ['Probeer dit als de eerdere stappen om terug te rekenen vertrouwd voelen. Een formule is een geschreven regel die hoeveelheden met elkaar verbindt. Andere letters kunnen voor bekende getallen staan, terwijl jij uitzoekt hoe je x vindt.', 'Stel bij p = 2x + 2y dat p en y gegeven zijn. Je mag het antwoord laten staan als een berekening met die letters; je hoeft hun getalswaarden nog niet te kennen.'],
        example: { prompt: 'Herschrijf p = 2x + 2y zodat x alleen staat.', reasons: ['Trek aan beide kanten 2y af.', 'Deel beide kanten door 2 en schrijf x links om het makkelijker te lezen.'], check: 'Als p = 20 en y = 3, dan is x = (20 − 6)/2 = 7. Controle: 2 × 7 + 2 × 3 = 20. Ook algemeen geeft invullen van (p − 2y)/2 in 2x + 2y weer p.' },
      },
    ],
    checkpoint: { prompt: 'Welke getallen maken 3(x − 1) = 3x − 3 waar?', options: ['Alleen x = 1', 'Geen reële getallen', 'Elk reëel getal', 'Alleen x = 0'], explanation: 'De linkerkant wordt 3x − 3, precies hetzelfde als rechts. Elk reëel getal werkt.' },
  },
  'logarithms-exponent-question': {
    title: 'Een logaritme vindt de ontbrekende macht', summary: 'Begin met herhaald vermenigvuldigen. Dan worden de nieuwe tekens een vertrouwde vraag.',
    sections: [
      {
        title: 'Opfrisser: wat betekent 2³?',
        body: ['2³ is een korte schrijfwijze voor 2 × 2 × 2, en dat is 8. Het betekent niet 2 × 3. De 2 heet het grondtal; de kleine 3 rechtsboven heet de exponent. We zeggen: “2 tot de macht 3”.', 'Bij positieve gehele exponenten tel je hoe vaak het grondtal in de vermenigvuldiging staat: 2¹ = 2, 2² = 4, 2³ = 8. Een stap terug betekent delen door 2, dus 2⁰ = 1. Je hoeft deze woorden nog niet te kennen: we blijven ze verbinden met de berekening.', 'Draai de vraag nu om: 2 tot welke macht geeft 8? Het antwoord is 3. We schrijven dit als log₂(8) = 3. Een logaritme vraagt naar de exponent.'],
      },
      {
        title: 'Lees een logaritme als een vraag',
        body: ['Bij log₃(x) = 2 is de kleine 3 nog steeds het grondtal. De uitspraak vraagt naar het getal x dat je krijgt door 3 tot de macht 2 te nemen. Dus x is 3 × 3 = 9.', 'De invoer tussen de haakjes heet het argument. Bij de logaritmen in deze cursus moet die invoer groter dan nul zijn. Het grondtal moet ook groter dan nul zijn en mag niet 1 zijn. De volgende les legt deze voorwaarden uit.'],
        example: { prompt: 'Los log₃(x) = 2 op.', reasons: ['x is de invoer van de logaritme en moet dus groter dan nul zijn.', 'Lees dezelfde uitspraak als “3 tot de macht 2 geeft x”.', '3 × 3 is 9.'], check: '9 is groter dan nul en log₃(9) = 2.' },
      },
      {
        title: 'De uitkomst van een logaritme mag negatief zijn',
        body: ['Bij machten van 10 deel je bij elke stap terug door 10: 10¹ = 10, 10⁰ = 1, 10⁻¹ = 0,1 en 10⁻² = 0,01. Een negatieve exponent betekent niet dat de uitkomst een negatief getal is.', 'Dus log₁₀(0,01) = −2. De invoer 0,01 is positief, terwijl het antwoord −2 negatief is. Ook geldt log₂(1) = 0, want 2⁰ = 1.'],
        math: math`10^{-2}=\frac{1}{10\cdot10}=0{,}01\quad\Longleftrightarrow\quad\log_{10}(0{,}01)=-2`,
      },
    ],
    checkpoint: { prompt: 'Wat is log₄(64)? Anders gezegd: 4 tot welke macht geeft 64?', options: ['16', '3', '4', '2'], explanation: '4 × 4 × 4 = 64, dus 4³ = 64. De gevraagde exponent is 3.' },
  },
  'logarithms-domain': {
    title: 'Welke getallen mag je invullen?', summary: 'Controleer het getal binnen de logaritme en leer wat ln betekent.',
    sections: [
      {
        title: 'De hele invoer moet groter dan nul zijn',
        body: ['Het domein betekent: alle getallen die je mag invullen. Bij reële logaritmen moet de invoer tussen de haakjes positief zijn: groter dan nul, niet gelijk aan nul.', 'Bij log₂(x − 3) is de hele invoer x − 3. Als x = 3, wordt die nul; als x = 2, wordt die −1. Allebei zijn niet toegestaan. Bij x = 4 wordt de invoer 1, en dat mag wel.', 'We hebben x − 3 > 0 nodig, dus x > 3. Lees > als “groter dan” en < als “kleiner dan”. Bij ≥ en ≤ mag het getal ook gelijk zijn aan de grens; bij > en < niet.'],
      },
      {
        title: 'Controleer ook het grondtal',
        body: ['Een reële logaritme heeft een grondtal nodig dat groter is dan nul en niet gelijk is aan 1. Een breuk zoals 1/2 mag wel. Nul en negatieve grondtallen zijn hier niet toegestaan.', 'Waarom geen grondtal 1? Elke macht van 1 is nog steeds 1. “1 tot welke macht geeft 8?” heeft geen antwoord, terwijl “1 tot welke macht geeft 1?” geen uniek antwoord heeft. Dat geeft geen bruikbare omgekeerde rekenregel.'],
      },
      {
        title: 'ln is een logaritme met een speciaal grondtal',
        body: ['ln betekent een logaritme met grondtal e. De letter e is de naam van een vast getal, ongeveer 2,71828; het is geen onbekende die we zoeken. Je hoeft de volledige decimale waarde niet te kennen.', 'Een functie is een vaste rekenregel die bij elke toegestane invoer precies één uitkomst geeft. ln is zo’n regel. Het betekent niet “l keer n” en je kunt het niet wegdelen.', 'Een logaritme met grondtal 10 is een andere regel dan ln. We schrijven elk grondtal erbij, behalve bij de standaardnaam ln. Als je e verheft tot de uitkomst van ln, kom je terug bij de positieve invoer.'],
      },
    ],
    checkpoint: { prompt: 'Welke waarden van x zijn toegestaan in log₃(7 − 2x)?', options: ['x < 3,5', 'x ≤ 3,5', 'x > 0', 'x ≠ 3,5'], explanation: 'De hele invoer moet groter dan nul zijn: 7 − 2x > 0. Tel aan beide kanten 2x op: 7 > 2x. Deel door 2: 3,5 > x, dus x < 3,5. Bij 3,5 wordt de invoer nul, dus die waarde mag niet.' },
  },
  'logarithms-laws': {
    title: 'Drie handige regels voor logaritmen', summary: 'Verbind vermenigvuldigen, delen en machten, en herken een regel die niet klopt.',
    sections: [
      {
        title: 'Invoer vermenigvuldigen betekent logaritmen optellen',
        body: ['Een product is de uitkomst van een vermenigvuldiging. Begin met getallen: 8 × 4 = (2 × 2 × 2) × (2 × 2). Er staan vijf tweeën in de vermenigvuldiging, dus de uitkomst is 2⁵.', 'Daarom is log₂(8 × 4) = 3 + 2 = 5. De logaritme van een product is de som van de logaritmen. Beide invoergetallen moeten groter dan nul zijn en de grondtallen moeten gelijk zijn.', 'De formule hieronder zegt hetzelfde met u en v als de twee invoergetallen. Het grondtal b moet groter dan nul zijn en mag niet 1 zijn.'],
      },
      {
        title: 'Invoer delen betekent logaritmen aftrekken',
        body: ['Een quotiënt is de uitkomst van een deling. Omdat 8 ÷ 4 = 2, geldt log₂(8/4) = 1. De regel geeft hetzelfde antwoord: log₂(8) − log₂(4) = 3 − 2 = 1.', 'Zowel het bovenste getal u als het onderste getal v moet groter dan nul zijn. Het grondtal moet hetzelfde zijn.'],
      },
      {
        title: 'Een macht binnenin wordt een vermenigvuldiging erbuiten',
        body: ['Bij een positieve invoer u is de logaritme van u tot de macht k gelijk aan k keer de logaritme van u. In de formule is k binnenin de exponent en erbuiten het getal waarmee je vermenigvuldigt. Dit werkt voor elk reëel getal k.', 'Bijvoorbeeld: log₂(8²) = log₂(64) = 6. De andere route geeft 2 × log₂(8) = 2 × 3 = 6. Het grondtal blijft 2; de exponent verandert dat niet.'],
      },
      {
        title: 'Optellen binnen de haakjes is iets anders',
        body: ['Gebruik de productregel niet als de invoergetallen worden opgeteld. Controleer het met getallen: log₂(8 + 8) = log₂(16) = 4, terwijl log₂(8) + log₂(8) = 3 + 3 = 6.', 'Omdat 4 niet gelijk is aan 6, bestaat er geen algemene regel die de logaritme van een optelling zo opsplitst. Kijk altijd eerst naar het teken binnen de haakjes.'],
      },
      {
        title: 'Verdieping: houd de oorspronkelijke voorwaarden',
        body: ['Als je log₂(x) + log₂(x − 2) samenvoegt, moeten de oorspronkelijke invoergetallen allebei positief blijven. We hebben x > 2 nodig. Ook als x(x − 2) bij een andere x positief is, maakt dat de twee oorspronkelijke logaritmen nog niet toegestaan.', 'Ook ln(x²) = 2ln(x) is hier alleen veilig voor x > 0. Bij x = −2 is de linkerkant ln(4), en dat mag. Maar rechts staat ln(−2), en dat mag niet. Bij herschrijven mogen de toegestane invoergetallen niet ongemerkt veranderen.'],
      },
    ],
    checkpoint: { prompt: 'Welke uitdrukking is gelijk aan log₂(3) + log₂(5)?', options: ['log₂(8)', 'log₂(3/5)', 'log₂(3) × log₂(5)', 'log₂(15)'], explanation: 'Beide invoergetallen zijn positief en de grondtallen zijn gelijk. Je telt de logaritmen op door de invoergetallen te vermenigvuldigen: log₂(3 × 5) = log₂(15).' },
  },
  'logarithms-inverse-functions': {
    title: 'Maak een logaritme ongedaan om x te vinden', summary: 'Gebruik de bijpassende macht, los de rest op en controleer.',
    sections: [
      {
        title: 'Gebruik het grondtal om terug te rekenen',
        body: ['ln heeft grondtal e. Dus ln(x − 2) = 3 vraagt: “e tot welke macht geeft x − 2?” Het antwoord is 3, dus x − 2 = e³.', 'Je kunt dit laten zien door e tot de macht van elke kant te nemen. Bij een positieve invoer maakt dit ln ongedaan. We delen niet door “ln”; we gebruiken de bijpassende omgekeerde berekening.'],
        example: { prompt: 'Los ln(x − 2) = 3 op.', reasons: ['De invoer x − 2 moet groter dan nul zijn.', 'Gebruik beide kanten als exponent bij het grondtal e.', 'De macht met grondtal e maakt ln ongedaan, dus de invoer x − 2 komt terug.', 'Tel aan beide kanten 2 op.'], check: 'e³ is positief, dus het antwoord is groter dan 2. Als je e³ + 2 voor x invult, krijg je ln(e³) = 3.' },
      },
      {
        title: 'Zelfde grondtal en zelfde logaritme: zelfde invoer',
        body: ['Bij hetzelfde toegestane grondtal geven verschillende positieve invoergetallen verschillende logaritmewaarden. Als twee logaritmen gelijk zijn, moeten hun invoergetallen dus gelijk zijn.', 'Dit heet ook wel de één-op-één-eigenschap. Je deelt geen gemeenschappelijke factor weg. Controleer eerst of beide invoergetallen toegestaan zijn voordat je ze aan elkaar gelijkstelt.'],
        example: { prompt: 'Los log₂(x − 1) = log₂(5 − x) op.', reasons: ['x − 1 moet positief zijn, dus x > 1. Ook 5 − x moet positief zijn, dus x < 5.', 'De logaritmen hebben hetzelfde grondtal en dezelfde waarde, dus hun invoer is gelijk.', 'Tel aan beide kanten x en daarna 1 op; deel beide kanten door 2.'], check: '3 ligt tussen 1 en 5. Beide oorspronkelijke invoergetallen worden 2, dus de logaritmen zijn gelijk.' },
      },
      {
        title: 'Een antwoord mag als berekening blijven staan',
        body: ['e³ + 2 is een exact antwoord: er is niets afgerond. Een rekenmachine geeft ongeveer 22,086. Dat helpt om de grootte in te schatten, maar meestal kun je het exacte antwoord beter laten staan.', 'Controleer de oorspronkelijke vergelijking en de toegestane invoer. Een getal uit de rekenmachine vervangt niet de uitleg waarom elke stap klopt.'],
      },
    ],
    checkpoint: { prompt: 'Los ln(x + 1) = 0 op.', options: ['x = −1', 'x = 1', 'x = 0', 'x = e'], explanation: 'We hebben x + 1 > 0 nodig, dus x > −1. Herschrijf als x + 1 = e⁰ = 1 en trek daarna 1 af: x = 0. De oorspronkelijke invoer is 1, en dat mag.' },
  },
  'logarithms-combine-and-check': {
    title: 'Voeg de stappen samen en controleer', summary: 'Verdieping: voeg logaritmen samen, toets mogelijke antwoorden en zoek een onbekende exponent.',
    sections: [
      {
        title: 'Verdieping: een berekend antwoord kan toch niet mogen',
        body: ['Probeer dit als haakjes, machten en de logaritmeregels vertrouwd voelen. We gebruiken ook x²: dat betekent x × x. Je kunt gerust eerst verder oefenen met uitleg voordat je dit voorbeeld aanpakt.', 'Schrijf eerst op welke invoer mag. Voeg daarna de logaritmen samen en reken de vergelijking uit. Een mogelijk antwoord uit die berekening is pas een oplossing als het ook in de oorspronkelijke vraag werkt.', 'De stap met haakjes hieronder herschrijft x² − 2x − 8 als (x − 4)(x + 2). Dit heet ontbinden in factoren. Controleer door uit te vermenigvuldigen: x² + 2x − 4x − 8 = x² − 2x − 8. Twee getallen kunnen alleen samen nul opleveren bij vermenigvuldigen als minstens één ervan nul is.'],
        example: { prompt: 'Los log₂(x) + log₂(x − 2) = 3 op.', reasons: ['Beide oorspronkelijke invoergetallen moeten groter dan nul zijn.', 'Gebruik de productregel voor logaritmen en houd de voorwaarde x > 2.', '2 tot de macht 3 is 8.', 'Werk x(x − 2) uit, trek aan beide kanten 8 af en schrijf x² − 2x − 8 als deze twee groepen vermenigvuldigd.', 'De haakjes geven x − 4 = 0 of x + 2 = 0: mogelijke antwoorden 4 en −2. −2 valt af, want we hebben x > 2 nodig.'], check: 'log₂(4) + log₂(2) = 2 + 1 = 3. Bij −2 zouden de oorspronkelijke invoergetallen −2 en −4 zijn: beide logaritmen zijn dan niet toegestaan.' },
      },
      {
        title: 'Schrijf een gewoon getal als een passende logaritme',
        body: ['Bij log₂(x + 2) = log₂(x) + 1 is de 1 geen invoer die je zomaar bij x mag optellen. Omdat log₂(2) = 1, schrijf je de 1 in die vorm.', 'Voor x > 0 wordt rechts dan log₂(2x). Gelijke invoer geeft x + 2 = 2x, dus x = 2. Controleer: log₂(4) = log₂(2) + 1, dus 2 = 1 + 1.'],
      },
      {
        title: 'Als x in de exponent staat',
        body: ['Bij 2^(x + 1) = 7 is de exponent onbekend. Delen door 2 maakt een macht van 2 niet ongedaan. Een logaritme met grondtal 2 stelt precies de vraag die we nodig hebben.', 'Heeft je rekenmachine wel ln maar geen logaritme met grondtal 2? Gebruik dan log₂(7) = ln(7)/ln(2). Dit heet veranderen van grondtal.'],
        example: { prompt: 'Los 2^(x + 1) = 7 op.', reasons: ['Neem aan beide kanten de logaritme met grondtal 2; beide invoergetallen zijn positief.', 'De logaritme vraagt naar de macht van 2. Links is die x + 1.', 'Trek aan beide kanten 1 af. De laatste schrijfwijze is handig op een rekenmachine.'], check: 'Het exacte antwoord geeft 2^(x + 1) = 2^(log₂(7)) = 7. Bij benadering is x gelijk aan 1,807.' },
      },
      {
        title: 'Voordat je vragen met een timer probeert',
        body: ['Leg bij oefenen met uitleg één stap in je eigen woorden uit voordat je het uitgewerkte antwoord bekijkt. Oefen ook met herkennen waarom een foute stap niet klopt, niet alleen met een getal kiezen.', 'In de toetsfase zijn hints verborgen en heeft elke vraag een tijdslimiet. Dit is een oefenfunctie voor een toetssituatie, geen lesmethode die door deze onderzoeken bewezen is. Blijf zonder timer oefenen zolang je tijd nodig hebt om na te denken.'],
      },
    ],
    checkpoint: { prompt: 'Bij log₂(x) + log₂(x − 2) = 3 vind je met rekenen x = 4 of x = −2. Welk antwoord werkt in de oorspronkelijke vergelijking?', options: ['Alleen x = 4', 'Alleen x = −2', 'Allebei', 'Geen van beide'], explanation: 'De oorspronkelijke invoergetallen moeten positief zijn, dus x > 2. Alleen x = 4 is toegestaan en geeft het oorspronkelijke totaal van 3.' },
  },
};

export const lessons = [
  // Otten et al.: equality, with an explicit limit to the balance analogy.
  // https://link.springer.com/article/10.1186/s40594-019-0183-2
  {
    id: 'equations-equality', topic: 'equations', title: 'What does x mean?',
    summary: 'Start with a missing number. Learn to read an equation before solving one.', minutes: 7,
    words: ['unknown', 'equation', 'equality', 'expression', 'operation', 'solution', 'substitute', 'set', 'real-number', 'equivalent'],
    sections: [
      {
        title: 'Start here: a missing number', visual: 'equality-balance',
        body: ['You already know the arithmetic we need: adding, subtracting, multiplying and dividing. A letter holds the place of a number we do not know yet. That number is called the unknown.', 'Read x + 2 = 5 as “which number, plus 2, gives 5?” The answer is 3. The letter x is not a multiplication sign: × means multiply; x is the number we are looking for.', 'The = sign says that the two sides have the same value. Imagine a balanced scale: taking 2 from both sides leaves x on one side and 3 on the other.'],
        math: math`x+2=5\quad\Longleftrightarrow\quad x=3`, sourceTags: ['otten'],
      },
      {
        title: 'The words, with one example each',
        body: ['An expression is a piece of mathematical writing, such as x + 2. An equation makes a statement with an equals sign, such as x + 2 = 5. An operation is a calculation action: for example, “add 2.”', 'A solution is a number that makes the equation true. To substitute means to put that number in place of the letter. Put 3 in place of x: 3 + 2 = 5, so 3 really is a solution.', 'We use real numbers: numbers on the usual number line, including negatives, zero, fractions and decimals. A set just means a collection. For example, the solution set {3} says that the only working answer is 3. You do not need to memorise the terminology before continuing.'], sourceTags: ['otten'],
      },
      {
        title: 'The answer does not have to be on the right',
        body: ['Both sides of = may contain calculations. Work out the side you know, then ask what number makes the other side match.', 'For 9 + 6 = x + 7, the left side is 15. We need x + 7 to be 15 too.'], math: math`9+6=x+7`,
        example: { prompt: 'Find the missing number in 9 + 6 = x + 7.', steps: [
          { math: math`15=x+7`, reason: '9 + 6 is 15, so the other side must also be 15.' },
          { math: math`8=x`, reason: 'Subtract 7 from both sides. 8 = x means the same thing as x = 8.' },
        ], check: 'Put 8 in place of x in the original question. Both sides are 15.' }, sourceTags: ['otten'],
      },
      {
        title: 'Change the calculation, keep the same answers',
        body: ['Add or subtract the same amount on both sides. You may also multiply or divide both sides by the same number, as long as it is not zero. These steps keep exactly the same solutions. We call the equations equivalent.', 'The double arrow below means “these have the same solutions.” Do not divide by zero. Multiplying both sides by zero loses the information about x: every equation would turn into 0 = 0.', 'The balance picture helps us think about equal amounts. It is less useful for negative numbers, since a physical weight cannot be negative. The rule about both sides still works.'],
        math: math`x+7=12\quad\Longleftrightarrow\quad x=5`, sourceTags: ['otten'],
      },
    ],
    checkpoint: { prompt: 'What belongs in the blank: 10 + 5 = ___ + 6?', options: ['15', '21', '9', '5'], correct: 2, explanation: 'The left side is 15. The blank must be 9 because 9 + 6 = 15.' }, sourceTags: ['otten'],
  },
  // Ngu et al.: connect meaning to shorter notation, rather than omit meaning.
  // https://doi.org/10.1080/01443410.2013.878019
  {
    id: 'equations-inverse-operations', topic: 'equations', title: 'Work backwards to find x',
    summary: 'Undo one calculation at a time until x stands on its own.', minutes: 7,
    words: ['operation', 'inverse', 'coefficient', 'isolate', 'negative', 'fraction', 'substitute'],
    sections: [
      {
        title: 'Undo the last action first', visual: 'undo-machine',
        body: ['3x means 3 × x. So 3x + 5 says: multiply x by 3, then add 5. To go backwards, subtract 5 first, then divide by 3.', 'A calculation that undoes another is called an inverse operation. To isolate x means to leave x on its own on one side. Every undo step must be done to both sides.'],
        example: { prompt: 'Solve 3x + 5 = 20.', steps: [
          { math: math`3x+5-5=20-5`, reason: 'Subtract 5 from both sides to undo “add 5.”' },
          { math: math`3x=15`, reason: 'The +5 and −5 make zero. On the right, 20 − 5 is 15.' },
          { math: math`\frac{3x}{3}=\frac{15}{3}`, reason: 'Divide both sides by 3 to undo “multiply by 3.”' },
          { math: math`x=5`, reason: 'x now stands alone, so we have the answer.' },
        ], check: 'Check by replacing x with 5: 3 × 5 + 5 = 20.' }, sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'A shorter line means the same thing',
        body: ['You may hear “move +7 across and change its sign.” What actually happens is: subtract 7 from both sides. Nothing jumps across the equals sign.', 'Compare the two ways of writing the same steps. Use the fuller version whenever you want to see why a step works.'],
        comparison: { left: { title: 'Show the calculation on both sides', steps: ['$x+7=12$', '$x+7-7=12-7$', '$x=5$'] }, right: { title: 'Write the same step more briefly', steps: ['$x+7=12$', '$x=12-7$', '$x=5$'] } }, sourceTags: ['ngu', 'otten'],
      },
      {
        title: 'Watch minus signs and whole groups',
        body: ['In −4x, the number multiplying x is −4. This number is called the coefficient. Keep its minus sign: to solve −4x = 20, divide both sides by −4, giving x = −5.', 'A fraction line means division. In (x − 2)/4, all of x − 2 is divided by 4. For (x − 2)/4 = 3, first multiply both sides by 4 to get x − 2 = 12. Then add 2 to both sides, giving x = 14.'],
        math: math`-4x=20\quad\Longleftrightarrow\quad x=\frac{20}{-4}=-5`, sourceTags: ['ngu'],
      },
    ],
    checkpoint: { prompt: 'In 5x − 4 = 16, what first undoes “subtract 4”?', options: ['Add 4 to both sides', 'Subtract 4 from both sides', 'Divide just 5x by 5', 'Change 16 to −16'], correct: 0, explanation: 'Adding 4 to both sides gives 5x = 20. Dividing both sides by 5 then gives x = 4.' }, sourceTags: ['otten', 'ngu'],
  },
  {
    id: 'equations-both-sides', topic: 'equations', title: 'When x is on both sides',
    summary: 'Subtract the same number of x’s from each side, then work backwards.', minutes: 7,
    words: ['unknown', 'term', 'coefficient', 'simplify', 'substitute', 'positive'],
    sections: [
      {
        title: 'Take away the same x on each side', visual: 'both-sides',
        body: ['Every x in the same equation stands for the same number. In 3x + 2 = x + 8, subtract x from both sides. Three lots of x minus one lot leave two lots: 2x + 2 = 8.', 'Then subtract 2 from both sides to get 2x = 6, and divide both sides by 2 to get x = 3. We do not need to know x before subtracting it: the same amount is removed on each side.'],
        math: math`3x+2=x+8\quad\Longleftrightarrow\quad 2x+2=8\quad\Longleftrightarrow\quad x=3`, sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'A second example, with every step',
        body: ['A term is one part separated from the others by + or −, outside brackets. In 5x − 4, the terms are 5x and −4. “Combine like terms” means collect matching parts: five lots of x minus two lots of x make three lots.', 'Choosing to leave a positive number multiplying x can make the arithmetic easier. A correct route with a negative number also works.'],
        example: { prompt: 'Solve 5x − 4 = 2x + 11.', steps: [
          { math: math`5x-2x-4=2x-2x+11`, reason: 'Subtract 2x from both sides.' },
          { math: math`3x-4=11`, reason: 'Five lots of x minus two lots make three lots; 2x − 2x is zero.' },
          { math: math`3x=15`, reason: 'Add 4 to both sides.' },
          { math: math`x=5`, reason: 'Divide both sides by 3.' },
        ], check: 'Put 5 in place of every x. The original left and right sides both give 21.' }, sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'Say what changed; check where you started',
        body: ['From 3x + 5 = x + 13 to 2x + 5 = 13, say “subtract x from both sides.” From there to 2x = 8, say “subtract 5 from both sides.” If a short line is confusing, write that action out.', 'Check by putting your answer into the original equation, not just the final line. If the two sides do not match, look for the first step where you changed one side differently from the other.'],
        math: math`3x+5=x+13\quad\Longleftrightarrow\quad 2x+5=13\quad\Longleftrightarrow\quad 2x=8`, sourceTags: ['otten', 'ngu'],
      },
    ],
    checkpoint: { prompt: 'Solve 4x + 1 = 2x + 9.', options: ['x = 5', 'x = 4', 'x = 2', 'x = −4'], correct: 1, explanation: 'Subtract 2x and then 1 from both sides: 2x = 8, so x = 4. Both original sides then equal 17.' }, sourceTags: ['otten', 'ngu'],
  },
  // Rittle-Johnson & Star: compare methods applied to the same equation.
  // https://doi.org/10.1037/a0014224
  {
    id: 'equations-choose-a-method', topic: 'equations', title: 'Brackets and fractions, step by step',
    summary: 'See what a group means, compare two routes, then handle fraction lines.', minutes: 9,
    words: ['factor', 'term', 'expand', 'fraction', 'numerator', 'denominator', 'common-denominator'],
    sections: [
      {
        title: 'Brackets keep a group together', visual: 'bracket-groups',
        body: ['2(x + 3) means two copies of the whole group x + 3. There are two x’s and two lots of 3, so the total is 2x + 6, not 2x + 3. This is called expanding the brackets.', 'A factor is something being multiplied. Here the factors are 2 and the whole group (x + 3). The rule works generally: a(b + c) = ab + ac. You may see it called the distributive property.', 'Try x = 1: 2(1 + 3) is 8 and 2 × 1 + 6 is also 8. The incorrect 2 × 1 + 3 would be 5.'], math: math`2(x+3)=2x+6`, sourceTags: ['otten'],
      },
      {
        title: 'Two correct routes to the same answer',
        body: ['For 3(x + 2) = 18, you can expand first or divide both sides by 3 first. Explain each step, then decide which feels easier.', 'Here, dividing first takes fewer calculations. That does not mean expansion is wrong; another equation may suit it better.'], math: math`3(x+2)=18`,
        comparison: { left: { title: 'Expand the brackets first', steps: ['$3x+6=18$', '$3x=12$', '$x=4$'] }, right: { title: 'Divide both sides by 3 first', steps: ['$x+2=6$', '$x=4$'] } }, sourceTags: ['rittle'],
      },
      {
        title: 'Next step: remove fraction lines',
        body: ['A fraction means top divided by bottom. The top is called the numerator; the bottom is the denominator. In x/2, x is divided by 2. The bottom must not be zero.', 'For x/2 + x/3 = 10, multiplying everything by 6 clears both divisions: 6 ÷ 2 = 3 and 6 ÷ 3 = 2. The number 6 is a common denominator. Remember to multiply every part on both sides.', 'Adding fractions does not mean adding their bottom numbers. For example, 1/2 + 1/3 = 3/6 + 2/6 = 5/6, not 2/5.'],
        example: { prompt: 'Solve x/2 + x/3 = 10.', steps: [
          { math: math`6\left(\frac{x}{2}+\frac{x}{3}\right)=6\cdot10`, reason: 'Multiply the whole of each side by 6.' },
          { math: math`3x+2x=60`, reason: 'Multiply both fraction parts: 6 × x/2 is 3x, and 6 × x/3 is 2x.' },
          { math: math`5x=60`, reason: 'Three lots of x plus two lots of x make five lots.' },
          { math: math`x=12`, reason: 'Divide both sides by 5.' },
        ], check: '12/2 + 12/3 = 6 + 4 = 10.' }, sourceTags: ['otten', 'ngu'],
      },
    ],
    checkpoint: { prompt: 'Which route solves 4(x − 2) = 20 without expanding the brackets?', options: ['Subtract 2, then divide just x by 4', 'Divide only the left side by 4', 'Turn 4(x − 2) into 4x − 2', 'Divide both sides by 4, then add 2 to both sides'], correct: 3, explanation: 'Division gives x − 2 = 5, then addition gives x = 7. Expanding first also works if you multiply every part inside the brackets.' }, sourceTags: ['rittle', 'otten', 'ngu'],
  },
  {
    id: 'equations-solution-sets', topic: 'equations', title: 'Can there be no answer—or many?',
    summary: 'Understand what it means when x disappears, then try rearranging a formula.', minutes: 8,
    words: ['solution', 'set', 'identity', 'real-number', 'isolate', 'substitute'],
    sections: [
      {
        title: 'Not every equation has just one answer', visual: 'solution-choices',
        body: ['For x + 2 = 5, only 3 works. But other equations can be true for every number, or impossible for every number. A solution set is simply the collection of all working answers.', 'For 2(x + 3) = 2x + 6, expanding the left side gives exactly the right side. Every real number works, including 0, negative numbers and fractions. This is called an identity.', 'Subtracting the same parts from both sides leaves 0 = 0. This says “zero equals zero”; it does not say that x has to be zero.'], math: math`2(x+3)=2x+6\quad\Longleftrightarrow\quad 0=0`, sourceTags: ['otten'],
      },
      {
        title: 'An impossible statement means no solution',
        body: ['For 4x + 1 = 4x + 7, subtract 4x from both sides. You get 1 = 7. No choice of x can make that true, so there is no solution.', 'When x disappears, read what remains. An always-true statement means every allowed number works; an always-false statement means none work.'], math: math`4x+1=4x+7\quad\Longleftrightarrow\quad 1=7`, sourceTags: ['otten'],
      },
      {
        title: 'Stretch: leave an answer in other letters',
        body: ['Try this after the earlier undo steps feel comfortable. A formula is a written rule connecting quantities. Other letters can stand for known numbers while you work out how to find x.', 'For p = 2x + 2y, imagine p and y are given. You can leave the answer as a calculation using them; you do not need their numerical values yet.'],
        example: { prompt: 'Rewrite p = 2x + 2y so that x stands alone.', steps: [
          { math: math`p-2y=2x`, reason: 'Subtract 2y from both sides.' },
          { math: math`x=\frac{p-2y}{2}`, reason: 'Divide both sides by 2, then write x on the left for easier reading.' },
        ], check: 'If p = 20 and y = 3, then x = (20 − 6)/2 = 7. Checking gives 2 × 7 + 2 × 3 = 20. In general, putting (p − 2y)/2 into 2x + 2y gives p.' }, sourceTags: ['otten', 'ngu'],
      },
    ],
    checkpoint: { prompt: 'Which numbers make 3(x − 1) = 3x − 3 true?', options: ['Only x = 1', 'No real values', 'Every real value', 'Only x = 0'], correct: 2, explanation: 'The left side becomes 3x − 3, exactly the right side. Every real number works.' }, sourceTags: ['otten', 'ngu'],
  },
  // Weber: build the idea of a power before asking the reverse question.
  // https://files.eric.ed.gov/fulltext/ED477690.pdf
  {
    id: 'logarithms-exponent-question', topic: 'logarithms', title: 'A logarithm finds the missing power',
    summary: 'Start with repeated multiplication. The new symbols then become a familiar question.', minutes: 8,
    words: ['power', 'exponent', 'base', 'logarithm', 'argument', 'positive', 'negative', 'inverse'],
    sections: [
      {
        title: 'Warm-up: what does 2³ mean?', visual: 'power-steps',
        body: ['2³ is a short way of writing 2 × 2 × 2, which is 8. It does not mean 2 × 3. The 2 is called the base; the small raised 3 is the exponent. We say “2 to the power 3.”', 'For positive whole exponents, count the copies being multiplied: 2¹ = 2, 2² = 4, 2³ = 8. One step backwards means divide by 2, so 2⁰ = 1. You do not need to know these words already—we will keep connecting them to the calculation.', 'Now reverse the question: 2 to what power gives 8? The answer is 3. We write this as log₂(8) = 3. A logarithm asks for the exponent.'],
        math: math`2^3=2\cdot2\cdot2=8\quad\Longleftrightarrow\quad\log_2(8)=3`, sourceTags: ['weber'],
      },
      {
        title: 'Read a logarithm as a question',
        body: ['In log₃(x) = 2, the little 3 is still the base. The statement asks for a number x that you reach by raising 3 to the power 2. So x is 3 × 3 = 9.', 'The input inside the brackets is called the argument. For the logarithms in this course, it must be greater than zero. The base must also be greater than zero, and cannot be 1. The next lesson explains these restrictions.'], math: math`\log_b(a)=c\quad\Longleftrightarrow\quad b^c=a`,
        example: { prompt: 'Solve log₃(x) = 2.', steps: [
          { math: math`x>0`, reason: 'x is the input inside the logarithm, so it must be greater than zero.' },
          { math: math`3^2=x`, reason: 'Read the same statement as “3 to the power 2 gives x.”' },
          { math: math`x=9`, reason: '3 × 3 is 9.' },
        ], check: '9 is greater than zero, and log₃(9) = 2.' }, sourceTags: ['weber', 'kenney'],
      },
      {
        title: 'The answer to a logarithm can be negative',
        body: ['For powers of 10, each step backwards divides by 10: 10¹ = 10, 10⁰ = 1, 10⁻¹ = 0.1, and 10⁻² = 0.01. A negative exponent does not mean that the result is a negative number.', 'So log₁₀(0.01) = −2. The input 0.01 is positive, even though the answer −2 is negative. Likewise, log₂(1) = 0 because 2⁰ = 1.'],
        math: math`10^{-2}=\frac{1}{10\cdot10}=0.01\quad\Longleftrightarrow\quad\log_{10}(0.01)=-2`, sourceTags: ['weber', 'kenney'],
      },
    ],
    checkpoint: { prompt: 'What is log₄(64)? In other words, 4 to which power gives 64?', options: ['16', '3', '4', '2'], correct: 1, explanation: '4 × 4 × 4 = 64, so 4³ = 64. The requested exponent is 3.' }, sourceTags: ['weber', 'kenney'],
  },
  // Kenney & Kastberg: meaningful notation, undoing, and allowed inputs.
  // https://files.eric.ed.gov/fulltext/EJ1093384.pdf
  {
    id: 'logarithms-domain', topic: 'logarithms', title: 'Which numbers are allowed?',
    summary: 'Check the number inside the logarithm, and learn what ln means.', minutes: 7,
    words: ['argument', 'domain', 'positive', 'base', 'inequality', 'function', 'logarithm'],
    sections: [
      {
        title: 'The whole input must be greater than zero', visual: 'domain-gates',
        body: ['The domain means the numbers you are allowed to put in. For real logarithms, the input inside the brackets must be positive: greater than zero, not equal to zero.', 'For log₂(x − 3), the whole input is x − 3. If x = 3, it becomes zero; if x = 2, it becomes −1. Neither is allowed. If x = 4, it becomes 1, which is allowed.', 'We need x − 3 > 0, so x > 3. Read > as “greater than” and < as “less than.” The signs ≥ and ≤ include equality; > and < do not.'], math: math`x-3>0\quad\Longleftrightarrow\quad x>3`, sourceTags: ['kenney'],
      },
      {
        title: 'Check the base as well',
        body: ['A real logarithm needs a base greater than zero and different from 1. A fraction such as 1/2 is allowed. Zero and negative bases are not allowed here.', 'Why not base 1? Every power of 1 is still 1. “1 to what power gives 8?” has no answer, while “1 to what power gives 1?” has no single answer. That does not give us a useful reverse rule.'],
        math: math`\left(\frac12\right)^2=\frac14\quad\Longleftrightarrow\quad\log_{1/2}\left(\frac14\right)=2`, sourceTags: ['kenney', 'weber'],
      },
      {
        title: 'ln is a logarithm with a special base',
        body: ['ln means a logarithm with base e. The letter e is the name of a fixed number, about 2.71828; it is not an unknown we are solving for. You do not need its full decimal value.', 'A function is a fixed rule that gives one output for each allowed input. ln is one such rule. It is not “l times n” and is not something to divide out.', 'A base-10 logarithm is a different rule from ln. We write every base explicitly except for the standard name ln. Raising e to the answer given by ln brings us back to the positive input.'],
        math: math`\ln(x)=\log_e(x)\qquad e^{\ln(x)}=x\quad(x>0)`, sourceTags: ['kenney'],
      },
    ],
    checkpoint: { prompt: 'Which values of x are allowed in log₃(7 − 2x)?', options: ['x < 3.5', 'x ≤ 3.5', 'x > 0', 'x ≠ 3.5'], correct: 0, explanation: 'The whole input must be greater than zero: 7 − 2x > 0. Add 2x to both sides: 7 > 2x. Divide by 2: 3.5 > x, or x < 3.5. At 3.5 the input is zero, so it is not allowed.' }, sourceTags: ['kenney', 'weber'],
  },
  // Chua & Wood: use concrete mistakes and counterexamples, not unexplained bans.
  // https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf
  {
    id: 'logarithms-laws', topic: 'logarithms', title: 'Three useful logarithm rules',
    summary: 'Connect multiplication, division and powers—and spot a rule that does not work.', minutes: 9,
    words: ['product', 'quotient', 'exponent', 'factor', 'numerator', 'denominator', 'domain', 'argument'],
    sections: [
      {
        title: 'Multiplying inputs means adding logarithms', visual: 'log-rules',
        body: ['A product is the result of multiplying. Start with numbers: 8 × 4 = (2 × 2 × 2) × (2 × 2). There are five copies of 2, so the answer is 2⁵.', 'That is why log₂(8 × 4) = 3 + 2 = 5. The logarithm of a product is the sum of the logarithms. Both inputs must be greater than zero and the bases must match.', 'The formula below says the same thing with u and v standing for the two inputs. A base b must be greater than zero and different from 1.'],
        math: math`\log_b(uv)=\log_b(u)+\log_b(v)\qquad(u>0,\ v>0)`, sourceTags: ['weber', 'chua'],
      },
      {
        title: 'Dividing inputs means subtracting logarithms',
        body: ['A quotient is the result of dividing. Since 8 ÷ 4 = 2, log₂(8/4) = 1. The rule gives the same answer: log₂(8) − log₂(4) = 3 − 2 = 1.', 'Both the top number u and bottom number v must be greater than zero, and the base must be the same.'],
        math: math`\log_b\left(\frac{u}{v}\right)=\log_b(u)-\log_b(v)\qquad(u>0,\ v>0)`, sourceTags: ['weber', 'chua'],
      },
      {
        title: 'A power inside becomes multiplication outside',
        body: ['For a positive input u, the logarithm of u raised to k equals k times the logarithm of u. In the formula, k is the exponent inside and the multiplying number outside. This works for any real number k.', 'For example, log₂(8²) = log₂(64) = 6. The other route gives 2 × log₂(8) = 2 × 3 = 6. The base stays 2; the exponent does not change it.'],
        math: math`\log_b(u^k)=k\log_b(u)\qquad(u>0)`, sourceTags: ['weber', 'chua'],
      },
      {
        title: 'Addition inside is a different calculation',
        body: ['Do not use the multiplication rule when the inputs are being added. Check with numbers: log₂(8 + 8) = log₂(16) = 4, while log₂(8) + log₂(8) = 3 + 3 = 6.', 'Because 4 is not 6, there cannot be a general rule that splits a logarithm of a sum this way. Always read the sign inside the brackets first.'],
        math: math`\log_2(8+8)=4\quad\ne\quad\log_2(8)+\log_2(8)=6`, sourceTags: ['chua'],
      },
      {
        title: 'Stretch: keep the original restrictions',
        body: ['When combining log₂(x) + log₂(x − 2), the original inputs must both be positive. We need x > 2. Even if x(x − 2) is positive at some other x, that does not make the original two logarithms allowed.', 'Similarly, ln(x²) = 2ln(x) is safe here only for x > 0. If x = −2, the left side is ln(4), which is allowed, but the right side contains ln(−2), which is not. A rewrite must not silently change which inputs are allowed.'], sourceTags: ['kenney', 'chua'],
      },
    ],
    checkpoint: { prompt: 'Which expression equals log₂(3) + log₂(5)?', options: ['log₂(8)', 'log₂(3/5)', 'log₂(3) × log₂(5)', 'log₂(15)'], correct: 3, explanation: 'Both inputs are positive and the bases match. Add the logarithms by multiplying the inputs: log₂(3 × 5) = log₂(15).' }, sourceTags: ['weber', 'kenney', 'chua'],
  },
  {
    id: 'logarithms-inverse-functions', topic: 'logarithms', title: 'Undo a logarithm to find x',
    summary: 'Use the matching power, solve the remaining equation, then check.', minutes: 8,
    words: ['inverse', 'function', 'argument', 'domain', 'candidate', 'substitute'],
    sections: [
      {
        title: 'Use the base to go backwards', visual: 'log-undo',
        body: ['ln has base e, so ln(x − 2) = 3 asks: “e to which power gives x − 2?” The answer is 3, so x − 2 = e³.', 'You can show this by raising e to each side. This undoes ln for a positive input. We are not dividing by “ln”; we are using the matching reverse calculation.'],
        example: { prompt: 'Solve ln(x − 2) = 3.', steps: [
          { math: math`x-2>0\quad\Longleftrightarrow\quad x>2`, reason: 'The input x − 2 must be greater than zero.' },
          { math: math`e^{\ln(x-2)}=e^3`, reason: 'Use each side as a power of e.' },
          { math: math`x-2=e^3`, reason: 'The power of e undoes ln, giving back the input x − 2.' },
          { math: math`x=e^3+2`, reason: 'Add 2 to both sides.' },
        ], check: 'e³ is positive, so the answer is greater than 2. Replacing x with e³ + 2 gives ln(e³) = 3.' }, sourceTags: ['kenney', 'weber'],
      },
      {
        title: 'Same base and same logarithm: same input',
        body: ['For the same allowed base, different positive inputs give different logarithm values. So if two logarithms are equal, their inputs must match.', 'This is sometimes called the one-to-one property. You are not cancelling a multiplying number. Check that both inputs are allowed before setting them equal.'],
        example: { prompt: 'Solve log₂(x − 1) = log₂(5 − x).', steps: [
          { math: math`1<x<5`, reason: 'x − 1 must be positive, so x > 1. Also 5 − x must be positive, so x < 5.' },
          { math: math`x-1=5-x`, reason: 'The two logarithms have the same base and value, so their inputs are equal.' },
          { math: math`2x=6\quad\Longrightarrow\quad x=3`, reason: 'Add x and then 1 to both sides; divide both sides by 2.' },
        ], check: '3 lies between 1 and 5. Both original inputs become 2, so the logarithms match.' }, sourceTags: ['kenney'],
      },
      {
        title: 'An answer can stay as a calculation',
        body: ['e³ + 2 is an exact answer: nothing has been rounded. A calculator gives about 22.086, which helps you judge its size, but the exact answer is usually better to keep.', 'Check the original equation and its allowed inputs. Getting a number from a calculator is not a substitute for explaining why each step works.'], sourceTags: ['kenney', 'weber'],
      },
    ],
    checkpoint: { prompt: 'Solve ln(x + 1) = 0.', options: ['x = −1', 'x = 1', 'x = 0', 'x = e'], correct: 2, explanation: 'We need x + 1 > 0, so x > −1. Rewrite as x + 1 = e⁰ = 1, then subtract 1: x = 0. The original input is 1, which is allowed.' }, sourceTags: ['kenney', 'weber'],
  },
  {
    id: 'logarithms-combine-and-check', topic: 'logarithms', title: 'Put the steps together and check',
    summary: 'A stretch lesson: combine logarithms, test possible answers, and find an unknown exponent.', minutes: 12,
    words: ['domain', 'candidate', 'factorise', 'factor', 'exponent', 'base', 'substitute'],
    sections: [
      {
        title: 'Stretch: a calculated answer may still be disallowed', visual: 'candidate-check',
        body: ['Try this after you are comfortable with brackets, powers and the logarithm rules. We will also use x², meaning x × x. It is fine to stay with guided practice before tackling this example.', 'First write which inputs are allowed. Then combine the logarithms and solve. A candidate is a possible answer produced by those calculations; it is only a solution if it also works in the original question.', 'The bracket step below rewrites x² − 2x − 8 as (x − 4)(x + 2). This is called factorising. Check by multiplying out: x² + 2x − 4x − 8 = x² − 2x − 8. Two numbers multiply to zero only if at least one of them is zero.'],
        example: { prompt: 'Solve log₂(x) + log₂(x − 2) = 3.', steps: [
          { math: math`x>0,\quad x-2>0\quad\Longrightarrow\quad x>2`, reason: 'Both original inputs must be greater than zero.' },
          { math: math`\log_2(x(x-2))=3`, reason: 'Use the multiplication rule for logarithms while keeping x > 2.' },
          { math: math`x(x-2)=8`, reason: '2 to the power 3 is 8.' },
          { math: math`(x-4)(x+2)=0`, reason: 'Expand x(x − 2), subtract 8 from both sides, then rewrite x² − 2x − 8 as these two brackets multiplied.' },
          { math: math`x=4`, reason: 'The brackets give x − 4 = 0 or x + 2 = 0: possible answers 4 and −2. Reject −2 because we need x > 2.' },
        ], check: 'log₂(4) + log₂(2) = 2 + 1 = 3. At −2, the original inputs would be −2 and −4, so neither logarithm is allowed.' }, sourceTags: ['kenney', 'chua'],
      },
      {
        title: 'Turn a plain number into a matching logarithm',
        body: ['In log₂(x + 2) = log₂(x) + 1, the 1 is not an input that you can simply add to x. Since log₂(2) = 1, rewrite 1 in that form.', 'For x > 0, the right side becomes log₂(2x). Matching the inputs gives x + 2 = 2x, so x = 2. Check: log₂(4) = log₂(2) + 1, or 2 = 1 + 1.'],
        math: math`\log_2(x)+1=\log_2(x)+\log_2(2)=\log_2(2x)\quad(x>0)`, sourceTags: ['chua', 'kenney'],
      },
      {
        title: 'When x is in the exponent',
        body: ['In 2^(x + 1) = 7, it is the exponent that is unknown. Dividing by 2 does not undo a power of 2. A base-2 logarithm asks exactly the question we need.', 'If your calculator has ln but no base-2 log button, use log₂(7) = ln(7)/ln(2). This is called changing the base.'],
        example: { prompt: 'Solve 2^(x + 1) = 7.', steps: [
          { math: math`\log_2(2^{x+1})=\log_2(7)`, reason: 'Take the base-2 logarithm of both sides; both inputs are positive.' },
          { math: math`x+1=\log_2(7)`, reason: 'The logarithm asks for the power of 2, which on the left is x + 1.' },
          { math: math`x=\log_2(7)-1=\frac{\ln(7)}{\ln(2)}-1`, reason: 'Subtract 1 from both sides. The final form is useful on a calculator.' },
        ], check: 'The exact answer gives 2^(x + 1) = 2^(log₂(7)) = 7. The approximate value of x is 1.807.' }, sourceTags: ['weber', 'kenney'],
      },
      {
        title: 'Before trying questions with a timer',
        body: ['In guided practice, explain one step in your own words before showing the worked answer. Practise spotting why a wrong step fails, not only choosing a number.', 'The exam phase hides hints and puts a deadline on each question. That is a rehearsal feature, not a teaching method proven by these papers. Stay with untimed practice whenever you need time to think.'], sourceTags: ['chua', 'kenney'],
      },
    ],
    checkpoint: { prompt: 'For log₂(x) + log₂(x − 2) = 3, the calculations give x = 4 or x = −2. Which works in the original equation?', options: ['Only x = 4', 'Only x = −2', 'Both', 'Neither'], correct: 0, explanation: 'The original inputs must be positive, so x > 2. Only x = 4 is allowed and gives the original total of 3.' }, sourceTags: ['weber', 'kenney', 'chua'],
  },
];

// Fail fast on missing Dutch prose rather than silently fall back to English.
// Share only language-independent structure, mathematics and correct answers.
export const lessonsNl = lessons.map(lesson => {
  const translated = dutchLessons[lesson.id];
  if (!translated || translated.sections.length !== lesson.sections.length) throw new Error(`Incomplete Dutch lesson: ${lesson.id}`);
  return {
    ...lesson, title: translated.title, summary: translated.summary,
    sections: lesson.sections.map((section, index) => {
      const nl = translated.sections[index];
      if (!nl.title || !nl.body?.length) throw new Error(`Incomplete Dutch section: ${lesson.id}/${index}`);
      const result = { ...section, title: nl.title, body: nl.body };
      if (nl.math) result.math = nl.math;
      if (section.example) {
        if (!nl.example || nl.example.reasons.length !== section.example.steps.length) throw new Error(`Incomplete Dutch example: ${lesson.id}/${index}`);
        result.example = { prompt: nl.example.prompt, steps: section.example.steps.map((step, stepIndex) => ({ math: step.math, reason: nl.example.reasons[stepIndex] })), check: nl.example.check };
      }
      if (section.comparison) {
        if (!nl.comparison) throw new Error(`Incomplete Dutch comparison: ${lesson.id}/${index}`);
        result.comparison = nl.comparison;
      }
      return result;
    }),
    checkpoint: { ...translated.checkpoint, correct: lesson.checkpoint.correct },
  };
});

const dutchSources = {
  otten: {
    application: 'Onze lessen over gelijkheid en de afbeelding van een weegschaal leggen uit waarom dezelfde rekenhandeling aan beide kanten de gelijkheid bewaart. Elke uitgewerkte stap benoemt wat verandert en waarom.',
    limitation: 'Dit overzicht van 34 artikelen vond geen duidelijk patroon voor de beste toepassing van het balansmodel. Een echte weegschaal is minder bruikbaar bij negatieve hoeveelheden. Onze afbeeldingen en uitleg in gewone taal zijn ontwerpkeuzes, geen bewezen beste methode.',
  },
  ngu: {
    application: 'Een terugrekenschema en volledig uitgeschreven stappen laten zien waarom een berekening werkt. Daarna staat een kortere schrijfwijze naast de uitgebreide versie, zodat leerlingen het verband kunnen zien.',
    limitation: 'In één experiment met 71 leerlingen presteerde de groep met de inverse methode beter bij complexere vergelijkingen. Onze volgorde van eerst uitleggen en daarna verkorten is een eigen combinatie van ideeën, niet een volgorde die dit experiment als beste heeft bewezen. De toepassing op logaritmen is onze uitbreiding.',
  },
  rittle: {
    application: 'Onze kaarten naast elkaar lossen dezelfde vergelijking op twee manieren op. Leerlingen bekijken waarom beide kloppen en welke minder of makkelijker rekenwerk vraagt.',
    limitation: 'Aan het onderzoek deden 162 leerlingen uit het zevende en achtste Amerikaanse leerjaar mee. De resultaten ondersteunen het vergelijken van oplossingsmethoden in die situatie; ze bewijzen niet dat elke vergelijking van methoden of deze website het leren verbetert.',
  },
  weber: {
    application: 'We laten eerst herhaald vermenigvuldigen zien en leggen uit wat een exponent betekent. Een logaritme wordt daarna een vraag naar die exponent, met een afbeelding die beide schrijfwijzen verbindt.',
    limitation: 'Dit onderzoeksverslag maakt onderscheid tussen routineberekeningen en begrip van machten, en stelt lesactiviteiten voor. Onze eigen opfrissers en afbeeldingen zijn door die ideeën geïnspireerd, geen herhaling van een grootschalig getoetste aanpak.',
  },
  kenney: {
    application: 'We leggen uit welke berekening een logaritme ongedaan maakt, in plaats van te zeggen dat “de log verdwijnt”. We onderscheiden ln van logaritmen met grondtal 10 en laten in uitwerkingen steeds zien welke invoer is toegestaan.',
    limitation: 'Dit artikel voor docenten bespreekt het denken van leerlingen en verbanden in de lesstof. Het is geen groot gerandomiseerd experiment en schrijft niet één verplichte lesvolgorde voor.',
  },
  chua: {
    application: 'Voorbeelden en feedback behandelen veelvoorkomende fouten: de productregel gebruiken bij optellen, log behandelen als iets dat je kunt wegdelen en een antwoord accepteren zonder de oorspronkelijke invoer te controleren.',
    limitation: 'Het onderzoek betrof 81 leerlingen op twee scholen in Singapore. Een gekozen fout antwoord kan aangeven wat iemand kan herhalen, maar stelt niet met zekerheid vast wat die leerling denkt. Al onze vragen, afbeeldingen en uitleg zijn oorspronkelijk werk.',
  },
};

export const sourcesNl = sources.map(source => ({ ...source, ...dutchSources[source.id] }));
