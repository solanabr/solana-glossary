/**
 * @arquivo WalletButton.tsx
 * @descricao Botao de conexao wallet Solana com dropdown de perfil
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";

export default function WalletButton() {
  const { t } = useTranslation();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { profile, avatars, nftAvatars, updateProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const truncated = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const copyAddress = () => {
    if (publicKey) navigator.clipboard.writeText(publicKey.toBase58());
    setOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
    setEditing(false);
  };

  const saveNick = () => {
    if (nick.trim()) updateProfile({ nickname: nick.trim().slice(0, 16) });
    setEditing(false);
  };

  const isImageAvatar = profile?.avatar?.startsWith("http");
  const AvatarImg = ({ size = "text-base" }: { size?: string }) =>
    isImageAvatar ? (
      <img
        src={profile!.avatar}
        alt="NFT"
        className={`${size === "text-3xl" ? "w-9 h-9" : "w-5 h-5"} rounded-full object-cover`}
      />
    ) : (
      <span className={size}>{profile?.avatar ?? "⚡"}</span>
    );

  // ── Nao conectado ─────────────────────────────────────────────────────
  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="text-xs px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        {t("common.connectWallet")}
      </button>
    );
  }

  // ── Conectado ─────────────────────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-900/30 text-white hover:border-purple-400/60 transition-colors"
      >
        <AvatarImg size="text-base" />
        <span>{profile?.nickname ?? "Anon"}</span>
        <span className="text-gray-500">{truncated}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3 z-50">
          {/* Avatar + Nick */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
            <AvatarImg size="text-3xl" />
            <div>
              <p className="text-white font-medium text-sm">
                {profile?.nickname}
              </p>
              <p className="text-gray-500 text-xs font-mono">{truncated}</p>
            </div>
          </div>

          {/* Edicao de perfil */}
          {editing ? (
            <div className="mb-3 space-y-2">
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                maxLength={16}
                placeholder={t("profile.nickPlaceholder")}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-purple-400 outline-none"
              />
              {nftAvatars.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {nftAvatars.map((nft) => (
                    <button
                      key={nft.mint}
                      onClick={() => updateProfile({ avatar: nft.image })}
                      title={nft.name}
                      className={`w-9 h-9 rounded-lg overflow-hidden transition-all ${profile?.avatar === nft.image ? "ring-2 ring-purple-400 scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"}`}
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {avatars.map((av) => (
                  <button
                    key={av}
                    onClick={() => updateProfile({ avatar: av })}
                    className={`text-xl p-1 rounded-lg transition-colors ${profile?.avatar === av ? "bg-purple-600/40 ring-1 ring-purple-400" : "hover:bg-white/10"}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <button
                onClick={saveNick}
                className="w-full py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors"
              >
                {t("profile.save")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNick(profile?.nickname ?? "");
                setEditing(true);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors mb-1"
            >
              {t("profile.edit")}
            </button>
          )}

          <button
            onClick={copyAddress}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors mb-1"
          >
            {t("wallet.copyAddress")}
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t("wallet.disconnect")}
          </button>
        </div>
      )}
    </div>
  );
}
