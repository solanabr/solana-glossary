/**
 * @arquivo VidaPlay.tsx
 * @descricao Pagina do Jogo da Vida — roteador lobby → gameplay
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import type { BoardThemeId, TurnTimerOption } from "../engine/types";
import Lobby from "../components/Lobby";
import GameBoard from "../components/GameBoard";

type Phase = "lobby" | "playing";

export default function VidaPlay() {
  const { tema, code } = useParams<{ tema: string; code?: string }>();
  const theme = (tema ?? "normie") as BoardThemeId;
  const [phase, setPhase] = useState<Phase>("lobby");
  const [playersCfg, setPlayersCfg] = useState<
    Array<{ name: string; color: string; wallet: string }>
  >([]);
  const [activeCode, setActiveCode] = useState<string | undefined>(code);
  const [turnTimer, setTurnTimer] = useState<TurnTimerOption>(30);

  const handleStart = (
    ps: Array<{ name: string; color: string; wallet: string }>,
    roomCode?: string,
    timer?: TurnTimerOption,
  ) => {
    setPlayersCfg(ps);
    if (roomCode) setActiveCode(roomCode);
    if (timer) setTurnTimer(timer);
    setPhase("playing");
  };

  if (phase === "lobby") {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0a0015] text-white flex items-center justify-center px-4 py-20">
          <Lobby theme={theme} roomCode={code} onStart={handleStart} />
        </div>
      </Layout>
    );
  }

  return (
    <GameBoard
      theme={theme}
      players={playersCfg}
      roomCode={activeCode}
      turnTimer={turnTimer}
    />
  );
}
