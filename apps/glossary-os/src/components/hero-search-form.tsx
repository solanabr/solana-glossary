import type { Locale } from "@/lib/locales";
import { getCopy } from "@/lib/copy";
import { withLocale } from "@/lib/routes";

export function HeroSearchForm({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <span className="search-label">{copy.search.label}</span>
        <p>{copy.search.description}</p>
      </div>

      <form action={withLocale(locale, "/explore")} className="search-form" method="get">
        <label className="sr-only" htmlFor="hero-search">
          {copy.explore.searchLabel}
        </label>
        <input
          className="search-input"
          defaultValue=""
          id="hero-search"
          name="q"
          placeholder={copy.search.placeholder}
          type="search"
        />
        <button className="search-button" type="submit">{copy.search.button}</button>
      </form>

      <div className="search-chip-row">
        {copy.search.starterQueries.map((query) => (
          <button className="search-chip" key={query} name="q" type="submit" value={query} formAction={withLocale(locale, "/explore")} formMethod="get">
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
