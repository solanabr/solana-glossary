import type { Metadata } from "next";
import {
  getAllTerms,
  getLocalizedTerms,
  getCategories,
  CATEGORY_LABELS,
} from "@/lib/glossary";
import GlossaryClient from "./glossary-client";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Glossary — Solana WTF",
  description:
    "Browse every Solana term, protocol, and concept. Search, filter by category, and switch languages. The glossary that doesn't suck.",
};

/* ------------------------------------------------------------------ */
/*  Server Component — data loading                                    */
/* ------------------------------------------------------------------ */

export default function GlossaryPage() {
  /* Load terms for every supported locale on the server.
     This avoids needing a client-side fetch when the user
     switches languages — the data is already serialised into
     the RSC payload. For a glossary of a few hundred terms
     the extra payload is negligible (~50-80 KB gzipped).       */

  const enTerms = getAllTerms();
  const ptTerms = getLocalizedTerms("pt");
  const esTerms = getLocalizedTerms("es");
  const categories = getCategories();

  return (
    <GlossaryClient
      localeData={{
        en: enTerms,
        pt: ptTerms,
        es: esTerms,
      }}
      categories={categories}
      categoryLabels={CATEGORY_LABELS}
    />
  );
}
