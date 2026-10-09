# EduTechProject

An English-language mathematics learning site inspired by the four-step progression of Școala Rutieră, with original lessons, questions and interface design. It teaches equations/isolating x and logarithms, then separates explained practice from timed self-assessment.

## Four phases

1. **Understand equations:** equality, legal transformations, inverse operations, comparing methods, checking solutions.
2. **Understand logarithms:** exponent ↔ logarithm, valid bases/domains, logarithm laws and inverse functions.
3. **Guided practice:** 28 original starter questions, optional hints, worked solutions and misconception feedback.
4. **Exam mode:** 10 or 20 questions, 60/90/120 seconds per question, server-enforced deadlines, reload resumption and no explanations. Individual-topic exams initially support 10 questions because each topic has 14; mixed exams also support 20.

Practice/lesson progress stays in this browser. No student account or analytics service is needed. Moderator accounts are created by the server operator; moderators can create, edit, publish/unpublish and transactionally import question JSON. Changes are audited and stored as revisions. Existing timed exams retain their original question snapshots.

## Research, and what it does not establish

The website includes a **Research & method** page, per-lesson research notes, and links next to relevant practice feedback. Source comments are in `content/lessons.mjs` and `content/questions.mjs`.

| Source | Application |
| --- | --- |
| [Otten et al. (2019)](https://link.springer.com/article/10.1186/s40594-019-0183-2) | Explain equality-preserving operations using the balance idea, including its limitations. |
| [Ngu et al. (2015)](https://researchers.westernsydney.edu.au/en/publications/cognitive-load-in-algebra-element-interactivity-in-solving-equati/) | Link compact inverse-operation steps to their full justification. |
| [Rittle-Johnson & Star (2009)](https://dash.harvard.edu/entities/publication/73120378-9609-6bd4-e053-0100007fdf3b) | Compare different valid solutions to the same equation. |
| [Weber (2002)](https://files.eric.ed.gov/fulltext/ED477690.pdf) | Teach logarithms by reversing exponentiation, not by symbol manipulation alone. |
| [Kenney & Kastberg (2013)](https://files.eric.ed.gov/fulltext/EJ1093384.pdf) | Name inverse functions precisely and check logarithm domains. |
| [Chua & Wood (2005)](https://math.nie.edu.sg/ame/matheduc/tme/tmeV8_2/Final%20Chua%20Wood.pdf) | Use misconception-based distractors and error-analysis feedback. |

The detailed-to-compact lesson sequence and timed testing are product design decisions, not outcomes proved by these papers. The platform has not undergone an independent learning-effectiveness study. Scores describe this starter bank only; this is not an official or proctored exam.

## Local development

Use current Node 24 LTS and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm test
```

In one terminal, start the API with `BASE_PATH=/edutechproject`, `PORT=3101`, `APP_ORIGIN=http://localhost:5173`, `COOKIE_SECURE=false` and `NODE_ENV=development`. Run `node server/index.mjs`. In another, run `BASE_PATH=/edutechproject npm run dev`. The Vite development proxy points to port 3101.

For a same-origin production-build preview:

```sh
BASE_PATH=/edutechproject npm run build
APP_ORIGIN=http://127.0.0.1:3101 COOKIE_SECURE=false BASE_PATH=/edutechproject PORT=3101 node server/index.mjs
```

Open `http://127.0.0.1:3101/edutechproject/`. Do not use HTTP cookie configuration in production: the server refuses it when `NODE_ENV=production`.

## Deployment and moderation

See [DEPLOYMENT.md](DEPLOYMENT.md) for the isolated VPS service, HTTPS route, resource limits, server-side Git workflow, backup/restore and moderator setup. See [SECURITY.md](SECURITY.md) for security boundaries and remaining operator responsibilities.

There are no default moderator passwords. On the configured server:

```sh
sudo bash /opt/edutechproject/scripts/moderator.sh create YOUR_USERNAME admin
```

The password prompt is hidden and pipes directly into the CLI. Never reuse the VPS root password.

Questions imported by a moderator must follow the shape in [CONTRACT.md](CONTRACT.md); a valid exportable example is supplied by the editor. Imports create new IDs only; edit existing questions through the editor. Questions can be unpublished without destroying their history. Source content is seeded only if an ID is missing, so deployment never silently overwrites moderator edits.

## Tests

`npm test` exercises authentication/CSRF, exam ownership/timers, immutable snapshots, import validation, audit history, credential revocation, seed preservation, source references and mathematical rendering. `npm run build` checks TypeScript and produces a self-hosted bundle. `npm audit` checks the locked dependency set against published advisories. Browser walkthroughs and learning trials are additional checks, not substitutes for each other.
