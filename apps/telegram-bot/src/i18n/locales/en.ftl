# apps/telegram-bot/src/i18n/locales/en.ftl

start-welcome =
    👋 Welcome to the <b>Solana Glossary Bot</b>!
    Search any of the 1,001 Solana terms.

    Try: <code>/glossary proof-of-history</code>
    Or type <code>@{ $bot_username } poh</code> in any chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Search:</b>
    /glossary &lt;term&gt; — search in English
    /glossario &lt;term&gt; — buscar em português
    /glosario &lt;term&gt; — buscar en español

    📂 <b>Browse:</b>
    /categories — list all 14 categories
    /category &lt;name&gt; — terms in a category

    📅 <b>Learn:</b>
    /termofday — term of the day

    🌐 <b>Language:</b>
    /language pt|en|es — change language

    💡 Type <code>@{ $bot_username } &lt;term&gt;</code> in any chat or group!

term-aliases = 🔗 Aliases
term-related = 📂 Related

btn-related = 🔍 Related terms
btn-category = 📂 Browse category
btn-share = 📤 Share

term-not-found = ❌ No results for <b>{ $query }</b>. Use /categories to explore.
multiple-results = 🔍 Found <b>{ $count }</b> results for <b>{ $query }</b>. Choose one:
usage-glossary =
    💡 Usage: <code>/glossary &lt;term&gt;</code>
    Example: <code>/glossary proof-of-history</code>

categories-choose = 📚 <b>Solana Glossary — 14 Categories</b>
    Choose a category:
categories-header =
    📚 <b>Solana Glossary — 14 Categories</b>
    Use <code>/category &lt;name&gt;</code> to list terms.
category-not-found = ❌ Category <b>{ $name }</b> not found. Use /categories to see available categories.
usage-category =
    💡 Usage: <code>/category &lt;name&gt;</code>
    Example: <code>/category defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } terms

daily-term-header = Term of the day

language-changed = ✅ Language changed to English.
language-invalid = ❌ Invalid language. Use: <code>/language pt | en | es</code>

internal-error = ⚠️ Something went wrong. Please try again.
rate-limit = ⏳ Please slow down! Wait a moment before sending more requests.
