import { GlossaryCopilot } from "@/components/glossary-copilot";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TermActions } from "@/components/term-actions";
import { getCopy } from "@/lib/copy";
import {
  getBuilderPathsForTerm,
  getCategoryMeta,
  getCategoryTermPreview,
  getCompactContext,
  getConceptGraph,
  getConfusableTerms,
  getMentalModel,
  getRelatedTerms,
  getSiblingTerms,
  getTermById,
} from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

function getBuilderUseText(locale: Locale, pathTitles: string[], relatedCount: number): string {
  const joinedPaths = pathTitles.join(", ");

  if (locale === "pt") {
    if (pathTitles.length > 0) {
      return `Fica mais útil quando você está navegando por ${joinedPaths} e precisa de vocabulário aterrado dentro de um fluxo real de build.`;
    }

    if (relatedCount > 0) {
      return "Este termo destrava conceitos adjacentes rapidamente, então funciona melhor quando você o trata como um ponto de conexão, não como definição isolada.";
    }

    return "Este termo importa quando você precisa de vocabulário preciso para a camada de Solana em que ele vive e quer evitar explicações rasas.";
  }

  if (locale === "es") {
    if (pathTitles.length > 0) {
      return `Se vuelve más útil cuando navegas por ${joinedPaths} y necesitas vocabulario aterrizado dentro de un flujo real de build.`;
    }

    if (relatedCount > 0) {
      return "Este término desbloquea conceptos adyacentes rápido, así que funciona mejor cuando lo tratas como un punto de conexión y no como una definición aislada.";
    }

    return "Este término importa cuando necesitas vocabulario preciso para la capa de Solana en la que vive y quieres evitar explicaciones superficiales.";
  }

  if (pathTitles.length > 0) {
    return `Most useful when you are moving through ${joinedPaths} and need grounded vocabulary inside a real build flow.`;
  }

  if (relatedCount > 0) {
    return `This term unlocks adjacent concepts quickly, so it works best when you treat it as a junction instead of an isolated definition.`;
  }

  return `This term matters when you need precise vocabulary for the Solana layer it belongs to and want to avoid shallow explanations.`;
}

function getNextConcepts(
  term: NonNullable<ReturnType<typeof getTermById>>,
  relatedTerms: ReturnType<typeof getRelatedTerms>,
  categoryPreview: ReturnType<typeof getCategoryTermPreview>,
  siblingTerms: ReturnType<typeof getSiblingTerms>,
) {
  const seen = new Set<string>();
  const candidates = [
    ...relatedTerms,
    siblingTerms.next,
    siblingTerms.previous,
    ...categoryPreview,
  ].filter(
    (
      candidate,
    ): candidate is NonNullable<ReturnType<typeof getTermById>> => Boolean(candidate),
  );

  return candidates.filter((candidate) => {
    if (!candidate || seen.has(candidate.id) || candidate.id === term.id) {
      return false;
    }

    seen.add(candidate.id);
    return true;
  }).slice(0, 4);
}

