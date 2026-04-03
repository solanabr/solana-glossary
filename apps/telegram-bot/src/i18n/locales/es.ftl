# apps/telegram-bot/src/i18n/locales/es.ftl

start-welcome =
    👋 ¡Bienvenido al <b>Solana Glossary Bot</b>!
    Busca cualquiera de los 1.001 términos de Solana.

    Prueba: <code>/glosario proof-of-history</code>
    O escribe <code>@{ $bot_username } poh</code> en cualquier chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glosario &lt;term&gt; — buscar en español
    /glossary &lt;term&gt; — search in English
    /glossario &lt;term&gt; — buscar em português

    📂 <b>Explorar:</b>
    /categorias — listar las 14 categorías
    /categoria &lt;nombre&gt; — términos de una categoría

    📅 <b>Aprender:</b>
    /terminodelhoy — término del día

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — cambiar idioma

    💡 Escribe <code>@{ $bot_username } &lt;term&gt;</code> en cualquier chat o grupo!

term-aliases = 🔗 Alias
term-related = 📂 Relacionados

btn-related = 🔍 Términos relacionados
btn-category = 📂 Ver categoría
btn-share = 📤 Compartir

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
