import type { GlossaryTerm, Category } from "./types";

import coreProtocol from "@/data/terms/core-protocol.json";
import programmingModel from "@/data/terms/programming-model.json";
import tokenEcosystem from "@/data/terms/token-ecosystem.json";
import defi from "@/data/terms/defi.json";
import zkCompression from "@/data/terms/zk-compression.json";
import infrastructure from "@/data/terms/infrastructure.json";
import security from "@/data/terms/security.json";
import devTools from "@/data/terms/dev-tools.json";
import network from "@/data/terms/network.json";
import blockchainGeneral from "@/data/terms/blockchain-general.json";
import web3 from "@/data/terms/web3.json";
import programmingFundamentals from "@/data/terms/programming-fundamentals.json";
import aiMl from "@/data/terms/ai-ml.json";
import solanaEcosystem from "@/data/terms/solana-ecosystem.json";

export const allTerms: GlossaryTerm[] = [
  ...coreProtocol,
  ...programmingModel,
  ...tokenEcosystem,
  ...defi,
  ...zkCompression,
  ...infrastructure,
  ...security,
  ...devTools,
  ...network,
  ...blockchainGeneral,
  ...web3,
  ...programmingFundamentals,
  ...aiMl,
  ...solanaEcosystem,
] as GlossaryTerm[];

const termMap = new Map<string, GlossaryTerm>();
const aliasMap = new Map<string, string>();

for (const t of allTerms) {
  termMap.set(t.id, t);
  if (t.aliases) {
    for (const alias of t.aliases) {
      aliasMap.set(alias.toLowerCase(), t.id);
    }
  }
}

export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  const lower = idOrAlias.toLowerCase();
  const direct = termMap.get(lower) || termMap.get(idOrAlias);
  if (direct) return direct;
  const resolved = aliasMap.get(lower);
  return resolved ? termMap.get(resolved) : undefined;
}

export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.aliases?.some((a) => a.toLowerCase().includes(q)),
  );
}

export function getTermsByCategory(category: Category): GlossaryTerm[] {
  return allTerms.filter((t) => t.category === category);
}

export function getRelatedTermsBFS(
  idOrAlias: string,
  depth = 1,
): GlossaryTerm[] {
  const start = getTerm(idOrAlias);
  if (!start || depth < 1) return [];

  const maxDepth = Math.min(Math.max(depth, 1), 3);
  const visited = new Set<string>([start.id]);
  const queue: Array<{ id: string; depth: number }> = [
    { id: start.id, depth: 0 },
  ];
  const related: GlossaryTerm[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const term = getTerm(current.id);
    if (!term || current.depth >= maxDepth) continue;

    for (const relatedId of term.related ?? []) {
      if (visited.has(relatedId)) continue;
      visited.add(relatedId);

      const relatedTerm = getTerm(relatedId);
      if (!relatedTerm) continue;

      related.push(relatedTerm);
      queue.push({ id: relatedId, depth: current.depth + 1 });
    }
  }

  return related;
}

export interface GlossaryStats {
  totalTerms: number;
  totalCategories: number;
  totalEdges: number;
  termsWithRelated: number;
  termsWithAliases: number;
  availableLocales: string[];
  byCategory: Array<{
    category: Category;
    count: number;
  }>;
}

export function getGlossaryStats(): GlossaryStats {
  let totalEdges = 0;
  let termsWithRelated = 0;
  let termsWithAliases = 0;

  for (const term of allTerms) {
    if (term.related?.length) {
      totalEdges += term.related.length;
      termsWithRelated += 1;
    }

    if (term.aliases?.length) {
      termsWithAliases += 1;
    }
  }

  return {
    totalTerms: allTerms.length,
    totalCategories: CATEGORIES.length,
    totalEdges,
    termsWithRelated,
    termsWithAliases,
    availableLocales: ["en", "pt", "es"],
    byCategory: CATEGORIES.map((category) => ({
      category,
      count: getTermsByCategory(category).length,
    })).sort((a, b) => b.count - a.count),
  };
}

const CATEGORIES: Category[] = [
  "core-protocol",
  "programming-model",
  "token-ecosystem",
  "defi",
  "zk-compression",
  "infrastructure",
  "security",
  "dev-tools",
  "network",
  "blockchain-general",
  "web3",
  "programming-fundamentals",
  "ai-ml",
  "solana-ecosystem",
];

export function getCategories(): Category[] {
  return CATEGORIES;
}
