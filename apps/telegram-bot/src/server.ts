// src/server.ts
import express from "express";
import { webhookCallback } from "grammy";
import { bot } from "./bot.js";
import { config } from "./config.js";

async function setCommands() {
  const commandSets = [
    {
      lang: "pt",
      commands: [
        { command: "start", description: "Iniciar o bot" },
        { command: "glossario", description: "Buscar um termo em português" },
        { command: "categorias", description: "Explorar as 14 categorias" },
        { command: "termododia", description: "Termo do dia" },
        { command: "idioma", description: "Trocar idioma (pt, en, es)" },
        { command: "help", description: "Ver todos os comandos" },
      ],
    },
    {
      lang: "en",
      commands: [
        { command: "start", description: "Start the bot" },
        { command: "glossary", description: "Search a Solana term" },
        { command: "categories", description: "Browse all 14 categories" },
        { command: "termofday", description: "Term of the day" },
        { command: "language", description: "Change language (pt, en, es)" },
        { command: "help", description: "Show all commands" },
      ],
    },
    {
      lang: "es",
      commands: [
        { command: "start", description: "Iniciar el bot" },
        { command: "glosario", description: "Buscar un término en español" },
        { command: "categorias", description: "Explorar las 14 categorías" },
        { command: "terminodelhoy", description: "Término del día" },
        { command: "idioma", description: "Cambiar idioma (pt, en, es)" },
        { command: "help", description: "Ver todos los comandos" },
      ],
    },
    {
      lang: "default",
      commands: [
        { command: "start", description: "Start the bot" },
        { command: "glossary", description: "Search a Solana term" },
        { command: "categories", description: "Browse all 14 categories" },
        { command: "termofday", description: "Term of the day" },
        { command: "language", description: "Change language (pt, en, es)" },
        { command: "help", description: "Show all commands" },
      ],
    },
  ];

  const promises = commandSets.map((set) =>
    set.lang === "default"
      ? bot.api.setMyCommands(set.commands)
      : bot.api.setMyCommands(set.commands, { language_code: set.lang })
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
  if (config.isProduction) {
    // Webhook mode — used on Railway
    const app = express();
    app.use(express.json());
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
