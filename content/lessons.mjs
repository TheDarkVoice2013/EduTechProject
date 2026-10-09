// Original instructional text. Source notes distinguish research findings from
// our design choices; the platform itself has not been independently evaluated.
const math = String.raw;

export const sources = [
  {
    id: 'otten', authors: 'Mara Otten, Marja Van den Heuvel-Panhuizen & Michiel Veldhuis', year: 2019,
    title: 'The balance model for teaching linear equations: a systematic literature review',
    url: 'https://link.springer.com/article/10.1186/s40594-019-0183-2',
    application: 'Our equality lessons connect operations on both sides to preserving equal values. Worked examples make each transformation explicit before using shorter notation.',
    limitation: 'This review of 34 articles did not identify a clear pattern establishing the best balance-model implementation. A physical balance has limitations with negative quantities. We use the analogy as an optional explanation, not a universally superior method.',
  },
  {
    id: 'ngu', authors: 'Bing Hiong Ngu, Siu Fung Chung & Alexander Seeshing Yeung', year: 2015,
    title: 'Cognitive load in algebra: element interactivity in solving equations',
    url: 'https://doi.org/10.1080/01443410.2013.878019',
    application: 'Detailed equivalence steps sit alongside compact inverse-operation solutions. Learners can connect the reason for an operation to a more economical written method.',
    limitation: 'In one experiment with 71 students, the inverse-method group performed better on equations with high element interactivity. Our explain-then-shorten sequence is a design synthesis, not a sequence this experiment directly established as best. Applying the idea to log equations is our extension.',
  },
  {
    id: 'rittle', authors: 'Bethany Rittle-Johnson & Jon R. Star', year: 2009,
    title: 'Compared to what? The effects of different comparisons on conceptual knowledge and procedural flexibility for equation solving',
    url: 'https://dash.harvard.edu/entities/publication/73120378-9609-6bd4-e053-0100007fdf3b',
    application: 'Our comparison cards solve the same equation in two ways and ask why both are valid and which suits the structure. Practice also checks recognition of alternative methods.',
    limitation: 'The study involved 162 seventh- and eighth-grade students. Its results support comparing solution methods in that setting; they do not establish that every comparison activity or this website improves learning.',
  },
  {
    id: 'weber', authors: 'Keith Weber', year: 2002,
    title: 'Students’ Understanding of Exponential and Logarithmic Functions',
    url: 'https://files.eric.ed.gov/fulltext/ED477690.pdf',
    application: 'Logarithms begin with the question “which exponent gives this value?” Learners translate between exponential and logarithmic statements before solving equations.',
    limitation: 'This research report distinguishes routine calculations from understanding exponentiation and proposes instructional activities. Our original activities are inspired by those ideas, not a replication of a validated large-scale intervention.',
  },
  {
    id: 'kenney', authors: 'Rachael Kenney & Signe Kastberg', year: 2013,
    title: 'Links in learning logarithms',
    url: 'https://files.eric.ed.gov/fulltext/EJ1093384.pdf',
    application: 'We name inverse functions instead of saying “the log disappears,” distinguish ln from base-10 logarithms, and show positive-argument conditions throughout worked solutions.',
    limitation: 'This teacher-facing article discusses student thinking and instructional connections. It is not a large randomized trial, and it does not establish one mandatory teaching sequence.',
  },
  {
    id: 'chua', authors: 'Chua Boon Liang & Eric Wood', year: 2005,
    title: 'Working with Logarithms: Students’ Misconceptions and Errors',
    url: 'https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf',
    application: 'Logarithm distractors and error checks target overgeneralized rules: distributing over addition, treating log as a factor, and failing to check restrictions. Feedback explains the mathematical distinction.',
    limitation: 'The study examined 81 students in two Singapore schools. A chosen distractor can suggest what to review, but it does not diagnose a learner with certainty. All our questions and explanations are original.',
  },
];

