# apps/telegram-bot/src/i18n/locales/pt.ftl

start-welcome =
    👋 Bem-vindo ao <b>Solana Glossary Bot</b>!
    Pesquise qualquer um dos 1.001 termos Solana.

    Tente: <code>/glossario proof-of-history</code>
    Ou digite <code>@{ $bot_username } poh</code> em qualquer chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glossario &lt;termo&gt; — buscar um termo Solana
    /aleatorio — termo aleatório

    📂 <b>Explorar:</b>
    /categorias — ver as 14 categorias
    /categoria &lt;nome&gt; — termos de uma categoria

    📅 <b>Aprender:</b>
    /termododia — termo do dia
    /quiz — iniciar quiz
    /favoritos — meus termos salvos
    /historico — últimos termos vistos

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — trocar idioma

    💡 Digite <code>@{ $bot_username } &lt;termo&gt;</code> em qualquer chat!

term-aliases = 🔗 Aliases
term-related = 📂 Relacionados

btn-related = 🔍 Relacionados
btn-category = 📂 Ver categoria
btn-share = 📤 Compartilhar

# Pagination
btn-prev = ← Anterior
btn-next = Próxima →
btn-page = Pág { $current }/{ $total }

# Random term
random-term-header = 🎲 Termo aleatório

# Quiz
quiz-question =
    🧠 <b>Qual termo descreve isso?</b>

    <i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correto!</b> Era <b>{ $term }</b>.
quiz-wrong = ❌ <b>Errado.</b> A resposta era <b>{ $term }</b>.
quiz-no-session = ❌ Nenhum quiz ativo. Use /quiz para começar.
quiz-no-user = ❌ Necessário usuário para quiz.

# Favorites
btn-fav-add = ⭐ Salvar
btn-fav-remove = ★ Remover
favorite-added = ⭐ Salvo!
favorite-removed = Removido.
favorites-header = ⭐ <b>Seus favoritos</b> — { $count } termos
favorites-empty = Você ainda não salvou nenhum termo. Use ⭐ no card de qualquer termo.
favorites-limit = ⚠️ Limite de 50 favoritos atingido.

# History
history-header = 🕐 <b>Últimos termos vistos</b>
history-empty = Você ainda não consultou nenhum termo.

# Streaks
streak-day = 🔥 { $count } dia seguido
streak-days = 🔥 { $count } dias seguidos
streak-first = 🔥 Primeiro dia!

# Did you mean
did-you-mean =
    ❌ Nenhum resultado para esse termo.

    Você quis dizer: <code>{ $term }</code>?
btn-did-you-mean = Sim, mostrar →

# External links
term-read-more = 🔗 <a href="{ $url }">Ver na documentação Solana</a>

# Onboarding
onboarding-tips =
    💡 <b>Dicas rápidas:</b>

    🔍 Busque qualquer termo: <code>/glossario proof-of-history</code>
    📂 Explore por categoria: /categorias
    🧠 Teste seus conhecimentos: /quiz

# Feedback
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Obrigado pelo feedback!

term-not-found = ❌ Nenhum resultado para <b>{ $query }</b>. Use /categorias para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Escolha um:
usage-glossary =
    💡 Uso: <code>/glossario &lt;termo&gt;</code>
    Exemplo: <code>/glossario proof-of-history</code>

categories-choose = 📚 <b>Solana Glossary — 14 Categorias</b>
    Escolha uma categoria:
categories-header =
    📚 <b>Solana Glossary — 14 Categorias</b>
    Use <code>/categoria &lt;nome&gt;</code> para listar os termos.
category-not-found = ❌ Categoria <b>{ $name }</b> não encontrada. Use /categorias para ver as disponíveis.
usage-category =
    💡 Uso: <code>/categoria &lt;nome&gt;</code>
    Exemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } termos

daily-term-header = Termo do dia

language-changed = ✅ Idioma alterado para português.
language-invalid = ❌ Idioma inválido. Use: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo deu errado. Tente novamente.
rate-limit = ⏳ Devagar! Aguarde um momento antes de enviar mais mensagens.
