# Bot Visual Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual images to bot onboarding: language picker, welcome banner, and chat menu button

**Architecture:** GitHub-hosted images with raw.githubusercontent.com URLs, graceful fallback to text-only mode

**Tech Stack:** TypeScript, Grammy, Telegram Bot API, GitHub raw URLs

---

## Task 1: Create assets folder structure and .gitkeep

**Files:**
- Create: `apps/telegram-bot/assets/.gitkeep`

- [ ] **Step 1: Create assets directory with .gitkeep**

```bash
mkdir -p apps/telegram-bot/assets
touch apps/telegram-bot/assets/.gitkeep
```

- [ ] **Step 2: Add placeholder README for images**

Create `apps/telegram-bot/assets/README.md`:
```markdown
# Bot Image Assets

Images hosted on GitHub and served via raw.githubusercontent.com

## Files Required

- `language-picker.png` - 1200x400px, shown on language selection
- `welcome-banner.png` - 1200x600px, shown on welcome message

## URLs After Upload

- Language Picker: `https://raw.githubusercontent.com/solanabr/solana-glossary/main/apps/telegram-bot/assets/language-picker.png`
- Welcome Banner: `https://raw.githubusercontent.com/solanabr/solana-glossary/main/apps/telegram-bot/assets/welcome-banner.png`
```

- [ ] **Step 3: Commit folder structure**

```bash
git add apps/telegram-bot/assets/
git commit -m "chore: create assets folder for bot images"
```

---

## Task 2: Update config.ts with image URLs

**Files:**
- Modify: `apps/telegram-bot/src/config.ts`

- [ ] **Step 1: Add image configuration constants**

Add to `config.ts` after existing config:
```typescript
// Image assets hosted on GitHub
export const ASSETS_BASE_URL = "https://raw.githubusercontent.com/solanabr/solana-glossary/main/apps/telegram-bot/assets";

export const IMAGES = {
  languagePicker: `${ASSETS_BASE_URL}/language-picker.png`,
  welcomeBanner: `${ASSETS_BASE_URL}/welcome-banner.png`,
} as const;
```

- [ ] **Step 2: Verify config imports**

Ensure config.ts exports everything:
```typescript
export { config, ASSETS_BASE_URL, IMAGES };
```

- [ ] **Step 3: Commit**

```bash
git add apps/telegram-bot/src/config.ts
git commit -m "feat: add image URL configuration for bot assets"
```

---

## Task 3: Implement image in language picker

**Files:**
- Modify: `apps/telegram-bot/src/commands/start.ts`

- [ ] **Step 1: Import IMAGES from config**

Add import:
```typescript
import { IMAGES } from "../config.js";
```

- [ ] **Step 2: Update language picker to use image**

Replace the language picker section in `startCommand`:
```typescript
// New user — no language set yet → show onboarding picker with image
if (!ctx.session.language) {
  await ctx.replyWithPhoto(IMAGES.languagePicker, {
    caption: LANGUAGE_PICKER,
    parse_mode: "HTML",
    reply_markup: languageKeyboard,
  });
  return;
}
```

- [ ] **Step 3: Add error handling with fallback**

Wrap in try-catch for graceful fallback:
```typescript
// New user — no language set yet → show onboarding picker with image
if (!ctx.session.language) {
  try {
    await ctx.replyWithPhoto(IMAGES.languagePicker, {
      caption: LANGUAGE_PICKER,
      parse_mode: "HTML",
      reply_markup: languageKeyboard,
    });
  } catch (err) {
    // Fallback to text-only if image fails
    await ctx.reply(LANGUAGE_PICKER, {
      parse_mode: "HTML",
      reply_markup: languageKeyboard,
    });
  }
  return;
}
```

- [ ] **Step 4: Remove old BANNER_URL constant**

Remove or update the old `BANNER_URL` export since we're using `IMAGES.welcomeBanner` now.

- [ ] **Step 5: Commit**

```bash
git add apps/telegram-bot/src/commands/start.ts
git commit -m "feat: add image to language picker with fallback"
```

---

## Task 4: Update welcome banner implementation

**Files:**
- Modify: `apps/telegram-bot/src/commands/start.ts`

- [ ] **Step 1: Update sendWelcome to use IMAGES.welcomeBanner**

Update `sendWelcome` function:
```typescript
export async function sendWelcome(ctx: MyContext): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  
  try {
    await ctx.replyWithPhoto(IMAGES.welcomeBanner, {
      caption: text,
      parse_mode: "HTML",
    });
  } catch (err) {
    // Fallback to text-only
    await ctx.reply(text, { parse_mode: "HTML" });
  }

  // Send onboarding tips as follow-up
  await ctx.reply(ctx.t("onboarding-tips"), { parse_mode: "HTML" });
}
```

- [ ] **Step 2: Remove old BANNER_URL usage**

Ensure old `BANNER_URL` logic is completely replaced.

- [ ] **Step 3: Commit**

```bash
git add apps/telegram-bot/src/commands/start.ts
git commit -m "feat: update welcome banner to use GitHub-hosted image"
```

---

## Task 5: Add setChatMenuButton in server.ts

**Files:**
- Modify: `apps/telegram-bot/src/server.ts`

- [ ] **Step 1: Add setChatMenuButton after bot startup**

In the `start()` function, after bot starts, add:
```typescript
async function start() {
  // Set chat menu button
  try {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "commands",
      },
    });
    console.log("✓ Chat menu button configured");
  } catch (err) {
    console.error("✗ Failed to set chat menu button:", err);
  }

  if (config.isProduction) {
    // ... rest of existing code
```

- [ ] **Step 2: Alternative: web_app menu button**

If you want a custom web app button instead:
```typescript
await bot.api.setChatMenuButton({
  menu_button: {
    type: "web_app",
    text: "📖 Glossary",
    web_app: { url: "https://solana.com/docs/terminology" },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/telegram-bot/src/server.ts
git commit -m "feat: add chat menu button configuration"
```

---

## Task 6: Build and verify compilation

**Files:**
- All modified files

- [ ] **Step 1: Build the project**

```bash
cd apps/telegram-bot
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 2: Copy locales to dist (if needed)**

```bash
cp -r src/i18n/locales dist/i18n/
```

- [ ] **Step 3: Verify dist/config.js has IMAGES**

Check that compiled output includes the new exports.

- [ ] **Step 4: Commit if build succeeds**

```bash
git add -A
git commit -m "build: compile bot with image features"
```

---

## Task 7: Create placeholder images (info only)

**Note:** This task is for documentation - actual image creation happens outside code.

- [ ] **Step 1: Document image requirements in README**

Already done in `assets/README.md` from Task 1.

- [ ] **Step 2: Note for user**

User needs to:
1. Create `language-picker.png` (1200x400px)
2. Create `welcome-banner.png` (1200x600px)
3. Place in `apps/telegram-bot/assets/`
4. Commit and push to GitHub
5. Images will be available at raw.githubusercontent.com URLs

---

## Testing Checklist

- [ ] Language picker shows image + caption + buttons
- [ ] Welcome banner shows image + caption
- [ ] Fallback works if images 404 (text-only mode)
- [ ] Menu button appears in chat
- [ ] All three languages work correctly
- [ ] No console errors on startup

---

## Post-Implementation

After images are created and uploaded:
1. Test with real images
2. Verify load times (<2s)
3. Check mobile display
4. Update this plan with any adjustments needed
