"use client";

import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/difficulty";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {DIFFICULTIES.map((d) => {
        const active = value === d;
        const color = DIFFICULTY_COLORS[d];
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              fontFamily: "var(--font-label)",
              background: active ? `${color}15` : "var(--surface-1)",
              border: `1px solid ${active ? color : "var(--border)"}`,
              color: active ? color : "var(--text-muted)",
              boxShadow: active ? `0 0 16px ${color}30, inset 0 0 12px ${color}10` : "none",
              clipPath:
                "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
            }}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        );
      })}
    </div>
  );
}
