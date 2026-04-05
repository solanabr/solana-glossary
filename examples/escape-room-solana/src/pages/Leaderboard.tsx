/**
 * @arquivo Leaderboard.tsx
 * @descricao Ranking de pontuacoes com toggle Escape/Vida e filtro por tema
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import AnimatedBlobs from "../components/AnimatedBlobs";
import { getTopScores, type ScoreEntry } from "../lib/leaderboard";

type Mode = "escape" | "vida";
const ESC_TABS = ["all", "genesis", "defi", "lab"] as const;
const VIDA_TABS = [
  "all",
  "vida-normie",
  "vida-startup",
  "vida-timeline",
] as const;
const MEDALS = ["🥇", "🥈", "🥉"];
const TC: Record<string, string> = {
  all: "border-cyan-400 text-cyan-300",
  genesis: "border-purple-400 text-purple-300",
  defi: "border-emerald-400 text-emerald-300",
  lab: "border-blue-400 text-blue-300",
  "vida-normie": "border-cyan-400 text-cyan-300",
  "vida-startup": "border-emerald-400 text-emerald-300",
  "vida-timeline": "border-orange-400 text-orange-300",
};
const OFF = "border-white/20 text-gray-500 hover:text-white";
const ON_MODE = "border-cyan-400 text-cyan-300 bg-cyan-400/10";
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const hCell = "px-4 py-3 text-center hidden md:table-cell";
const dCell = `${hCell} text-gray-400 text-xs`;

function best(scores: ScoreEntry[]): ScoreEntry[] {
  const m = new Map<string, ScoreEntry>();
  for (const s of scores) {
    const p = m.get(s.walletAddress);
    if (!p || s.score > p.score) m.set(s.walletAddress, s);
  }
  return [...m.values()].sort((a, b) => b.score - a.score);
}

function tL(t: (k: string) => string, th: string): string {
  return th.startsWith("vida-")
    ? t(`leaderboard.${th}`)
    : t(`escape.themes.${th}`);
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [mode, setMode] = useState<Mode>("escape");
  const [tab, setTab] = useState<string>("all");
  const wallet = publicKey?.toBase58() ?? "";
  const tabs = mode === "escape" ? ESC_TABS : VIDA_TABS;
  const vida = mode === "vida";

  const scores = useMemo(() => {
    if (vida && tab === "all")
      return best(getTopScores(100).filter((s) => s.theme.startsWith("vida-")));
    return best(getTopScores(100, tab === "all" ? undefined : tab));
  }, [tab, mode]);

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white font-['Space_Grotesk',sans-serif]">
        <AnimatedBlobs
          variant={tab === "defi" ? "defi" : tab === "lab" ? "lab" : "genesis"}
        />
        <motion.div
          className="relative z-10 flex flex-col items-center px-6 pt-20 pb-12"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold font-['Orbitron',sans-serif] bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-6"
          >
            {t("leaderboard.title")}
          </motion.h1>

          <motion.div variants={fadeUp} className="flex gap-2 mb-4">
            {(["escape", "vida"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setTab("all");
                }}
                className={`text-sm px-5 py-2 rounded-xl border font-medium transition-colors ${mode === m ? ON_MODE : OFF}`}
              >
                {t(`leaderboard.${m === "escape" ? "escapeRoom" : "vidaGame"}`)}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-2 mb-8">
            {tabs.map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${tab === id ? (TC[id] ?? TC.all) : OFF}`}
              >
                {id === "all" ? t("leaderboard.all") : tL(t, id)}
              </button>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="w-full max-w-3xl rounded-2xl p-[1px] bg-gradient-to-br from-purple-600/50 via-cyan-400/30 to-green-400/50"
          >
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                    <th className="px-4 py-3 text-center w-12">
                      {t("leaderboard.rank")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {t("leaderboard.player")}
                    </th>
                    <th className="px-4 py-3 text-right">
                      {t("leaderboard.bestScore")}
                    </th>
                    <th className={hCell}>{t("leaderboard.theme")}</th>
                    {!vida && (
                      <th className={hCell}>{t("leaderboard.level")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {scores.length === 0 && (
                    <tr>
                      <td
                        colSpan={vida ? 4 : 5}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        {t("leaderboard.empty")}
                      </td>
                    </tr>
                  )}
                  {scores.map((s, i) => {
                    const me = s.walletAddress === wallet;
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-white/5 transition-colors ${me ? "bg-purple-600/10" : "hover:bg-white/5"}`}
                      >
                        <td className="px-4 py-3 text-center font-bold">
                          {i < 3 ? MEDALS[i] : i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{s.avatar}</span>
                            <div>
                              <p
                                className={`font-medium ${me ? "text-cyan-300" : "text-white"}`}
                              >
                                {s.nickname}
                                {me ? " (you)" : ""}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {s.walletAddress.slice(0, 4)}...
                                {s.walletAddress.slice(-4)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-cyan-400">
                          {s.score}
                        </td>
                        <td className={dCell}>{tL(t, s.theme)}</td>
                        {!vida && (
                          <td className={dCell}>
                            {t(`escape.levels.${s.level}`)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
