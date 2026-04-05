/**
 * @arquivo rooms.ts
 * @descricao Sistema de salas online — Supabase como storage primario
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { supabase } from "../../lib/supabase";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface RoomPlayer {
  id: string;
  nickname: string;
  avatar: string;
  color: string;
  walletAddress: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  theme: string;
  hostWallet: string;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
}

const COLORS = [
  "#9945FF",
  "#14F195",
  "#00D1FF",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#10B981",
];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Criar sala ────────────────────────────────────────────────────────────

export async function createRoom(
  theme: string,
  host: { nickname: string; avatar: string; walletAddress: string },
): Promise<string> {
  const code = generateCode();

  const { error: e1 } = await supabase
    .from("multiplayer_rooms" as never)
    .insert({
      code,
      board: theme,
      host_wallet: host.walletAddress,
      status: "waiting",
    } as never);
  if (e1) console.error("[rooms] createRoom insert:", e1.message, e1);

  const roomId = await getRoomId(code);
  if (!roomId) {
    console.error(
      "[rooms] createRoom: room not found after insert, code:",
      code,
    );
    return code;
  }

  const { error: e2 } = await supabase.from("room_players" as never).insert({
    room_id: roomId,
    wallet_address: host.walletAddress,
    nickname: host.nickname,
    avatar: host.avatar,
    color: COLORS[0],
    is_host: true,
  } as never);
  if (e2) console.error("[rooms] createRoom player insert:", e2.message, e2);

  return code;
}

// ─── Entrar na sala ────────────────────────────────────────────────────────

export async function joinRoom(
  code: string,
  player: { nickname: string; avatar: string; walletAddress: string },
): Promise<Room | null> {
  console.log("[rooms] joinRoom attempt:", code, player.walletAddress);

  const roomId = await getRoomId(code);
  if (!roomId) {
    console.error("[rooms] joinRoom: room not found for code:", code);
    return null;
  }

  const { data: room, error: e1 } = await supabase
    .from("multiplayer_rooms" as never)
    .select("*")
    .eq("code", code)
    .single();
  if (e1) console.error("[rooms] joinRoom select room:", e1.message);
  if (!room || (room as { status: string }).status !== "waiting") {
    console.error("[rooms] joinRoom: room status invalid or null", room);
    return null;
  }

  const { data: existing } = await supabase
    .from("room_players" as never)
    .select("*")
    .eq("room_id", roomId)
    .eq("wallet_address", player.walletAddress);
  if (existing && (existing as unknown[]).length > 0) {
    console.log("[rooms] joinRoom: player already in room");
    return getRoom(code);
  }

  const { data: allPlayers } = await supabase
    .from("room_players" as never)
    .select("*")
    .eq("room_id", roomId);
  const count = (allPlayers as unknown[] | null)?.length ?? 0;
  if (count >= 8) {
    console.error("[rooms] joinRoom: room full", count);
    return null;
  }

  const { error: e2 } = await supabase.from("room_players" as never).insert({
    room_id: roomId,
    wallet_address: player.walletAddress,
    nickname: player.nickname,
    avatar: player.avatar,
    color: COLORS[count % COLORS.length],
    is_host: false,
  } as never);
  if (e2) console.error("[rooms] joinRoom player insert:", e2.message, e2);
  else console.log("[rooms] joinRoom: player inserted successfully");

  return getRoom(code);
}

// ─── Buscar sala ───────────────────────────────────────────────────────────

export async function getRoom(code: string): Promise<Room | null> {
  const { data: room, error: e1 } = await supabase
    .from("multiplayer_rooms" as never)
    .select("*")
    .eq("code", code)
    .single();
  if (e1) {
    console.error("[rooms] getRoom:", e1.message);
    return null;
  }
  if (!room) return null;
  const r = room as {
    id: string;
    code: string;
    board: string;
    host_wallet: string;
    status: string;
  };

  const { data: players, error: e2 } = await supabase
    .from("room_players" as never)
    .select("*")
    .eq("room_id", r.id)
    .order("joined_at" as never);
  if (e2) console.error("[rooms] getRoom players:", e2.message);

  const mapped: RoomPlayer[] = ((players as unknown[]) ?? []).map(
    (p: unknown) => {
      const rp = p as {
        id: string;
        nickname: string;
        avatar: string;
        color: string;
        wallet_address: string;
        is_host: boolean;
      };
      return {
        id: rp.id,
        nickname: rp.nickname,
        avatar: rp.avatar ?? "⚡",
        color: rp.color,
        walletAddress: rp.wallet_address,
        isHost: rp.is_host,
      };
    },
  );

  return {
    code: r.code,
    theme: r.board,
    hostWallet: r.host_wallet,
    status: r.status as Room["status"],
    players: mapped,
  };
}

/** Atualiza status da sala */
export async function updateRoomStatus(
  code: string,
  status: Room["status"],
): Promise<void> {
  await supabase
    .from("multiplayer_rooms" as never)
    .update({ status } as never)
    .eq("code", code);
}

/** Salva game state JSON na sala */
export async function saveGameState(
  code: string,
  state: unknown,
): Promise<void> {
  const { error } = await supabase
    .from("multiplayer_rooms" as never)
    .update({
      game_state: JSON.stringify(state),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("code", code);
  if (error) console.error("[rooms] saveGameState:", error.message);
}

/** Carrega game state JSON da sala */
export async function loadGameState(code: string): Promise<unknown | null> {
  const { data } = await supabase
    .from("multiplayer_rooms" as never)
    .select("game_state")
    .eq("code", code)
    .single();
  if (!data) return null;
  const raw = (data as { game_state: string | null }).game_state;
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Gera URL de convite */
export function getInviteUrl(code: string, theme?: string): string {
  const base = import.meta.env.VITE_BASE_PATH || "/";
  return `${window.location.origin}${base}vida/sala/${theme ?? "normie"}/${code}`;
}

// ─── Helper ────────────────────────────────────────────────────────────────

async function getRoomId(code: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("multiplayer_rooms" as never)
    .select("id")
    .eq("code", code)
    .single();
  if (error) console.error("[rooms] getRoomId:", error.message, "code:", code);
  return data ? (data as { id: string }).id : null;
}
