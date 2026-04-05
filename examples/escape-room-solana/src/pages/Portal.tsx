/**
 * @arquivo Portal.tsx
 * @descricao Portal retro estilo Mega Man X / Sonic — stage select dos jogos
 * @projeto Solana Glossary — Escape Room Solana + Jogo da Vida
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import ArcadeScores from "../components/ArcadeScores";

const PX = "font-['Press_Start_2P',monospace]";
const flicker = {
  animate: { opacity: [1, 0.7, 1, 0.9, 1] },
  transition: { duration: 3, repeat: Infinity },
};

const STAGES = [
  {
    id: "escape",
    path: "/escape",
    icon: "🔓",
    border: "#9945FF",
    glow: "0 0 20px #9945FF, 0 0 40px #9945FF40",
    bar: "bg-purple-500",
  },
  {
    id: "vida",
    path: "/vida",
    icon: "🎲",
    border: "#14F195",
    glow: "0 0 20px #14F195, 0 0 40px #14F19540",
    bar: "bg-emerald-500",
  },
];

export default function Portal() {
  const { t, i18n } = useTranslation();

  return (
    <Layout hideBack>
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        {/* CRT scanlines + vignette */}
        <div
          className="fixed inset-0 pointer-events-none z-30 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,0.3) 1px,rgba(0,0,0,0.3) 2px)",
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none z-30"
          style={{
            background:
              "radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* Star field */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 10% 20%,#fff3 0%,transparent 100%),radial-gradient(1px 1px at 80% 40%,#fff2 0%,transparent 100%),radial-gradient(1px 1px at 50% 70%,#fff2 0%,transparent 100%),radial-gradient(1px 1px at 30% 90%,#fff1 0%,transparent 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-4 pt-14 pb-10">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-1"
          >
            <h1
              className={`${PX} text-2xl md:text-4xl text-center tracking-wider text-[#9945FF] drop-shadow-[0_0_15px_#9945FF]`}
            >
              SOLANA
            </h1>
            <h2
              className={`${PX} text-lg md:text-2xl text-center tracking-widest mt-2 text-[#14F195] drop-shadow-[0_0_15px_#14F195]`}
            >
              GLOSSARY GAMES
            </h2>
          </motion.div>

          <motion.p
            {...flicker}
            className={`${PX} text-[10px] text-yellow-400 tracking-[0.3em] mt-3 mb-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]`}
          >
            ▶ INSERT COIN ◀
          </motion.p>
          <p className="text-[10px] text-gray-600 mb-6">
            {t("portal.subtitle")}
          </p>

          <div className="flex gap-3 mb-8">
            {["pt-BR", "es"].map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`${PX} text-[8px] px-3 py-1.5 border-2 transition-all ${i18n.language === lang ? "border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-gray-700 text-gray-600 hover:border-gray-500"}`}
              >
                {lang === "pt-BR" ? "PT-BR" : "ESPAÑOL"}
              </button>
            ))}
          </div>

          <div
            className={`${PX} text-[10px] text-cyan-400 tracking-[0.2em] mb-4 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]`}
          >
            — STAGE SELECT —
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl mb-10">
            {STAGES.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={s.path}
                  className="block border-2 p-5 transition-all duration-200 hover:brightness-110 group"
                  style={{
                    borderColor: s.border,
                    boxShadow: s.glow,
                    background: `linear-gradient(135deg, ${s.border}08, ${s.border}15)`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`${PX} text-[11px] mb-2 group-hover:text-white`}
                        style={{ color: s.border }}
                      >
                        {t(`portal.games.${s.id}`)}
                      </h3>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {t(`portal.games.${s.id}Desc`)}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-gray-800 overflow-hidden">
                          <motion.div
                            className={`h-full ${s.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                          />
                        </div>
                        <span
                          className={`${PX} text-[7px] text-gray-600 group-hover:text-gray-400`}
                        >
                          READY
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <ArcadeScores />
          <Footer className="font-mono" />
        </div>
      </div>
    </Layout>
  );
}
