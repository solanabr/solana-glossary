"use client";

import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithWallet } = useAuth();
  const { connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  if (!open || typeof document === "undefined") return null;

  const handleWalletClick = async () => {
    if (!connected) {
      // Open wallet adapter modal to connect first
      setWalletModalVisible(true);
      return;
    }
    await signInWithWallet();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative p-8 max-w-sm w-full text-center"
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          clipPath:
            "polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cloud icon */}
        <div
          className="mx-auto mb-5 flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            clipPath:
              "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
            background: "var(--surface-2)",
            boxShadow: "0 0 30px rgba(0,255,255,0.15)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00FFFF"
            strokeWidth="2"
          >
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "#00FFFF",
            textShadow: "0 0 10px rgba(0,255,255,0.5)",
            marginBottom: 4,
          }}
        >
          SAVE YOUR PROGRESS
        </div>

        <p
          className="text-text-secondary text-sm mb-6"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
        >
          Optional. Your local progress will be synced.
        </p>

        {/* Google button */}
        <button
          onClick={async () => {
            await signInWithGoogle();
          }}
          className="w-full mb-3 flex items-center justify-center gap-3 py-3 px-6 text-sm font-semibold transition-all duration-150 hover:translate-y-[-2px]"
          style={{
            background: "rgba(0,255,255,0.08)",
            border: "1px solid rgba(0,255,255,0.3)",
            color: "#00FFFF",
            fontFamily: "var(--font-label)",
            letterSpacing: "1px",
            clipPath:
              "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Wallet button */}
        <button
          onClick={handleWalletClick}
          className="w-full mb-6 flex items-center justify-center gap-3 py-3 px-6 text-sm font-semibold transition-all duration-150 hover:translate-y-[-2px]"
          style={{
            background: "rgba(20,241,149,0.08)",
            border: "1px solid rgba(20,241,149,0.3)",
            color: "#14F195",
            fontFamily: "var(--font-label)",
            letterSpacing: "1px",
            clipPath:
              "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M16 14h.01" />
            <path d="M2 10h20" />
          </svg>
          {connected ? "Sign in with Wallet" : "Connect Solana Wallet"}
        </button>

        {/* Dismiss link */}
        <button
          onClick={onClose}
          className="text-text-muted text-xs hover:text-text-secondary transition-colors duration-150"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          No thanks, keep playing locally
        </button>

        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
