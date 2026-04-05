/**
 * @arquivo VidaResult.tsx
 * @descricao Tela de resultado do Jogo da Vida — vencedor, scores e submit ao ranking
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Layout from "../../components/Layout";
import Confetti from "../../components/Confetti";
import Footer from "../../components/Footer";
import { useProfile } from "../../hooks/useProfile";
import { submitGameScore } from "../../lib/leaderboard";
import type { Player } from "../engine/types";

interface ResultState {
  players: Player[];
  winner: Player | null;
  turnCount: number;
  theme: string;
  abortedBy?: string;
}

export default function VidaResult() {
  const { t } = useTranslation();
  const { state: locState } = useLocation();
  const { tema } = useParams<{ tema: string }>();
  const { profile } = useProfile();
  const [rank, setRank] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const s = (locState as ResultState) ?? {
    players: [],
    winner: null,
    turnCount: 0,
    theme: tema ?? "normie",
  };
  const ranked = [...(s.players ?? [])].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (s.abortedBy || !profile || rank !== null) return;
    const me = ranked.find((p) => p.wallet === profile.walletAddress);
    if (!me) return;
    const r = submitGameScore(profile, {
      theme: `vida-${s.theme}`,
      level: "board",
      score: me.score,
      timeSeconds: 0,
      hintsUsed: 0,
    });
    setRank(r.rank);
    setIsNewRecord(r.isNewRecord);
  }, [profile]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0015] text-white px-4 py-20">
        {!s.abortedBy && <Confetti />}
        <motion.div
          className="max-w-md mx-auto flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-extrabold font-['Orbitron',sans-serif] bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {t("vida.gameOver")}
          </h1>

          {s.abortedBy && (
            <p className="text-sm text-red-400 mb-4">
              {s.abortedBy} — inativo (removido)
            </p>
          )}

          {s.winner && !s.abortedBy && (
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: s.winner.color }}
              />
              <span className="text-xl font-bold">{s.winner.name}</span>
              <span className="text-yellow-400">🏆</span>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            {t("vida.turnCount", { count: s.turnCount })}
          </p>

          <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden mb-4">
            {ranked.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 ${i === 0 ? "bg-yellow-500/5" : ""}`}
              >
                <span className="text-sm font-bold w-6">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}
                </span>
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm flex-1">{p.name}</span>
                <span className="text-sm font-bold text-cyan-400">
                  {p.score}
                </span>
              </div>
            ))}
          </div>

          {!s.abortedBy && rank !== null && (
            <div className="flex gap-3 mb-6">
              <span className="text-sm text-cyan-400 bg-cyan-400/10 px-4 py-1.5 rounded-full">
                {t("leaderboard.yourRank", { rank })}
              </span>
              {isNewRecord && (
                <span className="text-sm text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full animate-pulse">
                  {t("leaderboard.newRecord")}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={`/vida/jogar/${s.theme}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90"
            >
              {t("result.playAgain")}
            </Link>
            <Link
              to="/ranking"
              className="px-5 py-2.5 rounded-xl border border-cyan-500/30 text-cyan-400 text-sm hover:border-cyan-400/60"
            >
              {t("common.leaderboard")}
            </Link>
            <Link
              to="/vida"
              className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 text-sm hover:text-white"
            >
              {t("vida.backToBoards")}
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 text-sm hover:text-white"
            >
              {t("common.back")}
            </Link>
          </div>

          <div className="mt-8">
            <Footer />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
