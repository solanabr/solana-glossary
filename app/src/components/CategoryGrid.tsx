import type { GlossaryTerm } from "@stbr/solana-glossary";
import { motion } from "framer-motion";
import {
  Blocks,
  Shield,
  Coins,
  Code2,
  Globe,
  Layers,
  Cpu,
  Network,
  Brain,
  Puzzle,
  Wrench,
  Boxes,
  Database,
  Lock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";
import { categoryIconColors } from "@/lib/category-colors";
import { scaleIn } from "@/lib/animations";

interface CategoryGridProps {
  onSelectCategory: (category: string | null) => void;
  activeCategory: string | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  "core-protocol": Blocks,
  "programming-model": Code2,
  "token-ecosystem": Coins,
  defi: Layers,
  "zk-compression": Cpu,
  infrastructure: Network,
  security: Shield,
  "dev-tools": Wrench,
  network: Globe,
  "blockchain-general": Boxes,
  web3: Puzzle,
  "programming-fundamentals": Database,
  "ai-ml": Brain,
  "solana-ecosystem": Lock,
};

export function CategoryGrid({
  onSelectCategory,
  activeCategory,
}: CategoryGridProps) {
  const glossary = useGlossary();
  const categories = glossary.getCategories();
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {categories.map((cat, i) => {
        const Icon = categoryIcons[cat] || Blocks;
        const iconColor = categoryIconColors[cat] || "text-muted-foreground";
        const count = glossary.getTermsByCategory(cat).length;
        const isActive = activeCategory === cat;
        const label = t(`cat.${cat}` as Parameters<typeof t>[0]) || cat;

        return (
          <motion.button
            key={cat}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            custom={i * 0.02}
            onClick={() => onSelectCategory(isActive ? null : cat)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              isActive
                ? "bg-surface-elevated border-primary/30 glow-primary"
                : "bg-card border-border hover:bg-surface-elevated hover:border-primary/10"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 mb-1 ${iconColor}`} />
            <p className="text-[11px] font-medium text-foreground truncate">
              {label}
            </p>
            <p className="text-[10px] text-muted-foreground">{count}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
