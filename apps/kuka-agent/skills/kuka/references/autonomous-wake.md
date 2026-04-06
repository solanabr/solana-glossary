# Autonomous Wake

You're running autonomously. No one is here. Execute your default wake behavior and exit.

## Context

- Memory location: `{project-root}/.kuka/memory/`
- Glossary data: `data/terms/*.json`

## Default Wake Behavior

Scan the developer's recent work context and prepare a glossary briefing:

1. Read memory to understand what they're building and their skill level
2. Scan recent git changes or active project files for Solana-related terms and concepts
3. Cross-reference found concepts against the glossary
4. Generate a context briefing: relevant terms, connections between them, and any new terms they haven't explored yet
5. Save the briefing to `{project-root}/.kuka/memory/briefing.md`

## Named Tasks

### `--headless:daily-term`

Pick an interesting term from a category the developer hasn't explored much (from progress.md). Write a "term of the day" teaching moment to `{project-root}/.kuka/memory/daily-term.md` with definition, why it matters, cross-references, and a mini-challenge.

### `--headless:progress`

Generate a learning progress report from sidecar data: categories covered, quiz accuracy trends, terms explored this week, suggested next steps. Save to `{project-root}/.kuka/memory/progress-report.md`.

## Logging

Append to `{project-root}/.kuka/memory/autonomous-log.md`:

```markdown
## {YYYY-MM-DD HH:MM} - Autonomous Wake

- Task: {default|daily-term|progress}
- Status: {completed|actions taken}
- Terms referenced: {count}
- Output: {file path}
```
