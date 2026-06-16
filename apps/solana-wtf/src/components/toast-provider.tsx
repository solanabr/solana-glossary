"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Personality metadata for toast display                              */
/* ------------------------------------------------------------------ */

const PERSONALITY_META: Record<string, { emoji: string; name: string; color: string }> = {
  degen: { emoji: "\u{1F98D}", name: "Degen Sensei", color: "#14F195" },
  glados: { emoji: "\u{1F916}", name: "GLaDOS", color: "#FF003F" },
  maid: { emoji: "\u{1F380}", name: "Maid-chan", color: "#00FFFF" },
  dm: { emoji: "\u{1F409}", name: "DnD Master", color: "#BD00FF" },
};

/* ------------------------------------------------------------------ */
/*  Toast types                                                         */
/* ------------------------------------------------------------------ */

interface Toast {
  id: string;
  personalityId: string;
  phase: "in" | "out" | "visible";
}

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

interface ToastContextValue {
  showUnlockToast: (personalityId: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showUnlockToast = useCallback((personalityId: string) => {
    const id = `${personalityId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, personalityId, phase: "in" }]);

    // Transition to visible after animation
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, phase: "visible" } : t))
      );
    }, 400);

    // Start slide-out after 4s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, phase: "out" } : t))
      );
    }, 4000);

    // Remove after slide-out animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4400);
  }, []);

  // Listen for unlock events from progress context
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ personalityId: string }>).detail;
      showUnlockToast(detail.personalityId);
    };
    window.addEventListener("solana-wtf-unlock", handler);
    return () => window.removeEventListener("solana-wtf-unlock", handler);
  }, [showUnlockToast]);

  return (
    <ToastContext.Provider value={{ showUnlockToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          {toasts.map((toast) => {
            const meta = PERSONALITY_META[toast.personalityId] || {
              emoji: "\u{1F513}",
              name: toast.personalityId,
              color: "#00FFFF",
            };

            return (
              <div
                key={toast.id}
                className={
                  toast.phase === "in"
                    ? "toast-slide-in"
                    : toast.phase === "out"
                      ? "toast-slide-out"
                      : ""
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  background: "var(--bg-1)",
                  border: `1px solid ${meta.color}50`,
                  boxShadow: `0 0 30px ${meta.color}30, 0 0 60px ${meta.color}15, inset 0 0 20px ${meta.color}08`,
                  clipPath:
                    "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
                  minWidth: 260,
                  pointerEvents: "auto",
                }}
              >
                {/* Emoji */}
                <span style={{ fontSize: 28, flexShrink: 0 }}>
                  {meta.emoji}
                </span>

                {/* Text */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-title)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      color: meta.color,
                      textShadow: `0 0 10px ${meta.color}`,
                      textTransform: "uppercase",
                    }}
                  >
                    UNLOCKED
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-label)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {meta.name}
                  </div>
                </div>

                {/* Neon accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 8,
                    right: 8,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}
