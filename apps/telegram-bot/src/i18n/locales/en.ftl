start-welcome =
    👋 Welcome to the <b>Solana Glossary Bot</b>!
    Search any of the 1,001 Solana terms.

    Quick command: <code>/glossary proof-of-history</code>
    Inline search: <code>@{ $bot_username } poh</code>

help-message =
    📘 <b>Solana Glossary Bot</b>

    🔍 <b>Search:</b>
    <code>/glossary &lt;term&gt;</code> — look up a Solana term
    <code>/random</code> — random term

    📂 <b>Browse:</b>
    <code>/categories</code> — browse 14 categories
    <code>/category &lt;name&gt;</code> — terms in a category

    🧠 <b>Learn:</b>
    <code>/termofday</code> — term of the day
    <code>/quiz</code> — start quiz
    <code>/favorites</code> — saved terms
    <code>/history</code> — recently viewed terms
    <code>/streak</code> — view your streak
    <code>/leaderboard</code> — global ranking

    💻 <b>Dev:</b>
    <code>/path</code> — developer learning paths

    🌐 <b>Language:</b>
    <code>/language pt|en|es</code> — change language

    💡 Type <code>@{ $bot_username } &lt;term&gt;</code> in any chat.

term-aliases = 🔗 Aliases
term-related = 📂 Related

btn-related = 🔍 Related terms
btn-category = 📂 Browse category
btn-share = 📤 Share

btn-prev = ← Previous
btn-next = Next →
btn-page = Page { $current }/{ $total }
btn-back-categories = 🔙 Categories
btn-back-menu = 🏠 Menu

random-term-header = 🎲 Random term

quiz-question =
    🧠 <b>Which term is described below?</b>

    <i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correct!</b> It was <b>{ $term }</b>.
quiz-correct-with-streak =
    ✅ <b>Correct!</b> It was <b>{ $term }</b>.

    🔥 Streak: <b>{ $current }</b> days
quiz-correct-new-record =
    ✅ <b>Correct!</b> It was <b>{ $term }</b>.

    🎉 <b>New record!</b> { $max } days!

    🔥 Streak: <b>{ $max }</b> days
quiz-wrong = ❌ <b>Wrong.</b> The answer was <b>{ $term }</b>.
quiz-wrong-retry =
    ❌ <b>Not quite right!</b>

    What would you like to do?
quiz-btn-retry = 🔄 Try Again
quiz-btn-result = 📖 See Answer
quiz-try-again = 🔄 Let's try again!
quiz-result = 📖 The correct answer is <b>{ $term }</b>.
quiz-no-session = ❌ No active quiz. Use <code>/quiz</code> to start.
quiz-no-user = ❌ User required for quiz.

btn-fav-add = ⭐ Save
btn-fav-remove = ★ Remove
favorite-added = ⭐ Saved!
favorite-removed = Removed.
favorites-header = ⭐ <b>Your favorites</b> — { $count } terms
favorites-empty = No saved terms yet. Tap ⭐ on any term card.
favorites-limit = ⚠️ Favorites limit (50) reached.

history-header = 🕐 <b>Recently viewed</b>
history-empty = You haven't looked up any terms yet.

streak-day = 🔥 { $count } day streak
streak-days = 🔥 { $count } day streak
streak-first = 🔥 First day!
streak-message =
    { $fire } <b>Your Streak</b>

    🔥 Current: <b>{ $current }</b> days
    🏆 Best: <b>{ $max }</b> days
    ❄️ Freezes: <b>{ $freezes }</b>/1 remaining

    📅 Last 7 days:
    { $calendar }
streak-no-user = ❌ User required to view streak.

notification-streak-warning = 🔥 Streak Alert! You have 2 hours to take the <code>/quiz</code> and keep your streak.

quiz-new-record = 🎉 <b>New record!</b> { $max } days!
quiz-streak-continued = 🔥 Streak: <b>{ $current }</b> days

leaderboard-title = 🏆 <b>Global Ranking — Top 10</b>
leaderboard-empty = 🏆 No participants yet. Be the first to complete quizzes!
rank-no-user = ❌ User required to view rank.
rank-no-streak = You don't have a streak yet. Take a <code>/quiz</code> to start!
rank-position = 📊 <b>Your rank:</b> #{ $rank } of { $total } participants
rank-max-streak = 🔥 Your best: { $max } days
rank-you = → <b>You</b>
leaderboard-entry = { $medal } { $name } — { $streak } days
rank-entry-simple = { $rank } — { $streak } days
rank-nearby = 📈 Nearby competitors:

did-you-mean =
    ❌ No results for that term.

    Did you mean: <code>{ $term }</code>?
btn-did-you-mean = Yes, show →

term-read-more-label = Read Solana docs

onboarding-tips =
    💡 <b>Quick tips:</b>

    🔍 Look up any term: <code>/glossary proof-of-history</code>
    📂 Browse by category: <code>/categories</code>
    🧠 Test your knowledge: <code>/quiz</code>
    💻 Follow a dev path: <code>/path</code>

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Thanks for your feedback!

term-not-found = ❌ No results for <b>{ $query }</b>. Use <code>/categories</code> to explore.
multiple-results = 🔍 Found <b>{ $count }</b> results for <b>{ $query }</b>. Choose one:
usage-glossary =
    💡 Usage: <code>/glossary &lt;term&gt;</code>
    Example: <code>/glossary proof-of-history</code>
prompt-glossary-query =
    🔍 <b>What do you want to search for?</b>

    Send the term now.
    Example: <code>proof-of-history</code>

categories-choose =
    📚 <b>Solana Glossary — 14 Categories</b>
    Choose a category:
categories-header =
    📚 <b>Solana Glossary — 14 Categories</b>
    Use <code>/category &lt;name&gt;</code> to list terms.
category-not-found = ❌ Category <b>{ $name }</b> not found. Use <code>/categories</code> to see available categories.
usage-category =
    💡 Usage: <code>/category &lt;name&gt;</code>
    Example: <code>/category defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } terms

daily-term-header = Term of the day

menu-glossary = 🔍 Glossary
menu-categories = 📂 Categories
menu-random = 🎲 Random
menu-quiz = 🧠 Quiz
menu-path = 💻 Dev Path
menu-help = 📘 Help

path-message =
    💻 <b>Developer paths</b>

    Choose a path to browse the most useful Solana topics.
    You can also search directly with <code>/glossary &lt;term&gt;</code>.
path-track-core = Protocol Basics
path-track-dev = Programming Model
path-track-tools = Dev Tools
path-track-security = Security
path-track-network = Network
path-track-zk = ZK Compression

language-changed = ✅ Language changed to English.
language-invalid = ❌ Invalid language. Use: <code>/language pt | en | es</code>

internal-error = ⚠️ Something went wrong. Please try again.
rate-limit = ⏳ Please slow down. Wait a moment before sending more requests.
