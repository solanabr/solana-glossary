# apps/telegram-bot/src/i18n/locales/en.ftl

start-welcome =
    👋 Welcome to the <b>Solana Glossary Bot</b>!
    Search any of the 1,001 Solana terms.

    Try: <code>/glossary proof-of-history</code>
    Or type <code>@{ $bot_username } poh</code> in any chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Search:</b>
    /glossary &lt;term&gt; — look up a Solana term
    /random — random term

    📂 <b>Browse:</b>
    /categories — browse 14 categories
    /category &lt;name&gt; — terms in a category

    📅 <b>Learn:</b>
    /termofday — term of the day
    /quiz — start quiz
    /favorites — saved terms
    /history — recently viewed terms

    🌐 <b>Language:</b>
    /language pt|en|es — change language

    💡 Type <code>@{ $bot_username } &lt;term&gt;</code> in any chat!

term-aliases = 🔗 Aliases
term-related = 📂 Related

btn-related = 🔍 Related terms
btn-category = 📂 Browse category
btn-share = 📤 Share

# Pagination
btn-prev = ← Previous
btn-next = Next →
btn-page = Page { $current }/{ $total }

# Random term
random-term-header = 🎲 Random term

# Quiz
quiz-question =
    🧠 <b>Which term is described below?</b>

    <i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correct!</b> It was <b>{ $term }</b>.
quiz-wrong = ❌ <b>Wrong.</b> The answer was <b>{ $term }</b>.
quiz-no-session = ❌ No active quiz. Use /quiz to start.
quiz-no-user = ❌ User required for quiz.

# Favorites
btn-fav-add = ⭐ Save
btn-fav-remove = ★ Remove
favorite-added = ⭐ Saved!
favorite-removed = Removed.
favorites-header = ⭐ <b>Your favorites</b> — { $count } terms
favorites-empty = No saved terms yet. Tap ⭐ on any term card.
favorites-limit = ⚠️ Favorites limit (50) reached.

# History
history-header = 🕐 <b>Recently viewed</b>
history-empty = You haven't looked up any terms yet.

# Streaks
streak-day = 🔥 { $count } day streak
streak-days = 🔥 { $count } day streak
streak-first = 🔥 First day!

# Did you mean
did-you-mean =
    ❌ No results for that term.

    Did you mean: <code>{ $term }</code>?
btn-did-you-mean = Yes, show →

# External links
term-read-more = 🔗 <a href="{ $url }">Read Solana docs</a>

# Onboarding
onboarding-tips =
    💡 <b>Quick tips:</b>

    🔍 Look up any term: <code>/glossary proof-of-history</code>
    📂 Browse by category: /categories
    🧠 Test your knowledge: /quiz

# Feedback
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Thanks for your feedback!

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
