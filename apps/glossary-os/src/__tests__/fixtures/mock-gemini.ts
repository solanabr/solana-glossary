import { vi } from "vitest";

import type { CopilotSchemaAnswer } from "@/lib/copilot/response-parser";

export const LEGACY_RUNTIME_RESPONSE = {
  explanation:
    "This initializes an Anchor account, writes state into it, and links the new state to the authority signer.",
  key_concepts: [
    { term_id: "anchor", reason: "Anchor macros structure the program and account validation." },
    { term_id: "account", reason: "The instruction initializes and mutates an on-chain account." },
    { term_id: "signer", reason: "The authority signer funds and authorizes the initialization." },
  ],
  suggested_next_terms: [
    { term_id: "pda", reason: "PDAs are the next common step for program-owned state." },
    { term_id: "cpi", reason: "CPI matters once the program starts calling other programs." },
  ],
  glossary_mentions: ["anchor", "account", "signer", "pda"],
  caveat: "",
} as const;

export const LEGACY_DEBUG_RESPONSE = {
  explanation:
    "The failing account does not satisfy the expected constraint or was derived incorrectly, which is common with PDA and seeds mismatches.",
  key_concepts: [
    { term_id: "account", reason: "The failure is about account state and correctness." },
    { term_id: "pda", reason: "The account is often a PDA in this class of bug." },
    { term_id: "seeds", reason: "Seeds control the derived address and constraint checks." },
  ],
  suggested_next_terms: [{ term_id: "bump", reason: "The bump is part of PDA correctness." }],
  glossary_mentions: ["account", "pda", "seeds", "bump"],
  caveat: "none",
} as const;

export const LEGACY_GENERATE_RESPONSE = {
  explanation:
    "A good starting point is an Anchor program that derives a PDA from stable seeds and stores user-owned state there.",
  key_concepts: [
    { term_id: "pda", reason: "The request centers on a program-derived address." },
    { term_id: "anchor", reason: "Anchor is the framework implied by the request." },
    { term_id: "account", reason: "The generated PDA is still an on-chain account." },
  ],
  suggested_next_terms: [
    { term_id: "cpi", reason: "CPI matters once the program starts integrating with other programs." },
    { term_id: "seeds", reason: "Seed design controls PDA stability and address derivation." },
  ],
  glossary_mentions: ["pda", "anchor", "account", "seeds"],
  caveat: "",
} as const;

export const LEGACY_PLAN_RESPONSE = {
  explanation:
    "Start by understanding AMMs, liquidity pools, and swap execution before building the first DeFi surface area.",
  key_concepts: [
    { term_id: "amm", reason: "AMM mechanics drive pool pricing and swaps." },
    { term_id: "liquidity-pool", reason: "Liquidity pools hold the assets used by swaps." },
    { term_id: "swap", reason: "Swap flows are the user-facing execution path in the app." },
  ],
  suggested_next_terms: [
    { term_id: "price-impact", reason: "Price impact matters once users interact with real liquidity." },
    { term_id: "slippage", reason: "Slippage affects execution quality and UX." },
  ],
  glossary_mentions: ["amm", "liquidity-pool", "swap", "slippage"],
  caveat: "",
} as const;

export const MOCK_EXPLAIN_RESPONSE: CopilotSchemaAnswer = {
  summary: "Initializes a new account and stores authority metadata.",
  sections: [
    {
      id: "step-by-step",
      title: "Step-by-step explanation",
      body: "The instruction initializes an Anchor account, writes user data, and binds authority to the signer.",
      code: "",
    },
    {
      id: "what-it-does",
      title: "What this code does",
      body: "It creates program-owned state and stores a signer-controlled authority value.",
      code: "",
    },
    {
      id: "potential-issues",
      title: "Potential issues",
      body: "The snippet does not show extra access control beyond the signer requirement.",
      code: "",
    },
  ],
  key_concepts: [
    { term_id: "anchor", reason: "Anchor macros structure the program and accounts." },
    { term_id: "account", reason: "Account<'info, T> is the storage unit being initialized." },
    { term_id: "signer", reason: "The authority signer pays for and authorizes initialization." },
  ],
  suggested_next_terms: [
    { term_id: "pda", reason: "PDAs are a common next step for program-owned account design." },
    { term_id: "cpi", reason: "CPI becomes relevant once the program starts calling other programs." },
  ],
  glossary_mentions: ["anchor", "account", "signer", "pda"],
  caveat: "",
};

