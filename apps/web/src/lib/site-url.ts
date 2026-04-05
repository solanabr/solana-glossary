/** Site origin for OG, sitemap, canonical URLs (`BASE_URL` / `NEXT_PUBLIC_BASE_URL`). */
export function getSiteUrl(): string {
  return (
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * VS Code extension install link. Set `NEXT_PUBLIC_VSCODE_EXTENSION_URL` to the
 * Marketplace item page; otherwise falls back to Marketplace search.
 */
export function getVsCodeExtensionUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_VSCODE_EXTENSION_URL?.trim();
  if (fromEnv) return fromEnv;
  return "https://marketplace.visualstudio.com/search?term=%40stbr+solana+glossary&target=VSCode";
}
