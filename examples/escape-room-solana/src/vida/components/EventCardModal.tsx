/**
 * @arquivo EventCardModal.tsx
 * @descricao Modal de carta de evento — mostra termo e efeito
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { EventCard } from "../engine/types";

interface Props {
  card: EventCard;
  onDismiss: () => void;
}

const EFFECT_ICONS: Record<string, string> = {
  advance: "⬆️",
  retreat: "⬇️",
  bonus: "💰",
  penalty: "💸",
};

const EFFECT_COLORS: Record<string, string> = {
  advance: "text-green-400",
  retreat: "text-red-400",
  bonus: "text-yellow-400",
  penalty: "text-orange-400",
};

export default function EventCardModal({ card, onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-gray-900 border border-purple-500/40 rounded-xl p-6 shadow-[0_0_30px_rgba(153,69,255,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-3xl">🃏</span>
          <h3 className="text-lg font-bold text-purple-300 mt-2">
            {card.term}
          </h3>
        </div>
        <p className="text-sm text-gray-400 text-center mb-4 leading-relaxed max-h-32 overflow-y-auto">
          {card.definition}
        </p>
        <div
          className={`text-center text-lg font-bold mb-4 ${EFFECT_COLORS[card.effect]}`}
        >
          {EFFECT_ICONS[card.effect]}{" "}
          {t(`vida.effects.${card.effect}`, { value: card.value })}
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
        >
          {t("common.next")}
        </button>
      </motion.div>
    </motion.div>
  );
}
