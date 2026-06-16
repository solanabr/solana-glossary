"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import AuthButton from "@/components/auth-button";

/* ------------------------------------------------------------------ */
/*  Language toggle                                                     */
/* ------------------------------------------------------------------ */

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "es", label: "ES" },
] as const;

function subscribeLocale(callback: () => void) {
  window.addEventListener("locale-change", callback);
  return () => window.removeEventListener("locale-change", callback);
}

function getLocaleSnapshot() {
  const saved = localStorage.getItem("solana-wtf-locale");
  return saved && ["en", "pt", "es"].includes(saved) ? saved : "en";
}

function getLocaleServerSnapshot() {
  return "en";
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const linkBase: React.CSSProperties = {
  textDecoration: "none",
  color: "#8A8FA8",
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "6px 16px",
  transition: "all 0.15s ease",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const linkHover: React.CSSProperties = {
  color: "#00FFFF",
  textShadow: "0 0 8px rgba(0,255,255,0.35)",
  borderColor: "rgba(0,255,255,0.25)",
  background: "rgba(0,255,255,0.03)",
};

const linkActive: React.CSSProperties = {
  color: "#00FFFF",
  borderColor: "#00FFFF",
  background: "rgba(0,255,255,0.05)",
  boxShadow: "0 0 12px rgba(0,255,255,0.15), inset 0 0 12px rgba(0,255,255,0.03)",
  textShadow: "0 0 10px rgba(0,255,255,0.35)",
};

/* ------------------------------------------------------------------ */
/*  NavLink sub-component                                              */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  isActive,
  children,
  onClick,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    ...linkBase,
    ...(isActive ? linkActive : hovered ? linkHover : {}),
  };

  return (
    <Link
      href={href}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  LangButton sub-component                                           */
/* ------------------------------------------------------------------ */

function LangButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "4px 10px",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: 1,
        background: isActive ? "#20243a" : hovered ? "rgba(0,255,255,0.03)" : "transparent",
        color: isActive ? "#00FFFF" : hovered ? "#8A8FA8" : "#4A5070",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isActive ? "#00FFFF" : "transparent",
        boxShadow: isActive ? "0 0 8px rgba(0,255,255,0.15)" : "none",
        clipPath:
          "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CyberNav                                                      */
/* ------------------------------------------------------------------ */

interface CyberNavProps {
  active?: "home" | "glossary" | "decoder" | "games" | "about";
  backTo?: { href: string; label: string };
}

export default function CyberNav({ active, backTo }: CyberNavProps) {
  const [backHovered, setBackHovered] = useState(false);
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);
  const [menuOpen, setMenuOpen] = useState(false);

  const setLocale = (code: string) => {
    localStorage.setItem("solana-wtf-locale", code);
    window.dispatchEvent(new CustomEvent("locale-change", { detail: code }));
  };

  const navLinks = (
    <>
      <NavLink href="/glossary" isActive={active === "glossary"} onClick={() => setMenuOpen(false)}>
        Glossary
      </NavLink>
      <NavLink href="/decoder" isActive={active === "decoder"} onClick={() => setMenuOpen(false)}>
        Decoder
      </NavLink>
      <NavLink href="/games" isActive={active === "games"} onClick={() => setMenuOpen(false)}>
        Games
      </NavLink>
      <NavLink href="/about" isActive={active === "about"} onClick={() => setMenuOpen(false)}>
        About
      </NavLink>
    </>
  );

  const langToggle = (
    <div style={{ display: "flex", gap: 4 }}>
      {LOCALES.map((l) => (
        <LangButton
          key={l.code}
          label={l.label}
          isActive={locale === l.code}
          onClick={() => setLocale(l.code)}
        />
      ))}
    </div>
  );

  return (
    <nav
      style={{
        background: "rgba(10,11,16,0.85)",
        borderBottom: "1px solid rgba(0,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Gradient bottom line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, #00FFFF, #BD00FF, #FF003F, transparent)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Main bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          position: "relative",
        }}
        className="md:!px-10"
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1a1d2b",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#00FFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(0,255,255,0.15), inset 0 0 8px rgba(0,255,255,0.15)",
              clipPath:
                "polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 12,
                fontWeight: 900,
                color: "#00FFFF",
                lineHeight: 1,
              }}
            >
              W
            </span>
          </div>
          {/* Brand text — hide on very small, show on sm+ */}
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              fontSize: 14,
              color: "#E0E0E0",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Solana{" "}
            <span style={{ color: "#00FFFF", textShadow: "0 0 10px rgba(0,255,255,0.35)" }}>
              WTF
            </span>
          </span>
        </Link>

        {/* Desktop: nav links + lang + auth */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 6 }}>
          {langToggle}
          <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4 }}>
            {backTo ? (
              <Link
                href={backTo.href}
                style={{
                  ...linkBase,
                  ...(backHovered ? linkHover : {}),
                }}
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => setBackHovered(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {backTo.label}
              </Link>
            ) : (
              navLinks
            )}
          </div>
          <div style={{ marginLeft: 8 }}>
            <AuthButton />
          </div>
        </div>

        {/* Mobile: lang toggle + auth + hamburger */}
        <div className="flex md:hidden" style={{ alignItems: "center", gap: 8 }}>
          {langToggle}
          <AuthButton />
          {!backTo && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                background: menuOpen ? "rgba(0,255,255,0.06)" : "transparent",
                border: `1px solid ${menuOpen ? "#00FFFF" : "rgba(0,255,255,0.15)"}`,
                color: menuOpen ? "#00FFFF" : "#8A8FA8",
                cursor: "pointer",
                transition: "all 0.15s ease",
                clipPath:
                  "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
              }}
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              )}
            </button>
          )}
          {backTo && (
            <Link
              href={backTo.href}
              style={{
                ...linkBase,
                ...(backHovered ? linkHover : {}),
                fontSize: 12,
                padding: "4px 12px",
              }}
              onMouseEnter={() => setBackHovered(true)}
              onMouseLeave={() => setBackHovered(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {backTo.label}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && !backTo && (
        <div
          className="md:hidden"
          style={{
            borderTop: "1px solid rgba(0,255,255,0.06)",
            padding: "8px 16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "rgba(10,11,16,0.95)",
          }}
        >
          {navLinks}
        </div>
      )}
    </nav>
  );
}
