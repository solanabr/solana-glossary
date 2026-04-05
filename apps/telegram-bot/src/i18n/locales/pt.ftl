start-welcome =
    👋 <b>Solana Glossary Bot</b>

    Nunca mais saia do Telegram para entender um termo de Solana.

    💬 <code>/explicar</code> — responda qualquer mensagem para decodificar termos na hora
    💻 <code>/path</code> — trilhas guiadas, continue de onde parou
    🧠 <code>/quiz</code> — quiz diário para construir seu streak
    🔀 <code>/comparar poh pos</code> — compare dois conceitos lado a lado

help-message =
    📘 <b>Solana Glossary Bot</b>

    💬 <b>Explique no contexto:</b>
    <code>/explicar</code> — responda uma mensagem para explicar termos Solana na hora

    🔀 <b>Compare conceitos:</b>
    <code>/comparar &lt;termo1&gt; &lt;termo2&gt;</code> — comparação lado a lado

    💻 <b>Aprenda com trilhas:</b>
    <code>/path</code> ou <code>/trilha</code> — trilhas guiadas

    🧠 <b>Pratique:</b>
    <code>/quiz</code> — quiz diário + streak
    <code>/streak</code> · <code>/leaderboard</code>

    🔍 <b>Busque termos:</b>
    <code>/glossario &lt;termo&gt;</code> · <code>/aleatorio</code> · <code>/categorias</code> · <code>/termododia</code> · <code>/favoritos</code> · <code>/historico</code>

    🌐 Idioma: <code>/idioma pt|en|es</code>

term-aliases = 🔗 Aliases
term-related = 📂 Relacionados

btn-related = 🔍 Relacionados
btn-category = 📂 Ver categoria
btn-share = 📤 Compartilhar

btn-prev = ← Voltar
btn-next = Próxima →
btn-page = Pág { $current }/{ $total }
btn-back-categories = 🔙 Categorias
btn-back-menu = 🏠 Menu

random-term-header = 🎲 Termo aleatório

quiz-question =
    🧠 <b>Qual termo descreve isso?</b>  { $difficulty }

    <i>{ $definition }</i>
quiz-difficulty-beginner = 🟢 Iniciante
quiz-difficulty-basic = 🟢 Básico
quiz-difficulty-intermediate = 🟡 Intermediário
quiz-difficulty-advanced = 🔴 Avançado
quiz-difficulty-expert = 🔴 Expert
quiz-difficulty-fallback = ⚠️ Não há termos suficientes nesse nível — mostrando aleatório.
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correto!</b> Era <b>{ $term }</b>.
quiz-correct-with-streak =
    ✅ <b>Correto!</b> Era <b>{ $term }</b>.

    🔥 Streak: <b>{ $current }</b> dias
quiz-correct-new-record =
    ✅ <b>Correto!</b> Era <b>{ $term }</b>.

    🎉 <b>Novo recorde!</b> { $max } dias!

    🔥 Streak: <b>{ $max }</b> dias
quiz-wrong-retry =
    ❌ <b>Quase lá!</b>

    O que você quer fazer?
quiz-btn-retry = 🔄 Tentar novamente
quiz-btn-result = 📖 Ver resposta
quiz-try-again = 🔄 Vamos tentar de novo!
quiz-result = 📖 A resposta correta é <b>{ $term }</b>.
quiz-no-session = ❌ Nenhum quiz ativo. Use <code>/quiz</code> para começar.
quiz-no-user = ❌ Necessário usuário para quiz.

btn-fav-add = ⭐ Salvar
btn-fav-remove = ★ Remover
favorite-added = ⭐ Salvo!
favorite-removed = Removido.
favorites-header = ⭐ <b>Seus favoritos</b> — { $count } termos
favorites-empty = Você ainda não salvou nenhum termo. Use ⭐ no card de qualquer termo.
favorites-limit = ⚠️ Limite de 50 favoritos atingido.

