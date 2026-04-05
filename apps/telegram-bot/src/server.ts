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
        { command: "glossario", description: "Buscar um termo" },
        { command: "explicar", description: "Explicar termos de uma mensagem" },
        { command: "comparar", description: "Comparar dois conceitos Solana" },
        { command: "path", description: "Trilha para desenvolvedores" },
        { command: "aleatorio", description: "Termo aleatorio" },
        { command: "categorias", description: "Explorar as 14 categorias" },
        { command: "termododia", description: "Termo do dia" },
        { command: "quiz", description: "Iniciar quiz" },
        { command: "favoritos", description: "Meus termos salvos" },
        { command: "historico", description: "Ultimos termos vistos" },
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
        { command: "explain", description: "Explain terms from a message" },
        { command: "compare", description: "Compare two Solana concepts" },
        { command: "path", description: "Developer learning paths" },
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
        { command: "glosario", description: "Buscar un termino en espanol" },
        { command: "explicar", description: "Explicar terminos de un mensaje" },
        { command: "comparar", description: "Comparar dos conceptos Solana" },
        { command: "path", description: "Rutas para desarrolladores" },
        { command: "aleatorio", description: "Termino aleatorio" },
        { command: "categorias", description: "Explorar las 14 categorias" },
        { command: "terminodelhoy", description: "Termino del dia" },
        { command: "quiz", description: "Iniciar cuestionario" },
        { command: "favoritos", description: "Mis terminos guardados" },
        { command: "historial", description: "Terminos vistos recientemente" },
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
        { command: "explain", description: "Explain terms from a message" },
        { command: "compare", description: "Compare two Solana concepts" },
        { command: "path", description: "Developer learning paths" },
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
      : bot.api.setMyCommands(set.commands, {
          language_code: set.lang as "pt" | "en" | "es",
        }),
  );

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    const lang = commandSets[index].lang;
    if (result.status === "fulfilled") {
      console.log(`Commands registered for ${lang}`);
    } else {
      console.error(`Failed to set commands for ${lang}:`, result.reason);
    }
  });
}

async function start() {
  startNotificationScheduler(bot);

  try {
    await bot.api.setChatMenuButton({
      menu_button: { type: "commands" },
    });
    console.log("Chat menu button configured");
  } catch (err) {
    console.error("Failed to set chat menu button:", err);
  }

  if (config.isProduction) {
    const app = express();
    app.use(express.json());

    app.get("/", (_req, res) => {
      res.status(200).json({ status: "ok", service: "solana-glossary-bot" });
    });

    app.use("/webhook", webhookCallback(bot, "express"));

    app.listen(config.port, () => {
      console.log(`Webhook server running on port ${config.port}`);
    });

    await bot.api.setWebhook(`${config.webhookDomain}/webhook`);
    console.log(`Webhook set to ${config.webhookDomain}/webhook`);
    return;
  }

  console.log("Starting bot in long polling mode...");
  await bot.start({
    onStart: (info) => console.log(`Bot @${info.username} started`),
  });
}

setCommands()
  .then(start)
  .catch((err) => {
    console.error("Failed to start bot:", err);
    process.exit(1);
  });
