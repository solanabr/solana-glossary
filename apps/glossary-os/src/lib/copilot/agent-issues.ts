export type AgentIssueSeverity = "hint" | "warning" | "info";

export type AgentIssue = {
  code: string;
  title: string;
  message: string;
  severity: AgentIssueSeverity;
  relatedTermId: string;
};

type AgentIssuePattern = {
  pattern: RegExp;
  code: string;
  title: string;
  message: string;
  severity: AgentIssueSeverity;
  relatedTermId: string;
};

const ISSUE_PATTERNS: AgentIssuePattern[] = [
  {
    pattern: /unsafe\s*\{/,
    code: "UNSAFE_BLOCK",
    title: "Unsafe block detected",
    message:
      "Unsafe Rust requires extra review in Solana programs because memory and account handling mistakes can become security issues.",
    severity: "warning",
    relatedTermId: "account",
  },
  {
    pattern: /\.unwrap\(\)/,
    code: "UNWRAP_USAGE",
    title: "unwrap() can panic",
    message:
      "Prefer explicit error handling instead of unwrap() so program failures stay intentional and easier to debug.",
    severity: "warning",
    relatedTermId: "instruction",
  },
  {
    pattern: /\sas u(8|16|32|64)|\sas i(8|16|32|64)/,
    code: "UNCHECKED_CAST",
    title: "Unchecked integer cast",
    message:
      "Unchecked casts can hide truncation or overflow issues, especially around balances, token amounts, and account math.",
    severity: "info",
    relatedTermId: "account",
  },
  {
    pattern: /pub fn.*Context</,
    code: "REVIEW_ACCOUNT_CONSTRAINTS",
    title: "Review account constraints",
    message:
      "Instruction handlers should be reviewed for signer checks, PDA seeds, ownership checks, and writable account constraints.",
    severity: "hint",
    relatedTermId: "signer",
  },
  {
    pattern: /invoke_signed|find_program_address|seeds|bump/i,
    code: "PDA_SURFACE",
    title: "PDA flow detected",
    message:
      "This code uses PDA-related primitives. Verify seeds, bump reuse, and signer expectations carefully.",
    severity: "hint",
    relatedTermId: "pda",
  },
  {
    pattern: /CpiContext|invoke_signed|invoke\(/,
    code: "CPI_SURFACE",
    title: "CPI flow detected",
    message:
      "Cross-program invocations need correct account ordering, signer privileges, and target program assumptions.",
    severity: "hint",
    relatedTermId: "cpi",
  },
];

function dedupeIssues(issues: AgentIssue[]): AgentIssue[] {
  const seen = new Set<string>();
  const result: AgentIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.code}:${issue.relatedTermId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(issue);
  }

  return result;
}

export function detectAgentIssues(code: string): AgentIssue[] {
  const source = code.trim();
  if (!source) return [];

  const issues = ISSUE_PATTERNS.filter((entry) => entry.pattern.test(source)).map((entry) => ({
    code: entry.code,
    title: entry.title,
    message: entry.message,
    severity: entry.severity,
    relatedTermId: entry.relatedTermId,
  }));

  return dedupeIssues(issues);
}