history-header = 🕐 <b>Últimos termos vistos</b>
history-empty = Você ainda não consultou nenhum termo.

streak-day = 🔥 { $count } dia seguido
streak-days = 🔥 { $count } dias seguidos
streak-first = 🔥 Primeiro dia!
streak-message =
    { $fire } <b>Seu Streak</b>

    🔥 Atual: <b>{ $current }</b> dias
    🏆 Recorde: <b>{ $max }</b> dias
    ❄️ Congelamentos: <b>{ $freezes }</b>/1 restante

    📅 Últimos 7 dias:
    { $calendar }
group-streak-section-title = 👥 <b>Streak do Grupo</b>
group-streak-current = 🔥 Atual: <b>{ $current }</b> dias seguidos
group-streak-record = 🏆 Recorde do grupo: <b>{ $max }</b> dias
group-streak-calendar-label = 📅 Últimos 7 dias:
streak-no-user = ❌ Necessário usuário para ver streak.
group-streak-started = 🔥 Streak de grupo iniciado! Façam <code>/quiz</code> todo dia para manter.
group-streak-maintained = ✅ Streak do grupo mantido! { $count } membros participaram hoje.
group-streak-milestone = { $emoji} <b>{ $days } dias de streak em grupo!</b> { $celebration }
group-streak-milestone-3 = O grupo está aquecendo.
group-streak-milestone-7 = Uma semana seguida. Vocês estão constantes.
group-streak-milestone-14 = Este grupo está imbatível.
group-streak-milestone-30 = Lendários.
group-streak-broken = 💔 O streak do grupo foi perdido. Façam <code>/quiz</code> hoje para reiniciar.
group-streak-no-participation = 👥 Faça <code>/quiz</code> neste grupo para ver o streak coletivo.
group-streak-today-progress = 👤 Hoje: { $count }/{ $threshold } membros participaram

notification-streak-warning = 🔥 Alerta de Streak! Você tem 2h para fazer o <code>/quiz</code> e manter seu streak.

quiz-new-record = 🎉 <b>Novo recorde!</b> { $max } dias!
quiz-streak-continued = 🔥 Streak: <b>{ $current }</b> dias

leaderboard-title = 🏆 <b>Ranking Global — Top 10</b>
leaderboard-empty = 🏆 Nenhum participante ainda. Seja o primeiro a fazer quizzes!
group-leaderboard-title = 🏆 <b>Top deste grupo</b>
group-leaderboard-empty = 🏆 Nenhum membro fez quiz ainda. Seja o primeiro!
group-rank-position = 📊 <b>Sua posição:</b> #{ $rank } de { $total } membros
group-rank-cta = Faça <code>/quiz</code> para subir no ranking!
rank-no-user = ❌ Necessário usuário para ver posição.
rank-no-streak = Você ainda não tem um streak. Faça um <code>/quiz</code> para começar!
rank-position = 📊 <b>Sua posição:</b> #{ $rank } de { $total } participantes
rank-max-streak = 🔥 Seu recorde: { $max } dias
rank-you = → <b>Você</b>
leaderboard-entry = { $medal } { $name } — { $streak } dias
rank-entry-simple = { $rank } — { $streak } dias
rank-nearby = 📈 Competidores próximos:

did-you-mean =
    ❌ Nenhum resultado para esse termo.

    Você quis dizer: <code>{ $term }</code>?
btn-did-you-mean = Sim, mostrar →

term-read-more-label = Ver na documentação Solana

onboarding-tips =
    💡 <b>Dicas rápidas</b>

    Toque em um item do menu abaixo para ver exatamente como usar cada função.

    Hero actions:
    💬 <code>/explicar</code>
    💻 <code>/path</code>
    🧠 <code>/quiz easy</code>, <code>/quiz medium</code> ou <code>/quiz hard</code>

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Obrigado pelo feedback!

