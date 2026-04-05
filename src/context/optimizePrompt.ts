import type { StructuredContext } from "./buildContext";

export function optimizePrompt(
  input: string,
  context: string | StructuredContext,
): string {
  const contextBlock =
    typeof context === "string"
      ? context
      : JSON.stringify(context, null, 2);

  return `You are a Solana developer assistant.

Use the following glossary context:

${contextBlock}

Instructions:
- Be precise and technical
- Focus on Solana-specific concepts
- Do not explain terms that are already defined above

Request:
${input}`;
}
