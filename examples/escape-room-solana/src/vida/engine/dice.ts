/**
 * @arquivo dice.ts
 * @descricao Logica do dado virtual (1-6)
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

/** Rola o dado (1-6) */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** Faces do dado para exibicao visual */
export const DICE_FACES: Record<number, string[]> = {
  1: ["     ", "  ●  ", "     "],
  2: ["●    ", "     ", "    ●"],
  3: ["●    ", "  ●  ", "    ●"],
  4: ["●   ●", "     ", "●   ●"],
  5: ["●   ●", "  ●  ", "●   ●"],
  6: ["●   ●", "●   ●", "●   ●"],
};
