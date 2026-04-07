"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import type { CopilotAnswer } from "@/lib/copilot-types";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";
import { GlossaryRichText } from "./glossary-rich-text";

function formatAnswerForClipboard(answer: CopilotAnswer): string {
  const keyConcepts = answer.keyConcepts
    .map((concept) => `- ${concept.label}: ${concept.reason}`)
    .join("\n");
  const nextTerms = answer.suggestedNextTerms
    .map((concept) => `- ${concept.label}: ${concept.reason}`)
    .join("\n");

  return [
    "Explanation:",
    answer.explanation,
    "",
    "Key Concepts:",
    keyConcepts || "- None",
    "",
    "Suggested Next Terms:",
    nextTerms || "- None",
    answer.caveat ? ["", "Caveat:", answer.caveat].join("\n") : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function GlossaryCopilot({
  locale,
  termId,
}: {
  locale: Locale;
  termId: string;
}) {
  const copy = getCopy(locale);
  const copilot = copy.copilot;
  const [question, setQuestion] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSubmit = useMemo(() => question.trim().length > 0, [question]);

  async function handleSubmit() {
    if (!canSubmit) return;

    setError("");
    setCopyStatus("");

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          termSlug: termId,
          question,
          codeSnippet: codeSnippet.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { answer?: CopilotAnswer; error?: string };
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || copilot.genericError);
      }

      startTransition(() => {
        setAnswer(payload.answer ?? null);
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : copilot.genericError;
      setError(message);
      setAnswer(null);
    }
  }

  async function handleCopy() {
    if (!answer) return;

    try {
      await navigator.clipboard.writeText(formatAnswerForClipboard(answer));
      setCopyStatus(copilot.answerCopied);
    } catch {
      setCopyStatus(copilot.copyFailed);
    }
  }

  return (
    <section className="section-frame">
      <div className="section-heading">
        <span className="eyebrow">{copilot.eyebrow}</span>
        <h2>{copilot.title}</h2>
        <p>{copilot.lead}</p>
      </div>

      <div className="detail-panel copilot-panel">
        <div className="copilot-form">
          <label className="copilot-field">
            <span className="story-label">{copilot.questionLabel}</span>
            <textarea
              className="copilot-textarea"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={copilot.questionPlaceholder}
              rows={3}
              value={question}
            />
          </label>

          <details className="copilot-code-shell">
            <summary>{copilot.codeLabel}</summary>
            <div className="copilot-code-body">
              <p>{copilot.codeHint}</p>
              <textarea
                className="copilot-textarea copilot-code-textarea"
                onChange={(event) => setCodeSnippet(event.target.value)}
                placeholder={copilot.codePlaceholder}
                rows={8}
                value={codeSnippet}
              />
            </div>
          </details>

          <div className="hero-actions copilot-actions">
            <button
              className="action-button copilot-submit"
              disabled={!canSubmit || isPending}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {isPending ? copilot.submitting : copilot.submit}
            </button>
            {answer ? (
              <button className="action-button" onClick={() => void handleCopy()} type="button">
                {copilot.copyAnswer}
              </button>
            ) : null}
            {copyStatus ? <span className="action-status">{copyStatus}</span> : null}
          </div>
        </div>

        {error ? (
          <div className="empty-state copilot-error">
            <span className="eyebrow">{copilot.errorTitle}</span>
            <h2>{copilot.errorTitle}</h2>
            <p>{error}</p>
          </div>
        ) : null}

        {isPending ? (
          <div className="copilot-loading">
            <span className="pill">
              <strong>{copilot.loadingTitle}</strong>
              {copilot.loadingBody}
            </span>
          </div>
        ) : null}

        {!answer && !error && !isPending ? (
          <div className="empty-state">
            <span className="eyebrow">{copilot.emptyTitle}</span>
            <h2>{copilot.emptyTitle}</h2>
            <p>{copilot.emptyBody}</p>
          </div>
        ) : null}

        {answer ? (
          <div className="copilot-answer">
            <article className="section-card copilot-answer-card">
              <span className="story-label">{copilot.explanationTitle}</span>
              <h3>{copilot.explanationTitle}</h3>
              <GlossaryRichText
                locale={locale}
                terms={answer.highlightTerms}
                text={answer.explanation}
              />
            </article>

            <div className="copilot-answer-grid">
              <article className="section-card copilot-answer-card">
                <span className="story-label">{copilot.keyConceptsTitle}</span>
                <h3>{copilot.keyConceptsTitle}</h3>
                <div className="copilot-list">
                  {answer.keyConcepts.map((concept) => (
                    <div className="copilot-list-item" key={`${concept.id}-${concept.reason}`}>
                      <Link className="pill pill-link" href={withLocale(locale, `/term/${concept.id}`)}>
                        {concept.label}
                      </Link>
                      <p>{concept.reason}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="section-card copilot-answer-card">
                <span className="story-label">{copilot.nextTermsTitle}</span>
                <h3>{copilot.nextTermsTitle}</h3>
                <div className="copilot-list">
                  {answer.suggestedNextTerms.map((concept) => (
                    <div className="copilot-list-item" key={`${concept.id}-${concept.reason}`}>
                      <Link className="pill pill-link" href={withLocale(locale, `/term/${concept.id}`)}>
                        {concept.label}
                      </Link>
                      <p>{concept.reason}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {answer.caveat ? (
              <article className="section-card copilot-answer-card copilot-caveat-card">
                <span className="story-label">{copilot.caveatTitle}</span>
                <h3>{copilot.caveatTitle}</h3>
                <p>{answer.caveat}</p>
              </article>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
