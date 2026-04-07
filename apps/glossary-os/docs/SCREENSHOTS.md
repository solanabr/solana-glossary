# Screenshot Capture

From the repository root:

```bash
npm run dev:web
npm run capture:screenshots --workspace @stbr/glossary-os
```

This script waits for the local app, opens a headless browser, and saves updated PNGs to [`../screenshots`](../screenshots).

It captures:

- landing
- explore
- term page
- inline Copilot on a term page
- dedicated Copilot workspace
- Agent Mode workspace with a prefilled goal
- builder paths
- builder path detail

Optional overrides:

```bash
BASE_URL=http://127.0.0.1:3001 LOCALE=pt npm run capture:screenshots --workspace @stbr/glossary-os
```
