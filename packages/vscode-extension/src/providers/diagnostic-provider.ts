import * as vscode from "vscode";

type InsecurePattern = {
  pattern: RegExp;
  message: string;
  severity: vscode.DiagnosticSeverity;
  code: string;
};

const INSECURE_PATTERNS: InsecurePattern[] = [
  {
    pattern: /pub fn.*Context</,
    message: "Review signer and account constraints for this instruction. Missing validation is a common Solana bug source.",
    severity: vscode.DiagnosticSeverity.Hint,
    code: "MISSING_ACCOUNT_CONSTRAINTS",
  },
  {
    pattern: /unsafe\s*\{/,
    message: "Unsafe block detected. Review carefully for Solana-specific safety issues.",
    severity: vscode.DiagnosticSeverity.Warning,
    code: "UNSAFE_BLOCK",
  },
  {
    pattern: /\.unwrap\(\)/,
    message: "unwrap() can panic. Prefer explicit error handling in Solana programs.",
    severity: vscode.DiagnosticSeverity.Warning,
    code: "UNWRAP_USAGE",
  },
  {
    pattern: /\sas u(8|16|32|64)|\sas i(8|16|32|64)/,
    message: "Unchecked integer cast detected. Prefer checked conversions and checked arithmetic around token or lamport math.",
    severity: vscode.DiagnosticSeverity.Information,
    code: "UNCHECKED_CAST",
  },
];

export class GlossaryDiagnosticProvider {
  constructor(private readonly collection: vscode.DiagnosticCollection) {}

  updateDiagnostics(document: vscode.TextDocument): void {
    if (document.languageId !== "rust") {
      this.collection.delete(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const lines = document.getText().split("\n");

    for (const [lineIndex, lineText] of lines.entries()) {
      for (const pattern of INSECURE_PATTERNS) {
        if (!pattern.pattern.test(lineText)) continue;

        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(lineIndex, 0, lineIndex, lineText.length),
          pattern.message,
          pattern.severity,
        );
        diagnostic.source = "Solana Glossary";
        diagnostic.code = pattern.code;
        diagnostics.push(diagnostic);
      }
    }

    this.collection.set(document.uri, diagnostics);
  }
}
