# Changelog — Solana Glossary Competition

Todas as mudancas notaveis do projeto serao documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.10.3] - 2026-04-05

### Corrigido — Deploy #3 (BrowserRouter basename)
- `No routes matched location "/solanabr-glossario/"` — React Router nao reconhecia o path base
- **Fix**: adicionado `basename={import.meta.env.VITE_BASE_PATH}` ao `<BrowserRouter>` em main.tsx
- CSP expandido para permitir `https://static.cloudflareinsights.com` (beacon injetado pela hospedagem)
- **Resultado**: SUCESSO — site live em https://aceleradora.eco.br/solanabr-glossario/

---

## [0.10.2] - 2026-04-05

### Corrigido — Deploy #2 (CSP eval)
- Tela branca em producao: `Content Security Policy blocks 'eval'`
- Causa: `protobufjs` (dependencia do wallet-adapter) usa `eval()` internamente
- **Fix**: `.htaccess` com header CSP permitindo `unsafe-eval` + `unsafe-inline`
- **Resultado**: PARCIAL — CSP resolvido mas rotas nao funcionavam (ver 0.10.3)

---

## [0.10.1] - 2026-04-05

### Corrigido — Deploy #1 (SDK no CI)
- GitHub Actions: `Cannot find module '@stbr/solana-glossary'`
- Causa: SDK usa `file:../..` (link local), CI nao tinha o SDK buildado
- **Fix**: workflow agora faz `npm install && npm run build` na raiz antes do app
- Adicionado `VITE_BASE_PATH` env var para deploy em subfolder
- **Resultado**: Build CI passou, deploy FTP OK, mas site tela branca (ver 0.10.2)

---

## [0.10.0] - 2026-04-05

### Adicionado (Sprint 8-9 — Tabuleiros Imersivos + Leaderboard + Polish)
- **3 tabuleiros com UX completamente distinta** (layout, interacao, forma):
  - **Normie (Neon Cockpit)**: layout 2 colunas, dado na sidebar, nos circulares com glow neon, font Space Grotesk
  - **Startup (Terminal)**: CLI verde monocromo, sem dado visual (texto `> execute roll()`), board 5 colunas vertical, player list como process table
  - **Timeline (Arcade)**: HUD fixo no bottom, dado pixel 60x60 na barra, board 8 colunas chunky, font Press Start 2P
- **3 backgrounds animados**: BoardBgNeon (grid cyan pulsante), BoardBgMatrix (chuva katakana), BoardBgPixel (estrelas pixel)
- **Leaderboard Jogo da Vida**: VidaResult submete scores (`vida-{tema}`), Leaderboard.tsx com toggle Escape/Vida
- **5 SFX novos**: diceRoll, move, event, bonus, trap (Web Audio API sintetizado)
- **Timer por turno**: host escolhe Relax (60s) / Normal (30s) / Speed (15s) no Lobby
- **Ejecao por inatividade**: 3 timeouts consecutivos encerram partida, jogador inativo excluido do ranking
- **Deteccao de desconexao**: poll fallback com +3s buffer para jogador offline

### Corrigido
- **Bugfix mute**: BGM agora respeita estado de mute ao iniciar (`audioManager.isMuted()` no `startBgm`)
- **Bugfix invite URL**: rota de convite agora inclui tema (`/vida/sala/:tema/:code`) — Player 2 nao cai mais no normie
- **Bugfix winner poll**: poll agora detecta `winner` (`!!remote.winner !== !!local.winner`) — ambos jogadores vao pra tela final
- **Bugfix modais dupla overlay**: removido wrapper extra em Startup/Timeline — modais ja tem overlay proprio

### Refatorado
- `VidaPlay.tsx` extraido: wrapper fino (55 linhas) + `GameBoard.tsx` dispatcher de logica
- 3 UIs independentes: `GameUiNormie.tsx`, `GameUiStartup.tsx`, `GameUiTimeline.tsx`
- 3 boards independentes: `BoardNormie.tsx`, `BoardStartup.tsx`, `BoardTimeline.tsx`
- `Board.tsx` agora e dispatcher que seleciona board por tema
- `themes.ts` expandido com `ThemeVisual` (paletas, spaceStyles, fontes, HUD accent)

