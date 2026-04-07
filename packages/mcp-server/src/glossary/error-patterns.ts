export interface ErrorPattern {
  pattern: RegExp;
  errorType: string;
  relatedIds: string[];
  commonCauses: string[];
  quickFix: string;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /AccountNotFound|account.*not.*found|Error:\s*0x1/i,
    errorType: "AccountNotFound",
    relatedIds: ["account", "pda", "account-info"],
    commonCauses: [
      "Account was never initialized before use",
      "Wrong PDA derivation seeds or bump",
      "The passed account address does not exist on-chain",
    ],
    quickFix:
      "Verify the account exists on-chain and that the PDA derivation matches the program's expected seeds.",
  },
  {
    pattern: /ConstraintViolated|has_one.*failed|constraint.*violated|seeds constraint/i,
    errorType: "ConstraintViolated",
    relatedIds: ["anchor", "account", "seeds", "pda"],
    commonCauses: [
      "Anchor account constraint mismatch",
      "Wrong account passed into the instruction context",
      "Seeds or bump do not resolve to the expected PDA",
    ],
    quickFix:
      "Compare the runtime account inputs against the program's declared constraints and re-derive the PDA locally.",
  },
  {
    pattern: /InsufficientFunds|insufficient.*lamports|rent exempt|0x1 lamport/i,
    errorType: "InsufficientFunds",
    relatedIds: ["lamport", "rent", "transaction", "account"],
    commonCauses: [
      "The payer account does not have enough SOL",
      "The account would fall below rent-exempt minimum",
      "Account creation needs more lamports than expected",
    ],
    quickFix:
      "Check payer balance and calculate the required rent-exempt minimum before creating or resizing accounts.",
  },
  {
    pattern: /InvalidAccountData|invalid.*account.*data|borsh.*deserialize|discriminator mismatch/i,
    errorType: "InvalidAccountData",
    relatedIds: ["account", "discriminator", "serialization", "borsh"],
    commonCauses: [
      "Wrong account type passed into the instruction",
      "Account discriminator does not match the expected struct",
      "Serialized data layout differs from what the program expects",
    ],
    quickFix:
      "Verify that the instruction receives the right account type and that the serialization layout matches the program's struct definition.",
  },
  {
    pattern: /CrossProgramInvocation.*failed|CPI.*error|invoke.*failed/i,
    errorType: "CPIError",
    relatedIds: ["cpi", "invoke", "program", "instruction"],
    commonCauses: [
      "Wrong target program ID in the CPI call",
      "Missing required accounts for the invoked program",
      "Incorrect signer or writable privileges for CPI accounts",
    ],
    quickFix:
      "Verify the target program ID, account metas, signer requirements, and writable flags for the CPI.",
  },
  {
    pattern: /signature verification failed|unknown signer|missing signer/i,
    errorType: "MissingSigner",
    relatedIds: ["signer", "transaction", "instruction"],
    commonCauses: [
      "The required signer was not included in the transaction",
      "The account was marked as signer in the instruction but did not sign",
      "Program logic assumed authority without checking runtime signer status",
    ],
    quickFix:
      "Ensure the authority account signs the transaction and is passed with the correct signer metadata.",
  },
];

export function matchErrorPattern(errorMessage: string): ErrorPattern | null {
  for (const entry of ERROR_PATTERNS) {
    if (entry.pattern.test(errorMessage)) {
      return entry;
    }
  }

  return null;
}
