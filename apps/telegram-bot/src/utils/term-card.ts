import { formatTermCard } from "./format.js";
import { getLiveStatsLine } from "./solana-rpc.js";
import { getSolPriceLine } from "./coingecko.js";
import type { GlossaryTerm } from "../glossary/index.js";
import type { MyContext } from "../context.js";

export async function buildEnrichedTermCard(
  term: GlossaryTerm,
  t: MyContext["t"],
  locale?: string,
): Promise<string> {
  const baseCard = formatTermCard(term, t, locale);
  const enrichmentBudget = new Promise<[null, null]>((resolve) =>
    setTimeout(() => resolve([null, null]), 2_000),
  );
  const [liveStats, solPrice] = await Promise.race([
    Promise.all([getLiveStatsLine(term.id), getSolPriceLine(term.id)]),
    enrichmentBudget,
  ]);

  return [baseCard, liveStats, solPrice].filter(Boolean).join("\n\n");
}
