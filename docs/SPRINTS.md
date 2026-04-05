# Planejamento de Sprints — Solana Glossary Competition

> Autor: Lucas Galvao | Projeto: Solana Glossary Games
> Versionamento: Semantic Versioning (MAJOR.MINOR.PATCH)
> Cada sprint gera um bump de versao no CHANGELOG.md

---

## Sprint 0 — Fundacao (v0.1.0)
**Objetivo:** Planejamento completo, fork, estrutura de repositorio
- [x] Fork do repo solanabr/solana-glossary
- [x] Configuracao de remotes (origin + upstream)
- [x] Criacao de branches (feat/escape-room-solana, feat/jogo-da-vida-solana)
- [x] Questionario estrategico preenchido (20 decisoes documentadas)
- [x] Definicao dos 3 temas do Escape Room e 3 tabuleiros do Jogo da Vida
- [x] Definicao de stack: Vite + React 18 + TypeScript + Tailwind CSS
- [x] Documento de decisoes completo (docs/decisions.md)
- [x] Regras de desenvolvimento estabelecidas (CLAUDE.md)

## Sprint 1 — Prototipagem Visual (v0.2.0) ✓
**Objetivo:** Prototipos de UI para validacao antes de implementar
- [x] Scaffold Vite + React + TS + Tailwind (prototipo-visual/)
- [x] Instalacao do SDK @stbr/solana-glossary (linkado localmente)
- [x] 4 paginas de prototipo (escape-genesis, escape-defi, vida-normie, vida-startup)
- [x] Teste de tipografia, paletas, layouts, animacoes, componentes
- [x] Build e lint passando sem erros
- [x] Avaliacao do Lucas: todos aprovados, Matrix precisa ajuste no tabuleiro

## Sprint 2 — Arquitetura Base (v0.3.0) ✓
**Objetivo:** Estrutura compartilhada entre os dois jogos
- [x] Landing pages independentes por projeto
- [x] Setup Supabase (schema documentado, .env.local configurado)
- [x] Integracao wallet-adapter-react (Phantom + Solflare)
- [x] Setup react-i18next com pt-BR e es
- [x] Componentes base (layout, navbar)
- [x] Setup Howler.js (sistema de audio)
- [ ] Sistema de login wallet → nickname + avatar (Sprint 10)

## Sprint 3 — Escape Room: Engine Core (v0.4.0) ✓
**Objetivo:** Motor do jogo Escape Room funcionando
- [x] Sistema de temas e niveis (modular) — engine/themes.ts
- [x] Timer com contagem regressiva — hooks/useTimer.ts
- [x] Sistema de dicas (Surface → Consensus) — hooks/useHints.ts
- [x] Sistema de pontuacao — hooks/useScore.ts
- [x] Tela de resultado (vitoria/derrota) — pages/GameResult.tsx
- [x] Integracao SDK: getTermsByCategory(), getLocalizedTerms() — lib/glossary.ts
- [x] Pagina de selecao de temas — pages/ThemeSelect.tsx
- [x] Gameplay funcional (quiz multiple-choice) — pages/GamePlay.tsx

## Sprint 4 — Escape Room: 12 Puzzles (v0.5.0) ✓
**Objetivo:** Todos os 12 formatos de puzzle implementados
- [x] Tema 1 "O Bloco Genesis" — MultipleChoice, TrueFalse, FillBlank, ConnectionWeb
- [x] Tema 2 "O Cofre DeFi" — TermMatcher, CategorySort, DefinitionBuilder, OddOneOut
- [x] Tema 3 "O Laboratorio do Dev" — AliasResolver, RelatedTerms, CodeBreaker, TermTimeline
- [x] Arquitetura: PuzzleRegistry, PuzzleTypes, PuzzleShell, textUtils
- [x] GamePlay refatorado: per-term (8 puzzles) + batch (4 puzzles)
- [x] i18n de todo conteudo (pt-BR + es) — 48 chaves de puzzle
- [x] Build: zero erros TS, Vite 1.47s, 22 arquivos ≤200 linhas
- [x] **Hotfix v0.5.1**: 8 bugs criticos corrigidos (locale pt-BR, shuffle, stats, progressao, pagina duplicada)

