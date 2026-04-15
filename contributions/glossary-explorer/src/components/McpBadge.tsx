"use client";

import { useLocale } from "@/contexts/LocaleContext";

export default function McpBadge() {
  const { copy } = useLocale();

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-solana-green/25 bg-solana-green/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-solana-green">
      <span className="h-1.5 w-1.5 rounded-full bg-solana-green shadow-[0_0_12px_rgba(20,241,149,0.9)]" />
      {copy.chat.badge}
    </span>
  );
}
