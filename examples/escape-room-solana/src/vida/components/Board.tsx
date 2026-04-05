/**
 * @arquivo Board.tsx
 * @descricao Dispatcher — renderiza o tabuleiro correto por tema
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { BoardSpace, Player, BoardThemeId } from "../engine/types";
import BoardNormie from "./BoardNormie";
import BoardStartup from "./BoardStartup";
import BoardTimeline from "./BoardTimeline";

interface BoardProps {
  spaces: BoardSpace[];
  players: Player[];
  currentPlayerId: number;
  theme?: BoardThemeId;
}

const BOARDS: Record<BoardThemeId, typeof BoardNormie> = {
  normie: BoardNormie,
  startup: BoardStartup,
  timeline: BoardTimeline,
};

export default function Board({
  spaces,
  players,
  currentPlayerId,
  theme = "normie",
}: BoardProps) {
  const Comp = BOARDS[theme];
  return (
    <Comp spaces={spaces} players={players} currentPlayerId={currentPlayerId} />
  );
}
