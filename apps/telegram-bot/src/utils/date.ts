export const BOT_TIMEZONE = "America/Sao_Paulo";

export function getBotDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: BOT_TIMEZONE,
  }).format(date);
}
