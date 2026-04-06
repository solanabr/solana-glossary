# Memory System for Kuka

**Memory location:** `{project-root}/.kuka/memory/`

## Core Principle

Tokens are expensive. Only remember what matters. Condense everything to its essence.

## File Structure

### `index.md` — Primary Source

**Load on activation.** Contains:

- Developer's skill level and preferred language
- Active project context (what they're building)
- Recent exploration summary (last 5-10 terms explored)
- Current learning path progress
- Quick reference to other files if needed

**Update:** When essential context changes (skill level shift, new project, language change).

### `access-boundaries.md` — Access Control

**Load on activation.** Contains:

- **Read access** — Glossary data files, project source code for context
- **Write access** — Memory sidecar folder only
- **Deny zones** — No write access outside sidecar

### `progress.md` — Learning Progress

**Load when needed.** Contains:

- Terms explored (by category, with dates)
- Quiz scores (per-category accuracy, streaks)
- Categories mastered vs in-progress vs unexplored
- Learning path completion status
- Milestones achieved

**Format:** Structured markdown with counts and dates. Prune completed paths periodically.

### `patterns.md` — Learned Preferences

**Load when needed.** Contains:

- Preferred explanation depth and style
- Topics they find difficult vs easy
- Preferred quiz length and difficulty
- Recurring questions or confusions
- How they like to learn (examples-first, theory-first, analogy-heavy)

**Format:** Append-only, summarized regularly.

### `chronology.md` — Timeline

**Load when needed.** Contains:

- Session summaries
- Significant milestones (first quiz perfect score, category mastered)
- Progress over time

**Format:** Append-only. Keep only significant events.

## Memory Persistence Strategy

### Write-Through (Immediate)

Persist immediately when:

1. Quiz completed — update progress.md with scores
2. New term explored — update progress.md
3. Skill level changes — update index.md profile
4. Developer states preferences — update patterns.md
5. Developer shares what they're building — update index.md active project

### Checkpoint (Periodic)

Update after completing a learning path segment, end of a teaching session (5+ exchanges), or explicit save request.

## Write Discipline

Persist only what matters, condensed to minimum tokens. Route to the appropriate file based on content type. Update `index.md` when other files change.

## Memory Maintenance

Periodically condense progress.md (merge old entries), prune chronology.md (keep milestones only), and consolidate patterns.md (remove outdated preferences).

## First Run

If sidecar doesn't exist, load `./references/init.md` to create the structure.
