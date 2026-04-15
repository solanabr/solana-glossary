"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LocaleToggle from "./LocaleToggle";
import { useLocale } from "@/contexts/LocaleContext";

export default function Navigation() {
  const pathname = usePathname();
  const { locale, setLocale, copy } = useLocale();

  const links = [
    { href: "/", label: copy.nav.home },
    { href: "/explore", label: copy.nav.explore },
    { href: "/learn", label: copy.nav.learn ?? "Learn" },
    { href: "/chat", label: copy.nav.askAi },
  ];

  return (
    <nav className="sticky top-0 z-30 border-b border-white/8 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:py-0">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold gradient-text">
              solexicon
            </span>
            <span className="hidden rounded-full border border-solana-purple/20 bg-solana-purple/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-solana-purple sm:inline-flex">
              MCP-native
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? "text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <LocaleToggle current={locale} onChange={setLocale} />

            <kbd className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] text-muted sm:inline-flex">
              <span className="font-mono">{copy.nav.commandHint}</span>
              <span>⌘K</span>
            </kbd>
          </div>
        </div>
      </div>
    </nav>
  );
}
