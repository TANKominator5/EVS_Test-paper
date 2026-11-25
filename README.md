# পরিবেশ পাঠ · EVS Practice

A Bengali-first, browser-local practice site for all 15 Environmental Studies papers (450 questions, printed pages 266–295). No account or database is required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. `npm run build` exports a static site to `out/`; `npm test` checks the scoring and question data. Attempts live in local storage and are specific to the browser profile and site address. Clearing site data removes those attempts.

Run the desktop and mobile browser tests with `npx playwright install chromium` and `npx playwright test`.

## Paper data

- Source photos are local under `Questions Pic/` and ignored by Git.
- Store digitized sets in `src/data/`. Keep printed text and option order as-is. Only physical line wraps and layout may be normalized.
- Transcribe the printed answer key separately from explanations. Handwritten annotations are not answer data. If evidence contradicts the printed key, retain the key for scoring and include an anomaly note.
- For misprinted option labels, the original labels are displayed while internally the answer key is matched to A–D positions.
- Set 15 Q12 is scored as C (300 days), exactly as printed on p. 295, with a note explaining why that is not a universal school-meal rule.
- A set is playable only after all 30 questions and their explanations are present. Do not fill in unreadable source text from context.
