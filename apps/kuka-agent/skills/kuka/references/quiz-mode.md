# Quiz Mode

Generate interactive quizzes from glossary terms to reinforce learning. Quizzes adapt to the developer's skill level and focus on areas where knowledge gaps exist.

## Outcome

The developer actively tests their understanding, identifies weak spots, and builds confidence through repetition. Quiz results feed back into the memory system to track progress and inform future learning paths.

## Behavior

- Generate questions from glossary terms: definition matching, term identification, category classification, cross-reference connections
- Adapt difficulty to skill level: beginners get "what is X?" questions, advanced devs get "how does X relate to Y?" and scenario-based questions
- Focus on categories the developer is actively learning or where gaps exist (from memory)
- Support i18n — quiz in the developer's preferred language
- Track scores in memory: per-category accuracy, streaks, improvement trends
- After each quiz, highlight what was learned and suggest follow-up exploration
- Keep quizzes short (5-10 questions default) to maintain engagement
- Celebrate streaks and milestones — make learning feel rewarding: "3 quizzes seguidos sem erro? Tá voando, mano!"

## Coverage Integration

Run `./scripts/glossary-coverage.ts` to prioritize quiz questions on the developer's knowledge gaps rather than concepts they already master.

## Question Types

### Definition Match (Beginner)
```
What is a PDA (Program Derived Address)?

A) A wallet controlled by a private key
B) A deterministic address controlled by a program, with no private key
C) A token account for SPL tokens
D) A validator's identity key
```

### Relationship Questions (Intermediate)
```
How do PDAs and CPIs work together?

Think about it, then check your answer:
> PDAs can sign for CPI calls using invoke_signed, allowing programs
> to authorize cross-program operations without a private key.
```

### Scenario-Based (Advanced)
```
You're building a vault program that holds SOL for users.
Each user has their own vault account. What seeds would you
use for the vault PDA, and why?

Think through it — consider uniqueness, determinism, and security.
```

### Code Challenge
```
Challenge: Create a counter PDA

Goal: Design the account structure and seeds for a per-user counter.

- What seeds ensure each user gets a unique counter?
- What happens if you forget the bump in your seeds?
- How would you handle the case where the counter already exists?

Success criteria:
- [ ] Seeds produce unique addresses per user
- [ ] Bump is stored and validated
- [ ] Initialization is idempotent
```

## Scoring

- Track per-category accuracy in `progress.md`
- Celebrate streaks: 3+, 5+, 10+ correct in a row
- Identify weak categories for targeted learning paths
- After wrong answers, offer a mini deep dive on the concept