### Verificado
- TypeScript: zero erros | Build: sucesso (1.37s)
- 15 arquivos novos/modificados, todos componentes independentes por tema

---

## [0.9.12] - 2026-04-05

### Corrigido — FIX DEFINITIVO (turn handoff)
- **Root cause 1**: poll Supabase rodava para TODOS os jogadores (inclusive o ativo), sobrescrevendo estados intermediarios locais com dados stale do Supabase — cancelava o roll no meio da animacao
- **Root cause 2**: `resolveSpace()` retornava `turnPhase: "resolve"` em casas normais/bonus/trap, mas `nextTurn()` exigia `turnPhase: "next"` — turno NUNCA avancava nessas casas (NO-OP silencioso)
- **Root cause 3**: 3 `setState` aninhados + 2 `setTimeout` criavam race conditions impossiveis de debugar
- **Fix turns.ts**: casas nao-interativas (normal/bonus/trap) agora retornam `turnPhase: "next"` — phase machine corrigida
- **Fix useVidaGame.ts**: reescrita completa com modelo limpo:
  - Jogador ativo: computa turno local, salva 1x, NAO faz poll
  - Jogadores esperando: poll a cada 1.5s, NAO salvam
  - Zero setState aninhados, 1 setTimeout flat para animacao
  - Guards `isMyTurn` em todas as acoes (roll/dismiss/answer)
- **Resultado**: SUCESSO — turnos alternando corretamente, eventos e desafios funcionando, testado ate turno 6+
- **Escala**: modelo funciona identicamente para 2..8 jogadores

---

## [0.9.11] - 2026-04-04

### Corrigido — TENTATIVA 8 (turn handoff)
- **Diagnostico**: 3 saves fire-and-forget por roll (moving→resolve→nextTurn) chegavam fora de ordem no Supabase
  — save intermediario sobrescrevia o save final, revertendo currentPlayerIndex
- **Fix 1**: Uma unica escrita por acao — roll salva SO apos nextTurn (casas normais) ou SO o resolve (evento/desafio)
- **Fix 2**: Poll com useRef em vez de state nos deps do useEffect — interval estavel, sem gaps durante animacao
- **Fix 3**: console.log em save/poll para debug via F12
- **Resultado**: SUPERADO por v0.9.12

---

## [0.9.10] - 2026-04-04

### Corrigido — TENTATIVA 7 (turn handoff)
- Removido save do estado inicial no useState (Player 2 sobrescrevia jogada do Player 1)
- **Resultado**: FALHOU — turno ainda nao passa para Player 2 apos primeira jogada

---

## [0.9.9] - 2026-04-04

### Corrigido — TENTATIVA 6 (turn handoff)
- Removido useEffect para save — cada acao (roll, dismiss, answer) salva direto dentro da funcao
- Auto-pass em casas normais (sem precisar clicar "Next")
- Removido botao "Next" manual
- **Resultado**: FALHOU no turno 4 e depois REGREDIU primeira passagem (tentativa 7 causou)

---

## [0.9.8] - 2026-04-04

### Corrigido — TENTATIVA 5 (turn handoff)
- Removido check `isMyTurn` do save effect — o bug era que `nextTurn()` muda currentPlayerIndex
  ANTES do save effect rodar, entao `isMyTurn` ja era false e o save era pulado
- Adicionado `initialRef` para pular primeiro render
- **Resultado**: PARCIAL — funcionou 3 turnos, falhou no 4o (race condition do useEffect + setTimeout)

---

## [0.9.7] - 2026-04-04

### Corrigido — TENTATIVA 4 (turn handoff)
- `isMyTurn` agora compara por wallet address (nao por nickname)
- Problema: se ambos jogadores tem nickname "Anon" (padrao), `isMyTurn` era true para ambos
- So o jogador ativo salva state no Supabase (`fromPollRef` para evitar re-save)
- **Resultado**: FALHOU — wallet fix correto mas save via useEffect continuou com race condition

---

## [0.9.6] - 2026-04-04

