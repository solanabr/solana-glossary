import glossaryBundle from "../../data/glossary-bundle.json";
import type { GlossaryLiteTerm } from "./types";

let allTerms: GlossaryLiteTerm[] = [];
let termsById = new Map<string, GlossaryLiteTerm>();
let aliasToId = new Map<string, string>();

function ensureGlossaryLoaded() {
  if (allTerms.length > 0) {
    return;
  }

  allTerms = glossaryBundle as GlossaryLiteTerm[];
  termsById = new Map(allTerms.map((term) => [term.id, term]));
  aliasToId = new Map();

  for (const term of allTerms) {
    aliasToId.set(term.id.toLowerCase(), term.id);
    aliasToId.set(term.term.toLowerCase(), term.id);

    for (const alias of term.aliases ?? []) {
      aliasToId.set(alias.toLowerCase(), term.id);
    }
  }
}

export async function initializeLocalGlossary(_extensionPath: string): Promise<void> {
  ensureGlossaryLoaded();
}

export function getLocalTerms(): GlossaryLiteTerm[] {
  ensureGlossaryLoaded();
  return allTerms;
}

export function getLocalTerm(idOrAlias: string): GlossaryLiteTerm | undefined {
  ensureGlossaryLoaded();
  const normalized = idOrAlias.trim().toLowerCase();
  return termsById.get(normalized) ?? termsById.get(aliasToId.get(normalized) ?? "");
}

export function searchLocalGlossary(query: string, limit = 20): GlossaryLiteTerm[] {
  ensureGlossaryLoaded();
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return allTerms.slice(0, limit);
  }

  return allTerms
    .filter((term) => {
      return (
        term.id.toLowerCase().includes(normalized) ||
        term.term.toLowerCase().includes(normalized) ||
        term.definition.toLowerCase().includes(normalized) ||
        (term.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalized))
      );
    })
    .slice(0, limit);
}

export function getRelatedLocalTerms(term: GlossaryLiteTerm, limit = 3): GlossaryLiteTerm[] {
  ensureGlossaryLoaded();
  return (term.related ?? [])
    .map((id) => getLocalTerm(id))
    .filter((candidate): candidate is GlossaryLiteTerm => Boolean(candidate))
    .slice(0, limit);
}

export function detectAnchorTermFromText(text: string, fallbackId = "account"): GlossaryLiteTerm {
  ensureGlossaryLoaded();
  const lowerText = text.toLowerCase();
  const scoreById = new Map<string, number>();

  for (const term of allTerms) {
    const candidates = [term.id, term.term, ...(term.aliases ?? [])];
    for (const candidate of candidates) {
      const normalized = candidate.trim().toLowerCase();
      if (!normalized || normalized.length < 3) continue;
      if (!lowerText.includes(normalized)) continue;

      scoreById.set(term.id, (scoreById.get(term.id) ?? 0) + (normalized.includes(" ") ? 3 : 1));
    }
  }

  const ranked = [...scoreById.entries()].sort((left, right) => right[1] - left[1]);
  const top = ranked[0]?.[0];
  return getLocalTerm(top ?? fallbackId) ?? getLocalTerm(fallbackId) ?? allTerms[0];
}
