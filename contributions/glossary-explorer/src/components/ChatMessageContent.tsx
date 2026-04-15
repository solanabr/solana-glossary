"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; label: string; href: string };

const INLINE_PATTERN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const value = match[0];
    if (value.startsWith("**") && value.endsWith("**")) {
      tokens.push({ type: "bold", value: value.slice(2, -2) });
    } else {
      const linkMatch = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push({
          type: "link",
          label: linkMatch[1],
          href: linkMatch[2],
        });
      } else {
        tokens.push({ type: "text", value });
      }
    }

    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(text: string) {
  return tokenizeInline(text).map((token, index) => {
    if (token.type === "bold") {
      return (
        <strong key={`bold-${index}`} className="font-semibold text-foreground">
          {token.value}
        </strong>
      );
    }

    if (token.type === "link") {
      const graphLink = token.href.startsWith("/explore?highlight=");
      const sharedClassName = graphLink
        ? "inline-flex items-center rounded-full border border-solana-purple/25 bg-solana-purple/15 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:border-solana-green/40 hover:bg-solana-green/15"
        : "font-medium text-solana-green underline decoration-solana-green/30 underline-offset-4 transition-colors hover:text-white";

      if (token.href.startsWith("/")) {
        return (
          <Link
            key={`link-${index}`}
            href={token.href}
            className={sharedClassName}
          >
            {token.label}
          </Link>
        );
      }

      return (
        <a
          key={`link-${index}`}
          href={token.href}
          target="_blank"
          rel="noreferrer"
          className={sharedClassName}
        >
          {token.label}
        </a>
      );
    }

    return <Fragment key={`text-${index}`}>{token.value}</Fragment>;
  });
}

function renderParagraph(lines: string[], key: string) {
  const nodes: ReactNode[] = [];

  lines.forEach((line, index) => {
    nodes.push(...renderInline(line));
    if (index < lines.length - 1) {
      nodes.push(<br key={`${key}-br-${index}`} />);
    }
  });

  return (
    <p key={key} className="text-sm leading-7 text-foreground/90">
      {nodes}
    </p>
  );
}

export default function ChatMessageContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);

        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={`list-${index}`} className="space-y-2 pl-4 text-sm">
              {lines.map((line, lineIndex) => (
                <li
                  key={`item-${index}-${lineIndex}`}
                  className="list-disc text-foreground/90"
                >
                  {renderInline(line.replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        const heading = lines[0]?.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          return (
            <div key={`heading-${index}`} className="space-y-2">
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                {heading[2]}
              </p>
              {lines.slice(1).length > 0
                ? renderParagraph(lines.slice(1), `heading-body-${index}`)
                : null}
            </div>
          );
        }

        return renderParagraph(lines, `paragraph-${index}`);
      })}
    </div>
  );
}