### Adicionado
- Board visual redesenhado: casas maiores (56px min), layout snake, bordas coloridas, glow
- Player pins grandes (28px) com inicial do nome e sombra neon
- HUD melhorado com pin + score destaque + turno
- Indicador "SUA VEZ!" piscando em amarelo / "Aguardando..."
- BGM integrado ao Jogo da Vida (tema defi)
- SFX: tick ao rolar dado, correct/wrong nos quiz

### Corrigido — TENTATIVA 3 (turn handoff)
- `isMyTurn` comparava por nickname (bugado) — trocado por `myName` do perfil
- **Resultado**: FALHOU — nickname podia ser igual entre jogadores ("Anon")

---

## [0.9.5] - 2026-04-04

### Corrigido — TENTATIVA 2 (turn handoff + lobby)
- Host agora chama `updateRoomStatus(code, "playing")` ao clicar "Iniciar Partida"
- Poll do Lobby detecta `status === "playing"` e auto-inicia jogo para todos
- **Resultado**: SUCESSO para lobby/entrada — Player 2 entra no jogo quando host inicia
- **Resultado**: FALHOU para turnos — Player 2 nao recebia controle apos Player 1 jogar

---

## [0.9.4] - 2026-04-04

### Adicionado
- console.error logging em todas as operacoes Supabase (rooms.ts)
- Mensagem "(ver console F12)" no erro do Lobby para facilitar debug
- **Resultado**: Revelou que Supabase funciona (HTTP 200), join insere player corretamente

---

## [0.9.3] - 2026-04-04

### Corrigido — TENTATIVA 1 (turn handoff)
- Game state sync via Supabase (saveGameState/loadGameState em multiplayer_rooms.game_state)
- Turn lock: dado desabilitado quando nao e minha vez
- Definicao sem corte nos modais (removido truncamento 120/150 chars, adicionado scroll)
- Adicionado `game_state JSONB` na migration SQL
- **Resultado**: FALHOU — Player 2 nunca recebia turno (estado nao salvava corretamente)

---

## [0.9.2] - 2026-04-04

### Modificado
- rooms.ts reescrito: Supabase como storage primario (nao mais localStorage)
- Lobby.tsx: funcoes agora async (createRoom, joinRoom retornam Promises)
- Criado `docs/supabase-migration.sql` com schema completo
- **Resultado**: SUCESSO — salas funcionam cross-browser via Supabase

---

## [0.9.1] - 2026-04-04

### Adicionado
- Sistema de salas multiplayer online (rooms.ts, Lobby.tsx)
- Criar sala com codigo 6 chars, compartilhar link, entrar por codigo
- Player data vem do perfil da wallet (sem input manual de nome)
- Lobby com poll para atualizar lista de jogadores
- Rota `/vida/sala/:code` para convite direto
- Removido PlayerSetup local — jogo 100% online
- **Problema**: usava localStorage (nao funcionava cross-browser)

---

## [0.9.0] - 2026-04-04

### Adicionado (Sprint 6 — Jogo da Vida: Engine Core)
- **Engine completo** em `vida/engine/`: types, board, dice, turns, events, challenges, themes
  - Tabuleiro modular com ~50 casas (start, normal, event, challenge, bonus, trap, finish)
  - Dado virtual 1-6 com animacao de rolagem (CSS transform)
  - Maquina de estado de turnos: roll → moving → resolve → next
  - Cartas de evento com termos do SDK (avanca, recua, bonus, penalidade)
  - Quiz em casas de desafio: definicao → 4 opcoes, +150/-50 pts
  - 3 temas com categorias SDK distintas (normie/startup/timeline)
- **Componentes UI** em `vida/components/`:
  - Board (grid 10x5), Dice (visual com pontos), PlayerSetup (2-8 jogadores)
  - EventCardModal (carta com efeito), ChallengeModal (quiz 4 opcoes)
- **Paginas**: VidaPlay (gameplay), VidaResult (ranking final + confetti)
- **Hook**: useVidaGame — gerencia estado completo do jogo
- Rotas: `/vida/jogar/:tema`, `/vida/resultado/:tema`
- VidaHome: cards dos 3 tabuleiros agora linkam ao jogo (nao mais "EM BREVE")
- i18n: 25+ chaves vida.* (pt-BR + es): dado, jogador, turnos, efeitos, desafios
- **Footer com links**: Superteam Brazil Solana + Tokenfy.me em todas as paginas
- **Portal retro Mega Man X**: CRT scanlines, Press Start 2P font, star field, stage select, HIGH SCORES arcade

