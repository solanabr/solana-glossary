import Link from "next/link";
import { notFound } from "next/navigation";

import { getCopy } from "@/lib/copy";
import { getLearningTracks } from "@/lib/learning";
import { getUseCases, getUseCaseTerms } from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

export default async function LearnPage({
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
  const tracks = getLearningTracks(currentLocale);
  const useCases = getUseCases(currentLocale);
  const firstTrack = tracks[0];

  return (
    <div className="term-layout">
      <section className="detail-panel term-hero learn-hero">
        <div className="term-hero-grid">
          <div className="term-hero-copy">
            <span className="eyebrow">{copy.learn.eyebrow}</span>
            <h1>{copy.learn.title}</h1>
            <p className="lead">{copy.learn.lead}</p>

            {firstTrack ? (
              <div className="hero-actions">
                <Link className="primary-link" href={withLocale(currentLocale, `/learn/${firstTrack.slug}`)}>
                  {copy.learn.startHere}
                </Link>
                <Link className="secondary-link" href={withLocale(currentLocale, `/paths/${firstTrack.slug}`)}>
                  {copy.paths.learnCta}
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="term-sidebar">
            <article className="section-card term-sidebar-card">
              <div className="term-sidebar-card-head">
                <span className="story-label">{copy.learn.newDevTitle}</span>
                <h2>{copy.learn.recommendedOrder}</h2>
              </div>
              <p>{copy.learn.newDevBody}</p>
              <div className="context-nav">
                {tracks.map((track) => (
                  <div className="context-nav-link" key={track.slug}>
                    <span>{String(track.recommendedIndex).padStart(2, "0")}</span>
                    <strong>{track.title}</strong>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.learn.useCaseTitle}</span>
          <h2>{copy.learn.useCaseTitle}</h2>
          <p>{copy.learn.useCaseBody}</p>
        </div>

        <div className="path-grid">
          {useCases.map((useCase) => {
            const terms = getUseCaseTerms(useCase, currentLocale).slice(0, 4);

            return (
              <article className="path-card use-case-card" key={useCase.slug}>
                <span className="kicker">{copy.learn.useCaseTitle}</span>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
                <div className="pill-row">
                  {terms.map((term) => (
                    <Link className="pill pill-link" href={withLocale(currentLocale, `/term/${term.id}`)} key={term.id}>
                      {term.term}
                    </Link>
                  ))}
                </div>
                <p className="list-copy">{useCase.outcome}</p>
                <div className="hero-actions">
                  <Link className="primary-link" href={withLocale(currentLocale, `/paths/${useCase.pathSlug}`)}>
                    {copy.common.openPath}
                  </Link>
                  <Link className="secondary-link" href={withLocale(currentLocale, `/learn/${useCase.pathSlug}`)}>
                    {copy.common.takeQuiz}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.learn.onboardingTitle}</span>
          <h2>{copy.learn.onboardingTitle}</h2>
          <p>{copy.learn.onboardingBody}</p>
        </div>

        <div className="path-overview-grid">
          {copy.learn.onboardingSteps.map((step, index) => (
            <article className="section-card path-overview-card" key={step}>
              <span className="kicker">{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame">
        <div className="section-heading">
          <span className="eyebrow">{copy.learn.quizTitle}</span>
          <h2>{copy.learn.quizTitle}</h2>
          <p>{copy.learn.quizBody}</p>
        </div>

        <div className="path-grid">
          {tracks.map((track) => (
            <article className={`path-card accent-${track.accent}`} key={track.slug}>
              <span className="kicker">{copy.common.builderPath}</span>
              <h3>{track.title}</h3>
              <p>{track.description}</p>

              <div className="path-overview-grid">
                <div className="section-card path-overview-card">
                  <span className="kicker">{copy.paths.idealFor}</span>
                  <p>{track.audience}</p>
                </div>
                <div className="section-card path-overview-card">
                  <span className="kicker">{copy.paths.outcome}</span>
                  <p>{track.outcome}</p>
                </div>
              </div>

              <div className="pill-row">
                <span className="pill">
                  <strong>{track.questionCount}</strong> {copy.learn.questionLabel.toLowerCase()}
                </span>
                <span className="pill">
                  <strong>{track.termIds.length}</strong> {copy.common.terms}
                </span>
              </div>

              <div className="hero-actions">
                <Link className="primary-link" href={withLocale(currentLocale, `/learn/${track.slug}`)}>
                  {copy.common.takeQuiz}
                </Link>
                <Link className="secondary-link" href={withLocale(currentLocale, `/paths/${track.slug}`)}>
                  {copy.common.openPath}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
