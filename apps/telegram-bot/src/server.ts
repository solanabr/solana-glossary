// src/server.ts
import express from "express";
import { webhookCallback } from "grammy";
import { bot } from "./bot.js";
import { config } from "./config.js";
import { startNotificationScheduler } from "./scheduler/notifications.js";

async function setCommands() {
  const commandSets = [
    {
      lang: "pt",
      commands: [
        { command: "start", description: "Iniciar o bot" },
        { command: "glossario", description: "Buscar um termo em português" },
        { command: "aleatorio", description: "Termo aleatório" },
        { command: "categorias", description: "Explorar as 14 categorias" },
        { command: "termododia", description: "Termo do dia" },
        { command: "quiz", description: "Iniciar quiz" },
        { command: "favoritos", description: "Meus termos salvos" },
        { command: "historico", description: "Últimos termos vistos" },
        { command: "streak", description: "Ver seu streak de quizzes" },
        { command: "leaderboard", description: "Ranking global" },
        { command: "idioma", description: "Trocar idioma (pt, en, es)" },
        { command: "help", description: "Ver todos os comandos" },
      ],
    },
    {
      lang: "en",
      commands: [
        { command: "start", description: "Start the bot" },
        { command: "glossary", description: "Search a Solana term" },
        { command: "random", description: "Random term" },
        { command: "categories", description: "Browse all 14 categories" },
        { command: "termofday", description: "Term of the day" },
        { command: "quiz", description: "Start quiz" },
        { command: "favorites", description: "Saved terms" },
        { command: "history", description: "Recently viewed terms" },
        { command: "streak", description: "View your quiz streak" },
        { command: "leaderboard", description: "Global ranking" },
        { command: "language", description: "Change language (pt, en, es)" },
        { command: "help", description: "Show all commands" },
      ],
    },
    {
      lang: "es",
      commands: [
        { command: "start", description: "Iniciar el bot" },
        { command: "glosario", description: "Buscar un término en español" },
        { command: "aleatorio", description: "Término aleatorio" },
        { command: "categorias", description: "Explorar las 14 categorías" },
        { command: "terminodelhoy", description: "Término del día" },
        { command: "quiz", description: "Iniciar quiz" },
        { command: "favoritos", description: "Mis términos guardados" },
        { command: "historial", description: "Términos vistos recientemente" },
        { command: "streak", description: "Ver tu racha de quizzes" },
        { command: "leaderboard", description: "Ranking global" },
        { command: "idioma", description: "Cambiar idioma (pt, en, es)" },
        { command: "help", description: "Ver todos los comandos" },
      ],
    },
    {
      lang: "default",
      commands: [
        { command: "start", description: "Start the bot" },
        { command: "glossary", description: "Search a Solana term" },
        { command: "random", description: "Random term" },
        { command: "categories", description: "Browse all 14 categories" },
        { command: "termofday", description: "Term of the day" },
        { command: "quiz", description: "Start quiz" },
        { command: "favorites", description: "Saved terms" },
        { command: "history", description: "Recently viewed terms" },
        { command: "streak", description: "View your quiz streak" },
        { command: "leaderboard", description: "Global ranking" },
        { command: "language", description: "Change language (pt, en, es)" },
        { command: "help", description: "Show all commands" },
      ],
    },
  ];

  const promises = commandSets.map((set) =>
    set.lang === "default"
      ? bot.api.setMyCommands(set.commands)
      : bot.api.setMyCommands(set.commands, { language_code: set.lang as "pt" | "en" | "es" })
  );

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    const lang = commandSets[index].lang;
    if (result.status === "fulfilled") {
      console.log(`✓ Commands registered for ${lang}`);
    } else {
      console.error(`✗ Failed to set commands for ${lang}:`, result.reason);
    }
  });
}

async function start() {
  // Start notification scheduler for streak reminders
  startNotificationScheduler(bot);

  // Set chat menu button to show commands menu
  try {
    await bot.api.setChatMenuButton({
      menu_button: { type: "commands" },
    });
    console.log("✓ Chat menu button configured");
  } catch (err) {
    console.error("✗ Failed to set chat menu button:", err);
  }

  if (config.isProduction) {
    // Webhook mode — used on Railway
    const app = express();
    app.use(express.json());

    // Health check endpoint for Railway
    app.get("/", (req, res) => {
      res.status(200).json({ status: "ok", service: "solana-glossary-bot" });
    });

    app.use("/webhook", webhookCallback(bot, "express"));

    app.listen(config.port, () => {
      console.log(`Webhook server running on port ${config.port}`);
    });

    await bot.api.setWebhook(`${config.webhookDomain}/webhook`);
    console.log(`Webhook set to ${config.webhookDomain}/webhook`);
  } else {
    // Long polling — used locally
    console.log("Starting bot in long polling mode...");
    await bot.start({
      onStart: (info) => console.log(`Bot @${info.username} started`),
    });
  }
}

setCommands().then(start).catch((err) => {
  console.error("Failed to start bot:", err);
  process.exit(1);
});
