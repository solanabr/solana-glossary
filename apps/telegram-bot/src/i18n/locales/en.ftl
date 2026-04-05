start-welcome =
    👋 <b>Solana Glossary Bot</b>

    Never leave Telegram to look up a Solana term again.

    💬 <code>/explain</code> — reply to any message to decode terms on the spot
    💻 <code>/path</code> — guided learning paths, pick up where you left off
    🧠 <code>/quiz</code> — daily quiz to build your streak
    🔀 <code>/compare poh pos</code> — compare any two concepts side by side

help-message =
    📘 <b>Solana Glossary Bot</b>

    💬 <b>Explain in context:</b>
    <code>/explain</code> — reply to a message to explain Solana terms on the spot

    🔀 <b>Compare concepts:</b>
    <code>/compare &lt;term1&gt; &lt;term2&gt;</code> — side-by-side comparison

    💻 <b>Learn with paths:</b>
    <code>/path</code> — guided learning paths

    🧠 <b>Practice:</b>
    <code>/quiz</code> — daily quiz + streak
    <code>/streak</code> · <code>/leaderboard</code>

    🔍 <b>Look up terms:</b>
    <code>/glossary &lt;term&gt;</code> · <code>/random</code> · <code>/categories</code> · <code>/termofday</code> · <code>/favorites</code> · <code>/history</code>

    🌐 Language: <code>/language pt|en|es</code>

term-aliases = 🔗 Aliases
term-related = 📂 Related

btn-related = 🔍 Related terms
btn-category = 📂 Browse category
btn-share = 📤 Share

btn-prev = ← Back
btn-next = Next →
btn-page = Page { $current }/{ $total }
btn-back-categories = 🔙 Categories
btn-back-menu = 🏠 Menu

random-term-header = 🎲 Random term

quiz-question =
    🧠 <b>Which term is described below?</b>  { $difficulty }

    <i>{ $definition }</i>
quiz-difficulty-beginner = 🟢 Beginner
quiz-difficulty-basic = 🟢 Basic
quiz-difficulty-intermediate = 🟡 Intermediate
quiz-difficulty-advanced = 🔴 Advanced
quiz-difficulty-expert = 🔴 Expert
quiz-difficulty-fallback = ⚠️ Not enough terms at that level — showing random.
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
group-streak-section-title = 👥 <b>Group Streak</b>
group-streak-current = 🔥 Current: <b>{ $current }</b> days
group-streak-record = 🏆 Group record: <b>{ $max }</b> days
group-streak-calendar-label = 📅 Last 7 days:
streak-no-user = ❌ User required to view streak.
group-streak-started = 🔥 Group streak started! Take <code>/quiz</code> every day to keep it alive.
group-streak-maintained = ✅ Group streak maintained! { $count } members participated today.
group-streak-milestone = { $emoji} <b>{ $days } days of group streak!</b> { $celebration }
group-streak-milestone-3 = The group is heating up.
group-streak-milestone-7 = One full week. You are consistent.
group-streak-milestone-14 = This group is unstoppable.
group-streak-milestone-30 = Legendary.
group-streak-broken = 💔 The group streak was lost. Take <code>/quiz</code> today to restart it.
group-streak-no-participation = 👥 Take <code>/quiz</code> in this group to see the shared streak.
group-streak-today-progress = 👤 Today: { $count }/{ $threshold } members participated

notification-streak-warning = 🔥 Streak Alert! You have 2 hours to take the <code>/quiz</code> and keep your streak.

quiz-new-record = 🎉 <b>New record!</b> { $max } days!
quiz-streak-continued = 🔥 Streak: <b>{ $current }</b> days

leaderboard-title = 🏆 <b>Global Ranking — Top 10</b>
leaderboard-empty = 🏆 No participants yet. Be the first to complete quizzes!
group-leaderboard-title = 🏆 <b>Top in this group</b>
group-leaderboard-empty = 🏆 No group member has taken a quiz yet. Be the first!
group-rank-position = 📊 <b>Your rank:</b> #{ $rank } of { $total } members
group-rank-cta = Take <code>/quiz</code> to climb the ranking!
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
    💡 <b>Quick tips</b>

    Tap an item in the menu below to see exactly how each feature works.

    Hero actions:
    💬 <code>/explain</code>
    💻 <code>/path</code>
    🧠 <code>/quiz easy</code>, <code>/quiz medium</code> or <code>/quiz hard</code>

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Thanks for your feedback!

term-not-found = ❌ No results for <b>{ $query }</b>. Use <code>/categories</code> to explore.
multiple-results = 🔍 Found <b>{ $count }</b> results for <b>{ $query }</b>. Choose one:
usage-glossary =
    💡 Usage: <code>/glossary &lt;term&gt;</code>
    Example: <code>/glossary proof-of-history</code>
