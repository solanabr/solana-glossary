/**
 * @arquivo useProfile.ts
 * @descricao Hook de perfil do jogador — localStorage + Supabase opcional
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";
import { fetchNftAvatars, type NftAvatar } from "../lib/nft";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface PlayerProfile {
  walletAddress: string;
  nickname: string;
  avatar: string;
  locale: string;
  createdAt: string;
}

const STORAGE_KEY = "escape_profile";

const AVATARS = ["⚡", "🔐", "🧪", "🚀", "🌐", "💎", "🎮", "🎯", "🏆", "🔮"];

/** Retorna avatar aleatorio */
function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

// ─── Helpers localStorage ──────────────────────────────────────────────────

function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// ─── Sync Supabase (melhor esforco) ────────────────────────────────────────

async function syncToSupabase(profile: PlayerProfile): Promise<void> {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === "" || url === "https://xxx.supabase.co") return;
    await (
      supabase.from("profiles") as ReturnType<typeof supabase.from>
    ).upsert(
      {
        wallet_address: profile.walletAddress,
        display_name: profile.nickname,
        avatar_url: profile.avatar,
        preferred_lang: profile.locale,
      } as never,
      { onConflict: "wallet_address" },
    );
  } catch {
    /* Supabase offline ou nao configurado — ignora */
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useProfile() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<PlayerProfile | null>(loadProfile());
  const [nftAvatars, setNftAvatars] = useState<NftAvatar[]>([]);

  // Auto-cria perfil quando wallet conecta pela primeira vez
  useEffect(() => {
    if (!connected || !publicKey) return;
    const addr = publicKey.toBase58();
    const existing = loadProfile();
    if (existing && existing.walletAddress === addr) {
      setProfile(existing);
      return;
    }
    const newProfile: PlayerProfile = {
      walletAddress: addr,
      nickname: "Anon",
      avatar: randomAvatar(),
      locale: "pt-BR",
      createdAt: new Date().toISOString(),
    };
    saveProfile(newProfile);
    setProfile(newProfile);
    syncToSupabase(newProfile);
  }, [connected, publicKey]);

  // Busca NFTs da wallet para usar como avatar
  useEffect(() => {
    if (!connected || !publicKey) {
      setNftAvatars([]);
      return;
    }
    const rpc = import.meta.env.VITE_SOLANA_RPC_URL || "";
    fetchNftAvatars(rpc, publicKey.toBase58()).then(setNftAvatars);
  }, [connected, publicKey]);

  // Limpa profile ao desconectar
  useEffect(() => {
    if (!connected) {
      setProfile(null);
      setNftAvatars([]);
    }
  }, [connected]);

  /** Atualiza nickname e/ou avatar */
  const updateProfile = useCallback(
    (updates: { nickname?: string; avatar?: string }) => {
      if (!profile) return;
      const updated = { ...profile, ...updates };
      saveProfile(updated);
      setProfile(updated);
      syncToSupabase(updated);
    },
    [profile],
  );

  return {
    profile,
    connected,
    avatars: AVATARS,
    nftAvatars,
    updateProfile,
  };
}
