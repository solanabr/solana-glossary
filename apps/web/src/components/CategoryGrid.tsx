import {
  getCategories,
  getTermsByCategory,
  Category,
} from "@stbr/solana-glossary";
import { motion } from "framer-motion";
import {
  Blocks,
  Shield,
  Coins,
  Code2,
  Globe,
  Lock,
  Database,
  Layers,
  Cpu,
  Network,
  Brain,
  Puzzle,
  Wrench,
  Boxes,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface CategoryGridProps {
  onSelectCategory: (category: Category | null) => void;
  activeCategory: Category | null;
}

const categoryIcons: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  "core-protocol": { icon: Blocks, color: "text-primary" },
  "programming-model": { icon: Code2, color: "text-blue-400" },
  "token-ecosystem": { icon: Coins, color: "text-yellow-400" },
  defi: { icon: Layers, color: "text-emerald-400" },
  "zk-compression": { icon: Cpu, color: "text-violet-400" },
  infrastructure: { icon: Network, color: "text-orange-400" },
  security: { icon: Shield, color: "text-red-400" },
  "dev-tools": { icon: Wrench, color: "text-cyan-400" },
  network: { icon: Globe, color: "text-teal-400" },
  "blockchain-general": { icon: Boxes, color: "text-slate-400" },
  web3: { icon: Puzzle, color: "text-pink-400" },
  "programming-fundamentals": { icon: Database, color: "text-indigo-400" },
  "ai-ml": { icon: Brain, color: "text-purple-400" },
  "solana-ecosystem": { icon: Lock, color: "text-accent" },
};

export function CategoryGrid({
  onSelectCategory,
  activeCategory,
}: CategoryGridProps) {
  const categories = getCategories();
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {categories.map((cat, i) => {
        const meta = categoryIcons[cat] || {
          icon: Blocks,
          color: "text-muted-foreground",
        };
        const Icon = meta.icon;
        const count = getTermsByCategory(cat).length;
        const isActive = activeCategory === cat;
        const label = t(`cat.${cat}` as any) || cat;

        return (
          <motion.button
            key={cat}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onSelectCategory(isActive ? null : cat)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              isActive
                ? "bg-surface-elevated border-primary/30 glow-primary"
                : "bg-card border-border hover:bg-surface-elevated hover:border-primary/10"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 mb-1 ${meta.color}`} />
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
