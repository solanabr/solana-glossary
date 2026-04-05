/**
 * @arquivo GamePlay.tsx
 * @descricao Orquestrador do gameplay — resolve puzzle do registry e gerencia game loop
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useParams, useNavigate } from "react-router-dom";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useTranslation } from "react-i18next";
import { useTimer } from "../hooks/useTimer";
import { useHints } from "../hooks/useHints";
import { useScore } from "../hooks/useScore";
import { selectPuzzleTerms } from "../lib/glossary";
import { getLevelConfig, type ThemeId, type LevelId } from "../engine/themes";
import { getPuzzleEntry } from "../engine/puzzleRegistry";
import type { PuzzleResult } from "../engine/puzzleTypes";
import { completeLevel } from "../lib/progression";
import { audioManager } from "../lib/audio";
import { startBgm, stopBgm } from "../lib/bgm";
import Layout from "../components/Layout";
import AnimatedBlobs, { type BlobVariant } from "../components/AnimatedBlobs";
import GameHud from "../components/GameHud";
import HintsPanel from "../components/HintsPanel";

type GamePhase = "playing" | "won" | "lost";

export default function GamePlay() {
  const { tema, nivel } = useParams<{ tema: string; nivel: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const tId = (tema ?? "genesis") as ThemeId;
  const lId = (nivel ?? "surface") as LevelId;
  const lc = useMemo(() => getLevelConfig(tId, lId), [tId, lId]);
  const blob = tId as BlobVariant;

  const entry = useMemo(() => getPuzzleEntry(tId, lId), [tId, lId]);
  const PuzzleComponent = entry.component;
  const isBatch = entry.mode === "batch";

  const seedRef = useRef(Date.now());
  const terms = useMemo(
    () => selectPuzzleTerms(tId, lId, locale, seedRef.current),
    [tId, lId, locale],
  );
  const pool = useMemo(
    () => selectPuzzleTerms(tId, lId, locale, seedRef.current + 7),
    [tId, lId, locale],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [fb, setFb] = useState(false);
  const timer = useTimer({
    totalSeconds: lc.timeSeconds,
    autoStart: true,
    onExpire: () => setPhase("lost"),
  });
  const hints = useHints({
    terms,
    maxHints: lc.maxHints,
    penaltyPerHint: lc.hintPenalty,
  });
  const score = useScore({ multiplier: lc.scoreMultiplier });

  // BGM: inicia ao montar, para ao desmontar
  useEffect(() => {
    startBgm(tId);
    return () => stopBgm();
  }, [tId]);

  // Callback unificado para resultados de qualquer puzzle
  const handleResult = useCallback(
    (result: PuzzleResult) => {
      if (phase !== "playing") return;
      for (let i = 0; i < result.correct; i++) score.addCorrect();
      for (let i = 0; i < result.wrong; i++) score.addWrong();
      if (result.correct > 0) audioManager.playSfx("correct", tId);
      else if (result.wrong > 0) audioManager.playSfx("wrong", tId);

      if (isBatch && result.done) {
        setPhase("won");
        return;
      }

      if (!isBatch && result.done) {
        setFb(true);
        setTimeout(() => {
          setFb(false);
          if (idx + 1 >= terms.length) setPhase("won");
          else setIdx((p) => p + 1);
        }, 900);
      }
    },
    [phase, isBatch, idx, terms.length, score],
  );

  // Tick sonoro quando timer fica critico (<30s)
  useEffect(() => {
    if (phase !== "playing" || timer.remaining > 30 || timer.remaining <= 0)
      return;
    if (timer.remaining % 5 === 0) audioManager.playSfx("tick", tId);
  }, [timer.remaining, phase]);

  // Navega para resultado quando fase muda
  useEffect(() => {
    if (phase === "playing") return;
    timer.pause();
    stopBgm();
    audioManager.playSfx(phase === "won" ? "unlock" : "wrong", tId);
    if (phase === "won") completeLevel(tId, lId);
    const fs = score.calculateFinal(timer.remaining, hints.totalPenalty);
    navigate(`/resultado/${tId}/${lId}`, {
      state: {
        won: phase === "won",
        score: fs,
        timeLeft: timer.remaining,
        correctCount: score.correctCount,
        wrongCount: score.wrongCount,
        hintsUsed: hints.usedCount,
        theme: tId,
        level: lId,
      },
    });
  }, [phase]);

  return (
    <Layout>
      <div className="relative min-h-screen bg-[#0a0015] text-white font-['Space_Grotesk',sans-serif]">
        <AnimatedBlobs variant={blob} />
        <GameHud
          timer={{
            display: timer.display,
            percent: timer.percent,
            isExpired: timer.isExpired,
          }}
          score={score.total}
          theme={tId}
          level={lId}
          station={isBatch ? 0 : idx}
          totalStations={isBatch ? 1 : terms.length}
          onPause={timer.pause}
          puzzleMode={entry.mode}
        />
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto px-6 py-8">
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              {isBatch ? (
                <PuzzleComponent
                  mode="batch"
                  terms={terms}
                  pool={pool}
                  seed={seedRef.current}
                  disabled={fb || phase !== "playing"}
                  theme={tId}
                  onResult={handleResult}
                />
              ) : (
                <PuzzleComponent
                  mode="per-term"
                  terms={terms}
                  pool={pool}
                  seed={seedRef.current}
                  disabled={fb || phase !== "playing"}
                  theme={tId}
                  currentIndex={idx}
                  onResult={handleResult}
                />
              )}
            </Suspense>
          </div>
          <HintsPanel
            hints={hints.hints}
            usedCount={hints.usedCount}
            maxHints={hints.maxHints}
            canUseHint={hints.canUseHint}
            totalPenalty={hints.totalPenalty}
            hintPenaltyCost={lc.hintPenalty}
            disabled={fb || phase !== "playing"}
            theme={tId}
            onUseHint={hints.revealNext}
          />
        </div>
      </div>
    </Layout>
  );
}
