// src/config.ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && (process.env["VITEST"] === "true" || process.env["NODE_ENV"] === "test")) {
    return "test-value";
  }
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  botToken: requireEnv("BOT_TOKEN"),
  webhookDomain: process.env["WEBHOOK_DOMAIN"] ?? "",
  port: parseInt(process.env["PORT"] ?? "3000", 10),
  isProduction: !!process.env["WEBHOOK_DOMAIN"],
};

// Image assets hosted on GitHub
export const ASSETS_BASE_URL =
  "https://raw.githubusercontent.com/lrafasouza/solana-glossary/main/apps/telegram-bot/assets";

export const IMAGES = {
  languagePicker: `${ASSETS_BASE_URL}/chooselangugage.png`,
  welcomeBanner: `${ASSETS_BASE_URL}/welcome-banner.png`,
} as const;
