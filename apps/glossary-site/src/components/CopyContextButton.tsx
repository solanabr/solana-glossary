"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { getAllTermsLocalized } from "@/lib/i18n";

interface Props {
  category: string;
}

export default function CopyContextButton({ category }: Props) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const terms = getAllTermsLocalized(locale).filter(
      (t) => t.category === category,
    );
    const text = terms.map((t) => `${t.term}: ${t.definition}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-[#A0A0B0] hover:text-white hover:bg-white/10 transition-all"
      >
        {copied ? (
          <Check className="h-4 w-4 text-[#14F195]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "Copiado!" : "Copiar contexto para IA"}
      </button>

      {copied && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs shadow-xl"
          style={{
            background: "#1A1A24",
            borderColor: "#14F19540",
            color: "#14F195",
            animation: "fadeInUp 0.15s ease-out",
          }}
        >
          ✓ Contexto copiado! Cole no seu prompt.
        </div>
      )}
    </div>
  );
}