### Modificado
- `Portal.tsx` — reescrito com estetica retro real (pixel font, neon glow, vignette CRT)
- `App.tsx` — 3 novas rotas para Jogo da Vida
- `VidaHome.tsx` — tabuleiros clicaveis (Link ao inves de button disabled)
- `index.html` — Google Fonts: Press Start 2P + Orbitron + Space Grotesk
- Rodapes: componente Footer.tsx com links para linktr.ee/superteamBR e tokenfy.me

### Verificado
- TypeScript: zero erros | Build: sucesso (1.36s)
- 15 arquivos novos para Jogo da Vida, todos ≤200 linhas (max 175)
- Total: 1284 linhas de engine + UI para o Jogo da Vida

---

## [0.8.2] - 2026-04-04

### Adicionado (Portal retro-Solana + NFT Avatar)
- `pages/Portal.tsx` — pagina de entrada estilo retro Sonic/Mega Man X
  - Titulo "SOLANA GLOSSARY" com glow neon e fonte Orbitron
  - Scanlines e grid neon de fundo (estetica retro)
  - Dois cards: Escape Room (roxo/cyan) e Jogo da Vida (verde/laranja)
  - Mini leaderboard top 5 jogadores
  - "PRESS START" — referencia retro
- `lib/nft.ts` — busca NFTs da wallet via DAS API (getAssetsByOwner)
  - Funciona com Helius, Shyft e outros RPCs DAS-compativeis
  - Fallback graceful: se RPC nao suporta, retorna array vazio
- NFT thumbnails como opcoes de avatar (acima dos emojis)
- Rota `/escape` para Home do Escape Room, `/vida` placeholder do Jogo da Vida
- i18n: 10 chaves portal.* (pt-BR + es)

### Modificado
- `App.tsx` — nova rota `/` (Portal), Home movida para `/escape`
- `hooks/useProfile.ts` — integra fetchNftAvatars() ao conectar wallet
- `components/WalletButton.tsx` — exibe NFTs como avatar se disponiveis
- `pages/Home.tsx` — botao voltar ativo (volta para Portal)

### Verificado
- TypeScript: zero erros | Build: sucesso (1.26s) | Todos arquivos ≤200 linhas

---

## [0.8.0] - 2026-04-04

### Adicionado (Sprint 10 — Wallet + Perfil + Leaderboard)
- `components/WalletButton.tsx` — botao de conexao wallet real (Phantom/Solflare)
  - Dropdown: avatar + nickname, copiar endereco, editar perfil, desconectar
  - Edicao inline de nickname (max 16 chars) e avatar (10 emojis tematicos)
- `hooks/useProfile.ts` — hook de perfil com localStorage + Supabase opcional
  - Auto-cria perfil no primeiro connect (nickname "Anon", avatar aleatorio)
  - Sync para Supabase em melhor esforco (funciona sem backend)
- `lib/leaderboard.ts` — sistema de scores com localStorage + Supabase opcional
  - submitScore(), getTopScores(), getUserScores(), getBestScore(), submitGameScore()
  - Ranking automatico por pontuacao decrescente
- `pages/Leaderboard.tsx` — pagina de ranking completa
  - Tabs: Geral / Genesis / DeFi / Lab
  - Tabela: rank, avatar, nickname, score, tema, nivel
  - Destaque do jogador atual (highlight ciano)
  - Medalhas top 3 (ouro, prata, bronze)
- Score auto-submetido ao vencer qualquer nivel
- Indicador de posicao no ranking + "Novo recorde!" na tela de resultado
- Link "Ranking" adicionado na tela de resultado
- i18n: 15 novas chaves em wallet.*, profile.*, leaderboard.* (pt-BR + es)

