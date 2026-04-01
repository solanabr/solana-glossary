export const LEARNING_PATH_IDS = [
  "account",
  "program",
  "transaction",
  "instruction",
  "pda",
  "cpi",
  "lamport",
  "rent",
  "spl-token",
  "validator",
] as const;

export type LearningPathId = (typeof LEARNING_PATH_IDS)[number];
