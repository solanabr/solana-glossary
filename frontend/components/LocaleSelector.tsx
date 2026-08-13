"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function LocaleSelector({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(locale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", locale);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => onChange(loc)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            loc === current
              ? "bg-accent text-white"
              : "text-muted hover:text-base hover:bg-card"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
