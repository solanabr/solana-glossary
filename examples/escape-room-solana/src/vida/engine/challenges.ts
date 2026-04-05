/**
 * @arquivo challenges.ts
 * @descricao Gerador de quiz para casas de desafio
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { getTermsByCategory, type Category } from "@stbr/solana-glossary";
import type { ChallengeQuestion, BoardThemeId } from "./types";
import { getBoardConfig } from "./themes";
import ptOverrides from "../../../../../data/i18n/pt.json";
import esOverrides from "../../../../../data/i18n/es.json";

const LOCALE_DATA: Record<
  string,
  Record<string, { term?: string; definition?: string }>
> = {
  pt: ptOverrides as Record<string, { term?: string; definition?: string }>,
  es: esOverrides as Record<string, { term?: string; definition?: string }>,
};

function localize(
  id: string,
  term: string,
  def: string,
  locale?: string,
): { term: string; definition: string } {
  const lc = locale === "pt-BR" ? "pt" : locale;
  const o = lc ? LOCALE_DATA[lc]?.[id] : undefined;
  return { term: o?.term ?? term, definition: o?.definition ?? def };
}

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Gera uma pergunta quiz para uma casa de desafio */
export function generateChallenge(
  theme: BoardThemeId,
  locale?: string,
): ChallengeQuestion {
  const cfg = getBoardConfig(theme);
  const allTerms = cfg.categories.flatMap((cat) =>
    getTermsByCategory(cat as Category),
  );
  const valid = allTerms.filter((t) => t.definition.length > 0);
  const shuffled = shuffle(valid);
  const correct = shuffled[0];
  const distractors = shuffled.slice(1, 4);

  const { term, definition } = localize(
    correct.id,
    correct.term,
    correct.definition,
    locale,
  );
  const options = shuffle([
    term,
    ...distractors.map(
      (d) => localize(d.id, d.term, d.definition, locale).term,
    ),
  ]);

  return {
    term,
    definition,
    options,
    correctIndex: options.indexOf(term),
  };
}
