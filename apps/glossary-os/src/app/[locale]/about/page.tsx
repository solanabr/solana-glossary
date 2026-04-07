import { notFound } from "next/navigation";

import { getCopy } from "@/lib/copy";
import { allTerms, categoryOrder, getBuilderPaths } from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";

export default async function AboutPage({
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
      <section className="detail-panel term-hero about-hero">
        <div className="term-hero-grid">
          <div className="term-hero-copy">
            <span className="eyebrow">{copy.about.eyebrow}</span>
            <h1>{copy.about.title}</h1>
            <p className="lead">{copy.about.lead}</p>
          </div>

          <aside className="term-sidebar">
            <article className="section-card term-sidebar-card">
              <div className="term-sidebar-card-head">
                <span className="story-label">{copy.about.outcomesTitle}</span>
                <h2>Glossary OS</h2>
              </div>
              <div className="pill-row term-sidebar-pills">
                <span className="pill">
                  <strong>{allTerms.length}</strong>
                  {copy.common.terms}
                </span>
                <span className="pill">
                  <strong>{categoryOrder.length}</strong>
                  {copy.landing.discovery}
                </span>
                <span className="pill">
                  <strong>{paths.length}</strong>
                  {copy.common.builderPath}
                </span>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.about.pillarsTitle}</span>
          <h2>{copy.about.pillarsTitle}</h2>
          <p>{copy.about.challengeBody}</p>
        </div>

        <div className="section-grid">
          {copy.about.pillars.map((pillar) => (
            <article className="section-card about-card" key={pillar.title}>
              <span className="story-label">{copy.about.eyebrow}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame about-detail-grid">
        <article className="section-card about-card">
          <span className="story-label">{copy.about.challengeTitle}</span>
          <h2>{copy.about.challengeTitle}</h2>
          <p>{copy.about.challengeBody}</p>
        </article>

        <article className="section-card about-card">
          <span className="story-label">{copy.about.integrationTitle}</span>
          <h2>{copy.about.integrationTitle}</h2>
          <p>{copy.about.integrationBody}</p>
        </article>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.about.outcomesTitle}</span>
          <h2>{copy.about.outcomesTitle}</h2>
          <p>{copy.about.integrationBody}</p>
        </div>

        <div className="section-grid">
          {copy.about.outcomes.map((item) => (
            <article className="section-card about-outcome-card" key={item}>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