### Modificado
- `components/Layout.tsx` — botao placeholder substituido por WalletButton real
- `pages/GameResult.tsx` — integra submitGameScore(), exibe rank e recorde
- `locales/pt-BR.json` — +15 chaves (wallet, profile, leaderboard)
- `locales/es.json` — +15 chaves (wallet, profile, leaderboard)

### Verificado
- TypeScript: zero erros | Build: sucesso (1.42s) | Todos arquivos ≤200 linhas

---

## [0.7.3] - 2026-04-04

### Adicionado (Sprint 5 — BGM sintetizado)
- `lib/bgm.ts` — musica ambiente sintetizada via Web Audio API, zero mp3
  - Genesis: square wave, C minor, grave/misterioso (loop 5s)
  - DeFi: sawtooth wave, A minor pentatonic, ritmico/metalico (loop 3.5s)
  - Lab: triangle wave, E minor, rapido/eletronico (loop 2.2s)
- BGM inicia automaticamente ao entrar no gameplay
- BGM para com fade-out ao concluir ou perder
- Toggle mute agora controla SFX + BGM juntos

### Modificado
- `lib/audio.ts` — exporta `getAudioContext()` para compartilhar contexto com BGM
- `pages/GamePlay.tsx` — integra `startBgm()`/`stopBgm()` no ciclo de vida
- `components/Layout.tsx` — toggle mute chama `muteBgm()` em paralelo

### Verificado
- TypeScript: zero erros | Build: sucesso (1.36s) | Todos arquivos ≤200 linhas

---

## [0.7.2] - 2026-04-04

### Adicionado
- 1001 definicoes traduzidas para espanhol (es) no SDK (`data/i18n/es.json`)
  - Genesis: 272 termos | DeFi: 412 termos | Lab: 317 termos
- `scripts/merge-translations-es.js` — ferramenta de merge para patches ES

### Verificado
- TypeScript: zero erros | Build: sucesso (1.93s)

---

## [0.7.1] - 2026-04-04

### Corrigido
- Definicoes apareciam em ingles mesmo com pt.json traduzido — causa raiz: SDK usa `require()` dinamico que nao funciona no Vite/browser. Substituido por imports estaticos diretos dos JSONs de locale (`ptOverrides`, `esOverrides`) com funcao `applyLocale()` propria.

---

## [0.7.0] - 2026-04-04

### Adicionado (Sprint 5b — Traducao + Identidade Visual)
- 979/1001 definicoes traduzidas para pt-BR no SDK (`data/i18n/pt.json`)
  - Genesis: core-protocol (86), blockchain-general (84), network (58), infrastructure (44)
  - DeFi: token-ecosystem (59), defi (135), web3 (80), solana-ecosystem (138)
  - Lab: programming-model (69), dev-tools (64), programming-fundamentals (47), security (48), zk-compression (34), ai-ml (55)
- Identidade visual por tema via CSS:
  - Genesis: roxo/violeta com grid de circuitos
  - DeFi: verde/teal com estetica de cofre
  - Lab: azul/laranja com linhas de terminal
- Sons distintos por tema (Web Audio API):
  - Genesis: square wave, oitava grave (digital)
  - DeFi: sawtooth wave, oitava media (metalico)
  - Lab: triangle wave, oitava aguda (eletronico)
- `scripts/merge-translations.js` — ferramenta de merge de patches de traducao
- PuzzleShell e todos 12 puzzles aceitam prop `theme` para estilizacao

### Modificado
- `data/i18n/pt.json` — 822 definicoes traduzidas de EN para PT-BR (de 182 para 979)
- `lib/audio.ts` — playSfx() agora aceita tema, sons variam por tema
- `index.css` — 3 classes CSS de tema (puzzle-shell--genesis/defi/lab)
- `engine/puzzleTypes.ts` — theme? adicionado a PuzzleBaseProps

### Verificado
- TypeScript: zero erros | Build: sucesso (2.76s) | 98% cobertura traducao

---

## [0.6.1] - 2026-04-04

### Corrigido
- Termos em ingles em TODOS os puzzles — locale "pt-BR" nao era reconhecido pelo SDK (espera "pt"). Adicionado `normalizeLocale()` em glossary.ts
- Audio sem som — AudioContext precisa ser inicializado em user gesture. Adicionado `init()` no primeiro click via Layout

