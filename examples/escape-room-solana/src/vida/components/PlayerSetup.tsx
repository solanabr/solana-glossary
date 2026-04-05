/**
 * @arquivo PlayerSetup.tsx
 * @descricao Tela de configuracao de jogadores antes da partida
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { PLAYER_COLORS } from "../engine/types";

interface Props {
  onStart: (players: Array<{ name: string; color: string }>) => void;
}

interface Draft {
  name: string;
  color: string;
}

export default function PlayerSetup({ onStart }: Props) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Draft[]>([
    { name: "", color: PLAYER_COLORS[0] },
    { name: "", color: PLAYER_COLORS[1] },
  ]);

  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers([
      ...players,
      { name: "", color: PLAYER_COLORS[players.length] },
    ]);
  };

  const removePlayer = (idx: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, i) => i !== idx));
  };

  const updateName = (idx: number, name: string) => {
    const copy = [...players];
    copy[idx] = { ...copy[idx], name };
    setPlayers(copy);
  };

  const handleStart = () => {
    const named = players.map((p, i) => ({
      name: p.name.trim() || `${t("vida.player")} ${i + 1}`,
      color: p.color,
    }));
    onStart(named);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <h2 className="text-lg font-bold text-white text-center mb-6 font-['Orbitron',sans-serif]">
        {t("vida.setupTitle")}
      </h2>
      <div className="space-y-3 mb-6">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border-2 border-black/30"
              style={{ backgroundColor: p.color }}
            />
            <input
              value={p.name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={`${t("vida.player")} ${i + 1}`}
              maxLength={12}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
            />
            {players.length > 2 && (
              <button
                onClick={() => removePlayer(i)}
                className="text-gray-600 hover:text-red-400 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {players.length < 8 && (
          <button
            onClick={addPlayer}
            className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/30 transition-colors"
          >
            + {t("vida.addPlayer")}
          </button>
        )}
        <button
          onClick={handleStart}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("vida.startGame")}
        </button>
      </div>
    </motion.div>
  );
}
