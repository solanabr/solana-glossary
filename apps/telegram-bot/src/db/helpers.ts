export function getBotDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function getUtcDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(date: string, offsetDays: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export function getNextMonday(): Date {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
  nextMonday.setHours(0, 0, 0, 0);
  if (nextMonday <= now) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  return nextMonday;
}

export function canUseFreeze(freezeResetDate: string | null): boolean {
  if (!freezeResetDate) return true;
  return new Date() > new Date(freezeResetDate);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) return Number(value);
  return fallback;
}