export default async function TermPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const copy = getCopy(currentLocale);
  const term = getTermById(slug, currentLocale);
  if (!term) {
    notFound();
  }

  const relatedTerms = getRelatedTerms(term, currentLocale);
  const categoryPreview = getCategoryTermPreview(term, currentLocale);
  const siblingTerms = getSiblingTerms(term, currentLocale);
  const builderPaths = getBuilderPathsForTerm(term.id, currentLocale);
  const compactContext = getCompactContext(term, currentLocale);
  const confusableTerms = getConfusableTerms(term, currentLocale);
  const categoryMeta = getCategoryMeta(term.category, currentLocale);
  const mentalModel = getMentalModel(term, currentLocale);
  const conceptGraph = getConceptGraph(term, currentLocale);
  const builderUseText = getBuilderUseText(
    currentLocale,
    builderPaths.map((path) => path.title),
    relatedTerms.length,
  );
  const nextConcepts = getNextConcepts(term, relatedTerms, categoryPreview, siblingTerms);

  return (
    <div className="term-layout">
      <nav aria-label="Breadcrumb" className="term-breadcrumbs">
        <Link className="term-breadcrumb-link" href={withLocale(currentLocale, "/explore")}>
          {copy.common.backToExplore}
        </Link>
        <span className="term-breadcrumb-separator">/</span>
        <span className="term-breadcrumb-current">{term.term}</span>
      </nav>

      <section className="detail-panel term-hero">
        <div className="term-hero-grid">
          <div className="term-hero-copy">
            <span className="eyebrow">{categoryMeta.label}</span>
            <h1>{term.term}</h1>
            <p className="lead">{term.definition}</p>

            <div className="pill-row term-meta-row">
              <span className="pill">
                <strong>{copy.common.id}</strong>
                {term.id}
              </span>
              {(term.aliases ?? []).map((alias) => (
                <span className="pill" key={alias}>
                  <strong>{copy.common.alias}</strong>
                  {alias}
                </span>
              ))}
            </div>

            <TermActions compactContext={compactContext} locale={currentLocale} term={term} />
          </div>

          <aside className="term-sidebar">
            <article className="section-card term-sidebar-card">
              <div className="term-sidebar-card-head">
                <span className="story-label">{copy.term.context}</span>
                <h2>{categoryMeta.label}</h2>
              </div>
              <p>{categoryMeta.description}</p>
              <div className="pill-row term-sidebar-pills">
                <span className="pill">
                  <strong>{relatedTerms.length}</strong>
                  {copy.term.relatedTitle}
                </span>
                {builderPaths.length > 0 ? (
                  <span className="pill">
                    <strong>{builderPaths.length}</strong>
                    {copy.common.builderPath}
                  </span>
                ) : null}
              </div>
            </article>

            <article className="section-card term-sidebar-card">
              <div className="term-sidebar-card-head">
                <span className="story-label">{copy.term.keepGoing}</span>
                <h2>{copy.term.keepGoing}</h2>
              </div>
              <div className="context-nav">
                {siblingTerms.previous ? (
                  <Link
                    className="context-nav-link"
                    href={withLocale(currentLocale, `/term/${siblingTerms.previous.id}`)}
                  >
                    <span>{copy.term.previousInCategory}</span>
                    <strong>{siblingTerms.previous.term}</strong>
                  </Link>
                ) : null}
                {siblingTerms.next ? (
                  <Link
                    className="context-nav-link"
                    href={withLocale(currentLocale, `/term/${siblingTerms.next.id}`)}
                  >
                    <span>{copy.term.nextInCategory}</span>
                    <strong>{siblingTerms.next.term}</strong>
                  </Link>
                ) : null}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section-frame">
        <div className="insight-grid">
          <article className="section-card insight-card">
            <span className="story-label">{copy.term.plainMeaning}</span>
            <h2>{copy.term.plainMeaning}</h2>
            <p>{copy.term.plainMeaningLead}</p>
            <p className="insight-copy">{term.definition}</p>
          </article>
          <article className="section-card insight-card mental-model-card">
            <span className="story-label">{copy.term.mentalModel}</span>
            <h2>{copy.term.mentalModel}</h2>
            <p>{copy.term.mentalModelLead}</p>
            <p className="insight-copy">{mentalModel}</p>
          </article>
          <article className="section-card insight-card">
            <span className="story-label">{copy.term.technicalContext}</span>
            <h2>{copy.term.technicalContext}</h2>
            <p>{copy.term.technicalContextLead}</p>
            <p className="insight-copy">{categoryMeta.description}</p>
          </article>
          <article className="section-card insight-card">
            <span className="story-label">{copy.term.builderUse}</span>
            <h2>{copy.term.builderUse}</h2>
            <p>{copy.term.builderUseLead}</p>
            <p className="insight-copy">{builderUseText}</p>
            {builderPaths.length > 0 ? (
              <div className="pill-row">
                {builderPaths.map((path) => (
                  <Link className="pill pill-link" href={withLocale(currentLocale, `/paths/${path.slug}`)} key={path.slug}>
                    {path.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.term.aiHandoff}</span>
          <h2>{copy.term.aiHandoff}</h2>
          <p>{copy.term.aiHandoffLead}</p>
        </div>

        <article className="detail-panel ai-handoff-card">
          <pre className="context-preview">{compactContext}</pre>
        </article>
      </section>

      <GlossaryCopilot locale={currentLocale} termId={term.id} />

      {conceptGraph.length > 0 ? (
        <section className="section-frame">
          <div className="section-heading">
            <span className="eyebrow">{copy.term.graphEyebrow}</span>
            <h2>{copy.term.graphTitle}</h2>
            <p>{copy.term.graphBody}</p>
          </div>

          <div className="concept-graph-grid">
            {conceptGraph.map((node) => (
              <article className="section-card concept-graph-card" key={node.term.id}>
                <div className="concept-graph-head">
                  <span className="kicker">{copy.term.graphBranch}</span>
                  <h3>{node.term.term}</h3>
                  <p>{node.term.definition}</p>
                </div>
                {node.children.length > 0 ? (
                  <div className="pill-row">
                    {node.children.map((child) => (
                      <Link className="pill pill-link" href={withLocale(currentLocale, `/term/${child.id}`)} key={child.id}>
                        {child.term}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/term/${node.term.id}`)}>
                    {copy.common.openTerm}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {nextConcepts.length > 0 ? (
        <section className="section-frame">
          <div className="section-heading">
            <span className="eyebrow">{copy.term.nextExploreEyebrow}</span>
            <h2>{copy.term.nextExploreTitle}</h2>
            <p>{copy.term.nextExploreBody}</p>
          </div>

          <div className="term-grid next-concepts-grid">
            {nextConcepts.map((candidate) => (
              <article className="term-card next-concept-card" key={candidate.id}>
                <span className="kicker">{getCategoryMeta(candidate.category, currentLocale).label}</span>
                <h3>{candidate.term}</h3>
                <p>{candidate.definition}</p>
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/term/${candidate.id}`)}>
                    {copy.common.openTerm}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {confusableTerms.length > 0 ? (
        <section className="section-frame">
          <div className="section-heading">
            <span className="eyebrow">{copy.term.confusedEyebrow}</span>
            <h2>{copy.term.confusedTitle}</h2>
            <p>{copy.term.confusedBody}</p>
          </div>

          <div className="results-grid confused-grid">
            {confusableTerms.map((candidate) => (
              <article className="result-card confused-card" key={candidate.id}>
                <div className="result-card-head">
                  <span className="kicker">{getCategoryMeta(candidate.category, currentLocale).label}</span>
                  <span className="result-id">{candidate.id}</span>
                </div>
                <h2>{candidate.term}</h2>
                <p>{candidate.definition}</p>
                {(candidate.aliases ?? []).length > 0 ? (
                  <div className="pill-row">
                    {candidate.aliases?.slice(0, 2).map((alias) => (
                      <span className="pill" key={alias}>
                        <strong>{copy.common.alias}</strong>
                        {alias}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/term/${candidate.id}`)}>
                    {copy.common.openTerm}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.term.relatedEyebrow}</span>
          <h2>{copy.term.relatedTitle}</h2>
          <p>{copy.term.relatedBody}</p>
        </div>

        {relatedTerms.length > 0 ? (
          <div className="results-grid">
            {relatedTerms.map((relatedTerm) => (
              <article className="result-card" key={relatedTerm.id}>
                <div className="result-card-head">
                  <span className="kicker">{getCategoryMeta(relatedTerm.category, currentLocale).label}</span>
                  <span className="result-id">{relatedTerm.id}</span>
                </div>
                <h2>{relatedTerm.term}</h2>
                <p>{relatedTerm.definition}</p>
                <div className="link-row">
                  <Link
                    className="text-link"
                    href={withLocale(currentLocale, `/term/${relatedTerm.id}`)}
                  >
                    {copy.common.openTerm}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="eyebrow">{copy.term.noMappedRelationsEyebrow}</span>
            <h2>{copy.term.noMappedRelationsTitle}</h2>
            <p>{copy.term.noMappedRelationsBody}</p>
          </div>
        )}
      </section>

      {builderPaths.length > 0 ? (
        <section className="section-frame">
          <div className="section-heading">
            <span className="eyebrow">{copy.term.builderEyebrow}</span>
            <h2>{copy.term.builderTitle}</h2>
            <p>{copy.term.builderBody}</p>
          </div>

          <div className="path-grid">
            {builderPaths.map((path) => (
              <article className={`path-card accent-${path.accent}`} key={path.slug}>
                <span className="kicker">{copy.common.builderPath}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <div className="pill-row">
                  <span className="pill">
                    <strong>{path.termIds.length}</strong> {copy.common.terms}
                  </span>
                </div>
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/paths/${path.slug}`)}>
                    {copy.common.openPath}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.term.moreInCategoryEyebrow}</span>
          <h2>{copy.term.moreInCategoryTitle}</h2>
          <p>{copy.term.moreInCategoryBody}</p>
        </div>

        <div className="term-grid">
          {categoryPreview.map((candidate) => (
            <article className="term-card" key={candidate.id}>
              <span className="kicker">{getCategoryMeta(candidate.category, currentLocale).label}</span>
              <h3>{candidate.term}</h3>
              <p>{candidate.definition}</p>
              <div className="link-row">
                <Link className="text-link" href={withLocale(currentLocale, `/term/${candidate.id}`)}>
                  {copy.common.openTerm}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
