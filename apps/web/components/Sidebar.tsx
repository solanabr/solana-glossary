"use client";
import { getAllCategories, getTermsByCategory } from "@/lib/glossary";
import { useLocale } from "@/lib/i18n";
import type { Category } from "@/lib/glossary";

const CATEGORY_LABELS: Record<Category, string> = {
  "core-protocol": "Core Protocol",
  "programming-model": "Programming",
  "token-ecosystem": "Tokens",
  defi: "DeFi",
  "zk-compression": "ZK",
  infrastructure: "Infra",
  security: "Security",
  "dev-tools": "Dev Tools",
  network: "Network",
  "blockchain-general": "Blockchain",
  web3: "Web3",
  "programming-fundamentals": "Fundamentals",
  "ai-ml": "AI/ML",
  "solana-ecosystem": "Ecosystem",
};

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (c: Category) => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const { locale } = useLocale();
  const categories = getAllCategories();

  return (
    <aside className="w-[72px] border-r border-border pt-3 pb-6 shrink-0">
      <p className="text-[9px] text-text-dim uppercase tracking-widest px-2 mb-2">Cats</p>
      {categories.map((cat) => {
        const count = getTermsByCategory(cat, locale).length;
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`w-full text-left px-2 py-1.5 border-b border-border flex justify-between items-center transition-colors ${
              activeCategory === cat
                ? "text-accent font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            <span className="text-[9px] font-body truncate">{CATEGORY_LABELS[cat]}</span>
            <span className="text-[8px] text-text-dim ml-1">{count}</span>
          </button>
        );
      })}
    </aside>
  );
}