### Verificado
- TypeScript: zero erros | Build: sucesso (1.15s)

---

## [0.6.0] - 2026-04-04

### Adicionado (Escape Room — Sprint 5: Polish)
- `lib/audio.ts` — reescrito com Web Audio API: SFX 8-bit sintetizados (correct, wrong, tick, hint, unlock), zero dependencia de mp3
- SFX integrados ao gameplay: acerto/erro em puzzles, tick a cada 5s quando timer <30s, fanfarra na vitoria, buzz na derrota
- SFX no HintsPanel: som ao revelar dica
- Responsividade mobile: CategorySort e ConnectionWeb grids adaptativos (1 col mobile → 3 cols desktop)
- CSS: scroll suave, safe-area para notch, hide-scrollbar utilitario, overscroll-behavior

### Corrigido
- HintsPanel: strings "Usar Dica", "Sem dicas restantes", "Penalidade" hardcoded → movidas para i18n (pt-BR + es)
- i18n: novas chaves `hints.*` em pt-BR e es

### Verificado
- TypeScript: zero erros | Build: sucesso (1.15s) | Todos arquivos ≤200 linhas

---

## [0.5.1] - 2026-04-04

### Corrigido (Escape Room — 8 bugs criticos)
- Termos apareciam em ingles — GamePlay agora passa `i18n.language` ao SDK
- Shuffle quebrado (resposta sempre letra D) — seed normalizado para evitar overflow `MAX_SAFE_INTEGER`
- Stats zeradas na tela de resultado — campos alinhados: `correctCount`, `wrongCount`, `hintsUsed`, `won`
- "Tempo esgotado" aparecia ao vencer — corrigido para exibir "Voce escapou!" quando `phase=won`
- Sem curva de dificuldade — termos ordenados por tamanho de definicao (menor = mais facil)
- Pagina /temas duplicava a Home — removida, rota eliminada do App.tsx
- Sem progressao de niveis — novo `lib/progression.ts` com localStorage
- Strings hardcoded no GameResult — movidas para i18n (pt-BR + es)

### Adicionado
- `lib/progression.ts` — desbloqueio progressivo de niveis (Surface → Consensus)
- `components/ThemeProgressCard.tsx` — card de tema com barra de progresso
- `components/Confetti.tsx` — extraido do GameResult para respeitar limite 200 linhas
- i18n: chaves `home.*` e `result.*` em pt-BR e es

### Removido
- Rota `/temas` e import de ThemeSelect no App.tsx

### Verificado
- TypeScript: zero erros | Build: sucesso | Todos arquivos ≤200 linhas

---

## [0.5.0] - 2026-04-04

### Adicionado (Escape Room — Sprint 4: 12 Puzzles)
- `engine/puzzleTypes.ts` — interfaces PuzzleResult, PerTermPuzzleProps, BatchPuzzleProps
- `engine/puzzleRegistry.ts` — registro lazy dos 12 puzzles com mapeamento tema:nivel
- `puzzles/shared/PuzzleShell.tsx` — wrapper visual glassmorphism com AnimatePresence
- `puzzles/shared/textUtils.ts` — Levenshtein, fuzzyMatch, maskTerm, cipherDefinition
- `puzzles/MultipleChoice.tsx` — definicao → 4 opcoes (Genesis/Surface)
- `puzzles/TrueFalse.tsx` — termo + definicao real/trocada (Genesis/Confirmation)
- `puzzles/FillBlank.tsx` — definicao mascarada, digitar termo (Genesis/Finality)
- `puzzles/ConnectionWeb.tsx` — conectar termos related em grid (Genesis/Consensus)
- `puzzles/TermMatcher.tsx` — parear termos com definicoes em colunas (DeFi/Surface)
- `puzzles/CategorySort.tsx` — classificar termos em buckets de categoria (DeFi/Confirmation)
- `puzzles/DefinitionBuilder.tsx` — montar definicao com chips ordenados (DeFi/Finality)
- `puzzles/OddOneOut.tsx` — identificar intruso de outra categoria (DeFi/Consensus)
- `puzzles/AliasResolver.tsx` — alias/abreviacao → termo correto (Lab/Surface)
- `puzzles/RelatedTerms.tsx` — multi-select termos relacionados (Lab/Confirmation)
- `puzzles/CodeBreaker.tsx` — definicao cifrada estilo terminal (Lab/Finality)
- `puzzles/TermTimeline.tsx` — reordenar por dependencia conceitual (Lab/Consensus)
- i18n: 48 chaves de puzzle em pt-BR + es

