"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AgentResult, AgentStep } from "@/lib/copilot/agent-mode";
import { runAgentMode } from "@/lib/copilot/agent-mode";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";
import { GlossaryRichText } from "./glossary-rich-text";

type AgentModeCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  goalLabel: string;
  goalPlaceholder: string;
  run: string;
  running: string;
  errorTitle: string;
  noIssues: string;
  planTitle: string;
  generateTitle: string;
  explainTitle: string;
  issuesTitle: string;
  nextTermsTitle: string;
};

const agentModeCopyByLocale: Record<Locale, AgentModeCopy> = {
  en: {
    eyebrow: "Agent Mode",
    title: "Run a multi-step Solana workflow from one goal.",
    lead:
      "Describe what you want to build. The Copilot will plan, generate, explain, check for obvious issues, and suggest what to learn next.",
    goalLabel: "Goal",
    goalPlaceholder:
      "Example: Build an Anchor program for a user vault with deposits and withdrawals.",
    run: "Run agent",
    running: "Running agent...",
    errorTitle: "Agent error",
    noIssues: "No obvious issues were detected by the local checks.",
    planTitle: "Plan",
    generateTitle: "Generated code",
    explainTitle: "Explanation",
    issuesTitle: "Issues",
    nextTermsTitle: "Next terms",
  },
  pt: {
    eyebrow: "Modo Agente",
    title: "Execute um workflow multi-etapas de Solana a partir de um objetivo.",
    lead:
      "Descreva o que você quer construir. O Copilot vai planejar, gerar, explicar, checar problemas óbvios e sugerir o que aprender depois.",
    goalLabel: "Objetivo",
    goalPlaceholder:
      "Exemplo: construir um programa Anchor para um vault de usuário com depósitos e saques.",
    run: "Executar agente",
    running: "Executando agente...",
    errorTitle: "Erro do agente",
    noIssues: "Nenhum problema óbvio foi detectado pelas checagens locais.",
    planTitle: "Plano",
    generateTitle: "Código gerado",
    explainTitle: "Explicação",
    issuesTitle: "Problemas",
    nextTermsTitle: "Próximos termos",
  },
  es: {
    eyebrow: "Modo Agente",
    title: "Ejecuta un workflow multi-paso de Solana desde un solo objetivo.",
    lead:
      "Describe lo que quieres construir. El Copilot planificará, generará, explicará, revisará problemas evidentes y sugerirá qué aprender después.",
    goalLabel: "Objetivo",
    goalPlaceholder:
      "Ejemplo: crear un programa Anchor para una bóveda de usuario con depósitos y retiros.",
    run: "Ejecutar agente",
    running: "Ejecutando agente...",
    errorTitle: "Error del agente",
    noIssues: "No se detectaron problemas evidentes con las comprobaciones locales.",
    planTitle: "Plan",
    generateTitle: "Código generado",
    explainTitle: "Explicación",
    issuesTitle: "Problemas",
    nextTermsTitle: "Próximos términos",
  },
};

function StepItem({ step }: { step: AgentStep }) {
  return (
    <div className={`copilot-list-item agent-step agent-step-${step.status}`}>
      <div className="pill-row">
        <strong>{step.label}</strong>
        <span className="pill">{step.status}</span>
      </div>
      {step.error ? <p>{step.error}</p> : null}
    </div>
  );
}

