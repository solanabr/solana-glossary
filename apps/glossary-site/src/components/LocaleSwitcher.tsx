"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, type Locale } from "@/hooks/useLocale";

const LANGS: { code: Locale; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: Locale) {
    setLocale(newLocale);
    // On term pages, update the ?lang= searchParam so the Server Component re-renders
    if (pathname.startsWith("/termo/")) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", newLocale);
      router.replace(url.pathname + url.search);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            locale === code
              ? "gradient-solana text-black"
              : "text-[#A0A0B0] hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
