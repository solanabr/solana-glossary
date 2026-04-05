/**
 * @arquivo textUtils.ts
 * @descricao Utilidades de texto para puzzles — fuzzy match, mascaramento, cifra
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

/** Distancia de Levenshtein entre duas strings */
export function levenshtein(a: string, b: string): number {
  const la = a.length,
    lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () =>
    Array(lb + 1).fill(0),
  );
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[la][lb];
}

/** Verifica se a resposta e proxima o suficiente do termo correto */
export function fuzzyMatch(
  input: string,
  target: string,
  maxDist = 2,
): boolean {
  const a = input.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (a === b) return true;
  return levenshtein(a, b) <= maxDist;
}

/** Mascara um termo na definicao, substituindo por underscores */
export function maskTermInDefinition(definition: string, term: string): string {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const placeholder = "▇".repeat(Math.min(term.length, 12));
  return definition.replace(regex, placeholder);
}

/**
 * Cifra uma definicao para o puzzle CodeBreaker.
 * Revela apenas a primeira letra de cada frase, resto vira pontos.
 */
export function cipherDefinition(definition: string): string {
  const sentences = definition.split(/(?<=[.!?])\s+/);
  return sentences
    .map((s) => {
      if (s.length === 0) return s;
      const first = s.charAt(0);
      const rest = s.slice(1).replace(/[a-zA-ZÀ-ÿ]/g, "•");
      return first + rest;
    })
    .join(" ");
}

/** Extrai trechos-chave de uma definicao (substantivos/verbos longos) */
export function extractKeyPhrases(definition: string, count = 3): string[] {
  const words = definition.split(/\s+/).filter((w) => w.length >= 5);
  const step = Math.max(1, Math.floor(words.length / (count + 1)));
  const phrases: string[] = [];
  for (let i = step; i < words.length && phrases.length < count; i += step) {
    phrases.push(words[i].replace(/[.,;:!?]$/, ""));
  }
  return phrases;
}

/** Embaralha as letras de uma string (para word scramble) */
export function scrambleWord(word: string, seed: number): string {
  const chars = word.split("");
  let s = seed;
  for (let i = chars.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = Math.floor(((s - 1) / 2147483646) * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
