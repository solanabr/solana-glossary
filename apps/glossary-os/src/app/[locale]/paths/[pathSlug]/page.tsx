import Link from "next/link";
import { notFound } from "next/navigation";

import { getCopy } from "@/lib/copy";
import {
  getBuilderPath,
  getBuilderPathCategorySummary,
  getBuilderPathDetails,
  getBuilderPathSiblings,
  getBuilderPathTerms,
  getCategoryMeta,
} from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pathSlug: string }>;
}) {
  const { locale, pathSlug } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const copy = getCopy(currentLocale);
  const path = getBuilderPath(pathSlug, currentLocale);
  if (!path) {
    notFound();
  }

  const terms = getBuilderPathTerms(path.slug, currentLocale);
  const details = getBuilderPathDetails(path.slug, currentLocale);
  const siblings = getBuilderPathSiblings(path.slug, currentLocale);
  const categories = getBuilderPathCategorySummary(path.slug, currentLocale);

  return (
    <div className="term-layout">
      <section className={`detail-panel term-hero accent-${path.accent}`}>
        <div className="term-hero-grid">
          <div className="term-hero-copy">
            <span className="eyebrow">{copy.paths.detailEyebrow}</span>
            <h1>{path.title}</h1>
            <p className="lead">{path.description}</p>

            <div className="pill-row">
              <span className="pill">
                <strong>{terms.length}</strong> {copy.common.terms}
              </span>
              <span className="pill">
                <strong>{categories.length}</strong> {copy.paths.categories}
              </span>
            </div>

            <div className="hero-actions">
              <Link className="primary-link" href={withLocale(currentLocale, `/learn/${path.slug}`)}>
                {copy.paths.quizCta}
              </Link>
              <Link className="secondary-link" href={withLocale(currentLocale, "/learn")}>
                {copy.paths.learnCta}
              </Link>
            </div>
          </div>

          <aside className="term-sidebar">
            <article className="section-card">
              <h2>{copy.paths.overview}</h2>
              <div className="context-nav">
                <div className="context-nav-link">
                  <span>{copy.paths.idealFor}</span>
                  <strong>{details?.audience}</strong>
                </div>
                <div className="context-nav-link">
                  <span>{copy.paths.outcome}</span>
                  <strong>{details?.outcome}</strong>
                </div>
              </div>
            </article>

            <article className="section-card">
              <h2>{copy.paths.categories}</h2>
              <div className="pill-row">
                {categories.map((category) => (
                  <span className="pill" key={category.label}>
                    {category.label}
                  </span>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.paths.sequenceEyebrow}</span>
          <h2>{copy.paths.sequenceTitle}</h2>
          <p>{copy.paths.sequenceLead}</p>
        </div>

        <div className="sequence-stack">
          {terms.map((term, index) => (
            <article className="sequence-card" key={term.id}>
              <div className="sequence-index">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="sequence-content">
                <div className="result-card-head">
                  <span className="kicker">{getCategoryMeta(term.category, currentLocale).label}</span>
                  {index === 0 ? <span className="pill">{copy.paths.startHere}</span> : null}
                </div>
                <h2>{term.term}</h2>
                <p>{term.definition}</p>
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/term/${term.id}`)}>
                    {copy.common.openTerm}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.paths.workflowTitle}</span>
          <h2>{copy.paths.sequenceTitle}</h2>
          <p>{copy.paths.sequenceLead}</p>
        </div>

        <div className="path-overview-grid">
          <article className="section-card path-overview-card">
            <span className="kicker">1</span>
            <p>{copy.paths.workflowStep1}</p>
          </article>
          <article className="section-card path-overview-card">
            <span className="kicker">2</span>
            <p>{copy.paths.workflowStep2}</p>
          </article>
          <article className="section-card path-overview-card">
            <span className="kicker">3</span>
            <p>{copy.paths.workflowStep3}</p>
          </article>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.paths.detailEyebrow}</span>
          <h2>{copy.term.keepGoing}</h2>
          <p>{copy.term.moreInCategoryBody}</p>
        </div>

        <div className="path-grid">
          {siblings.previous ? (
            <article className={`path-card accent-${siblings.previous.accent}`}>
              <span className="kicker">{copy.paths.previousPath}</span>
              <h3>{siblings.previous.title}</h3>
              <p>{siblings.previous.description}</p>
              <div className="link-row">
                <Link className="text-link" href={withLocale(currentLocale, `/paths/${siblings.previous.slug}`)}>
                  {copy.common.openPath}
                </Link>
              </div>
            </article>
          ) : null}
          {siblings.next ? (
            <article className={`path-card accent-${siblings.next.accent}`}>
              <span className="kicker">{copy.paths.nextPath}</span>
              <h3>{siblings.next.title}</h3>
              <p>{siblings.next.description}</p>
              <div className="link-row">
                <Link className="text-link" href={withLocale(currentLocale, `/paths/${siblings.next.slug}`)}>
                  {copy.common.openPath}
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
