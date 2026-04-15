"use client";

import type { Locale } from "@/lib/glossary";
import { UI_LABELS } from "@/lib/glossary";

function SolanaGradientWord() {
  return <span className="text-sol-brand-word">Solana</span>;
}

export default function HeroTitle({
  locale,
  className = "",
  id,
}: {
  locale: Locale;
  className?: string;
  id?: string;
}) {
  const t = UI_LABELS[locale];
  const rest = t.hero_title_rest;

  return (
    <h1
      id={id}
      className={`font-display text-[2.35rem] font-semibold leading-[1.06] tracking-tight text-sol-text sm:text-[3rem] md:text-[3.65rem] lg:text-[4.1rem] xl:text-[4.35rem] ${className}`}
    >
      {locale === "en" ? (
        <>
          <SolanaGradientWord />
          {rest ? ` ${rest}` : ""}
        </>
      ) : (
        <>
          {rest ? `${rest} ` : ""}
          <SolanaGradientWord />
        </>
      )}
    </h1>
  );
}