term-not-found = ❌ Nenhum resultado para <b>{ $query }</b>. Use <code>/categorias</code> para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Escolha um:
usage-glossary =
    💡 Uso: <code>/glossario &lt;termo&gt;</code>
    Exemplo: <code>/glossario proof-of-history</code>
usage-compare =
    🔀 Uso: <code>/comparar &lt;termo1&gt; &lt;termo2&gt;</code>
    Exemplo: <code>/comparar poh pos</code>
usage-quiz =
    🧠 Uso: <code>/quiz</code> · <code>/quiz easy</code> · <code>/quiz medium</code> · <code>/quiz hard</code>
prompt-glossary-query =
    🔍 <b>O que você quer pesquisar?</b>

    Envie o termo agora.
    Exemplo: <code>proof-of-history</code>

compare-header = 🔀 <b>{ $term1 }</b> vs <b>{ $term2 }</b>
compare-shared-related = 🔗 Relacionado a ambos: { $terms }
compare-not-found-one = ❌ Termo não encontrado: <b>{ $query }</b>. Você quis dizer <code>{ $suggestion }</code>?
compare-not-found-one-no-suggestion = ❌ Termo não encontrado: <b>{ $query }</b>. Use <code>/glossario</code> para buscar.
compare-not-found-both = ❌ Nenhum dos dois termos foi reconhecido. Use <code>/categorias</code> para explorar.
compare-same-term = 💡 Você comparou um termo com ele mesmo. Tente <code>/glossario { $term }</code> para ver o card completo.
compare-side-left = primeiro
compare-side-right = segundo
compare-ambiguous-header = ⚠️ <b>O { $side } termo ficou ambíguo:</b> <code>{ $query }</code>
compare-ambiguous-footer = Refine o comando com um ID mais específico.

categories-choose =
    📚 <b>Solana Glossary — 14 Categorias</b>
    Escolha uma categoria:
categories-header =
    📚 <b>Solana Glossary — 14 Categorias</b>
    Use <code>/categoria &lt;nome&gt;</code> para listar os termos.
category-not-found = ❌ Categoria <b>{ $name }</b> não encontrada. Use <code>/categorias</code> para ver as disponíveis.
usage-category =
    💡 Uso: <code>/categoria &lt;nome&gt;</code>
    Exemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } termos

daily-term-header = Termo do dia

menu-glossary = 🔍 Glossário
menu-categories = 📂 Categorias
menu-random = 🎲 Aleatório
menu-quiz = 🧠 Quiz
menu-path = 💻 Trilha Dev
menu-help = 📘 Ajuda

path-menu-header =
    💻 <b>Trilhas de aprendizado</b>

    Cada trilha é um mini-curso focado.
    Seu progresso fica salvo — continue de onde parou.
path-step-header = { $emoji } <b>{ $name }</b> · Etapa { $step } de { $total }
path-step-badge = { $current }/{ $total }
path-completed =
    ✅ <b>Trilha concluída: { $name }</b>

    Você cobriu os conceitos principais desta trilha.

    Próximo passo recomendado:
    🧠 Faça o quiz da trilha para manter seu streak

    ou
    ➡️ Comece { $next_path }
path-completed-final =
    ✅ <b>Trilha concluída: { $name }</b>

    Você cobriu os conceitos principais desta trilha.

    Próximo passo recomendado:
    🧠 Faça o quiz da trilha para manter seu streak
path-quiz = 🧠 Quiz da trilha
path-restart = 🔄 Reiniciar
path-name-solana-basics = Solana Basics
path-desc-solana-basics = Fundamentos do protocolo: PoH, slots, epochs e validators
path-name-defi-foundations = DeFi Foundations
path-desc-defi-foundations = Como DeFi funciona em Solana: AMMs, pools e swaps
path-name-builders-path = Builder's Path
path-desc-builders-path = O que todo dev Solana precisa saber: programs, PDAs e CPIs