export const MOCK_DEBUG_RESPONSE: CopilotSchemaAnswer = {
  summary: "The instruction is failing because the expected account state is missing or mismatched.",
  sections: [
    {
      id: "problem",
      title: "Problem",
      body: "The provided account does not satisfy the on-chain constraint or does not exist in the expected shape.",
      code: "",
    },
    {
      id: "why",
      title: "Why it happens",
      body: "This usually happens when the client passes the wrong PDA, wrong bump, or an uninitialized account.",
      code: "",
    },
    {
      id: "fix",
      title: "Fix",
      body: "Re-derive the PDA, verify the bump, and ensure the account is initialized before invoking the instruction.",
      code: "let (pda, bump) = Pubkey::find_program_address(&[b\"vault\"], program_id);",
    },
  ],
  key_concepts: [
    { term_id: "account", reason: "The error is about account state and validity." },
    { term_id: "pda", reason: "PDA mismatches are a common root cause for this class of error." },
    { term_id: "seeds", reason: "Seeds influence the derived address and constraint checks." },
  ],
  suggested_next_terms: [
    { term_id: "bump", reason: "The bump is part of PDA correctness." },
  ],
  glossary_mentions: ["account", "pda", "seeds", "bump"],
  caveat: "none",
};

export const MOCK_GENERATE_RESPONSE: CopilotSchemaAnswer = {
  summary: "Creates starter Anchor code for a PDA-backed account flow.",
  sections: [
    {
      id: "generated-code",
      title: "Generated code",
      body: "Starter Anchor program with PDA initialization.",
      code: "declare_id!(\"REPLACE_WITH_YOUR_PROGRAM_ID\");\n\n#[program]\npub mod profile_program {\n    use super::*;\n}",
    },
    {
      id: "explanation",
      title: "Explanation",
      body: "The starter uses a PDA so the program can control state without a private key.",
      code: "",
    },
    {
      id: "implementation-notes",
      title: "Implementation notes",
      body: "You still need to define accounts, constraints, and client wiring.",
      code: "",
    },
  ],
  key_concepts: [
    { term_id: "anchor", reason: "The generated code uses Anchor macros and conventions." },
    { term_id: "pda", reason: "The requested implementation centers on PDA creation." },
    { term_id: "seeds", reason: "Seeds define how the PDA is derived." },
  ],
  suggested_next_terms: [
    { term_id: "account", reason: "You need account layout knowledge to finish the implementation." },
    { term_id: "idl", reason: "IDLs matter once the client side is wired up." },
  ],
  glossary_mentions: ["anchor", "pda", "seeds", "account"],
  caveat: "",
};

export const MOCK_PLAN_RESPONSE: CopilotSchemaAnswer = {
  summary: "Breaks a DeFi build goal into concept and implementation stages.",
  sections: [
    {
      id: "goal-breakdown",
      title: "Goal breakdown",
      body: "Start by learning swaps, pools, and pricing before building the protocol surface.",
      code: "",
    },
    {
      id: "plan",
      title: "Step-by-step plan",
      body: "1. Learn AMMs and liquidity pools.\n2. Map swaps and slippage.\n3. Design the user flow.\n4. Implement and test.",
      code: "",
    },
    {
      id: "implementation-approach",
      title: "Implementation approach",
      body: "Use the glossary terms as the learning spine and pair them with a narrow MVP feature set.",
      code: "",
    },
  ],
  key_concepts: [
    { term_id: "amm", reason: "AMM mechanics define swap pricing." },
    { term_id: "liquidity-pool", reason: "Pools hold the liquidity used by swaps." },
    { term_id: "slippage", reason: "Slippage shapes execution quality for users." },
  ],
  suggested_next_terms: [
    { term_id: "swap", reason: "Swap flows tie the DeFi concepts together." },
    { term_id: "price-impact", reason: "Price impact matters when reasoning about pool depth." },
  ],
  glossary_mentions: ["amm", "liquidity-pool", "slippage", "swap"],
  caveat: "",
};

export function createGeminiPayload(answer: unknown) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(answer) }],
        },
      },
    ],
  };
}

export function mockGeminiFetch(answer: unknown, init?: ResponseInit) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(createGeminiPayload(answer)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    }),
  );

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
