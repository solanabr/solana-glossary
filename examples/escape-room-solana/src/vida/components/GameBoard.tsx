/**
 * @arquivo GameBoard.tsx
 * @descricao Dispatcher de gameplay — logica compartilhada + selecao de UI por tema
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../../components/Layout";
import { useProfile } from "../../hooks/useProfile";
import { startBgm, stopBgm } from "../../lib/bgm";
import type {
  BoardThemeId,
  TurnTimerOption,
  GameState,
  Player,
} from "../engine/types";
import { useVidaGame } from "../hooks/useVidaGame";
import GameUiNormie from "./GameUiNormie";
import GameUiStartup from "./GameUiStartup";
import GameUiTimeline from "./GameUiTimeline";

export interface GameUiProps {
  state: GameState;
  currentPlayer: Player;
  isMyTurn: boolean;
  timeLeft: number;
  roll: () => void;
  dismissEvent: () => void;
  answerChallenge: (correct: boolean) => void;
  theme: BoardThemeId;
  t: ReturnType<typeof useTranslation>["t"];
}

interface Props {
  theme: BoardThemeId;
  players: Array<{ name: string; color: string; wallet: string }>;
  roomCode?: string;
  turnTimer?: TurnTimerOption;
}

const BGM_MAP: Record<BoardThemeId, "genesis" | "defi" | "lab"> = {
  normie: "genesis",
  startup: "defi",
  timeline: "lab",
};

const UI_MAP: Record<BoardThemeId, React.ComponentType<GameUiProps>> = {
  normie: GameUiNormie,
  startup: GameUiStartup,
  timeline: GameUiTimeline,
};

export default function GameBoard({
  theme,
  players,
  roomCode,
  turnTimer,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const myWallet = profile?.walletAddress ?? "";
  const navFired = useRef(false);

  useEffect(() => {
    startBgm(BGM_MAP[theme]);
    return () => stopBgm();
  }, [theme]);

  const game = useVidaGame({ theme, players, roomCode, myWallet, turnTimer });

  if (game.state.abortedBy !== null && !navFired.current) {
    navFired.current = true;
    const afk = game.state.players.find((p) => p.id === game.state.abortedBy);
    setTimeout(() => {
      navigate(`/vida/resultado/${theme}`, {
        state: {
          players: game.state.players.filter(
            (p) => p.id !== game.state.abortedBy,
          ),
          winner: null,
          turnCount: game.state.turnCount,
          theme,
          abortedBy: afk?.name ?? "???",
        },
      });
    }, 1500);
  }

  if (game.state.winner && !navFired.current) {
    navFired.current = true;
    setTimeout(() => {
      navigate(`/vida/resultado/${theme}`, {
        state: {
          players: game.state.players,
          winner: game.state.winner,
          turnCount: game.state.turnCount,
          theme,
        },
      });
    }, 1500);
  }

  const Ui = UI_MAP[theme];
  return (
    <Layout>
      <Ui {...game} theme={theme} t={t} />
    </Layout>
  );
}