explain-no-reply =
    💬 <b>Como usar o /explicar:</b>

    1. Segure a mensagem que quer entender
    2. Toque em <b>Responder</b>
    3. Envie <code>/explicar</code>

    O bot vai explicar os termos Solana presentes nessa mensagem.
    Você também pode enviar <code>/explicar &lt;termo&gt;</code> direto.
explain-missing-reply-context =
    ⚠️ <b>Recebi o comando, mas não recebi o contexto da mensagem respondida.</b>

    Neste grupo, o Telegram não entregou ao bot o conteúdo da mensagem à qual o <code>/explicar</code> respondeu.

    Tente usar <code>/explicar &lt;termo&gt;</code> diretamente.
    Se isso continuar, revise a configuração do bot e as permissões do grupo.
explain-not-found = ❌ Não encontrei termos Solana reconhecíveis nessa mensagem.
explain-summary = 💬 Encontrei { $count } termo(s) nesta mensagem: { $terms }
group-welcome =
    👋 <b>O Solana Glossary Bot chegou.</b>

    Responda qualquer mensagem com <code>/explicar</code> para decodificar termos Solana sem tirar a conversa do Telegram.

    Teste agora: responda uma mensagem e envie <code>/explicar</code>
    Também: <code>/comparar poh pos</code> · <code>/path</code> · <code>/quiz</code>

language-changed = ✅ Idioma alterado para português.
language-invalid = ❌ Idioma inválido. Use: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo deu errado. Tente novamente.
rate-limit = ⏳ Devagar. Aguarde um momento antes de enviar mais mensagens.

quiz-correct-group-with-streak =
    ✅ { $name } acertou! Era <b>{ $term }</b>.
    🔥 Streak pessoal: <b>{ $personal }</b> dias · 👥 Streak do grupo: <b>{ $group }</b> dias{ $status }
quiz-correct-group-new-record-with-streak =
    ✅ { $name } acertou! Era <b>{ $term }</b>.
    🎉 <b>Novo recorde pessoal!</b> { $max } dias.
    🔥 Streak pessoal: <b>{ $personal }</b> dias · 👥 Streak do grupo: <b>{ $group }</b> dias{ $status }

tips-menu-title =
    💡 <b>Guia rápido do bot</b>

    Escolha um item para ver como usar.
tips-menu-back = ← Voltar para dicas
tips-btn-explain = 💬 Explicar
tips-btn-compare = 🔀 Comparar
tips-btn-path = 💻 Path
tips-btn-quiz = 🧠 Quiz
tips-btn-glossary = 🔍 Glossário
tips-btn-categories = 📂 Categorias
tips-btn-streak = 🔥 Streak
tips-btn-leaderboard = 🏆 Ranking
tips-btn-help = 📘 Ajuda
tips-explain =
    💬 <b>Como usar /explicar</b>

    1. Responda uma mensagem no grupo
    2. Envie <code>/explicar</code>
    3. O bot detecta os termos Solana e explica na hora

    Exemplo: responda a uma mensagem sobre "turbine" e envie <code>/explicar</code>.
tips-compare =
    🔀 <b>Como usar /comparar</b>

    Compare dois conceitos lado a lado:
    <code>/comparar poh pos</code>
    <code>/comparar account pda</code>
tips-path =
    💻 <b>Como usar /path</b>

    Envie <code>/path</code> para abrir as trilhas guiadas.
    Escolha uma trilha, avance termo por termo e finalize com o quiz da trilha.
tips-quiz =
    🧠 <b>Como usar /quiz</b>

    Níveis disponíveis:
    <code>/quiz</code>
    <code>/quiz easy</code>
    <code>/quiz medium</code>
    <code>/quiz hard</code>
    <code>/quiz 1</code> até <code>/quiz 5</code>
tips-glossary =
    🔍 <b>Como usar /glossario</b>

    Busque um termo direto:
    <code>/glossario proof-of-history</code>

    Também funciona inline:
    <code>@{ $bot_username } poh</code>
