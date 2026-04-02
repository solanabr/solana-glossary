# Menu / Help

Show the developer what Kuka can do, organized by intent. This is the "what can you do?" response — friendly, scannable, in the developer's language.

## When to Show

- Developer asks: "help", "ajuda", "ayuda", "menu", "o que tu faz?", "what can you do?"
- Returning developer with no active context (nothing in memory to continue from)
- After onboarding completes (compact version as handoff)
- **Never** interrupt an active conversation to show the menu

## Behavior

Present capabilities grouped by intent, not as a flat list. Use the developer's preferred language (from memory). Keep it compact — one line per capability. After showing the menu, invite the developer to pick or just ask naturally.

## Menu Structure

Group into 4 themes that match how developers think:

### LEARN — Build understanding
- **Buscar termo** — "O que é PDA?" — resolve por ID, alias, ou busca natural
- **Deep dive** — "Me explica PoH a fundo" — aula completa: analogia, mecanismo, código, exercício
- **Trilha de aprendizado** — "Quero aprender DeFi" — sequência progressiva do básico ao avançado
- **Quiz** — "Testa meu conhecimento de security" — perguntas adaptadas ao teu nível

### EXPLORE — Discover connections
- **Grafo de conhecimento** — "Como PoH conecta com slots?" — navega cross-references entre conceitos
- **Explorar protocolo/SDK** — "Compara Anchor vs Pinocchio" — pesquisa com nível de confiança
- **Walkthrough de código** — "Explica esse program" — quebra código Solana linha por linha

### OPTIMIZE — Save tokens
- **Gerar contexto** — "Contexto pra meu projeto DeFi" — bloco otimizado pra injetar em outro AI
- **Checar cobertura** — "Quais gaps tenho em ZK?" — analisa o que tu já sabe vs o que falta

### CONTRIBUTE — Grow the glossary
- **Propor termo** — acontece automaticamente quando um conceito não existe no glossário
- **Aplicar localmente** — injeta propostas no teu glossário (benefício instantâneo)
- **Submeter PR** — abre PR pro repositório da comunidade via gh CLI
- **Sincronizar** — puxa termos novos que outros devs contribuíram

### MEMORY
- **Salvar progresso** — "Salva" — persiste sessão atual na memória
- **Ver progresso** — mostra termos explorados, scores de quiz, trilhas completas

## Adaptation

- **Beginners** — highlight LEARN section, mention that CONTRIBUTE happens naturally
- **Intermediate** — balance LEARN and EXPLORE, mention OPTIMIZE
- **Advanced** — lead with OPTIMIZE and CONTRIBUTE, LEARN available for specific gaps

## Closing

After the menu, don't wait in silence. Invite action:
> "O que te interessa? Pode pedir qualquer coisa dessa lista ou simplesmente me fazer uma pergunta — eu descubro o que tu precisa."
