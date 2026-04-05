/**
 * @arquivo VidaHome.tsx
 * @descricao Selecao de tabuleiros do Jogo da Vida Solana
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Footer from "../components/Footer";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

interface BoardCfg {
  id: string;
  gradient: string;
  border: string;
  icon: string;
  bgStyle: React.CSSProperties;
  glowColor: string;
}

const BOARDS: BoardCfg[] = [
  {
    id: "normie",
    gradient: "from-cyan-400 via-violet-500 to-blue-600",
    border: "border-cyan-400/40",
    icon: "🌐",
    glowColor: "rgba(6,182,212,0.15)",
    bgStyle: {
      backgroundImage:
        "linear-gradient(rgba(6,182,212,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.08) 1px,transparent 1px)",
      backgroundSize: "40px 40px",
    },
  },
  {
    id: "startup",
    gradient: "from-green-400 via-emerald-500 to-green-700",
    border: "border-green-400/40",
    icon: "💻",
    glowColor: "rgba(34,197,94,0.15)",
    bgStyle: {
      backgroundImage:
        "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(34,197,94,0.04) 3px,rgba(34,197,94,0.04) 4px)",
    },
  },
  {
    id: "timeline",
    gradient: "from-orange-400 via-pink-500 to-purple-600",
    border: "border-orange-400/40",
    icon: "🕹️",
    glowColor: "rgba(251,146,60,0.15)",
    bgStyle: {
      backgroundImage:
        "repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(251,146,60,0.03) 8px,rgba(251,146,60,0.03) 16px)",
    },
  },
];

export default function VidaHome() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(34,197,94,0.2), transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.2), transparent 50%)",
          }}
        />
        <motion.div
          className="relative z-10 flex flex-col items-center px-6 pt-20 pb-12"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-extrabold text-center font-['Orbitron',sans-serif] mb-3"
          >
            <span className="bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t("vida.title")}
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-gray-400 text-center max-w-lg mb-10 text-sm"
          >
            {t("vida.subtitle")}
          </motion.p>

          {/* Cards dos tabuleiros */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12"
          >
            {BOARDS.map((b) => (
              <motion.div key={b.id} variants={scaleIn}>
                <Link
                  to={`/vida/jogar/${b.id}`}
                  className={`block w-full text-left rounded-2xl p-[1px] bg-gradient-to-br ${b.gradient} opacity-90 hover:opacity-100 transition-all duration-300 group`}
                >
                  <div
                    className="rounded-2xl bg-[#0a0015]/90 backdrop-blur-xl p-6 h-full"
                    style={b.bgStyle}
                  >
                    <div className="text-4xl mb-3">{b.icon}</div>
                    <h3
                      className={`text-xl font-bold font-['Orbitron',sans-serif] bg-gradient-to-r ${b.gradient} bg-clip-text text-transparent mb-2`}
                    >
                      {t(`vida.boards.${b.id}`)}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">
                      {t(`vida.boards.${b.id}Desc`)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded-full border border-white/10">
                        {t("vida.houses")}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-white/10">
                        {t("vida.players")}
                      </span>
                    </div>
                    <div className="mt-4 text-xs text-emerald-400 font-mono tracking-wider">
                      {t("portal.play")} →
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Info sobre multiplayer */}
          <motion.div variants={fadeUp} className="max-w-md text-center">
            <p className="text-gray-500 text-sm mb-2">
              {t("vida.multiplayerInfo")}
            </p>
            <div className="flex justify-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-600">
                🎲 {t("vida.dice")}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-600">
                🃏 {t("vida.cards")}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-600">
                🧩 {t("vida.quiz")}
              </span>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-10">
            <Footer />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
