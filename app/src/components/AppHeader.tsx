import { Link, useLocation } from "react-router-dom";
import { MessageSquare, BookOpen, Sparkles, Globe } from "lucide-react";
import { useI18n, LOCALE_LABELS, Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["en", "pt", "es"];

export function AppHeader() {
  const location = useLocation();
  const { locale, setLocale, t } = useI18n();

  const navItems = [
    { path: "/", label: t("nav.glossary"), icon: BookOpen },
    { path: "/copilot", label: t("nav.copilot"), icon: MessageSquare },
    { path: "/learn", label: t("learn.title"), icon: Sparkles },
  ];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center gradient-border bg-background">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold gradient-text">
            Solana Dev Copilot
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
          </nav>

          {/* Language selector */}
          <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-secondary border border-border">
            <Globe className="h-3 w-3 text-muted-foreground mr-0.5" />
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
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
