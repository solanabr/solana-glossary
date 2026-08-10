import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { setTheme, useTheme } from "@/lib/theme";

/**
 * Toggle button for the light/dark palette. The icon shows the theme you'd
 * move to; the accessible name plus `aria-pressed` describe the state, which
 * is what a screen reader announces for a toggle.
 */
export function ThemeToggle() {
  const { t } = useI18n();
  const isDark = useTheme() === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("theme.label")}
      aria-pressed={isDark}
      title={isDark ? t("theme.to_light") : t("theme.to_dark")}
      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
