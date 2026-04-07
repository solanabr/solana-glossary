"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GlossaryCopilot } from "@/components/glossary-copilot";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";
import type { GlossaryTerm } from "../../../../src/types";

export function CopilotHub({
  locale,
  selectedTerm,
  terms,
}: {
  locale: Locale;
  selectedTerm: GlossaryTerm;
  terms: GlossaryTerm[];
}) {
  const router = useRouter();
  const copy = getCopy(locale);
  const [query, setQuery] = useState(selectedTerm.term);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = normalized
      ? terms.filter(
          (term) =>
            term.term.toLowerCase().includes(normalized) ||
            term.id.toLowerCase().includes(normalized) ||
            term.aliases?.some((alias) => alias.toLowerCase().includes(normalized)),
        )
      : terms;

    return base.slice(0, 8);
  }, [query, terms]);

  function selectTerm(termId: string, termLabel: string) {
    setQuery(termLabel);
    router.push(withLocale(locale, `/copilot?term=${termId}`));
  }

  return (
    <div className="copilot-page-layout">
      <section className="hero-panel">
        <div className="section-heading">
          <span className="eyebrow">{copy.copilot.eyebrow}</span>
          <h1>{copy.copilot.pageTitle}</h1>
          <p>{copy.copilot.pageLead}</p>
        </div>
      </section>

      <section className="section-frame">
        <div className="copilot-page-grid">
          <article className="section-card copilot-page-picker">
            <span className="story-label">{copy.copilot.pickerTitle}</span>
            <h2>{copy.copilot.pickerTitle}</h2>
            <p>{copy.copilot.pickerBody}</p>

            <label className="copilot-field">
              <span className="story-label">{copy.copilot.switchTerm}</span>
              <input
                className="copilot-textarea copilot-picker-input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search.placeholder}
                type="text"
                value={query}
              />
            </label>

            <div className="copilot-term-list">
              {suggestions.map((term) => {
                const active = term.id === selectedTerm.id;
                return (
                  <button
                    className={`copilot-term-item${active ? " copilot-term-item-active" : ""}`}
                    key={term.id}
                    onClick={() => selectTerm(term.id, term.term)}
                    type="button"
                  >
                    <strong>{term.term}</strong>
                    <span>{term.id}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="section-card copilot-page-anchor">
            <span className="story-label">{copy.copilot.activeTermTitle}</span>
            <h2>{selectedTerm.term}</h2>
            <p>{copy.copilot.activeTermBody}</p>
            <p className="list-copy">{selectedTerm.definition}</p>
            <div className="pill-row">
              <span className="pill">
                <strong>{copy.common.id}</strong>
                {selectedTerm.id}
              </span>
              {(selectedTerm.aliases ?? []).slice(0, 3).map((alias) => (
                <span className="pill" key={alias}>
                  <strong>{copy.common.alias}</strong>
                  {alias}
                </span>
              ))}
            </div>
            <div className="link-row">
              <Link className="text-link" href={withLocale(locale, `/term/${selectedTerm.id}`)}>
                {copy.copilot.openTermPage}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <GlossaryCopilot locale={locale} termId={selectedTerm.id} />
    </div>
  );
}
