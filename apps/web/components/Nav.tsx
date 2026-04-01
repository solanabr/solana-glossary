"use client";
import Link from "next/link";
import { useLocale, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/glossary";

export default function Nav() {
  const { locale, setLocale } = useLocale();

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-heading font-black text-sm tracking-tight text-text">
          SOLANA GLOSSARY
        </span>
        <span className="bg-accent text-bg text-[10px] font-bold px-1.5 py-0.5 rounded-full font-heading">
          BR
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/start"
          className="text-[11px] text-text-muted hover:text-text transition-colors"
        >
          Começar aqui
        </Link>
        <div className="flex gap-1">
          {(["en", "pt", "es"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                locale === l
                  ? "bg-accent text-bg font-bold"
                  : "text-text-dim hover:text-text"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
        <a
          href="https://github.com/solanabr/solana-glossary"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-text-dim hover:text-text transition-colors"
        >
          ★ Star
        </a>
      </div>
    </nav>
  );
}
