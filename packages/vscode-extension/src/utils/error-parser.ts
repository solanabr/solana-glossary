export type ParsedError = {
  title: string;
  anchorHint: string;
};

const ERROR_HINTS: Array<{ pattern: RegExp; anchorHint: string; title: string }> = [
  { pattern: /constraint|seeds|bump/i, anchorHint: "pda", title: "PDA constraint issue" },
  { pattern: /signer|signature/i, anchorHint: "signer", title: "Signer issue" },
  { pattern: /cpi|invoke/i, anchorHint: "cpi", title: "CPI issue" },
  { pattern: /rent|lamports/i, anchorHint: "rent", title: "Rent or lamports issue" },
  { pattern: /account/i, anchorHint: "account", title: "Account issue" },
];

export function parseErrorMessage(message: string): ParsedError {
  const match = ERROR_HINTS.find((entry) => entry.pattern.test(message));
  return {
    title: match?.title ?? "Solana runtime issue",
    anchorHint: match?.anchorHint ?? "account",
  };
}