export const lessons = [
  // Otten et al.: equality and the scope/limits of a balance analogy.
  // https://link.springer.com/article/10.1186/s40594-019-0183-2
  {
    id: 'equations-equality', topic: 'equations', title: 'An equation is a relationship',
    summary: 'Understand what the equals sign promises, and what a solution must do.', minutes: 5,
    sections: [
      {
        title: 'Same value, two expressions',
        body: ['The equals sign means that the expressions on its two sides have the same value. It does not mean “the answer comes next.” Either side can contain numbers, operations, or an unknown.', 'A solution is a value you can substitute for the unknown that makes the original equality true. We work with real numbers in this course.'],
        math: math`9+6=x+7`,
        example: { prompt: 'Which value makes this statement true?', steps: [
          { math: math`15=x+7`, reason: 'Calculate the left side; the right side must also equal 15.' },
          { math: math`8=x`, reason: 'Subtract 7 from both sides. Equality works in either direction.' },
        ], check: 'With x = 8, both original sides equal 15.' },
        sourceTags: ['otten'],
      },
      {
        title: 'Keep equality intact',
        body: ['Imagine equal amounts on two sides of a balance. Adding or subtracting the same amount on both sides keeps them equal. Multiplying or dividing both sides by the same nonzero number also gives an equivalent equation.', 'The analogy helps explain equality; it is not a model we must force onto every problem. Physical weights are less helpful for negative quantities. The algebraic rule still works.'],
        math: math`A=B\quad\Longrightarrow\quad A+c=B+c`,
        sourceTags: ['otten'],
      },
      {
        title: 'Equivalent means the same solutions',
        body: ['Equivalent equations have exactly the same solution set. We choose reversible operations to move from one to the next.', 'Do not divide by zero. Multiplying an equation by zero loses information, so it is not an equivalent transformation for solving it. Later, we will also check where logarithms are defined.'],
        math: math`x+7=12\quad\Longleftrightarrow\quad x=5`,
        sourceTags: ['otten'],
      },
    ],
    checkpoint: { prompt: 'What belongs in the blank: 10 + 5 = ___ + 6?', options: ['15', '21', '9', '5'], correct: 2, explanation: 'The left side is 15. The blank must be 9 because 9 + 6 = 15.' },
    sourceTags: ['otten'],
  },
  // Ngu et al. motivate reducing unnecessary notation, not eliminating meaning.
  // https://doi.org/10.1080/01443410.2013.878019
  {
    id: 'equations-inverse-operations', topic: 'equations', title: 'Undo operations, one layer at a time',
    summary: 'Isolate x by reversing the operations applied to it, then connect full steps to shorthand.', minutes: 7,
    sections: [
      {
        title: 'Read the structure before calculating',
        body: ['In 3x + 5, x is first multiplied by 3 and then 5 is added. To isolate x, undo the outer operation first: subtract 5, then divide by 3.', 'Each step acts on both sides of the equation. The goal is not to “move x” as an object; it is to keep the same solutions while making the equation simpler.'],
        example: { prompt: 'Solve 3x + 5 = 20.', steps: [
          { math: math`3x+5-5=20-5`, reason: 'Subtract 5 from both sides to undo the addition.' },
          { math: math`3x=15`, reason: 'Simplify both sides.' },
          { math: math`\frac{3x}{3}=\frac{15}{3}`, reason: 'Divide both sides by the nonzero coefficient 3.' },
          { math: math`x=5`, reason: 'The unknown is isolated.' },
        ], check: 'Substitute into the original: 3 × 5 + 5 = 20.' },
        sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'A shortcut still has a reason',
        body: ['“Move +5 across and change its sign” is shorthand for subtracting 5 from both sides. Nothing crosses an equals sign by magic.', 'Compare the two records below. Use the detailed one when you need the justification and the compact one when the reason is clear. Our choice to connect both forms is a teaching design decision, not a universally proven sequence.'],
        comparison: {
          left: { title: 'Keep every operation visible', steps: ['$x+7=12$', '$x+7-7=12-7$', '$x=5$'] },
          right: { title: 'Record the inverse step compactly', steps: ['$x+7=12$', '$x=12-7$', '$x=5$'] },
        },
        sourceTags: ['ngu', 'otten'],
      },
      {
        title: 'Keep the sign with the coefficient',
        body: ['In −4x = 20, the coefficient is −4, not 4. Dividing both sides by −4 gives x = −5.', 'When an entire expression is divided by a number, undo that division before changing what is inside. For (x − 2)/4 = 3, multiply by 4 to get x − 2 = 12, then add 2.'],
        math: math`-4x=20\quad\Longleftrightarrow\quad x=\frac{20}{-4}=-5`,
        sourceTags: ['ngu'],
      },
    ],
    checkpoint: { prompt: 'For 5x − 4 = 16, which operation directly undoes the outer subtraction?', options: ['Add 4 to both sides', 'Subtract 4 from both sides', 'Divide just 5x by 5', 'Change 16 to −16'], correct: 0, explanation: 'Adding 4 to both sides gives 5x = 20. Dividing both sides by 5 then gives x = 4.' },
    sourceTags: ['otten', 'ngu'],
  },
  {
    id: 'equations-both-sides', topic: 'equations', title: 'When x appears on both sides',
    summary: 'Collect unknown terms through valid operations, not unexplained sign changes.', minutes: 6,
    sections: [
      {
        title: 'Remove the same unknown amount',
        body: ['If x appears in both members, subtract one variable term from both sides. You are applying the same operation for every possible x.', 'Choosing to keep a positive coefficient can make arithmetic easier, but a route with a negative coefficient is also valid.'],
        example: { prompt: 'Solve 5x − 4 = 2x + 11.', steps: [
          { math: math`5x-2x-4=2x-2x+11`, reason: 'Subtract 2x from both sides.' },
          { math: math`3x-4=11`, reason: 'Combine like terms.' },
          { math: math`3x=15`, reason: 'Add 4 to both sides.' },
          { math: math`x=5`, reason: 'Divide both sides by 3.' },
        ], check: 'At x = 5, the original left and right sides both equal 21.' },
        sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'Name the operation behind the line',
        body: ['From 3x + 5 = x + 13 to 2x + 5 = 13, the reason is “subtract x from both sides.” From there to 2x = 8, it is “subtract 5 from both sides.”', 'Pause when a line seems unfamiliar: what was added, subtracted, multiplied, or divided on both sides? If you cannot name the operation, expand the shorthand.'],
        math: math`3x+5=x+13\;\Longleftrightarrow\;2x+5=13\;\Longleftrightarrow\;2x=8`,
        sourceTags: ['otten', 'ngu'],
      },
      {
        title: 'Check in the original equation',
        body: ['Substitution is a check on the whole solution, not only the last step. A mistake made early can survive every later calculation.', 'If the two original sides differ after substitution, revisit the first line where equality was not preserved. A failed check tells you where more explanation is useful.'],
        sourceTags: ['otten'],
      },
    ],
    checkpoint: { prompt: 'Solve 4x + 1 = 2x + 9.', options: ['x = 5', 'x = 4', 'x = 2', 'x = −4'], correct: 1, explanation: 'Subtract 2x and then 1 from both sides: 2x = 8, so x = 4. Both original sides then equal 17.' },
    sourceTags: ['otten', 'ngu'],
  },
  // Side-by-side methods directly implement comparison rather than merely cite it.
  // https://doi.org/10.1037/a0014224
  {
    id: 'equations-choose-a-method', topic: 'equations', title: 'Brackets, fractions, and a choice of method',
    summary: 'Compare valid routes and select one that keeps the structure easy to follow.', minutes: 8,
    sections: [
      {
        title: 'Two routes, one solution',
        body: ['Study both solutions to the same equation. Explain why each step is valid before deciding which route you prefer.', 'Here, dividing before expanding uses fewer calculations. In another equation, expansion may be more convenient. There is not one mandatory first move for every problem.'],
        math: math`3(x+2)=18`,
        comparison: {
          left: { title: 'Expand first', steps: ['$3x+6=18$', '$3x=12$', '$x=4$'] },
          right: { title: 'Divide first', steps: ['$x+2=6$', '$x=4$'] },
        },
        sourceTags: ['rittle'],
      },
      {
        title: 'A factor multiplies every term',
        body: ['The distributive property is a(b + c) = ab + ac. Therefore 2(x + 3) becomes 2x + 6, not 2x + 3.', 'Check an expansion with a simple input when you are unsure. At x = 1, 2(x + 3) equals 8; 2x + 3 would equal 5, so those expressions cannot be identical.'],
        math: math`2(x+3)=2x+6`,
        sourceTags: ['otten'],
      },
      {
        title: 'Clear fractions across the entire equation',
        body: ['Choose a nonzero common denominator and multiply every term on both sides by it. This removes fractions without changing the solutions.', 'Do not add denominators when adding fractions. The common denominator connects the different fractional parts.'],
        example: { prompt: 'Solve x/2 + x/3 = 10.', steps: [
          { math: math`6\left(\frac{x}{2}+\frac{x}{3}\right)=6\cdot10`, reason: 'Multiply both sides by the common denominator 6.' },
          { math: math`3x+2x=60`, reason: 'Distribute 6 to both fractional terms.' },
          { math: math`5x=60`, reason: 'Combine like terms.' },
          { math: math`x=12`, reason: 'Divide by 5.' },
        ], check: '12/2 + 12/3 = 6 + 4 = 10.' },
        sourceTags: ['otten', 'ngu'],
      },
    ],
    checkpoint: { prompt: 'Which valid route avoids expanding 4(x − 2) = 20?', options: ['Subtract 2, then divide just x by 4', 'Divide only the left side by 4', 'Turn 4(x − 2) into 4x − 2', 'Divide both sides by 4, then add 2 to both sides'], correct: 3, explanation: 'Division gives x − 2 = 5, then addition gives x = 7. Expansion is also valid if every term is multiplied correctly.' },
    sourceTags: ['rittle', 'otten', 'ngu'],
  },
  {
    id: 'equations-solution-sets', topic: 'equations', title: 'One solution, no solution, or every real number',
    summary: 'Interpret what remains when x cancels, and rearrange a simple formula.', minutes: 7,
    sections: [
      {
        title: 'A true statement for every x',
        body: ['When both sides simplify to the same expression, the equation is an identity. Every real number satisfies it.', 'If subtracting the same terms leaves 0 = 0, you have not proved x = 0. You have reached a statement that is true independently of x.'],
        math: math`2(x+3)=2x+6\quad\Longleftrightarrow\quad 0=0`,
        sourceTags: ['otten'],
      },
      {
        title: 'A false statement for every x',
        body: ['For 4x + 1 = 4x + 7, subtracting 4x leaves 1 = 7. No choice of x can make this true.', 'When the unknown disappears, read the remaining statement. True for every x means all real numbers; always false means no solution.'],
        math: math`4x+1=4x+7\quad\Longleftrightarrow\quad 1=7`,
        sourceTags: ['otten'],
      },
      {
        title: 'Isolate a letter in a formula',
        body: ['The same reasoning works when other letters are present. Treat them as known quantities while isolating the chosen unknown.', 'A numerical answer is not always the goal. An equivalent formula can describe x in terms of the other quantities.'],
        example: { prompt: 'Make x the subject of p = 2x + 2y.', steps: [
          { math: math`p-2y=2x`, reason: 'Subtract 2y from both sides.' },
          { math: math`x=\frac{p-2y}{2}`, reason: 'Divide both sides by the nonzero number 2 and reverse the equality for readability.' },
        ], check: 'Substituting (p − 2y)/2 for x in 2x + 2y simplifies back to p.' },
        sourceTags: ['otten', 'ngu'],
      },
    ],
    checkpoint: { prompt: 'Which real values satisfy 3(x − 1) = 3x − 3?', options: ['Only x = 1', 'No real values', 'Every real value', 'Only x = 0'], correct: 2, explanation: 'The left side expands to 3x − 3, exactly the right side. The equation is true for every real x.' },
    sourceTags: ['otten', 'ngu'],
  },
  // Weber: connect the process of exponentiation with the inverse question.
  // https://files.eric.ed.gov/fulltext/ED477690.pdf
  {
    id: 'logarithms-exponent-question', topic: 'logarithms', title: 'A logarithm asks for an exponent',
    summary: 'Connect powers and logarithms before memorizing any logarithm rules.', minutes: 6,
    sections: [
      {
        title: 'One relationship, two ways to read it',
        body: ['“Two to the power three is eight” and “the base-two logarithm of eight is three” express the same relationship.', 'The base stays the base. The logarithm value is the exponent. Say the question aloud: what exponent on this base produces that argument?'],
        math: math`2^3=8\quad\Longleftrightarrow\quad\log_2(8)=3`,
        sourceTags: ['weber'],
      },
      {
        title: 'Use the definition to solve',
        body: ['For real logarithms, the base b must be positive and different from 1, and the argument a must be positive. Under these conditions, logarithmic and exponential forms are equivalent.', 'If the unknown is inside the logarithm, changing representation often produces an ordinary equation you already know how to solve.'],
        math: math`\log_b(a)=c\quad\Longleftrightarrow\quad b^c=a`,
        example: { prompt: 'Solve log₃(x) = 2.', steps: [
          { math: math`x>0`, reason: 'The argument of the logarithm must be positive.' },
          { math: math`3^2=x`, reason: 'Rewrite the logarithmic relationship as a power.' },
          { math: math`x=9`, reason: 'Evaluate the power.' },
        ], check: '9 is positive and log₃(9) = 2.' },
        sourceTags: ['weber', 'kenney'],
      },
      {
        title: 'A positive argument can have a negative logarithm',
        body: ['10⁻² = 0.01, so log₁₀(0.01) = −2. The restriction is on the argument, not on the result.', 'A logarithm can be negative, zero, or positive. For example, log₂(1) = 0 because 2⁰ = 1.'],
        math: math`10^{-2}=0.01\quad\Longleftrightarrow\quad\log_{10}(0.01)=-2`,
        sourceTags: ['weber', 'kenney'],
      },
    ],
    checkpoint: { prompt: 'What is log₄(64)?', options: ['16', '3', '4', '2'], correct: 1, explanation: '4³ = 64, so the exponent requested by log₄(64) is 3.' },
    sourceTags: ['weber', 'kenney'],
  },
  // Kenney & Kastberg: notation, meaning, inverse functions, and domains.
  // https://files.eric.ed.gov/fulltext/EJ1093384.pdf
  {
    id: 'logarithms-domain', topic: 'logarithms', title: 'Check the domain before you calculate',
    summary: 'Know which bases and arguments are allowed, including the meaning of ln.', minutes: 6,
    sections: [
      {
        title: 'The argument is strictly positive',
        body: ['The real logarithm of zero or a negative number is not defined. For a logarithm containing an expression, require that entire expression to be positive.', 'For log₂(x − 3), x itself being positive is not enough. We need x − 3 > 0, which means x > 3.'],
        math: math`\log_2(x-3)\text{ is defined exactly when }x>3`,
        sourceTags: ['kenney'],
      },
      {
        title: 'A base between zero and one is allowed',
        body: ['A valid real logarithm base satisfies b > 0 and b ≠ 1. A base such as 1/2 is valid; 0, 1, and negative bases are not.', 'Why exclude 1? Because 1 raised to any real power is still 1, so it cannot give a unique inverse that asks which exponent produced an arbitrary positive value.'],
        math: math`\left(\frac12\right)^2=\frac14\quad\Longleftrightarrow\quad\log_{1/2}\left(\frac14\right)=2`,
        sourceTags: ['kenney', 'weber'],
      },
      {
        title: 'ln means logarithm in base e',
        body: ['The symbol ln names the natural logarithm: its base is e, approximately 2.71828. It is a function, not a variable or a factor you can divide out.', 'A base-10 logarithm and a natural logarithm are different functions. This course always writes the base explicitly except for the standard notation ln.'],
        math: math`\ln(x)=\log_e(x)\qquad e^{\ln(x)}=x\quad(x>0)`,
        sourceTags: ['kenney'],
      },
    ],
    checkpoint: { prompt: 'For which real x is log₃(7 − 2x) defined?', options: ['x < 3.5', 'x ≤ 3.5', 'x > 0', 'x ≠ 3.5'], correct: 0, explanation: 'Require 7 − 2x > 0. This gives 7 > 2x, so x < 3.5. Equality would make the argument zero.' },
    sourceTags: ['kenney', 'weber'],
  },
  // Chua & Wood: directly confront overgeneralized algebraic rules.
  // https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf
  {
    id: 'logarithms-laws', topic: 'logarithms', title: 'Three useful rules—and one tempting mistake',
    summary: 'Combine products, quotients, and powers without inventing a rule for sums.', minutes: 8,
    sections: [
      {
        title: 'Products become sums',
        body: ['For positive u and v, and a valid base b, the logarithm of uv is the sum of their logarithms. This follows from how exponents add when powers with the same base are multiplied.', 'For example, 8 × 4 = 2³ × 2² = 2⁵. Therefore log₂(8 × 4) = 3 + 2 = 5. Read the argument carefully: it is a product.'],
        math: math`\log_b(uv)=\log_b(u)+\log_b(v)\qquad(u>0,\ v>0)`,
        sourceTags: ['weber', 'chua'],
      },
      {
        title: 'Quotients become differences; powers become factors',
        body: ['Dividing powers subtracts their exponents. This gives the quotient rule for positive numerator and denominator.', 'For a positive u and real k, taking the logarithm of u raised to k gives k times the logarithm of u. The factor multiplies the value of the logarithm; it does not become part of its base.'],
        math: math`\log_b\left(\frac{u}{v}\right)=\log_b(u)-\log_b(v)\qquad\log_b(u^k)=k\log_b(u)`,
        sourceTags: ['weber', 'chua'],
      },
      {
        title: 'Do not distribute a logarithm over addition',
        body: ['There is no corresponding general rule that turns the logarithm of a sum into a sum of logarithms.', 'Use a counterexample instead of memorizing a warning: log₂(8 + 8) = log₂(16) = 4, but log₂(8) + log₂(8) = 6. These are not the same expression.'],
        math: math`\log_2(8+8)=4\quad\ne\quad\log_2(8)+\log_2(8)=6`,
        sourceTags: ['chua'],
      },
      {
        title: 'A rule does not erase domain restrictions',
        body: ['When combining log₂(x) + log₂(x − 2), keep both original conditions. The domain is x > 2 even if the product x(x − 2) happens to be positive for some other x.', 'Likewise, writing ln(x²) = 2ln(x) requires x > 0. The left expression alone is also defined for negative nonzero x, but the right expression is not. A rewrite must respect the original domain.'],
        sourceTags: ['kenney', 'chua'],
      },
    ],
    checkpoint: { prompt: 'Which expression equals log₂(3) + log₂(5)?', options: ['log₂(8)', 'log₂(3/5)', 'log₂(3) × log₂(5)', 'log₂(15)'], correct: 3, explanation: 'The arguments are positive and the bases match. The product rule gives log₂(3 × 5) = log₂(15).' },
    sourceTags: ['weber', 'kenney', 'chua'],
  },
  {
    id: 'logarithms-inverse-functions', topic: 'logarithms', title: 'Undo a logarithm with its inverse',
    summary: 'Solve single-log equations by naming the inverse function and checking the answer.', minutes: 7,
    sections: [
      {
        title: 'The function is undone, not divided away',
        body: ['If ln(x − 2) = 3, apply the exponential function with base e to both sides. It reverses the natural logarithm on its domain.', 'Saying “the ln disappears” can hide the reason. Say which function is applied and why it reverses the original one.'],
        example: { prompt: 'Solve ln(x − 2) = 3.', steps: [
          { math: math`x-2>0\quad\Longleftrightarrow\quad x>2`, reason: 'State the positive-argument condition first.' },
          { math: math`e^{\ln(x-2)}=e^3`, reason: 'Apply the same exponential function to both sides.' },
          { math: math`x-2=e^3`, reason: 'Exponentiation with base e reverses ln for a positive argument.' },
          { math: math`x=e^3+2`, reason: 'Add 2 to both sides.' },
        ], check: 'The candidate is greater than 2. Substitution gives ln(e³) = 3.' },
        sourceTags: ['kenney', 'weber'],
      },
      {
        title: 'Equal logs with the same base',
        body: ['A logarithm with a valid fixed base is one-to-one: two different positive inputs cannot produce the same output. Therefore equal logarithms of that base have equal arguments.', 'This is not cancellation of a common factor. Check both arguments before equating them.'],
        example: { prompt: 'Solve log₂(x − 1) = log₂(5 − x).', steps: [
          { math: math`1<x<5`, reason: 'Both x − 1 and 5 − x must be positive.' },
          { math: math`x-1=5-x`, reason: 'Use the one-to-one property of the same logarithm function.' },
          { math: math`2x=6\quad\Longrightarrow\quad x=3`, reason: 'Collect the unknown terms and divide by 2.' },
        ], check: '3 belongs to the domain and makes both arguments equal to 2.' },
        sourceTags: ['kenney'],
      },
      {
        title: 'Retain an exact answer',
        body: ['An expression such as e³ + 2 is an exact answer. A rounded decimal is useful for checking its size, but it need not replace the exact expression.', 'Use the original equation for the final check, including its domain. A calculator result alone does not explain why the transformations were valid.'],
        sourceTags: ['kenney', 'weber'],
      },
    ],
    checkpoint: { prompt: 'Solve ln(x + 1) = 0.', options: ['x = −1', 'x = 1', 'x = 0', 'x = e'], correct: 2, explanation: 'The domain is x > −1. Exponentiating gives x + 1 = e⁰ = 1, hence x = 0. The original argument is then 1.' },
    sourceTags: ['kenney', 'weber'],
  },
  {
    id: 'logarithms-combine-and-check', topic: 'logarithms', title: 'Combine, solve, then check the domain',
    summary: 'Handle multi-log equations and unknown exponents without accepting invalid candidates.', minutes: 10,
    sections: [
      {
        title: 'An algebraic candidate can still be invalid',
        body: ['Start with the domain, combine using a valid rule, solve the resulting equation, and test the candidates against the original restrictions.', 'In this example, a negative algebraic candidate makes the product positive but makes the two original logarithms undefined. Keeping the original domain prevents that mistake.'],
        example: { prompt: 'Solve log₂(x) + log₂(x − 2) = 3.', steps: [
          { math: math`x>0\text{ and }x-2>0\quad\Longrightarrow\quad x>2`, reason: 'Both original arguments must be positive.' },
          { math: math`\log_2(x(x-2))=3`, reason: 'Apply the product rule within that domain.' },
          { math: math`x(x-2)=8`, reason: 'Rewrite in exponential form.' },
          { math: math`(x-4)(x+2)=0`, reason: 'Rearrange x² − 2x − 8 = 0 and factor.' },
          { math: math`x=4`, reason: 'The candidates are 4 and −2; reject −2 because x must be greater than 2.' },
        ], check: 'log₂(4) + log₂(2) = 2 + 1 = 3.' },
        sourceTags: ['kenney', 'chua'],
      },
      {
        title: 'Match the base before combining',
        body: ['In log₂(x + 2) = log₂(x) + 1, the 1 is not an argument that can simply be added to x. Rewrite it as log₂(2).', 'Within x > 0, the right side becomes log₂(2x), giving x + 2 = 2x and x = 2. Check the candidate in the original equation.'],
        math: math`\log_2(x)+1=\log_2(x)+\log_2(2)=\log_2(2x)\quad(x>0)`,
        sourceTags: ['chua', 'kenney'],
      },
      {
        title: 'An unknown exponent needs a logarithm',
        body: ['When the unknown is an exponent, use a logarithm to undo the exponential function. Dividing by the base does not undo exponentiation.', 'A base-two logarithm fits a power of two directly. You can also calculate it as ln(7)/ln(2) if a calculator has only ln and base-10 log.'],
        example: { prompt: 'Solve 2^(x + 1) = 7.', steps: [
          { math: math`\log_2(2^{x+1})=\log_2(7)`, reason: 'Both sides are positive, so applying log₂ is defined and reversible.' },
          { math: math`x+1=\log_2(7)`, reason: 'The logarithm reverses exponentiation with base 2.' },
          { math: math`x=\log_2(7)-1=\frac{\ln(7)}{\ln(2)}-1`, reason: 'Subtract 1. The final equality is the change-of-base formula.' },
        ], check: 'Substitution gives 2^(x + 1) = 2^(log₂(7)) = 7. The approximate value of x is 1.807.' },
        sourceTags: ['weber', 'kenney'],
      },
      {
        title: 'Before you try a timed simulation',
        body: ['In practice, explain a step in your own words before revealing the solution. Check whether you can identify an invalid step, not merely select a numerical answer.', 'The exam phase removes hints and uses a per-question deadline. That is a product feature for rehearsal, not a teaching intervention established by these papers. Use untimed practice whenever you need time to reason.'],
        sourceTags: ['chua', 'kenney'],
      },
    ],
    checkpoint: { prompt: 'For log₂(x) + log₂(x − 2) = 3, algebra produces x = 4 or x = −2. Which answer is valid?', options: ['Only x = 4', 'Only x = −2', 'Both', 'Neither'], correct: 0, explanation: 'The original equation requires x > 2. Only x = 4 meets that condition and gives the correct original sum.' },
    sourceTags: ['weber', 'kenney', 'chua'],
  },
];
