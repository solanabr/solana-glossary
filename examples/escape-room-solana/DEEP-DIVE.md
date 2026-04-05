# Deep Dive — Solana Glossary Games

## Why Games?

The Solana Glossary SDK has 1000+ terms across 14 categories. Reading definitions is boring. Playing with them is not.

We built two games that turn passive reading into active learning:

1. **Escape Room** — Solo puzzle-solving against the clock. 12 puzzle types test different cognitive skills (matching, ordering, decoding, classifying). You can't just memorize — you have to *understand* the terms.

2. **Jogo da Vida** — Multiplayer board game where event cards and challenge quizzes use real SDK terms. You learn while competing with friends online.

Both games use the full breadth of the SDK: all 14 categories, localized definitions (pt-BR + es), related terms, and aliases.

## Architecture Decisions

### One App, Two Games

Both games live in `examples/escape-room-solana/`. The Jogo da Vida is in `src/vida/`. They share:
- Wallet connection (`@solana/wallet-adapter-react`)
- Profile system (nickname + avatar, localStorage + Supabase)
- Leaderboard (toggle between Escape Room and Jogo da Vida)
- Audio engine (Web Audio API, zero mp3 files)
- i18n infrastructure (react-i18next, 200+ keys per language)
- Supabase client

### SDK Integration Strategy

Instead of showing raw glossary data, we mapped the 14 SDK categories into **themed learning paths**:

| Game Theme | SDK Categories | Narrative |
|-----------|---------------|-----------|
| Genesis / Normie | blockchain-general, core-protocol, network, infrastructure | Fundamentals — what is Solana? |
| DeFi / Startup | token-ecosystem, defi, web3, solana-ecosystem | Financial layer — tokens, swaps, protocols |
| Lab / Timeline | programming-model, dev-tools, programming-fundamentals, security | Builder layer — programs, tools, safety |

Each theme draws exclusively from its categories via `getTermsByCategory()`. Players who complete all 3 themes have been exposed to all 14 categories.

### Multiplayer Sync Model

The Jogo da Vida multiplayer uses a simple but robust pattern:

```
Active player: compute turn locally → save ONCE to Supabase → done
Waiting players: poll every 1.5s → display what they get → never save
```

Key design choices:
- **No WebSockets/Realtime channels** — REST polling is simpler and works through corporate firewalls
- **Active player skips poll** — prevents the poll from overwriting intermediate local state (this was the root cause of 8 failed attempts at turn sync)
- **Single save per action** — no intermediate state saves, no ordering issues
- **Turn timer with disconnect detection** — if the active player doesn't act within the configured time + 3s buffer, any waiting player can force-skip

### Three Boards, Three Products

The Jogo da Vida has 3 boards that are **not just color swaps** — they're different interaction paradigms:

**Normie (Neon Cockpit):**
- 2-column layout (board left, dice+players right)
- Visual dice with Framer Motion spring animation
- Glassmorphic HUD panels with neon glow
- Circular board nodes with animated boxShadow

**Startup (Terminal):**
- No visual dice — replaced by clickable text command (`> execute roll()`)
- 5-column vertical board (10 rows, like a terminal log)
- ASCII timer bar (`[████████░░]`)
- Player list rendered as a process table (`PID NAME SCORE POS STATUS`)

**Timeline (Arcade):**
- HUD fixed to viewport bottom (like an arcade status bar)
- 60x60px pixel dice button embedded in the HUD
- 8-column board with chunky 3px-border tiles
- Press Start 2P font, no gradients, no blur — pure solid colors

### Audio Without Assets

All sound effects and background music are synthesized in real-time using the Web Audio API:

- **SFX**: 10 distinct effects (correct, wrong, tick, hint, unlock, diceRoll, move, event, bonus, trap)
- **BGM**: 3 theme loops (Genesis: C minor square wave, DeFi: A minor sawtooth, Lab: E minor triangle)
- **Theme-adaptive**: Each SFX varies by theme (octave + waveform changes)
- **Zero external assets**: No mp3, wav, or audio files — everything is oscillators and gain nodes

### Puzzle Design Philosophy

The 12 Escape Room puzzles test different cognitive skills:

| Skill | Puzzles | How it teaches |
|-------|---------|---------------|
| Recognition | MultipleChoice, TrueFalse | "Which definition matches?" |
| Recall | FillBlank, AliasResolver | "Type the term from memory" |
| Association | ConnectionWeb, RelatedTerms | "Which terms are related?" |
| Classification | CategorySort, OddOneOut | "Which category does this belong to?" |
| Construction | DefinitionBuilder, TermTimeline | "Build/order from parts" |
| Decoding | CodeBreaker, TermMatcher | "Decode and match" |

Difficulty scales by definition length (shorter definitions = harder to distinguish) and by level (Surface → Consensus adds more terms and reduces time).

## Numbers

- **1001 terms** across 14 SDK categories
- **979 pt-BR translations** + **1001 es translations**
- **12 puzzle types** in the Escape Room
- **3 themed boards** with distinct UX in the Jogo da Vida
- **50 board spaces** per board (start, finish, event, challenge, bonus, trap)
- **200+ i18n keys** per language
- **10 synthesized SFX** + **3 BGM loops** (zero audio files)
- **0 external dependencies** for audio (pure Web Audio API)

## What We'd Do Next

- Video walkthrough of both games
- Responsive mobile optimization
- Supabase Realtime channels (replace polling with subscriptions)
- QR code for room invites
- Animated piece movement on the board (interpolated path)
- Per-theme modal styling for Startup (terminal frame) and Timeline (pixel frame)
- Escape Room visual theming per theme (DeFi hexagons, Lab terminal style)
