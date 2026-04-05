/**
 * @arquivo GameResult.tsx
 * @descricao Tela de resultado (vitoria/derrota) com estatisticas
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { Link, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import AnimatedBlobs, { type BlobVariant } from "../components/AnimatedBlobs";
import Confetti from "../components/Confetti";
import { useProfile } from "../hooks/useProfile";
import { submitGameScore } from "../lib/leaderboard";

type ResultState = {
  won: boolean;
  score: number;
  timeLeft: number;
  correctCount: number;
  wrongCount: number;
  hintsUsed: number;
  theme: string;
  level: string;
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function GameResult() {
  const { t } = useTranslation();
  const { state: locState } = useLocation();
  const { tema, nivel } = useParams<{ tema: string; nivel: string }>();
  const { profile } = useProfile();
  const [rank, setRank] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const s =
    (locState as ResultState) ??
    ({
      won: false,
      score: 0,
      timeLeft: 0,
      correctCount: 0,
      wrongCount: 0,
      hintsUsed: 0,
      theme: tema ?? "genesis",
      level: nivel ?? "surface",
    } as ResultState);
  const blob = s.theme as BlobVariant;
  const timeFmt = `${Math.floor(s.timeLeft / 60)}:${String(s.timeLeft % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!s.won || !profile || rank !== null) return;
    const g = {
      theme: s.theme,
      level: s.level,
      score: s.score,
      timeSeconds: s.timeLeft,
      hintsUsed: s.hintsUsed,
    };
    const r = submitGameScore(profile, g);
    setRank(r.rank);
    setIsNewRecord(r.isNewRecord);
  }, [s.won, profile]);

  const stats = [
    {
      label: t("common.score"),
      val: s.score,
      color: s.won ? "text-cyan-400" : "text-orange-400",
    },
    { label: t("result.timeLeft"), val: timeFmt, color: "text-green-400" },
    {
      label: t("result.correct"),
      val: s.correctCount,
      color: "text-emerald-400",
    },
    { label: t("result.wrong"), val: s.wrongCount, color: "text-red-400" },
    {
      label: t("result.hintsUsed"),
      val: s.hintsUsed,
      color: "text-yellow-400",
    },
  ];
  const grad = s.won
    ? "from-green-400 via-cyan-400 to-green-300"
    : "from-red-500 via-orange-400 to-red-500";

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white font-['Space_Grotesk',sans-serif]">
        <AnimatedBlobs variant={blob} />
        {s.won && <Confetti />}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUp}
            animate={s.won ? undefined : { x: [0, -8, 8, -6, 6, -3, 3, 0] }}
            transition={s.won ? undefined : { duration: 0.6, delay: 0.5 }}
            className={`text-5xl md:text-6xl font-extrabold text-center mb-4 font-['Orbitron',sans-serif] bg-gradient-to-r ${grad} bg-clip-text text-transparent`}
          >
            {s.won ? t("escape.victory") : t("escape.defeat")}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-gray-400 text-center mb-8"
          >
            {t(`escape.themes.${s.theme}`)} &mdash;{" "}
            {t(`escape.levels.${s.level}`)}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="w-full max-w-md rounded-2xl p-[1px] bg-gradient-to-br from-purple-600/50 via-cyan-400/30 to-green-400/50 mb-10"
          >
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
              <h2 className="text-center text-sm text-gray-400 uppercase tracking-wider mb-4">
                {t("result.stats")}
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {stats.slice(0, 3).map((st) => (
                  <div
                    key={st.label}
                    className="flex flex-col items-center gap-1 py-3"
                  >
                    <span className={`text-2xl font-bold ${st.color}`}>
                      {st.val}
                    </span>
                    <span className="text-xs text-gray-400">{st.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stats.slice(3).map((st) => (
                  <div
                    key={st.label}
                    className="flex flex-col items-center gap-1 py-3"
                  >
                    <span className={`text-2xl font-bold ${st.color}`}>
                      {st.val}
                    </span>
                    <span className="text-xs text-gray-400">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          {rank !== null && (
            <motion.div variants={fadeUp} className="flex gap-3 mb-6">
              <span className="text-sm text-cyan-400 bg-cyan-400/10 px-4 py-1.5 rounded-full">
                {t("leaderboard.yourRank", { rank })}
              </span>
              {isNewRecord && (
                <span className="text-sm text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full animate-pulse">
                  {t("leaderboard.newRecord")}
                </span>
              )}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="flex gap-4">
            <Link
              to={`/jogar/${s.theme}/${s.level}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              {t("result.playAgain")}
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors text-sm"
            >
              {t("result.backToThemes")}
            </Link>
            <Link
              to="/ranking"
              className="px-6 py-3 rounded-xl border border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 transition-colors text-sm"
            >
              {t("common.leaderboard")}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
