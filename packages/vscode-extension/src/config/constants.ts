export const EXTENSION_ID = "solanaGlossary";

export const COMMANDS = {
  explainSelection: "solanaGlossary.explainSelection",
  debugError: "solanaGlossary.debugError",
  generateFromComment: "solanaGlossary.generateFromComment",
  openPlanner: "solanaGlossary.openPlanner",
  searchGlossary: "solanaGlossary.searchGlossary",
} as const;

export const SOLANA_LANGUAGES = ["rust", "typescript", "javascript", "toml"] as const;

export const DEFAULT_API_BASE_URL = "https://solana-glossary-two.vercel.app";

export const DEFAULT_LOCALE = "en" as const;
