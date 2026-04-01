import type { Difficulty } from "@/lib/difficulty";

const STYLES: Record<Difficulty, string> = {
  Beginner: "bg-green/20 text-green border border-green/30",
  Intermediate: "bg-accent/10 text-accent border border-accent/20",
  Advanced: "bg-red-900/20 text-red-300 border border-red-700/30",
};

const LABELS: Record<string, Record<Difficulty, string>> = {
  en: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" },
  pt: { Beginner: "Iniciante", Intermediate: "Intermediário", Advanced: "Avançado" },
  es: { Beginner: "Principiante", Intermediate: "Intermedio", Advanced: "Avanzado" },
};

export default function DifficultyBadge({
  difficulty,
  locale = "en",
}: {
  difficulty: Difficulty;
  locale?: string;
}) {
  const label = LABELS[locale]?.[difficulty] ?? difficulty;
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${STYLES[difficulty]}`}>
      {label}
    </span>
  );
}
