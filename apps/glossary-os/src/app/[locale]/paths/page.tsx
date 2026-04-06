import Link from "next/link";
import { notFound } from "next/navigation";

import { getCopy } from "@/lib/copy";
import { getBuilderPathDetails, getBuilderPathTerms, getBuilderPaths } from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

export default async function PathsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const copy = getCopy(currentLocale);
  const paths = getBuilderPaths(currentLocale);

  return (
    <div className="term-layout">
      <section className="detail-panel term-hero">
        <div className="term-hero-grid">
          <div className="term-hero-copy">
            <span className="eyebrow">{copy.paths.eyebrow}</span>
            <h1>{copy.paths.title}</h1>
            <p className="lead">{copy.paths.lead}</p>
          </div>

          <aside className="term-sidebar">
            <article className="section-card">
              <h2>{copy.paths.workflowTitle}</h2>
              <div className="context-nav">
                <div className="context-nav-link">
                  <span>1</span>
                  <strong>{copy.paths.workflowStep1}</strong>
                </div>
                <div className="context-nav-link">
                  <span>2</span>
                  <strong>{copy.paths.workflowStep2}</strong>
                </div>
                <div className="context-nav-link">
                  <span>3</span>
                  <strong>{copy.paths.workflowStep3}</strong>
                </div>
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

        <div className="path-grid">
        {paths.map((path) => (
          <article className={`path-card accent-${path.accent}`} key={path.slug}>
            <span className="kicker">{copy.paths.pathEyebrow}</span>
            <h2>{path.title}</h2>
            <p>{path.description}</p>

            <div className="path-overview-grid">
              <div className="section-card path-overview-card">
                <span className="kicker">{copy.paths.idealFor}</span>
                <p>{getBuilderPathDetails(path.slug, currentLocale)?.audience}</p>
              </div>
              <div className="section-card path-overview-card">
                <span className="kicker">{copy.paths.outcome}</span>
                <p>{getBuilderPathDetails(path.slug, currentLocale)?.outcome}</p>
              </div>
            </div>

            <div className="pill-row">
              {getBuilderPathTerms(path.slug, currentLocale).slice(0, 4).map((term) => (
                <span className="pill" key={term.id}>
                  {term.term}
                </span>
              ))}
            </div>

            <div className="pill-row">
              <span className="pill">
                <strong>{path.termIds.length}</strong> {copy.common.terms}
              </span>
            </div>
            <div className="hero-actions">
              <Link className="primary-link" href={withLocale(currentLocale, `/paths/${path.slug}`)}>
                {copy.paths.startPath}
              </Link>
              <Link className="secondary-link" href={withLocale(currentLocale, `/learn/${path.slug}`)}>
                {copy.paths.quizCta}
              </Link>
            </div>
          </article>
        ))}
        </div>
      </section>
    </div>
  );
}
