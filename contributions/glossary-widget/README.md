# solexicon Widget SDK

> Embeddable glossary widget — drop one `<script>` tag to get Solana term tooltips on any page.

## Quick Start

### Auto-init (simplest)

```html
<script src="https://cdn.example.com/solexicon-widget.js" data-auto data-theme="dark"></script>
```

That's it. The widget scans your page, highlights Solana terms, and shows tooltip definitions on hover.

### Manual init (full control)

```html
<script src="solexicon-widget.js"></script>
<script>
  SolanaGlossary.init({
    theme: 'dark',
    locale: 'en',
    highlight: true,
    position: 'bottom',
    maxTerms: 100,
    exclude: ['.no-glossary'],
    onTermClick: (term) => {
      console.log('Clicked:', term.id, term.term);
    }
  });
</script>
```

## Features

- **30+ embedded Solana terms** with definitions, categories, and aliases
- **DOM text scanning** — automatically finds Solana terms in your page content
- **Hover tooltips** with term name, category badge, definition, and aliases
- **Dark/light/auto theme** support
- **Zero dependencies** — vanilla TypeScript, no framework required
- **< 30KB gzipped** — lightweight enough for any page
- **Style-isolated** — won't conflict with your existing CSS
- **One highlight per term** — clean, non-intrusive experience
- **Configurable** — exclude selectors, limit terms, custom click handlers
- **Destroyable** — clean removal with `SolanaGlossary.destroy()`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Widget color theme |
| `locale` | `'en' \| 'pt' \| 'es'` | `'en'` | Language for terms |
| `highlight` | `boolean` | `true` | Whether to highlight terms in page text |
| `position` | `'bottom' \| 'top' \| 'cursor'` | `'bottom'` | Tooltip position relative to highlighted term |
| `exclude` | `string[]` | `['.no-glossary']` | CSS selectors to skip when scanning |
| `maxTerms` | `number` | `100` | Maximum number of terms to highlight |
| `onTermClick` | `(term) => void` | Opens GitHub | Custom click handler |

## API

### `SolanaGlossary.init(config?): Promise<number>`

Initialize the widget. Returns the number of terms highlighted.

### `SolanaGlossary.destroy(): void`

Remove all highlights, tooltips, and injected styles. Restores the page to its original state.

## Build

```bash
npm install
npm run build
```

Outputs:
- `dist/widget.js` — IIFE bundle for `<script>` tag (CDN-ready)
- `dist/widget.esm.js` — ES module for `import` usage

## Demo

Open `demo/index.html` in a browser to see the widget in action with interactive theme switching.

## How It Works

1. **Scan** — Uses `TreeWalker` to traverse text nodes in the DOM
2. **Match** — Tests each text node against regex patterns for 30+ Solana terms
3. **Highlight** — Wraps matched text in a `<span>` with dotted underline
4. **Tooltip** — Shows a floating card on hover with term details
5. **One per term** — Only highlights the first occurrence of each term

## Embedded Terms

The widget ships with 30 essential Solana terms covering:

- **Core Protocol**: Solana, PoH, Transactions, Slots, Epochs, Validators, Lamports
- **Programming Model**: Programs, Accounts, PDAs, Instructions, CPIs, Rent
- **Token Ecosystem**: SPL Token, Token-2022, NFTs, Compressed NFTs
- **DeFi**: AMMs, Jupiter, Liquid Staking, Jito, MEV
- **Infrastructure**: RPC, Staking, Wallets
- **Ecosystem**: Metaplex, Anchor Framework
- **Emerging**: AI Agents, DePIN

## Integration Examples

### React / Next.js

```tsx
import { useEffect } from 'react';

export function GlossaryWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/solexicon-widget.js';
    script.onload = () => {
      window.SolanaGlossary?.init({ theme: 'dark' });
    };
    document.body.appendChild(script);

    return () => {
      window.SolanaGlossary?.destroy();
      script.remove();
    };
  }, []);

  return null;
}
```

### Vue

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(async () => {
  await import('./solexicon-widget.js');
  window.SolanaGlossary?.init({ theme: 'dark' });
});

onUnmounted(() => {
  window.SolanaGlossary?.destroy();
});
</script>
```

### Plain HTML

```html
<script src="solexicon-widget.js" data-auto data-theme="dark"></script>
```
