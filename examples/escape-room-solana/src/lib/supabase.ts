/**
 * @arquivo supabase.ts
 * @descricao Cliente Supabase singleton com tipagem do schema do banco
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { createClient } from "@supabase/supabase-js";

// ─── Tipagem do banco de dados ───────────────────────────────────────────────

/** Perfil do jogador vinculado a wallet */
export interface Profile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_lang: "pt-BR" | "es";
  created_at: string;
  updated_at: string;
}

/** Entrada no ranking do Escape Room */
export interface LeaderboardEscape {
  id: string;
  profile_id: string;
  theme: string;
  level: string;
  score: number;
  time_seconds: number;
  hints_used: number;
  completed_at: string;
}

/** Schema completo do banco de dados */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      leaderboard_escape: {
        Row: LeaderboardEscape;
        Insert: Omit<LeaderboardEscape, "id" | "completed_at">;
        Update: Partial<Omit<LeaderboardEscape, "id" | "completed_at">>;
      };
    };
  };
}

// ─── Variaveis de ambiente ───────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ─── Cliente singleton ──────────────────────────────────────────────────────

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
