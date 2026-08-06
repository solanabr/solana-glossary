import { Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AiRestingProps {
  /** Horizontal, low-profile layout for inline slots (e.g. term panels). */
  compact?: boolean;
  className?: string;
}

/**
 * Friendly placeholder shown wherever an AI surface is gated off in the
 * AI-free Phase-1 build. Glossary browsing stays fully available.
 */
export function AiResting({ compact = false, className = "" }: AiRestingProps) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      className={`rounded-lg bg-secondary/50 border border-border ${
        compact
          ? "flex items-center gap-3 p-3"
          : "flex flex-col items-center justify-center text-center gap-2 p-6"
      } ${className}`}
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Moon className="h-4 w-4 text-primary" />
      </div>
      <div className={compact ? "min-w-0" : "space-y-1 max-w-sm"}>
        <p className="text-xs font-semibold text-foreground">
          {t("ai.resting.title")}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("ai.resting.body")}
        </p>
      </div>
    </div>
  );
}