tips-categories =
    📂 <b>Como usar categorias</b>

    Envie <code>/categorias</code> para navegar pelo menu
    ou <code>/categoria defi</code> para abrir uma categoria específica.
tips-streak =
    🔥 <b>Como usar /streak</b>

    Em DM, mostra seu streak pessoal.
    Em grupo, mostra seu streak + o streak coletivo do grupo.
tips-leaderboard =
    🏆 <b>Como usar /leaderboard</b>

    Em DM, mostra o ranking global.
    Em grupo, mostra o top local daquele grupo.
tips-help =
    📘 <b>Como usar /help</b>

    Envie <code>/help</code> para ver todos os comandos principais organizados por caso de uso.

quiz-menu-title = 🧠 <b>Configurar Quiz</b>
quiz-menu-mode = Modo
quiz-menu-mode-single = 1 pergunta
quiz-menu-mode-round = Rodada
quiz-menu-difficulty = Dificuldade
quiz-menu-difficulty-all = Qualquer
quiz-menu-difficulty-easy = Fácil
quiz-menu-difficulty-medium = Médio
quiz-menu-difficulty-hard = Difícil
quiz-menu-difficulty-level = Nível { $level }
quiz-menu-count = Perguntas
quiz-menu-failure = Ao errar
quiz-menu-failure-continue = Continuar
quiz-menu-failure-sudden-death = Eliminação
quiz-menu-start = ▶️ Começar
quiz-menu-group-note = Em grupos o quiz fica no modo rápido: uma pergunta por vez para evitar spam.
quiz-round-progress = 🎯 <b>Pergunta { $current }/{ $total }</b> · ✅ { $correct } · ❌ { $wrong } · { $mode }
quiz-round-count-adjusted = ⚠️ Ajustei a rodada de <b>{ $requested }</b> para <b>{ $available }</b> perguntas com base no pool disponível.
quiz-round-feedback-correct = ✅ Correto! Era <b>{ $term }</b>.
quiz-round-feedback-correct-streak = ✅ Correto! Era <b>{ $term }</b>. 🔥 Streak: <b>{ $current }</b>
quiz-round-feedback-wrong = ❌ Errado. A resposta certa era <b>{ $term }</b>.
quiz-round-summary =
    🏁 <b>Rodada finalizada</b>

    Perguntas respondidas: <b>{ $answered }/{ $total }</b>
    Acertos: <b>{ $correct }</b>
    Erros: <b>{ $wrong }</b>
    Aproveitamento: <b>{ $accuracy }%</b>
    Dificuldade: <b>{ $difficulty }</b>
quiz-btn-play-again = 🔁 Jogar de novo
quiz-btn-menu = ⚙️ Menu do Quiz

quiz-wrong = ❌ <b>Errado.</b> A resposta era <b>{ $term }</b>.

language-changed-confirmation =
    ✅ Idioma alterado para português.

    ℹ️ <i>O menu de comandos (/) continua no idioma do seu app Telegram. Use /help para ver todos os comandos em português.</i>

start-language-picker =
    🌐 <b>Escolha seu idioma</b>
    Escolha abaixo o idioma da interface do bot.
start-language-option-pt = 🇧🇷 Português
start-language-option-en = 🇺🇸 English
start-language-option-es = 🇪🇸 Español

group-language-picker =
    🌐 <b>Escolha o idioma deste grupo</b>

    Selecione o idioma do grupo.
    Depois disso, eu envio o menu e o onboarding do grupo no idioma escolhido.
group-language-changed = ✅ Idioma do grupo atualizado.
group-onboarding-tips =
    💡 <b>Comece rápido no grupo</b>

    Use <code>/explicar</code> respondendo uma mensagem.
    Use <code>/comparar termo1 termo2</code> para comparar conceitos.
    Use <code>/quiz</code> para praticar rápido no grupo.
