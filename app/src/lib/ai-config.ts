/**
 * Centralized AI availability check.
 * VITE_AI_AVAILABLE is set by the Vite API plugin based on whether
 * AI_API_KEY is configured in .env.
 */
export function isAIAvailable(): boolean {
  return (
    import.meta.env.VITE_AI_AVAILABLE === true ||
    import.meta.env.VITE_AI_AVAILABLE === "true"
  );
}
