# Implementation contract

Dutch-first educational application with an English switch. The separate repository is the entire project; do not modify the parent project. No student account is required. Student progress and language choice are browser-local. Moderator identities are provisioned using a local CLI, never public registration. Configurable BASE_PATH supports /edutechproject/ as well as a dedicated subdomain.

## Content

`content/questions.mjs` exports `questions`: Question[] with Dutch variants from `content/questions-nl.mjs`; `content/lessons.mjs` exports English `lessons`/`sources` and Dutch `lessonsNl`/`sourcesNl`. `content/glossary.json` contains entries with stable `id` and `nl`/`en` definitions (`term`, `aliases`, `meaning`, `example`, optional `math`). Question answer banks are server-only and must never be imported by browser code.

Question: `{id, topic: 'equations'|'logarithms', difficulty: 1|2|3, prompt, math?: string, options: [{id: 'a'|'b'|'c'|'d', text, math?: string}], correctOptionId, hint, explanation: string[], misconception, sourceTags: string[], published: boolean}`.

Question optionally includes `translations: {nl: {prompt, options, hint, explanation, misconception}}`. Translated options must have exactly the same IDs/order as English; there is only one outer correctOptionId. A supplied translation must be complete. All text is plain text; `math` is restricted KaTeX rendered with `trust:false`, never arbitrary HTML. Explanations may contain inline math `$...$`. IDs are URL-safe slugs. All content has original wording. Public question DTO omits `correctOptionId`, `explanation`, `misconception` and the complete `translations` object; it adds `language` and `requestedLanguage`. Server validators reject unknown keys and invalid correctOptionId references.

Lesson: `{id, topic, title, summary, minutes, sections: [{title, body: string[], math?: string, example?: {prompt, steps: [{math, reason}], check?: string}, comparison?: {left: {title, steps: string[]}, right: {title, steps: string[]}}, sourceTags: string[]}], checkpoint: {prompt, options: string[], correct: number, explanation}, sourceTags: string[]}`.

Source: `{id, authors, year, title, url, application, limitation}`. Stable IDs: otten, ngu, rittle, weber, kenney, chua.

Lessons optionally include `words: string[]` referencing glossary IDs; sections optionally include `visual: string` referencing a code-native LessonVisual. IDs, option order and correct indices stay identical across lesson languages so progress survives switching. Inline glossary matching is opt-in only for lesson/practice prose, not exam content or answer labels.

## HTTP contract

All JSON APIs use `{error: string}` for errors. App and APIs share the origin. GET `/api/session` creates/reads an opaque HttpOnly session cookie and returns `{csrfToken, user: null|{username, role:'moderator'|'admin'}}`. Every POST/PUT/PATCH/DELETE requires `X-CSRF-Token` plus same-origin Origin validation. Client calls this first and keeps CSRF token in memory.

Content, public questions, practice feedback and exam routes accept `?lang=nl|en` (default `nl`); unsupported values return 400. Missing Dutch question translations fall back explicitly to English. Moderator endpoints return both variants for editing. Exam snapshots retain both language prompts/options but no hints/explanations, and language switches preserve the snapshot, option IDs and deadline.

- GET `/api/health` -> `{status:'ok'}` with no operational details.
- GET `/api/content` -> `{lessons,sources}`.
- GET `/api/questions?topic=equations|logarithms` -> `{questions: PublicQuestion[]}`. Published only.
- POST `/api/practice/:id/answer` `{optionId}` -> `{correct,correctOptionId,explanation,misconception,sourceTags}`.
- POST `/api/exams` `{topic:'mixed'|'equations'|'logarithms',count:10|20,secondsPerQuestion:60|90|120}` -> ExamState.
- GET `/api/exams/current` -> `{exam:null}` or ExamState.
- GET `/api/exams/:id` -> ExamState. Must belong to the session.
- POST `/api/exams/:id/answer` `{questionId,optionId: string|null}` -> ExamState. Reject stale question IDs; server deadline controls; timed-out answers never count. Only current question served. Next deadline starts on advancing. Exam status is server authoritative.
- POST `/api/exams/:id/finish` `{}` -> ExamState (unanswered count wrong).
- POST `/api/auth/login` `{username,password}` -> `{csrfToken,user}`; rotate session.
- POST `/api/auth/logout` `{}` -> `{csrfToken,user:null}`; rotate session.
- GET `/api/mod/questions` -> `{questions: Question[]}` requires moderator/admin.
- POST `/api/mod/questions` Question -> `{question:Question}`; reject ID conflicts.
- PUT `/api/mod/questions/:id` Question -> `{question:Question}`.
- POST `/api/mod/import` `{questions:Question[]}` -> `{imported:number}`; transactional validation, max 100, creates only (reject duplicates), no arbitrary uploads/files.
- GET `/api/mod/audit` -> `{entries:[{id,username,action,questionId,createdAt}]}`.

ExamState: `{id,status:'active'|'completed',topic,total,index,secondsPerQuestion,serverNow:number,deadline:number|null,question:PublicQuestion|null,answered:number,result?:{correct:number,total:number,answers:[{question:PublicQuestion,selectedOptionId:string|null,correctOptionId:string,correct:boolean,timedOut:boolean}]}}`. Never include answer keys/explanations before completion. Never show exam explanations even after completion; suggest revisiting practice. Persist snapshots so later moderator edits do not change in-flight exams. At most one active exam per session. Frontend must handle server time offset, reload resumption, expiry and empty question banks.

## Ownership

- Curriculum agent: content/*.mjs and content README only.
- Backend agent: server/*.mjs and tests/backend.test.mjs only.
- Frontend agent: src/*, index.html, public/*, vite.config.ts, tsconfig.json only.
- Root: package files, integration fixes after coordination, deployment/configuration/docs and additional tests.
