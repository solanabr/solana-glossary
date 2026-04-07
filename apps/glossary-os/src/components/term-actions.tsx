"use client";

import { useState } from "react";

import { getCopy } from "@/lib/copy";
import type { GlossaryTerm } from "../../../../src/types";

function getCopyLink(locale: string, termId: string): string {
  if (typeof window === "undefined") {
    return `/${locale}/term/${termId}`;
  }

  return `${window.location.origin}/${locale}/term/${termId}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function TermActions({
  compactContext,
  locale,
  term,
}: {
  compactContext: string;
  locale: string;
  term: GlossaryTerm;
}) {
  const [status, setStatus] = useState("");
  const copy = getCopy(locale as "en" | "pt" | "es");

  async function handleCopy(action: "link" | "definition" | "context") {
    try {
      if (action === "link") {
        await copyText(getCopyLink(locale, term.id));
        setStatus(copy.term.linkCopied);
        return;
      }

      if (action === "definition") {
        await copyText(term.definition);
        setStatus(copy.term.definitionCopied);
        return;
      }

      await copyText(compactContext);
      setStatus(copy.term.contextCopied);
    } catch {
      setStatus(copy.term.clipboardFailed);
    }
  }

  return (
    <div className="term-actions">
      <button className="action-button" onClick={() => void handleCopy("link")} type="button">{copy.term.copyLink}</button>
      <button
        className="action-button"
        onClick={() => void handleCopy("definition")}
        type="button"
      >
        {copy.term.copyDefinition}
      </button>
      <button className="action-button" onClick={() => void handleCopy("context")} type="button">{copy.term.copyContext}</button>
      {status ? <span className="action-status">{status}</span> : null}
    </div>
  );
}
