# apps/telegram-bot/src/i18n/locales/es.ftl

start-welcome =
    👋 ¡Bienvenido al <b>Solana Glossary Bot</b>!
    Busca cualquiera de los 1.001 términos de Solana.

    Prueba: <code>/glosario proof-of-history</code>
    O escribe <code>@{ $bot_username } poh</code> en cualquier chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glosario &lt;término&gt; — buscar un término Solana
    /aleatorio — término aleatorio

    📂 <b>Explorar:</b>
    /categorias — ver las 14 categorías
    /categoria &lt;nombre&gt; — términos de una categoría

    📅 <b>Aprender:</b>
    /terminodelhoy — término del día
    /quiz — iniciar quiz
    /favoritos — mis términos guardados
    /historial — términos vistos recientemente

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — cambiar idioma

    💡 Escribe <code>@{ $bot_username } &lt;término&gt;</code> en cualquier chat!

term-aliases = 🔗 Alias
term-related = 📂 Relacionados

btn-related = 🔍 Términos relacionados
btn-category = 📂 Ver categoría
btn-share = 📤 Compartir

# Pagination
btn-prev = ← Anterior
btn-next = Siguiente →
btn-page = Pág { $current }/{ $total }

# Random term
random-term-header = 🎲 Término aleatorio

# Quiz
quiz-question =
    🧠 <b>¿Qué término describe esto?</b>

    <i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.
quiz-wrong = ❌ <b>Incorrecto.</b> La respuesta era <b>{ $term }</b>.
quiz-no-session = ❌ No hay quiz activo. Usa /quiz para comenzar.
quiz-no-user = ❌ Usuario requerido para quiz.

# Favorites
btn-fav-add = ⭐ Guardar
btn-fav-remove = ★ Quitar
favorite-added = ⭐ ¡Guardado!
favorite-removed = Quitado.
favorites-header = ⭐ <b>Tus favoritos</b> — { $count } términos
favorites-empty = Aún no tienes términos guardados. Toca ⭐ en cualquier término.
favorites-limit = ⚠️ Límite de 50 favoritos alcanzado.

# History
history-header = 🕐 <b>Vistos recientemente</b>
history-empty = Aún no has consultado ningún término.

# Streaks
streak-day = 🔥 { $count } día seguido
streak-days = 🔥 { $count } días seguidos
streak-first = 🔥 ¡Primer día!

# Did you mean
did-you-mean =
    ❌ Sin resultados para ese término.

    ¿Quisiste decir: <code>{ $term }</code>?
btn-did-you-mean = Sí, mostrar →

# External links
term-read-more = 🔗 <a href="{ $url }">Ver documentación Solana</a>

# Onboarding
onboarding-tips =
    💡 <b>Consejos rápidos:</b>

    🔍 Busca cualquier término: <code>/glosario proof-of-history</code>
    📂 Explora por categoría: /categorias
    🧠 Pon a prueba tus conocimientos: /quiz

# Feedback
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = ¡Gracias por tu opinión!

term-not-found = ❌ Sin resultados para <b>{ $query }</b>. Usa /categorias para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Elige uno:
usage-glossary =
    💡 Uso: <code>/glosario &lt;término&gt;</code>
    Ejemplo: <code>/glosario proof-of-history</code>

categories-choose = 📚 <b>Solana Glossary — 14 Categorías</b>
    Elige una categoría:
categories-header =
    📚 <b>Solana Glossary — 14 Categorías</b>
    Usa <code>/categoria &lt;nombre&gt;</code> para listar los términos.
category-not-found = ❌ Categoría <b>{ $name }</b> no encontrada. Usa /categorias para ver las disponibles.
usage-category =
    💡 Uso: <code>/categoria &lt;nombre&gt;</code>
    Ejemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } términos

daily-term-header = Término del día

language-changed = ✅ Idioma cambiado a español.
language-invalid = ❌ Idioma inválido. Usa: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo salió mal. Por favor, inténtalo de nuevo.
rate-limit = ⏳ ¡Ve más despacio! Espera un momento antes de enviar más mensajes.
