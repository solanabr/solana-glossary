import { INTENT_MAP } from "./intentMap";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

export function detectIntent(input: string): string[] {
  const normalized = normalize(input);
  const words = normalized.split(/\s+/);
  const found = new Set<string>();

  for (const key of Object.keys(INTENT_MAP)) {
    if (normalized.includes(key)) {
      found.add(key);
      continue;
    }
    for (const word of words) {
      if (key.includes(word) && word.length > 3) {
        found.add(key);
        break;
      }
    }
  }

  return Array.from(found);
}
