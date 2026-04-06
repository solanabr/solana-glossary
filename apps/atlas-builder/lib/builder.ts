import type { GlossaryTerm } from "../../../src/types";
import { allTerms } from "../../../src/index";
import { getLocalizedTerms } from "../../../src/i18n";
import { detectIntent } from "../../../src/builder/detectIntent";
import { resolveConcepts } from "../../../src/builder/resolveConcepts";
import { expandConcepts } from "../../../src/builder/expandConcepts";
import { generateArchitecture } from "../../../src/builder/generateArchitecture";
import { generateStructure } from "../../../src/builder/generateStructure";

export type { Architecture } from "../../../src/builder/generateArchitecture";
export type { GlossaryTerm };

export interface BuildResult {
  concepts: GlossaryTerm[];
  architecture: {
    components: string[];
    flows: string[];
    notes: string[];
  };
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
