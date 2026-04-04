start-welcome =
    👋 Bem-vindo ao <b>Solana Glossary Bot</b>!
    Pesquise qualquer um dos 1.001 termos Solana.

    Comando rápido: <code>/glossario proof-of-history</code>
    Busca inline: <code>@{ $bot_username } poh</code>

help-message =
    📘 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    <code>/glossario &lt;termo&gt;</code> — buscar um termo Solana
    <code>/aleatorio</code> — termo aleatório

    📂 <b>Explorar:</b>
    <code>/categorias</code> — ver as 14 categorias
    <code>/categoria &lt;nome&gt;</code> — termos de uma categoria

    🧠 <b>Aprender:</b>
    <code>/termododia</code> — termo do dia
    <code>/quiz</code> — iniciar quiz
    <code>/favoritos</code> — meus termos salvos
    <code>/historico</code> — últimos termos vistos
    <code>/streak</code> — ver seu streak
    <code>/leaderboard</code> — ranking global

    💻 <b>Dev:</b>
    <code>/path</code> ou <code>/trilha</code> — trilhas para programadores

    🌐 <b>Idioma:</b>
    <code>/idioma pt|en|es</code> — trocar idioma

    💡 Digite <code>@{ $bot_username } &lt;termo&gt;</code> em qualquer chat.

term-aliases = 🔗 Aliases
term-related = 📂 Relacionados

btn-related = 🔍 Relacionados
btn-category = 📂 Ver categoria
btn-share = 📤 Compartilhar

btn-prev = ← Anterior
btn-next = Próxima →
btn-page = Pág { $current }/{ $total }
btn-back-categories = 🔙 Categorias
btn-back-menu = 🏠 Menu

random-term-header = 🎲 Termo aleatório

quiz-question =
    🧠 <b>Qual termo descreve isso?</b>

    <i>{ $definition }</i>
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
quiz-btn-retry = 🔄 Tentar Novamente
quiz-btn-result = 📖 Ver Resposta
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
streak-no-user = ❌ Necessário usuário para ver streak.

notification-streak-warning = 🔥 Alerta de Streak! Você tem 2h para fazer o <code>/quiz</code> e manter seu streak.

quiz-new-record = 🎉 <b>Novo recorde!</b> { $max } dias!
quiz-streak-continued = 🔥 Streak: <b>{ $current }</b> dias

leaderboard-title = 🏆 <b>Ranking Global — Top 10</b>
leaderboard-empty = 🏆 Nenhum participante ainda. Seja o primeiro a fazer quizzes!
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
    💡 <b>Dicas rápidas:</b>

    🔍 Busque qualquer termo: <code>/glossario proof-of-history</code>
    📂 Explore por categoria: <code>/categorias</code>
    🧠 Teste seus conhecimentos: <code>/quiz</code>
    💻 Siga uma trilha dev: <code>/path</code>

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Obrigado pelo feedback!

term-not-found = ❌ Nenhum resultado para <b>{ $query }</b>. Use <code>/categorias</code> para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Escolha um:
usage-glossary =
    💡 Uso: <code>/glossario &lt;termo&gt;</code>
    Exemplo: <code>/glossario proof-of-history</code>
prompt-glossary-query =
    🔍 <b>O que você quer pesquisar?</b>

    Envie o termo agora.
    Exemplo: <code>proof-of-history</code>

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

path-message =
    💻 <b>Trilhas para programadores</b>

    Escolha uma trilha para navegar pelos tópicos mais úteis de Solana.
    Você também pode buscar direto com <code>/glossario &lt;termo&gt;</code>.
path-track-core = Base do Protocolo
path-track-dev = Modelo de Programação
path-track-tools = Dev Tools
path-track-security = Segurança
path-track-network = Rede
path-track-zk = ZK Compression

language-changed = ✅ Idioma alterado para português.
language-invalid = ❌ Idioma inválido. Use: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo deu errado. Tente novamente.
rate-limit = ⏳ Devagar. Aguarde um momento antes de enviar mais mensagens.
