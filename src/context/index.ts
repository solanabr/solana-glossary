import { allTerms } from "../index";
import { getLocalizedTerms } from "../i18n";
import { detectTerms } from "./detectTerms";
import { rankTerms } from "./rankTerms";
import { expandTerms } from "./expandTerms";
import { buildContext } from "./buildContext";
import { optimizePrompt } from "./optimizePrompt";
import type { ContextMode, StructuredContext } from "./buildContext";

export { detectTerms } from "./detectTerms";
export { rankTerms } from "./rankTerms";
export { expandTerms } from "./expandTerms";
export { buildContext } from "./buildContext";
export { optimizePrompt } from "./optimizePrompt";
export type { ContextMode, StructuredContext } from "./buildContext";

export interface InjectOptions {
  mode?: ContextMode;
  expand?: boolean;
  optimize?: boolean;
  lang?: "en" | "es" | "pt";
}

export function injectGlossaryContext(
  input: string,
  options: InjectOptions = {},
): string | StructuredContext {
  const { mode = "concise", expand = false, optimize = false, lang } = options;

  const terms = lang && lang !== "en" ? getLocalizedTerms(lang) : allTerms;

  const detected = detectTerms(input, terms);
  const ranked = rankTerms(input, detected);
  const final = expand ? expandTerms(ranked, terms) : ranked;

  const context = buildContext(final, mode);

  if (optimize) {
    return optimizePrompt(input, context);
  }

  return context;
}