usage-compare =
    🔀 Usage: <code>/compare &lt;term1&gt; &lt;term2&gt;</code>
    Example: <code>/compare poh pos</code>
usage-quiz =
    🧠 Usage: <code>/quiz</code> · <code>/quiz easy</code> · <code>/quiz medium</code> · <code>/quiz hard</code>
prompt-glossary-query =
    🔍 <b>What do you want to search for?</b>

    Send the term now.
    Example: <code>proof-of-history</code>

compare-header = 🔀 <b>{ $term1 }</b> vs <b>{ $term2 }</b>
compare-shared-related = 🔗 Related to both: { $terms }
compare-not-found-one = ❌ Term not found: <b>{ $query }</b>. Did you mean <code>{ $suggestion }</code>?
compare-not-found-one-no-suggestion = ❌ Term not found: <b>{ $query }</b>. Use <code>/glossary</code> to search.
compare-not-found-both = ❌ Neither term was recognized. Use <code>/categories</code> to explore.
compare-same-term = 💡 You compared a term with itself. Try <code>/glossary { $term }</code> for the full card.
compare-side-left = first
compare-side-right = second
compare-ambiguous-header = ⚠️ <b>The { $side } term is ambiguous:</b> <code>{ $query }</code>
compare-ambiguous-footer = Refine the command with a more specific term ID.

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

path-menu-header =
    💻 <b>Learning Paths</b>

    Each path is a focused mini-course.
    Your progress is saved — resume where you left off.
path-step-header = { $emoji} <b>{ $name }</b> · Step { $step } of { $total }
path-step-badge = { $current }/{ $total }
path-completed =
    ✅ <b>Path completed: { $name }</b>

    You've covered the key concepts in this path.

    Recommended next step:
    🧠 Quiz this path to keep your streak going

    or
    ➡️ Start { $next_path }
path-completed-final =
    ✅ <b>Path completed: { $name }</b>

    You've covered the key concepts in this path.

    Recommended next step:
    🧠 Quiz this path to keep your streak going
path-quiz = 🧠 Quiz this path
path-restart = 🔄 Restart
path-name-solana-basics = Solana Basics
path-desc-solana-basics = Protocol fundamentals: PoH, slots, epochs, validators
path-name-defi-foundations = DeFi Foundations
path-desc-defi-foundations = How DeFi works on Solana: AMMs, liquidity pools, swaps
path-name-builders-path = Builder's Path
path-desc-builders-path = What every Solana dev must know: programs, PDAs, CPIs

explain-no-reply =
    💬 <b>How to use /explain:</b>

    1. Long-press the message you want to understand
    2. Tap <b>Reply</b>
    3. Send <code>/explain</code>

    The bot will explain the Solana terms found in that message.
    You can also send <code>/explain &lt;term&gt;</code> directly.
explain-missing-reply-context =
    ⚠️ <b>I received the command, but not the replied message context.</b>

    In this group, Telegram did not deliver the message content that <code>/explain</code> was replying to.

    Try <code>/explain &lt;term&gt;</code> directly.
    If this keeps happening, check the bot setup and group permissions.
explain-not-found = ❌ No recognizable Solana terms found in that message.
explain-summary = 💬 I found { $count } term(s) in this message: { $terms }
group-welcome =
    👋 <b>Solana Glossary Bot is here.</b>

    Reply to any message with <code>/explain</code> to decode Solana terms without pulling the conversation out of Telegram.

    Try it now: reply to a message and send <code>/explain</code>
    Also: <code>/compare poh pos</code> · <code>/path</code> · <code>/quiz</code>

language-changed = ✅ Language changed to English.
language-invalid = ❌ Invalid language. Use: <code>/language pt | en | es</code>

internal-error = ⚠️ Something went wrong. Please try again.
rate-limit = ⏳ Please slow down. Wait a moment before sending more requests.

quiz-correct-group-with-streak =
    ✅ { $name } got it right! It was <b>{ $term }</b>.
    🔥 Personal streak: <b>{ $personal }</b> days · 👥 Group streak: <b>{ $group }</b> days{ $status }
quiz-correct-group-new-record-with-streak =
    ✅ { $name } got it right! It was <b>{ $term }</b>.
    🎉 <b>New personal record!</b> { $max } days.
    🔥 Personal streak: <b>{ $personal }</b> days · 👥 Group streak: <b>{ $group }</b> days{ $status }

tips-menu-title =
    💡 <b>Quick bot guide</b>

    Choose an item to see how to use it.
