"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth-modal";

export default function AuthButton() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showDropdown]);

  if (isLoading) return null;

  // Not authenticated — show "SAVE" button
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all duration-150 hover:translate-y-[-1px]"
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            background: "transparent",
            clipPath:
              "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          Save
        </button>
        <AuthModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Authenticated — show avatar with dropdown
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center overflow-hidden transition-all duration-150"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid rgba(0,255,255,0.4)",
          boxShadow: "0 0 10px rgba(0,255,255,0.15)",
          background: avatarUrl ? "transparent" : "var(--surface-2)",
          cursor: "pointer",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-title)",
              fontSize: 12,
              fontWeight: 700,
              color: "#00FFFF",
            }}
          >
            {initial}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute right-0 top-full mt-2 w-56 z-50"
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--border)",
            clipPath:
              "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div
              className="text-sm font-semibold text-text-primary truncate"
              style={{ fontFamily: "var(--font-label)" }}
            >
              {displayName}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#14F195", boxShadow: "0 0 6px rgba(20,241,149,0.6)" }}
              />
              <span
                className="text-xs"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#14F195",
                }}
              >
                Cloud sync ON
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              setShowDropdown(false);
              await signOut();
            }}
            className="w-full text-left px-4 py-2.5 text-xs text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
