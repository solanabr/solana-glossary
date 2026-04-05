import type { GlossaryTerm } from "../types";

export type ContextMode = "concise" | "expanded" | "structured";

export interface StructuredContext {
  context: Array<{
    term: string;
    definition: string;
    category: string;
    related: string[];
  }>;
}

export function buildContext(terms: GlossaryTerm[], mode: ContextMode): string | StructuredContext {
  if (mode === "concise") {
    return terms
      .map((t) => `${t.term}: ${t.definition || "No definition available."}`)
      .join("\n");
  }

  if (mode === "expanded") {
    return terms
      .map((t) => {
        let entry = `${t.term}\n${t.definition || "No definition available."}`;
        if (t.related && t.related.length > 0) {
          entry += `\nRelated: ${t.related.join(", ")}`;
        }
        return entry;
      })
      .join("\n\n");
  }

  return {
    context: terms.map((t) => ({
      term: t.term,
      definition: t.definition || "No definition available.",
      category: t.category,
      related: t.related ?? [],
    })),
  };
}