tips-menu-back = ← Back to tips
tips-btn-explain = 💬 Explain
tips-btn-compare = 🔀 Compare
tips-btn-path = 💻 Path
tips-btn-quiz = 🧠 Quiz
tips-btn-glossary = 🔍 Glossary
tips-btn-categories = 📂 Categories
tips-btn-streak = 🔥 Streak
tips-btn-leaderboard = 🏆 Leaderboard
tips-btn-help = 📘 Help
tips-explain =
    💬 <b>How to use /explain</b>

    1. Reply to a message in a group
    2. Send <code>/explain</code>
    3. The bot detects Solana terms and explains them instantly

    Example: reply to a message about "turbine" and send <code>/explain</code>.
tips-compare =
    🔀 <b>How to use /compare</b>

    Compare two concepts side by side:
    <code>/compare poh pos</code>
    <code>/compare account pda</code>
tips-path =
    💻 <b>How to use /path</b>

    Send <code>/path</code> to open guided learning paths.
    Pick a path, move term by term, then finish with the path quiz.
tips-quiz =
    🧠 <b>How to use /quiz</b>

    Available levels:
    <code>/quiz</code>
    <code>/quiz easy</code>
    <code>/quiz medium</code>
    <code>/quiz hard</code>
    <code>/quiz 1</code> through <code>/quiz 5</code>
tips-glossary =
    🔍 <b>How to use /glossary</b>

    Search for a term directly:
    <code>/glossary proof-of-history</code>

    Inline also works:
    <code>@{ $bot_username } poh</code>
tips-categories =
    📂 <b>How to use categories</b>

    Send <code>/categories</code> to browse the menu
    or <code>/category defi</code> to open one category directly.
tips-streak =
    🔥 <b>How to use /streak</b>

    In DMs, it shows your personal streak.
    In groups, it shows your streak plus the group's shared streak.
tips-leaderboard =
    🏆 <b>How to use /leaderboard</b>

    In DMs, it shows the global ranking.
    In groups, it shows the local ranking for that group.
tips-help =
    📘 <b>How to use /help</b>

    Send <code>/help</code> to see all main commands organized by use case.

quiz-menu-title = 🧠 <b>Quiz Setup</b>
quiz-menu-mode = Mode
quiz-menu-mode-single = 1 question
quiz-menu-mode-round = Round
quiz-menu-difficulty = Difficulty
quiz-menu-difficulty-all = Any
quiz-menu-difficulty-easy = Easy
quiz-menu-difficulty-medium = Medium
quiz-menu-difficulty-hard = Hard
quiz-menu-difficulty-level = Level { $level }
quiz-menu-count = Questions
quiz-menu-failure = On wrong answer
quiz-menu-failure-continue = Keep going
quiz-menu-failure-sudden-death = Elimination
quiz-menu-start = ▶️ Start
quiz-menu-group-note = Groups use the fast mode: one question at a time to avoid spam.
quiz-round-progress = 🎯 <b>Question { $current }/{ $total }</b> · ✅ { $correct } · ❌ { $wrong } · { $mode }
quiz-round-count-adjusted = ⚠️ I adjusted the round from <b>{ $requested }</b> to <b>{ $available }</b> questions based on the available pool.
quiz-round-feedback-correct = ✅ Correct! It was <b>{ $term }</b>.
quiz-round-feedback-correct-streak = ✅ Correct! It was <b>{ $term }</b>. 🔥 Streak: <b>{ $current }</b>
quiz-round-feedback-wrong = ❌ Wrong. The correct answer was <b>{ $term }</b>.
quiz-round-summary =
    🏁 <b>Round finished</b>

    Questions answered: <b>{ $answered }/{ $total }</b>
    Correct: <b>{ $correct }</b>
    Wrong: <b>{ $wrong }</b>
    Accuracy: <b>{ $accuracy }%</b>
    Difficulty: <b>{ $difficulty }</b>
quiz-btn-play-again = 🔁 Play Again
quiz-btn-menu = ⚙️ Quiz Menu

language-changed-confirmation =
    ✅ Language changed to English.

    ℹ️ <i>The command menu (/) follows your Telegram app language. Use /help to see all commands in English.</i>

start-language-picker =
    🌐 <b>Choose your language</b>
    Choose your language below.
start-language-option-pt = 🇧🇷 Portuguese
start-language-option-en = 🇺🇸 English
start-language-option-es = 🇪🇸 Spanish

group-language-picker =
    🌐 <b>Choose this group's language</b>

    Pick the language for this group.
    After that, I'll send the menu and the group onboarding in the selected language.
group-language-changed = ✅ Group language updated.
group-onboarding-tips =
    💡 <b>Quick start in groups</b>

    Use <code>/explain</code> by replying to a message.
    Use <code>/compare term1 term2</code> to compare concepts.
    Use <code>/quiz</code> for fast practice in the group.
