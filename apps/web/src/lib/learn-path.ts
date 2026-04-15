/**
 * Curated onboarding path: ordered like typical protocol docs — time/consensus,
 * state & rent, execution model, then live network & tokens.
 * Term ids match `data/terms` canonical ids.
 */

export type LearnPathStageKey =
  | "consensus"
  | "accounts"
  | "programs"
  | "network";

export interface LearnPathStage {
  readonly key: LearnPathStageKey;
  readonly termIds: readonly string[];
}

export const LEARN_PATH_STAGES: readonly LearnPathStage[] = [
  {
    key: "consensus",
    termIds: ["proof-of-history", "slot", "validator"],
  },
  {
    key: "accounts",
    termIds: ["account", "rent"],
  },
  {
    key: "programs",
    termIds: ["program", "transaction", "pda"],
  },
  {
    key: "network",
    termIds: ["spl-token", "mainnet-beta"],
  },
] as const;

/** Flat list (graph, analytics) — same terms, path order. */
export const LEARN_PATH_TERM_IDS: readonly string[] = LEARN_PATH_STAGES.flatMap(
  (s) => [...s.termIds],
);
