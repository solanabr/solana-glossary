import { getVsCodeExtensionUrl } from "./site-url";

/**
 * Toggle MCP / CLI / VS Code in the home nav and sitemap.
 * Read on the server (or at build) and pass into client components to avoid
 * hydration mismatch — client bundles may inline `NEXT_PUBLIC_*` differently than SSR.
 *
 * Unset or empty → visible (default). To hide: `0`, `false`, `no`, or `off`.
 */
function readPublicShowFlag(envName: string): boolean {
  const raw = process.env[envName];
  if (raw == null || String(raw).trim() === "") return true;
  const v = String(raw).trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return true;
}

export type HomePlatformNavProps = {
  showNavMcp: boolean;
  showNavCli: boolean;
  showNavVsCode: boolean;
  vscodeExtensionUrl: string;
};

/** Use in Server Components; pass result to `HomePageClient`. */
export function getHomePlatformNavProps(): HomePlatformNavProps {
  return {
    showNavMcp: readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_MCP"),
    showNavCli: readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_CLI"),
    showNavVsCode: readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_VSCODE"),
    vscodeExtensionUrl: getVsCodeExtensionUrl(),
  };
}

export const showNavMcp = readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_MCP");
export const showNavCli = readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_CLI");
export const showNavVsCode = readPublicShowFlag("NEXT_PUBLIC_SHOW_NAV_VSCODE");
