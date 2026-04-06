import type { Architecture } from "./generateArchitecture";

export function generateStructure(architecture: Architecture): string {
  const hasToken = architecture.components.some((c) => c.toLowerCase().includes("token"));
  const hasClient = architecture.components.some((c) => c.toLowerCase().includes("client"));
  const hasWeb = architecture.components.some((c) => c.toLowerCase().includes("web"));
  const hasDeFi = architecture.components.some((c) => c.toLowerCase().includes("defi"));

  const lines: string[] = [];

  lines.push("/program");
  lines.push("  /src");
  lines.push("    /instructions");
  lines.push("    /state");
  lines.push("    /errors");

  if (hasDeFi) {
    lines.push("    /math");
  }

  lines.push("  Cargo.toml");

  if (hasToken) {
    lines.push("/token");
    lines.push("  /mint");
    lines.push("  /accounts");
  }

  if (hasClient || hasWeb) {
    lines.push("/client");
    lines.push("  /src");
    lines.push("    /instructions");
    lines.push("    /accounts");
    lines.push("    index.ts");
  }

  lines.push("/tests");
  lines.push("  /integration");
  lines.push("/scripts");
  lines.push("  deploy.ts");

  return lines.join("\n");
}