### Modificado
- `lib/glossary.ts` — PuzzleTerm estendido com `related[]` e `aliases[]`, `shuffle` exportada
- `pages/GamePlay.tsx` — refatorado: puzzle registry + dois modos (per-term/batch)
- `components/GameHud.tsx` — suporte a `puzzleMode` batch (esconde dots de progresso)
- `CLAUDE.md` — adicionada convencao de commit obrigatoria

### Verificado
- TypeScript: zero erros | Build: sucesso (1.47s) | 22 arquivos novos ≤200 linhas
- 12 puzzles lazy-loaded como chunks separados

---

## [0.4.0] - 2026-04-04

### Adicionado (Escape Room — Sprint 3: Engine Core)
- `engine/themes.ts` — configuracao modular: 3 temas, 4 niveis, categorias SDK
- `hooks/useTimer.ts` — contagem regressiva com start/pause/reset
- `hooks/useHints.ts` — dicas progressivas com penalidade por nivel
- `hooks/useScore.ts` — pontuacao com bonus de tempo e perfect clear (+500)
- `lib/glossary.ts` — integracao SDK: selectPuzzleTerms(), generateHint()
- `components/GameHud.tsx` — HUD com timer colorido, score, progresso
- `components/PuzzleCard.tsx` — quiz 4 opcoes com feedback visual
- `components/HintsPanel.tsx` — painel de dicas com custo e bloqueio
- `pages/ThemeSelect.tsx` — selecao de tema com contagem de termos SDK
- `pages/GamePlay.tsx` — gameplay funcional: timer, quiz, dicas, pontuacao
- `pages/GameResult.tsx` — resultado: vitoria/derrota + stats detalhados

### Verificado
- TypeScript: zero erros | Build: sucesso (1.24s) | 22 arquivos ≤200 linhas

---

## [0.3.0] - 2026-04-04

