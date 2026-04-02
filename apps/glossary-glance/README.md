# Glossary Glance — Solana

Browser extension (Chrome + Firefox) that **highlights Solana glossary terms** on any webpage and shows **definitions on hover**.

## SDK dependency

This app **depends on `@stbr/solana-glossary`** (see `package.json`). The build script imports `allTerms` from the SDK and reads `data/i18n/*.json` from the installed package — same source as [`npm i @stbr/solana-glossary`](https://www.npmjs.com/package/@stbr/solana-glossary).

In this monorepo, the dependency is **`file:../../`** (the glossary package at the repo root). After the package is published, you can switch to `"@stbr/solana-glossary": "^1.0.0"` for a standalone install.

## Features

- **~1001 terms** — display names, aliases, and spaced `id` variants (e.g. `proof-of-history` → `proof of history`)
- **Longest-match** highlighting to avoid chopping multi-word concepts
- **Tooltips** — localized definition (EN / PT / ES) + category + related terms
- **Respects** `<code>`, `<pre>`, and nested syntax-highlighted blocks when “skip code” is enabled
- **MutationObserver** — works on SPAs (Twitter/X, docs, etc.)
- **MV3** — minimal `storage` permission; content scripts only

## Build

**1.** Compile the SDK once (generates `dist/` for `import("@stbr/solana-glossary")`):

```bash
# from solana-glossary repo root
npm install
npm run build
```

**2.** Build the extension bundle:

```bash
cd apps/glossary-glance
npm install
npm run build
```

This writes `dist/glossary-bundle.json` from **`allTerms`** + **`data/i18n`** inside `@stbr/solana-glossary`.

## Load unpacked (Chrome)

1. `npm run build`
2. `chrome://extensions` → **Developer mode** → **Load unpacked**
3. Select the `apps/glossary-glance` folder (the one that contains `manifest.json`)

## Load temporary add-on (Firefox)

1. `npm run build`
2. `about:debugging` → **This Firefox** → **Load Temporary Add-on**
3. Pick `apps/glossary-glance/manifest.json`

## Icons

Placeholder PNGs live under `icons/`. Regenerate with Pillow if needed (purple tile + “S”).

## Settings

- **Popup** — on/off, locale, skip code blocks
- **Options** — max text nodes per pass (performance tuning)

After toggling, **reload** heavy tabs.

## Submission / PR

Per [BOUNTY.md](../../BOUNTY.md): contribute via PR to [`solanabr/solana-glossary`](https://github.com/solanabr/solana-glossary), include README + screenshots or short demo.

## License

MIT (same as the glossary repo).
