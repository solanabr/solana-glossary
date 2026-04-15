"use client";

import { availableLocales } from "@/lib/i18n";
import type { LocaleCode } from "@/lib/types";

interface LocaleToggleProps {
  current: LocaleCode;
  onChange: (locale: LocaleCode) => void;
}

export default function LocaleToggle({ current, onChange }: LocaleToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.045] p-1">
      {availableLocales.map((locale) => (
        <button
          key={locale.code}
          type="button"
          onClick={() => onChange(locale.code)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] transition-all ${
            current === locale.code
              ? "bg-[linear-gradient(135deg,rgba(153,69,255,0.92),rgba(20,241,149,0.82))] text-black shadow-[0_10px_30px_rgba(20,241,149,0.22)]"
              : "text-white/60 hover:text-white"
          }`}
        >
          {locale.label}
        </button>
      ))}
    </div>
  );
}