### Adicionado
- `examples/escape-room-solana/` — app Vite independente (PR #1)
  - 16 arquivos fonte, todas ≤200 linhas
  - Paginas: Home (landing), ThemeSelect, GamePlay, Leaderboard
  - Componentes: Layout, AnimatedBlobs, ThemeCard
  - Libs: supabase.ts, wallet.tsx, audio.ts, i18n.ts
  - i18n: pt-BR.json + es.json
  - Build de producao: sucesso
- `examples/jogo-da-vida-solana/` — app Vite independente (PR #2)
  - 17 arquivos fonte, todas ≤200 linhas
  - Paginas: Home (landing), BoardSelect, Lobby, GamePlay, Leaderboard
  - Componentes: Layout, NeonGrid (3 variantes), BoardCard (3 estilos)
  - Libs: supabase.ts, wallet.tsx, audio.ts, i18n.ts
  - i18n: pt-BR.json + es.json
  - Build de producao: sucesso
- `docs/SUPABASE-SCHEMA.md` — schema completo (profiles, leaderboards, rooms, RLS, Realtime)
- Dependencias instaladas: wallet-adapter, supabase-js, react-i18next, framer-motion, howler

### Decidido
- Arquitetura de PRs: cada jogo e um app independente em examples/
- Ambos compartilham mesmo projeto Supabase (auth unificado)
- Landing page do deploy fica fora dos PRs (HTML simples no servidor)
- Leaderboard geral via view SQL que soma pontos dos dois jogos

### Verificado
- TypeScript: zero erros em ambos os projetos
- Build producao: sucesso em ambos (escape-room 1.31s, jogo-da-vida 1.17s)
- 33 arquivos fonte totais, todos ≤200 linhas com cabecalho padrao

---

## [0.2.0] - 2026-04-04

### Adicionado
- `docs/SPRINTS.md` — planejamento completo Sprint 0-12 com versionamento semantico
- `prototipo-visual/` — scaffold Vite + React 18 + TypeScript + Tailwind CSS v4
- 4 paginas de prototipo visual com estilos profundamente distintos:
  - `EscapeGenesis.tsx` — Solana fluido/organico (Space Grotesk, glassmorphism, blobs)
  - `EscapeDefi.tsx` — Solana geometrico/angular (Orbitron, hexagonos, scanlines)
  - `VidaNormie.tsx` — Futurista/Neon (Share Tech Mono, glows ciano/violeta)
  - `VidaStartup.tsx` — Matrix (monoespaçado verde, chuva de caracteres, terminal)
- `Hub.tsx` — pagina hub de selecao dos 4 prototipos
- Componentes extraidos: `IconsSvg.tsx`, `GenesisBlobs.tsx`, `CasaTabuleiro.tsx`
- Integracao local do SDK `@stbr/solana-glossary` (1001 termos confirmados)
- Dependencias: react-router-dom, framer-motion, tailwindcss, @tailwindcss/vite

### Decidido (20 decisoes no total — questionario 100% respondido)
- Stack: Vite + React 18 + TypeScript + Tailwind CSS
- Escape Room: 3 temas × 4 niveis = 12 desafios, 12 formatos de puzzle distintos
- Temas: "O Bloco Genesis" (fundamentos), "O Cofre DeFi" (financeiro), "O Laboratorio do Dev" (construcao)
- Dificuldade por metafora Solana: Surface → Confirmation → Finality → Consensus
- Jogo da Vida: 3 tabuleiros independentes × ~50 casas, 2-8 jogadores online
- Tabuleiros: "De Normie a Validator" (neon), "Startup Solana" (matrix), "A Timeline" (pixel art)
- Multiplayer real via Supabase Realtime (link/QR code convite)
- Login por wallet Solana + nickname/avatar, leaderboard por jogo + geral
- i18n obrigatorio (pt-BR + es), audio 8-bit/16-bit, estetica Solana-branded
- Deploy em aceleradora.eco.br via cPanel
- Conteudo curado manualmente com 3x variacoes para sensacao de aleatoriedade

### Configurado
- Fork: github.com/lglucas/solana-glossary
- Branches: feat/escape-room-solana, feat/jogo-da-vida-solana
- Remotes: origin (fork) + upstream (solanabr/solana-glossary)
- SDK buildado localmente para linkagem

### Verificado
- Build de producao: zero erros, zero warnings
- TypeScript: zero erros
- Todos os arquivos ≤200 linhas (regra de ouro respeitada)
- 11 arquivos fonte, 1075 linhas totais

---

## [0.1.0] - 2026-04-03

### Adicionado
- Estrutura inicial do projeto multi-game para competicao Superteam Brazil
- `CLAUDE.md` com regras de desenvolvimento adaptadas do instrucoes-master
- Pasta `projeto-1-escape-room/` com PLANNING.md inicial
- Pasta `projeto-2-jogo-da-vida/` com PLANNING.md inicial
- 6 skills Claude Code instaladas em `.claude/skills/`:
  - brand-guidelines, frontend-design, pptx, skill-creator, theme-factory, ui-ux-pro-max
- `docs/questionario-projetos.md` — questionario estrategico para definir escopo de cada jogo
- `docs/decisions.md` — registro de 9 decisoes tomadas na sessao de planejamento
- `docs/codigofonte/` — codigos-fonte de inspiracao (escaperoom.html + jogodavida.html)
- Memorias do projeto salvas (competicao + perfil do usuario)

### Analisado
- PDF da competicao "Bring back the Solana Glossary" (regras, premios, criterios)
- SDK `@stbr/solana-glossary` (1001 termos, 14 categorias, API reference)
- Codigos-fonte existentes (Operation Cypherpunk 1413 linhas + Jogo da Vida 999 linhas)
- Metodologia Experience Learning da Perestroika (4 pilares)

### Decidido
- 2 projetos: Escape Room + Jogo da Vida (refatorados com tema Solana)
- PRs separados para maximizar bonus na competicao
- Planejamento completo antes da execucao
- Stack tecnica a definir apos questionario