export function AgentMode({
  locale,
  termId,
  initialGoal,
  autorun,
}: {
  locale: Locale;
  termId: string;
  initialGoal?: string;
  autorun?: boolean;
}) {
  const copy = getCopy(locale);
  const agentCopy = agentModeCopyByLocale[locale];
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const hasAutoRun = useRef(false);

  const canRun = useMemo(() => goal.trim().length > 0 && !running, [goal, running]);

  async function handleRun() {
    if (!canRun) return;

    setRunning(true);
    setError("");
    setResult(null);
    setSteps([]);

    try {
      const agentResult = await runAgentMode({
        goal,
        locale,
        termId,
        onStep(step) {
          setSteps((previous) => {
            const existingIndex = previous.findIndex((item) => item.type === step.type);
            if (existingIndex >= 0) {
              const next = [...previous];
              next[existingIndex] = step;
              return next;
            }

            return [...previous, step];
          });
        },
      });

      setResult(agentResult);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : copy.copilot.genericError;
      setError(message);
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (!autorun || hasAutoRun.current) return;
    if (!initialGoal?.trim()) return;

    hasAutoRun.current = true;
    void handleRun();
  }, [autorun, initialGoal]);

  return (
    <section className="section-frame">
      <div className="section-heading">
        <span className="eyebrow">{agentCopy.eyebrow}</span>
        <h2>{agentCopy.title}</h2>
        <p>{agentCopy.lead}</p>
      </div>

      <div className="detail-panel">
        <label className="copilot-field">
          <span className="story-label">{agentCopy.goalLabel}</span>
          <textarea
            className="copilot-textarea"
            onChange={(event) => setGoal(event.target.value)}
            placeholder={agentCopy.goalPlaceholder}
            rows={4}
            value={goal}
          />
        </label>

        <div className="hero-actions copilot-actions">
          <button
            className="action-button copilot-submit"
            disabled={!canRun}
            onClick={() => void handleRun()}
            type="button"
          >
            {running ? agentCopy.running : agentCopy.run}
          </button>
        </div>

        {steps.length > 0 ? (
          <div className="copilot-list">
            {steps.map((step) => (
              <StepItem key={step.type} step={step} />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="empty-state copilot-error">
            <span className="eyebrow">{agentCopy.errorTitle}</span>
            <h2>{agentCopy.errorTitle}</h2>
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="copilot-answer">
            {result.planAnswer ? (
              <article className="section-card copilot-answer-card">
                <span className="story-label">{agentCopy.planTitle}</span>
                <h3>{agentCopy.planTitle}</h3>
                <GlossaryRichText
                  locale={locale}
                  terms={result.planAnswer.highlightTerms}
                  text={result.planAnswer.explanation}
                />
              </article>
            ) : null}

            {result.generatedCode ? (
              <article className="section-card copilot-answer-card">
                <span className="story-label">{agentCopy.generateTitle}</span>
                <h3>{agentCopy.generateTitle}</h3>
                <pre className="copilot-code-shell">
                  <code>{result.generatedCode}</code>
                </pre>
              </article>
            ) : null}

            {result.explainAnswer ? (
              <article className="section-card copilot-answer-card">
                <span className="story-label">{agentCopy.explainTitle}</span>
                <h3>{agentCopy.explainTitle}</h3>
                <GlossaryRichText
                  locale={locale}
                  terms={result.explainAnswer.highlightTerms}
                  text={result.explainAnswer.explanation}
                />
              </article>
            ) : null}

            <article className="section-card copilot-answer-card">
              <span className="story-label">{agentCopy.issuesTitle}</span>
              <h3>{agentCopy.issuesTitle}</h3>
              {result.issues.length > 0 ? (
                <div className="copilot-list">
                  {result.issues.map((issue) => (
                    <div className="copilot-list-item" key={`${issue.code}-${issue.relatedTermId}`}>
                      <div className="pill-row">
                        <span className="pill">
                          <strong>Severity</strong>
                          {issue.severity}
                        </span>
                        <Link className="pill pill-link" href={withLocale(locale, `/term/${issue.relatedTermId}`)}>
                          {issue.relatedTermId}
                        </Link>
                      </div>
                      <p>{issue.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{agentCopy.noIssues}</p>
              )}
            </article>

            <article className="section-card copilot-answer-card">
              <span className="story-label">{agentCopy.nextTermsTitle}</span>
              <h3>{agentCopy.nextTermsTitle}</h3>
              <div className="copilot-list">
                {result.nextTerms.map((term) => (
                  <div className="copilot-list-item" key={`${term.id}-${term.reason}`}>
                    <Link className="pill pill-link" href={withLocale(locale, `/term/${term.id}`)}>
                      {term.label}
                    </Link>
                    <p>{term.reason}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}
