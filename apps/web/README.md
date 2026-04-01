# Solana Glossary Web

A production-quality frontend for the `@stbr/solana-glossary` SDK — searchable, beautiful, and fully trilingual.

**Live demo:** _deploy to Vercel and add URL here_

---

## Features

- **1001 termos, 14 categorias, 3 idiomas** — EN / PT-BR / ES via React Context + `getLocalizedTerms()`
- **Busca CMD+K** — full-text search via SDK + Fuse.js fuzzy fallback quando não há resultados exatos
- **"Por que isso existe?"** — cada termo tem uma explicação de _motivação_, não só definição. Por que PDAs existem? Por que rent? Por que PoH? Essa é a pergunta que nenhum glossário responde
- **Grafo de conhecimento** — D3.js force simulation usando os campos `related[]` do SDK. Clique em um nó para navegar
- **Badges de dificuldade** — Iniciante / Intermediário / Avançado por termo e categoria, i18n incluído
- **Trilha de aprendizado `/start`** — 10 termos essenciais ordenados do mais básico ao mais avançado, com links para o próximo
- **100% estático** — `output: "export"` no Next.js. Nenhum servidor necessário. Deploy em qualquer CDN

---

## Estrutura

```
apps/web/
├── app/
│   ├── page.tsx                ← Home: hero + sidebar + featured card + mini-grid
│   ├── term/[id]/page.tsx      ← Detalhe do termo: definição, Por quê, código, grafo, relacionados
│   ├── category/[slug]/page.tsx← Todos os termos de uma categoria
│   └── start/page.tsx          ← Trilha de aprendizado (10 termos essenciais)
├── components/
│   ├── Nav.tsx                 ← Logo, link /start, toggle de idioma (EN/PT-BR/ES), GitHub star
│   ├── Sidebar.tsx             ← 14 categorias com contagem de termos
│   ├── SearchModal.tsx         ← CMD+K, full-text + fuzzy (Fuse.js)
│   ├── FeaturedCard.tsx        ← Card destacado da categoria ativa
│   ├── MiniCard.tsx            ← Card compacto para grids
│   ├── DifficultyBadge.tsx     ← Badge Iniciante/Intermediário/Avançado
│   └── term/
│       ├── WhySection.tsx      ← "Por que isso existe?" — o diferencial
│       ├── CodeExample.tsx     ← Snippet copiável para termos-chave
│       ├── KnowledgeGraph.tsx  ← D3.js force simulation
│       └── RelatedTerms.tsx    ← Links para termos relacionados
├── lib/
│   ├── glossary.ts             ← Wrapper do SDK com suporte a locale
│   ├── difficulty.ts           ← Mapeamento de dificuldade por termo/categoria
│   ├── learningPath.ts         ← IDs dos 10 termos essenciais
│   └── i18n.tsx                ← LocaleProvider + useLocale hook
└── __tests__/
    ├── glossary.test.ts
    └── difficulty.test.ts
```

---

## Setup

```bash
# A partir da raiz do repositório
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # Export estático para /out — 1020 páginas estáticas
npm test           # Vitest — 12 testes
```

> **Nota:** O SDK `@stbr/solana-glossary` é referenciado como dependência local (`file:../..`). Certifique-se de buildar o SDK primeiro caso edite os arquivos em `src/`:
> ```bash
> cd ../../ && npm run build
> ```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, `output: "export"`) |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS v4 |
| Dados | `@stbr/solana-glossary` SDK |
| Busca | SDK `searchTerms()` + Fuse.js fuzzy fallback |
| Grafo | D3.js v7 force simulation |
| Fontes | Archivo Black (headings) + Inter (body) via `next/font/google` |
| Testes | Vitest + Testing Library |
| Deploy | Vercel (static export) |

---

## Páginas geradas

| Rota | Tipo | Quantidade |
|------|------|-----------|
| `/` | Static | 1 |
| `/start` | Static | 1 |
| `/term/[id]` | SSG | 1001 |
| `/category/[slug]` | SSG | 14 |
| `/_not-found` | Static | 1 |
| **Total** | | **1018** |

---

## Design

Inspirado na identidade visual do [Superteam BR](https://superteam.com.br/) e [Superteam](https://us.superteam.fun/):

- Fundo escuro `#1b231d`, tipografia `#f7eacb`
- Amarelo `#ffd23f` como cor de destaque
- Verde `#008c4c` para categorias
- Sem gradientes — tipografia e espaçamento fazem o trabalho
- Fonte Archivo Black para headings, Inter para corpo
