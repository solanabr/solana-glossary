import Link from "next/link";
import { notFound } from "next/navigation";

import { HeroSearchForm } from "@/components/hero-search-form";
import { getCopy } from "@/lib/copy";
import {
  allTerms,
  categoryOrder,
  getBuilderPaths,
  getBuilderPathTerms,
  getCategoryCount,
  getCategoryMeta,
  getConceptGraph,
  getFeaturedTerms,
  getMentalModel,
  getTermById,
  getTermsByCategory,
  getUseCases,
} from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

export default async function LocaleHomePage({
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
  const featuredTerms = getFeaturedTerms(currentLocale);
  const builderPaths = getBuilderPaths(currentLocale);
  const featuredCategories = categoryOrder.slice(0, 8);
  const useCases = getUseCases(currentLocale).slice(0, 3);
  const mentalModelTerm = getTermById("pda", currentLocale) ?? featuredTerms[0];
  const graphTerm = getTermById("transaction", currentLocale) ?? featuredTerms[1] ?? featuredTerms[0];
  const mentalModel = mentalModelTerm ? getMentalModel(mentalModelTerm, currentLocale) : null;
  const conceptGraph = graphTerm ? getConceptGraph(graphTerm, currentLocale, 3) : [];
  const heroStats = [
    { value: `${allTerms.length}`, label: copy.landing.coverage },
    { value: `${categoryOrder.length}`, label: copy.landing.discovery },
    { value: "3", label: copy.landing.locales },
    { value: `${builderPaths.length}`, label: copy.common.builderPath },
  ];

  return (
    <>
      <section className="hero-panel hero-center-panel">
        <div className="hero-center-copy">
          <span className="eyebrow">{copy.landing.eyebrow}</span>
          <h1 className="display-title">{copy.landing.title}</h1>
          <p className="lead hero-center-lead">{copy.landing.lead}</p>

          <div className="hero-search-stage">
            <HeroSearchForm locale={currentLocale} />
          </div>

          <div className="hero-actions hero-actions-centered">
            <Link className="primary-link" href={withLocale(currentLocale, "/explore")}>
              {copy.landing.ctaExplore}
            </Link>
            <Link className="secondary-link" href={withLocale(currentLocale, "/paths")}>
              {copy.landing.ctaPaths}
            </Link>
          </div>
        </div>

        <div className="hero-quick-start hero-quick-start-centered">
          <div className="quick-start-copy quick-start-copy-centered">
            <span className="story-label">{copy.landing.quickStartEyebrow}</span>
            <h2>{copy.landing.quickStartTitle}</h2>
            <p>{copy.landing.quickStartBody}</p>
          </div>
          <div className="quick-start-row quick-start-row-hero">
            {builderPaths.slice(0, 4).map((path) => (
              <Link
                className={`quick-start-link accent-${path.accent}`}
                href={withLocale(currentLocale, `/paths/${path.slug}`)}
                key={path.slug}
              >
                <span>{path.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-stat-strip">
        {heroStats.map((stat) => (
          <article className="hero-stat-item" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="section-frame hero-preview-section">
        <div className="hero-preview-grid">
          <article className="story-card">
            <span className="story-label">{copy.landing.whyExists}</span>
            <p>{copy.landing.whyExistsBody}</p>
          </article>

          <article className="story-card preview-card">
            <span className="story-label">{copy.landing.previewEyebrow}</span>
            <h2>{copy.landing.previewTitle}</h2>
            <p>{copy.landing.previewBody}</p>
            <div className="pill-row">
              {builderPaths.slice(0, 4).map((path) => (
                <Link
                  className="pill pill-link"
                  href={withLocale(currentLocale, `/paths/${path.slug}`)}
                  key={path.slug}
                >
                  {path.title}
                </Link>
              ))}
            </div>
          </article>

          <article className="signal-card signal-card-featured">
            <span className="signal-kicker">{copy.landing.aiReady}</span>
            <strong>AI</strong>
            <p>{copy.landing.aiReadyBody}</p>
          </article>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.landing.previewEyebrow}</span>
          <h2>{copy.landing.previewTitle}</h2>
          <p>{copy.landing.previewBody}</p>
        </div>

        <div className="hero-differentiator-grid">
          {mentalModelTerm && mentalModel ? (
            <article className="section-card value-card mental-model-card">
              <span className="story-label">{copy.term.mentalModel}</span>
              <h2>{mentalModelTerm.term}</h2>
              <p className="list-copy">{mentalModel}</p>
              <div className="link-row">
                <Link className="text-link" href={withLocale(currentLocale, `/term/${mentalModelTerm.id}`)}>
                  {copy.common.openTerm}
                </Link>
              </div>
            </article>
          ) : null}

          {graphTerm ? (
            <article className="section-card value-card">
              <span className="story-label">{copy.term.graphEyebrow}</span>
              <h2>{graphTerm.term}</h2>
              <p>{copy.term.graphBody}</p>
              <div className="pill-row">
                {conceptGraph.map((node) => (
                  <Link className="pill pill-link" href={withLocale(currentLocale, `/term/${node.term.id}`)} key={node.term.id}>
                    {node.term.term}
                  </Link>
                ))}
              </div>
            </article>
          ) : null}

          <article className="section-card value-card use-case-card">
            <span className="story-label">{copy.learn.useCaseTitle}</span>
            <h2>{copy.learn.useCaseTitle}</h2>
            <p>{copy.learn.useCaseBody}</p>
            <div className="pill-row">
              {useCases.map((useCase) => (
                <Link className="pill pill-link" href={withLocale(currentLocale, `/paths/${useCase.pathSlug}`)} key={useCase.slug}>
                  {useCase.title}
                </Link>
              ))}
            </div>
            <div className="link-row">
              <Link className="text-link" href={withLocale(currentLocale, "/learn")}>
                {copy.common.openLearn}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section-frame">
        <div className="value-grid">
          <article className="section-card value-card">
            <span className="story-label">{copy.landing.speed}</span>
            <h2>{copy.landing.speed}</h2>
            <p>{copy.landing.speedBody}</p>
          </article>
          <article className="section-card value-card">
            <span className="story-label">{copy.landing.builderFocus}</span>
            <h2>{copy.landing.builderFocus}</h2>
            <p>{copy.landing.builderFocusBody}</p>
          </article>
          <article className="section-card value-card">
            <span className="story-label">{copy.landing.aiReady}</span>
            <h2>{copy.landing.aiReady}</h2>
            <p>{copy.landing.aiReadyBody}</p>
          </article>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.landing.browseEyebrow}</span>
          <h2>{copy.landing.browseTitle}</h2>
          <p>{copy.landing.browseBody}</p>
        </div>

        <div className="category-grid">
          {featuredCategories.map((category) => {
            const meta = getCategoryMeta(category, currentLocale);
            const previewTerms = getTermsByCategory(category, currentLocale).slice(0, 3);

            return (
              <article className="category-card" key={category}>
                <div className="category-card-head">
                  <span className="category-short">{meta.shortLabel}</span>
                  <span className="pill">
                    <strong>{getCategoryCount(category)}</strong> {copy.common.terms}
                  </span>
                </div>
                <h3>{meta.label}</h3>
                <p>{meta.description}</p>
                <div className="pill-row">
                  {previewTerms.map((term) => (
                    <Link
                      className="pill pill-link"
                      href={withLocale(currentLocale, `/term/${term.id}`)}
                      key={term.id}
                    >
                      {term.term}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-frame spotlight-layout">
        <div className="section-heading">
          <span className="eyebrow">{copy.landing.builderEyebrow}</span>
          <h2>{copy.landing.builderTitle}</h2>
          <p>{copy.landing.builderBody}</p>
        </div>

        <div className="path-grid">
          {builderPaths.map((path) => {
            const previewTerms = getBuilderPathTerms(path.slug, currentLocale).slice(0, 4);

            return (
              <article className={`path-card accent-${path.accent}`} key={path.slug}>
                <span className="kicker">{copy.common.builderPath}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <div className="pill-row">
                  {previewTerms.map((term) => (
                    <span className="pill" key={term.id}>
                      {term.term}
                    </span>
                  ))}
                </div>
                <div className="link-row">
                  <Link className="text-link" href={withLocale(currentLocale, `/paths/${path.slug}`)}>
                    {copy.common.openPath}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.landing.featuredEyebrow}</span>
          <h2>{copy.landing.featuredTitle}</h2>
          <p>{copy.landing.featuredBody}</p>
        </div>

        <div className="term-grid">
          {featuredTerms.map((term) => (
            <article className="term-card" key={term.id}>
              <span className="kicker">{getCategoryMeta(term.category, currentLocale).label}</span>
              <h3>{term.term}</h3>
              <p>{term.definition}</p>
              <div className="link-row">
                <Link className="text-link" href={withLocale(currentLocale, `/term/${term.id}`)}>
                  {copy.common.openTerm}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
