import * as vscode from "vscode";

import type { CopilotAnswer, CopilotLinkedReason } from "../api/types";
import { DEFAULT_API_BASE_URL } from "../config/constants";

function renderReasonList(items: CopilotLinkedReason[]): string {
  if (items.length === 0) {
    return "<li>No mapped concepts.</li>";
  }

  return items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.label)}</strong><br /><span>${escapeHtml(item.reason)}</span></li>`,
    )
    .join("");
}

function renderHighlightTerms(answer: CopilotAnswer): string {
  if (answer.highlightTerms.length === 0) {
    return "<p class=\"muted\">No glossary links returned.</p>";
  }

  return answer.highlightTerms
    .map(
      (item) =>
        `<a class="tag" href="${DEFAULT_API_BASE_URL}/en/term/${encodeURIComponent(item.id)}">${escapeHtml(item.label)}</a>`,
    )
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateCopilotHtml(
  title: string,
  answer: CopilotAnswer,
  sourceText: string,
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webview", "style.css"),
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webview", "webview.js"),
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <main class="shell">
      <header class="header">
        <p class="eyebrow">Solana Glossary Copilot</p>
        <h1>${escapeHtml(title)}</h1>
        <span class="pill">${escapeHtml(answer.mode)}</span>
      </header>

      <section class="card">
        <h2>Explanation</h2>
        <p>${escapeHtml(answer.explanation)}</p>
      </section>

      ${
        sourceText.trim()
          ? `<section class="card">
        <h2>Source</h2>
        <pre><code>${escapeHtml(sourceText)}</code></pre>
      </section>`
          : ""
      }

      <section class="grid">
        <article class="card">
          <h2>Key Concepts</h2>
          <ul>${renderReasonList(answer.keyConcepts)}</ul>
        </article>
        <article class="card">
          <h2>Suggested Next Terms</h2>
          <ul>${renderReasonList(answer.suggestedNextTerms)}</ul>
        </article>
      </section>

      <section class="card">
        <h2>Glossary Links</h2>
        <div class="tags">${renderHighlightTerms(answer)}</div>
      </section>

      ${
        answer.caveat
          ? `<section class="card warning">
        <h2>Caveat</h2>
        <p>${escapeHtml(answer.caveat)}</p>
      </section>`
          : ""
      }
    </main>
    <script src="${scriptUri}"></script>
  </body>
</html>`;
}
