"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getNetworkStats,
  getRelevantStatsForTerm,
  type SolanaNetworkStats,
} from "@/lib/solana-rpc";

export default function LiveDataBadge({ termId }: { termId: string }) {
  const { locale, copy } = useLocale();
  const [stats, setStats] = useState<SolanaNetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const data = await getNetworkStats();
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading || !stats) return null;

  const relevant = getRelevantStatsForTerm(termId, stats);
  if (relevant.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-solana-green/20 bg-gradient-to-r from-solana-green/5 to-transparent"
    >
      <div className="flex items-center gap-2 border-b border-solana-green/10 px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-solana-green" />
        </span>
        <span className="font-mono text-xs font-semibold text-solana-green">
          {copy.learn.liveData}
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {relevant.map((stat) => {
          const label =
            locale === "pt"
              ? stat.labelPt
              : locale === "es"
                ? stat.labelEs
                : stat.label;

          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <span className="font-mono text-sm font-semibold text-white">
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-3">
        <span className="text-[10px] text-muted/50">
          Mainnet-beta &middot; Updated{" "}
          {new Date(stats.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}
