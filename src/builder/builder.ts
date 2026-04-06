import type { GlossaryTerm } from "../types";
import { allTerms } from "../index";
import { getLocalizedTerms } from "../i18n";
import { detectIntent } from "./detectIntent";
import { resolveConcepts } from "./resolveConcepts";
import { expandConcepts } from "./expandConcepts";
import { generateArchitecture } from "./generateArchitecture";
import type { Architecture } from "./generateArchitecture";
import { generateStructure } from "./generateStructure";

export interface BuildResult {
  concepts: GlossaryTerm[];
  architecture: Architecture;
  structure: string;
}

export interface BuildOptions {
  expand?: boolean;
  lang?: "en" | "es" | "pt";
}

export function buildProject(input: string, options: BuildOptions = {}): BuildResult {
  const { expand = false, lang } = options;

  const terms = lang && lang !== "en" ? getLocalizedTerms(lang) : allTerms;

  const intents = detectIntent(input);
  const base = resolveConcepts(intents.length > 0 ? intents : ["general"], terms);
  const concepts = expand ? expandConcepts(base, terms) : base;
  const architecture = generateArchitecture(concepts);
  const structure = generateStructure(architecture);

  return { concepts, architecture, structure };
}
