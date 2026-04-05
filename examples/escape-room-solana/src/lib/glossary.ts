/**
 * @arquivo glossary.ts
 * @descricao Integracao com SDK @stbr/solana-glossary — busca e selecao de termos
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import {
  getTermsByCategory,
  type GlossaryTerm,
  type Category,
} from "@stbr/solana-glossary";
import type { ThemeId, LevelId } from "../engine/themes";
import { getThemeConfig, getLevelConfig } from "../engine/themes";

/**
 * Importa locales diretamente via Vite (o require() do SDK nao funciona no browser).
 * Vite resolve imports estaticos de JSON sem problemas.
 */
import ptOverrides from "../../../../data/i18n/pt.json";
import esOverrides from "../../../../data/i18n/es.json";

/** Termo processado para uso nos puzzles */
export interface PuzzleTerm {
  id: string;
  term: string;
  definition: string;
  category: Category;
  /** IDs de termos relacionados (usado por ConnectionWeb, RelatedTerms, etc.) */
  related: string[];
  /** Abreviacoes/aliases (usado por AliasResolver) */
  aliases: string[];
}

/** Mapa de locales carregados estaticamente (Vite-compatible) */
const LOCALE_DATA: Record<
  string,
  Record<string, { term?: string; definition?: string }>
> = {
  pt: ptOverrides as Record<string, { term?: string; definition?: string }>,
  es: esOverrides as Record<string, { term?: string; definition?: string }>,
};

/** Normaliza locale: "pt-BR" → "pt" */
function normalizeLocale(locale: string): string {
  return (
    ({ "pt-BR": "pt", "pt-br": "pt" } as Record<string, string>)[locale] ??
    locale
  );
}

/** Aplica overrides de locale nos termos (substitui getLocalizedTerms do SDK) */
function applyLocale(terms: GlossaryTerm[], locale: string): GlossaryTerm[] {
  const overrides = LOCALE_DATA[locale];
  if (!overrides) return terms;
  return terms.map((t) => {
    const o = overrides[t.id];
    if (!o) return t;
    return {
      ...t,
      term: o.term ?? t.term,
      definition: o.definition ?? t.definition,
    };
  });
}

/**
 * Busca todos os termos das categorias de um tema.
 * Aplica locale diretamente (sem depender do require() do SDK).
 */
function getThemeTerms(themeId: ThemeId, locale?: string): GlossaryTerm[] {
  const theme = getThemeConfig(themeId);
  const base = theme.categories.flatMap((cat) => getTermsByCategory(cat));
  const sdkLocale = locale ? normalizeLocale(locale) : undefined;
  if (sdkLocale && sdkLocale !== "en") return applyLocale(base, sdkLocale);
  return base;
}

/**
 * Embaralha array usando Fisher-Yates.
 * Usa seed opcional para reprodutibilidade.
 */
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const copy = [...arr];
  // Normaliza seed para evitar overflow em Date.now() * 16807
  let s = seed ? (Math.abs(seed) % 2147483646) + 1 : 0;
  const rand = s
    ? () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      }
    : Math.random;

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Seleciona termos para um puzzle.
 * Retorna `count` termos aleatorios (com 3x pool para variedade).
 * Filtra termos sem definicao.
 */
export function selectPuzzleTerms(
  themeId: ThemeId,
  levelId: LevelId,
  locale?: string,
  sessionSeed?: number,
): PuzzleTerm[] {
  const level = getLevelConfig(themeId, levelId);
  const allTerms = getThemeTerms(themeId, locale);

  // Filtra termos que tem definicao preenchida
  const valid = allTerms.filter((t) => t.definition.length > 0);

  // Embaralha e pega o necessario
  const shuffled = shuffle(valid, sessionSeed);
  const selected = shuffled.slice(0, level.termCount);

  // Ordena por dificuldade crescente (definicao menor = mais facil)
  selected.sort((a, b) => a.definition.length - b.definition.length);

  return selected.map((t) => ({
    id: t.id,
    term: t.term,
    definition: t.definition,
    category: t.category as Category,
    related: t.related ?? [],
    aliases: t.aliases ?? [],
  }));
}

/**
 * Gera uma dica para um termo.
 * Revela a primeira letra + tamanho da palavra.
 */
export function generateHint(term: PuzzleTerm): string {
  const firstLetter = term.term.charAt(0);
  const wordCount = term.term.split(/\s+/).length;
  const charCount = term.term.length;
  return `Comeca com "${firstLetter}", ${wordCount} palavra(s), ${charCount} caracteres`;
}

/**
 * Retorna o total de termos disponiveis para um tema.
 * Util para exibir na UI.
 */
export function getThemeTermCount(themeId: ThemeId): number {
  return getThemeTerms(themeId).filter((t) => t.definition.length > 0).length;
}
