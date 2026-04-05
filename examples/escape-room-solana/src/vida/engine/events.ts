/**
 * @arquivo events.ts
 * @descricao Cartas de evento com termos do SDK
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { getTermsByCategory, type Category } from "@stbr/solana-glossary";
import type { EventCard, BoardThemeId } from "./types";
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

const EFFECTS: Array<{ effect: EventCard["effect"]; value: number }> = [
  { effect: "advance", value: 3 },
  { effect: "advance", value: 2 },
  { effect: "retreat", value: 2 },
  { effect: "retreat", value: 3 },
  { effect: "bonus", value: 100 },
  { effect: "bonus", value: 75 },
  { effect: "penalty", value: 50 },
  { effect: "penalty", value: 75 },
];

/** Compra uma carta de evento aleatoria baseada no tema */
export function drawEventCard(theme: BoardThemeId, locale?: string): EventCard {
  const cfg = getBoardConfig(theme);
  const allTerms = cfg.categories.flatMap((cat) =>
    getTermsByCategory(cat as Category),
  );
  const valid = allTerms.filter((t) => t.definition.length > 0);
  const raw = valid[Math.floor(Math.random() * valid.length)];
  const { term, definition } = localize(
    raw.id,
    raw.term,
    raw.definition,
    locale,
  );
  const fx = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

  return {
    term,
    definition,
    effect: fx.effect,
    value: fx.value,
    category: raw.category,
  };
}
