/**
 * @arquivo ArcadeScores.tsx
 * @descricao Mini leaderboard estilo arcade para o Portal
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTopScores, type ScoreEntry } from "../lib/leaderboard";

const PX = "font-['Press_Start_2P',monospace]";

const RANK_COLORS = ["text-yellow-400", "text-gray-400", "text-orange-600"];

export default function ArcadeScores() {
  const { t } = useTranslation();
  const scores: ScoreEntry[] = getTopScores(5);

  return (
    <div className="w-full max-w-2xl mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className={`${PX} text-[9px] text-yellow-400 tracking-wider`}>
          HIGH SCORES
        </span>
        <Link
          to="/ranking"
          className={`${PX} text-[7px] text-gray-600 hover:text-cyan-400`}
        >
          {t("portal.viewAll")} →
        </Link>
      </div>
      <div className="border border-gray-800 bg-black/50">
        {scores.length === 0 ? (
          <p className={`${PX} text-[8px] text-gray-700 text-center py-6`}>
            {t("portal.noScores")}
          </p>
        ) : (
          scores.map((sc, i) => (
            <div
              key={sc.id}
              className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/50 last:border-b-0"
            >
              <span
                className={`${PX} text-[9px] w-6 ${RANK_COLORS[i] ?? "text-gray-700"}`}
              >
                {i + 1}.
              </span>
              <span className="text-sm">{sc.avatar}</span>
              <span
                className={`${PX} text-[8px] text-gray-400 flex-1 truncate`}
              >
                {sc.nickname}
              </span>
              <span className={`${PX} text-[9px] text-cyan-400`}>
                {String(sc.score).padStart(6, "0")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