## Sprint 5 — Escape Room: Polish (v0.6.0) ✓
**Objetivo:** Acabamento profissional do Escape Room
- [x] Audio: SFX 8-bit sintetizado via Web Audio API (sem mp3/Howler), 5 sons distintos
- [x] Efeitos sonoros integrados: acerto, erro, tick timer, dica, vitoria/derrota
- [x] Animacoes Framer Motion ja presentes desde Sprint 3-4 (transicoes, puzzles, feedback)
- [x] Estetica Solana-branded: glassmorphism, gradientes, Orbitron, blobs animados
- [x] Responsividade: grids adaptativos, safe-area, scroll suave
- [x] HintsPanel: i18n completo (removido hardcoded)
- [x] Musica BGM por tema — sintetizado via Web Audio API (3 loops distintos)
- [x] **Hotfix v0.6.1**: locale pt-BR→pt normalizado para SDK, audio init em user gesture

## Sprint 5b — Traducao + Identidade Visual (v0.7.0)
**Objetivo:** Conteudo 100% pt-BR, cada tema com identidade propria
- [x] Traduzir definicoes pt-BR: Genesis (272 termos) — 100%
- [x] Traduzir definicoes pt-BR: DeFi (412 termos) — 100%
- [x] Traduzir definicoes pt-BR: Lab (317 termos) — 100%
- [x] Traduzir definicoes es: todas as 14 categorias (1001 termos) — 100%
- [x] Identidade visual por tema: Genesis (roxo/circuitos), DeFi (verde/cofre), Lab (azul-laranja/terminal)
- [x] Sons distintos por tema: 3 paletas sonoras (square/sawtooth/triangle, oitavas diferentes)
- [x] Todos 12 puzzles recebem prop theme e aplicam estilo visual do tema
- [ ] Testes de usabilidade em todos os 12 puzzles

## Sprint 6 — Jogo da Vida: Engine Core (v0.9.0) ✓
**Objetivo:** Motor do Jogo da Vida funcionando
- [x] Sistema de tabuleiro (~50 casas) modular — board.ts, types.ts
- [x] Dado virtual com animacao — dice.ts, Dice.tsx
- [x] Sistema de turnos (2-8 jogadores) — turns.ts, useVidaGame.ts
- [x] Cartas de evento com termos do SDK — events.ts, EventCardModal.tsx
- [x] Mini-desafios em casas especiais — challenges.ts, ChallengeModal.tsx
- [x] Quiz rapido (definicao → 4 opcoes) — ChallengeModal.tsx
- [x] Integracao SDK: getTermsByCategory() + locale overrides

## Sprint 7 — Jogo da Vida: Multiplayer Online (v0.9.12) ✓
**Objetivo:** Multiplayer via internet funcionando
- [x] Supabase Realtime: criacao de sala — rooms.ts, Lobby.tsx
- [x] Geracao de link/codigo de convite — getInviteUrl(), codigo 6 chars
- [x] Sincronizacao de estado entre jogadores — saveGameState/loadGameState poll 1.5s
- [x] Coordenacao de turnos em tempo real — modelo ativo-salva / passivo-poll
- [x] Tratamento de desconexao — timer por turno (15/30/60s), 3 timeouts = ejecao
- [x] Lobby de espera pre-jogo — Lobby.tsx com auto-start quando host inicia

