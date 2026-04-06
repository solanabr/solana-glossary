import { findClosest, lookupTerm } from "../utils/search.js";
import { escapeHtml, formatCategoryName } from "../utils/format.js";
import type { GlossaryTerm } from "../glossary/index.js";
import type { MyContext } from "../context.js";

type CompareResolution =
  | { kind: "found"; term: GlossaryTerm }
  | { kind: "ambiguous"; terms: GlossaryTerm[] }
  | { kind: "suggestion"; suggestion?: GlossaryTerm };

export async function compareCommand(ctx: MyContext): Promise<void> {
  const raw = (ctx.match as string).trim();
  if (!raw) {
    await ctx.reply(ctx.t("usage-compare"), { parse_mode: "HTML" });
    return;
  }

  const parsed = parseCompareInput(raw);
  if (!parsed) {
    await ctx.reply(ctx.t("usage-compare"), { parse_mode: "HTML" });
    return;
  }

  const leftResolved = resolveSingleTerm(parsed.leftQuery);
  const rightResolved = resolveSingleTerm(parsed.rightQuery);

  if (leftResolved.kind === "ambiguous") {
    await ctx.reply(
      buildAmbiguousCompareMessage(
        ctx,
        parsed.leftQuery,
        leftResolved.terms,
        "left",
      ),
      { parse_mode: "HTML" },
    );
    return;
  }

  if (rightResolved.kind === "ambiguous") {
    await ctx.reply(
      buildAmbiguousCompareMessage(
        ctx,
        parsed.rightQuery,
        rightResolved.terms,
        "right",
      ),
      { parse_mode: "HTML" },
    );
    return;
  }

  if (leftResolved.kind !== "found" && rightResolved.kind !== "found") {
    await ctx.reply(ctx.t("compare-not-found-both"), { parse_mode: "HTML" });
    return;
  }

  if (leftResolved.kind !== "found") {
    await replyCompareNotFound(ctx, parsed.leftQuery, leftResolved.suggestion);
    return;
  }

  if (rightResolved.kind !== "found") {
    await replyCompareNotFound(ctx, parsed.rightQuery, rightResolved.suggestion);
    return;
  }

  if (leftResolved.term.id === rightResolved.term.id) {
    await ctx.reply(ctx.t("compare-same-term", { term: leftResolved.term.id }), {
      parse_mode: "HTML",
    });
    return;
  }

  const sharedRelated = getSharedRelated(leftResolved.term, rightResolved.term);
  const text = [
    ctx.t("compare-header", {
      term1: leftResolved.term.id,
      term2: rightResolved.term.id,
    }),
    "",
    formatCompareSection("A", leftResolved.term),
    "",
    formatCompareSection("B", rightResolved.term),
    sharedRelated.length > 0
      ? `\n${ctx.t("compare-shared-related", {
          terms: sharedRelated
            .map((term) => `<code>${escapeHtml(term)}</code>`)
            .join(", "),
        })}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.reply(text, { parse_mode: "HTML" });
}

function parseCompareInput(
  raw: string,
): { leftQuery: string; rightQuery: string } | null {
  const normalized = raw.trim();
  const separatorMatch = normalized.match(/\s(?:vs|x)\s|[|,]/i);

  if (separatorMatch && separatorMatch.index !== undefined) {
    const leftQuery = normalized.slice(0, separatorMatch.index).trim();
    const rightQuery = normalized
      .slice(separatorMatch.index + separatorMatch[0].length)
      .trim();

    if (leftQuery && rightQuery) return { leftQuery, rightQuery };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  return {
    leftQuery: parts[0],
    rightQuery: parts.slice(1).join(" "),
  };
}

function resolveSingleTerm(query: string): CompareResolution {
  const result = lookupTerm(query);
  if (result.type === "found") return { kind: "found", term: result.term };
  if (result.type === "multiple") {
    return { kind: "ambiguous", terms: result.terms };
  }
  return { kind: "suggestion", suggestion: findClosest(query) };
}

async function replyCompareNotFound(
  ctx: MyContext,
  query: string,
  suggestion?: GlossaryTerm,
): Promise<void> {
  if (suggestion) {
    await ctx.reply(
      ctx.t("compare-not-found-one", {
        query,
        suggestion: suggestion.id,
      }),
      {
        parse_mode: "HTML",
      },
    );
    return;
  }

  await ctx.reply(ctx.t("compare-not-found-one-no-suggestion", { query }), {
    parse_mode: "HTML",
  });
}

function buildAmbiguousCompareMessage(
  ctx: MyContext,
  query: string,
  terms: GlossaryTerm[],
  side: "left" | "right",
): string {
  const sideLabel =
    side === "left" ? ctx.t("compare-side-left") : ctx.t("compare-side-right");
  const options = terms
    .slice(0, 5)
    .map((term) => `• <code>${escapeHtml(term.id)}</code>`)
    .join("\n");

  return [
    ctx.t("compare-ambiguous-header", {
      side: sideLabel,
      query,
    }),
    "",
    options,
    "",
    ctx.t("compare-ambiguous-footer"),
  ].join("\n");
}

function formatCompareSection(label: string, term: GlossaryTerm): string {
  const definition = getDefinitionPreview(term.definition);
  const aliases =
    term.aliases && term.aliases.length > 0
      ? `\nAliases: ${term.aliases
          .map((alias) => `<code>${escapeHtml(alias)}</code>`)
          .join(", ")}`
      : "";

  return [
    `<b>${label}. ${escapeHtml(term.term)}</b>`,
    `Category: ${escapeHtml(formatCategoryName(term.category))}`,
    escapeHtml(definition),
    aliases,
  ]
    .filter(Boolean)
    .join("\n");
}

function getDefinitionPreview(definition: string): string {
  const sentences = definition
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.slice(0, 2).join(" ");
}

function getSharedRelated(left: GlossaryTerm, right: GlossaryTerm): string[] {
  const leftSet = new Set(left.related ?? []);
  return (right.related ?? []).filter((term) => leftSet.has(term));
}
