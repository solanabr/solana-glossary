import type { GlossaryTerm } from "../types";

export interface Architecture {
  components: string[];
  flows: string[];
  notes: string[];
}

const CATEGORY_COMPONENT_MAP: Partial<Record<string, string>> = {
  "core-protocol": "On-chain program",
  "programming-model": "Program logic",
  "token-ecosystem": "Token mint and accounts",
  defi: "DeFi instruction handlers",
  "zk-compression": "Compressed state layer",
  infrastructure: "RPC and cluster integration",
  security: "Authority and signer validation",
  "dev-tools": "Client SDK",
  network: "Network configuration",
  "blockchain-general": "Ledger state",
  web3: "Web client",
  "programming-fundamentals": "Core data structures",
  "ai-ml": "Off-chain inference layer",
  "solana-ecosystem": "Ecosystem integration",
};

export function generateArchitecture(concepts: GlossaryTerm[]): Architecture {
  const componentSet = new Set<string>();
  const flows: string[] = [];
  const notes: string[] = [];

  for (const concept of concepts) {
    const component = CATEGORY_COMPONENT_MAP[concept.category];
    if (component) componentSet.add(component);
  }

  const hasPda = concepts.some((c) => c.id.includes("pda") || c.term.toLowerCase().includes("pda"));
  const hasToken = concepts.some((c) => c.category === "token-ecosystem");
  const hasCpi = concepts.some((c) => c.id.includes("cpi") || c.term.toLowerCase().includes("cpi"));
  const hasSigner = concepts.some((c) => c.id.includes("signer") || c.term.toLowerCase().includes("signer"));
  const hasAccount = concepts.some((c) => c.id.includes("account"));

  if (hasAccount) flows.push("Client → RPC → Program → Account read/write");
  if (hasPda) flows.push("Instruction → derive PDA → validate seeds → mutate state");
  if (hasToken) flows.push("Mint authority → Token account → Transfer instruction");
  if (hasCpi) flows.push("Program → CPI → Target program → Return result");
  if (flows.length === 0) flows.push("Client → Transaction → Program → State update");

  if (hasPda) notes.push("PDAs require deterministic seed derivation and bump storage");
  if (hasSigner) notes.push("Validate all signers explicitly in instruction logic");
  if (hasToken) notes.push("Use SPL Token program via CPI for token operations");
  if (concepts.some((c) => c.category === "security")) {
    notes.push("Implement ownership checks before any state mutation");
  }

  return {
    components: Array.from(componentSet),
    flows,
    notes,
  };
}
