# Learning and moderation walkthrough

## Learner

1. Open the homepage on desktop and phone. Navigate all four phases with keyboard and touch.
2. Open the first equality lesson. Follow each legal operation, open “Why we teach it this way”, and check the original paper link.
3. Try a wrong checkpoint answer, read the explanation, correct it and mark the lesson complete. Reload: progress should remain in this browser.
4. Compare the two methods in the brackets/fractions lesson. Explain why both are valid and why one may be shorter. This is a teaching check, not just a UI check.
5. Open the logarithm lessons. Confirm the positive-argument/base restrictions, power↔log conversion and the worked `ln(x−2)=3` example are clear.
6. In practice, filter topics. Try the optional hint, submit an incorrect answer, then examine the explanation, misconception and paper notes. No correctness appears before submission.
7. Start a mixed 10-question exam. Verify there are no hints or worked explanations; refresh during a question and confirm its deadline does not reset. Let one expire, then submit another. End early and inspect the score.
8. Try a second browser/session: it must not be able to retrieve the first session's exam by ID.
9. Reset browser-local progress through the privacy/progress control. Existing server exam records follow server retention; resetting browser progress is not an account/data-deletion request.

## Moderator (use a named test account)

1. Provision a moderator with the operator CLI and sign in over HTTPS.
2. Create a draft with a new ID, four options, a correct option, hint, explanation and research tags. It must be absent from public practice.
3. Publish it, verify it appears, then correct an explanation and inspect the audit entry. Existing exams should keep the original snapshot.
4. Import valid JSON with new IDs. Invalid JSON, HTML, unknown fields, duplicate IDs or a correct-answer ID absent from the options must be rejected without partial imports.
5. Unpublish the test item rather than deleting its history. Sign out; moderator requests must fail afterwards.
6. Reset the moderator's password from the CLI. The old authenticated session must no longer work.

## Operations

Run `npm test`, `npm run build`, `npm audit` and `node scripts/smoke.mjs URL` on the exact revision. The smoke test creates and finishes one anonymous exam. Verify a database backup and its integrity, service resource caps, loopback-only listener, correct Caddy routing and unaffected neighboring websites. Keep screenshots/test data out of Git.

## Learning evaluation still required

These checks verify behavior, not educational effectiveness. Ask a few real learners to explain an equation step, compare two methods and solve a domain-sensitive log equation before and after a session. Record confusing wording and unexpected errors with consent. Improve the explanations based on observations; do not claim measured learning gains without an actual evaluation.
