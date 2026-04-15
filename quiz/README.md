# Solana Quiz

> Interactive quiz game built from the 1001-term Solana Glossary. Test your knowledge, review what you missed, and level up your Solana expertise.

**Live demo:** https://quiz-flame-two.vercel.app

---

## Features

- **Dynamic questions** — generated from any combination of the 14 categories
- **Multiple choice** — 4 options per question (1 correct + 3 distractors from the full dataset)
- **Instant feedback** — correct/incorrect highlighted immediately after each answer
- **Scoring** — percentage score + average answer time
- **Review mode** — see every question with your answer vs. the correct answer
- **Terms to study** — missed terms listed with their definitions after the quiz

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `@stbr/solana-glossary` for the question bank

## Running locally

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

## How it works

`src/quiz.ts` generates questions by:
1. Filtering terms by selected categories (or all if none selected)
2. Randomly picking N terms with `definition.length > 40`
3. For each term: picking 3 distractors from the full pool
4. Shuffling the 4 options and recording the correct index

```
src/
  glossary.ts          # Static imports of all JSON data (Vite bundles at build time)
  quiz.ts              # Question generation + types
  App.tsx              # Screen router (setup → quiz → results → review)
  components/
    Setup.tsx          # Category picker + question count selector
    QuizQuestion.tsx   # Single question with progress bar
    Results.tsx        # Score + terms-to-review list
    Review.tsx         # Full answer-by-answer breakdown
```

---

Built by [Superteam Brazil](https://superteam.fun/brazil) for the Solana Glossary Bounty.
