import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  Globe,
  GraduationCap,
  Mountain,
  GalleryVerticalEnd,
} from "lucide-react";
import { useI18n, LOCALE_LABELS, Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["en", "pt", "es"];

export function AppHeader() {
  const location = useLocation();
  const { locale, setLocale, t } = useI18n();

  const navItems = [
    { path: "/", label: t("nav.glossary"), icon: BookOpen },
    { path: "/swipe", label: "Swipe", icon: GalleryVerticalEnd },
  ];

  // The AI surfaces stay reachable from the glossary itself (term insights,
  // quiz, code explain via the hero input); the header promotes the external
  // Superteam properties instead.
  const externalLinks = [
    { href: "https://st.academy", label: "Academy", icon: GraduationCap },
    { href: "https://solanaiceberg.com", label: "Iceberg", icon: Mountain },
  ];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center gradient-border bg-background">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold gradient-text">
            Solana Glossary
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path.includes("?")
                ? location.pathname + location.search === item.path
                : location.pathname === item.path && !location.search;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            {externalLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.label} (opens in a new tab)`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Language selector */}
          <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-secondary border border-border">
            <Globe className="h-3 w-3 text-muted-foreground mr-0.5" />
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-label={`Switch language to ${LOCALE_LABELS[l]}`}
                aria-pressed={locale === l}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                  locale === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