## Sprint 8 — Jogo da Vida: 3 Tabuleiros (v0.10.0) ✓
**Objetivo:** Os 3 tabuleiros completos com conteudo e UX distinta
- [x] Tabuleiro 1 "De Normie a Validator" — Neon Cockpit: 2 colunas, nos circulares, glow
- [x] Tabuleiro 2 "Startup Solana" — Terminal CLI: 5 colunas vertical, texto-only, verde monocromo
- [x] Tabuleiro 3 "A Timeline" — Arcade 8-bit: HUD bottom, 8 colunas chunky, pixel font
- [x] Conteudo curado por tabuleiro — eventos/desafios usam categorias SDK distintas por tema
- [x] i18n: pt-BR + es completo (leaderboard, vida, boards)

## Sprint 9 — Jogo da Vida: Polish (v0.10.0) ✓
**Objetivo:** Acabamento profissional do Jogo da Vida
- [x] 3 backgrounds animados (neon grid, matrix rain, pixel stars)
- [x] 5 SFX novos: diceRoll, move, event, bonus, trap (Web Audio API)
- [x] 3 estilos visuais imersivamente distintos (layout, interacao, forma)
- [x] Leaderboard integrado: submit score + toggle Escape/Vida
- [x] Bugfixes: mute, invite URL, winner poll, dupla overlay modais
- [ ] Responsividade mobile (parcial)
- [ ] Testes de usabilidade finais

## Sprint 10 — Leaderboard e Integracao (v0.8.0) ✓
**Objetivo:** Sistema de ranking e integracao final
- [x] Conexao wallet real (Phantom + Solflare) com WalletButton
- [x] Perfil do jogador (nickname, avatar emoji, localStorage + Supabase)
- [x] Leaderboard por tema (Geral / Genesis / DeFi / Lab)
- [x] Score auto-submetido ao vencer (rank + flag novo recorde)
- [x] i18n: wallet, profile, leaderboard (pt-BR + es)
- [ ] Landing page final com navegacao entre jogos (Sprint 12)
- [ ] Testes end-to-end (Sprint 11)

## Sprint 11 — Deploy e QA (v0.12.0)
**Objetivo:** Deploy em producao e garantia de qualidade
- [ ] Build otimizado (Vite production)
- [ ] Deploy no aceleradora.eco.br via cPanel
- [ ] Testes em producao (mobile + desktop + wallets)
- [ ] Correcao de bugs encontrados
- [ ] Performance audit (Lighthouse)
- [ ] SSL/HTTPS verificado

## Sprint 12 — Submissao e Documentacao Final (v1.0.0)
**Objetivo:** PRs prontos, documentacao completa, submissao na competicao
- [ ] PR #1: feat/escape-room-solana → solanabr/solana-glossary
- [ ] PR #2: feat/jogo-da-vida-solana → solanabr/solana-glossary
- [ ] README.md por projeto (descricao, screenshots, setup, demo link)
- [ ] Deep dive writeup (bonus da competicao)
- [ ] Video walkthrough (bonus da competicao)
- [ ] Submissao no Superteam Earn com links dos PRs
- [ ] Post no Twitter mencionando @superaborasolana

---

## Resumo de Versoes

| Sprint | Versao | Marco |
|--------|--------|-------|
| 0 | v0.1.0 | Planejamento completo |
| 1 | v0.2.0 | Prototipos visuais |
| 2 | v0.3.0 | Arquitetura base + auth |
| 3 | v0.4.0 | Escape Room engine |
| 4 | v0.5.0 | 12 puzzles implementados |
| 5 | v0.6.0 | Escape Room polido |
| 5b | v0.7.0 | Traducao pt-BR + identidade visual |
| 6 | v0.8.0 | Jogo da Vida engine |
| 7 | v0.9.0 | Multiplayer online |
| 8 | v0.9.0 | 3 tabuleiros completos |
| 9 | v0.10.0 | Jogo da Vida polido |
| 10 | v0.8.0 | Wallet + Perfil + Leaderboard |
| 11 | v0.12.0 | Deploy + QA |
| 12 | v1.0.0 | Submissao final |
