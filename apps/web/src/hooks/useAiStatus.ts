/**
 * AI availability gate for the Phase-1 static deploy.
 *
 * The AI backend (copilot, quiz, apply-code) is not wired up in Phase 1, so
 * this defaults to `false` and the app ships as a fully functional glossary.
 * The flag is build-time (`VITE_AI_ENABLED`) so the AI surfaces stay
 * tree-shakable and gated.
 *
 * Phase 2 will upgrade this hook to fetch `/api/ai/status` at runtime.
 */
export function useAiStatus(): boolean {
  return import.meta.env.VITE_AI_ENABLED === "true";
}
