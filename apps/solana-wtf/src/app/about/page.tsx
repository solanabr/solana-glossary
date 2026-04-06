"use client";

import { useState } from "react";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const EXPERIENCE = [
  {
    role: "Design Engineer & UX Designer",
    company: "Freelance / Independent",
    period: "Current",
    color: "#00FFFF",
    highlights: [
      "Building AI-powered tools with Claude Code, Claude API & Figma",
      "Solana WTF — gamified glossary for the Solana ecosystem",
      "Neuroot — burnout recovery app (MVP)",
      "AI Course for UX Designers",
    ],
  },
  {
    role: "UX Designer",
    company: "Nomad",
    period: "Fintech",
    color: "#14F195",
    highlights: [
      "International banking & remittance products",
      "End-to-end UX for financial experiences",
    ],
  },
  {
    role: "UX Designer",
    company: "Brivia",
    period: "Agency",
    color: "#BD00FF",
    highlights: [
      "Major clients: Carrefour, KPMG, Banco do Brasil, GPA, Banco Pan, CPFL",
      "Design systems, product design & user research",
    ],
  },
  {
    role: "UX & Web Designer",
    company: "VG8 / OpenGo",
    period: "Digital Agency",
    color: "#FF003F",
    highlights: [
      "Web design, UI kits & digital campaigns",
      "Cross-functional team collaboration",
    ],
  },
];

const SKILLS = [
  { label: "UX Design", color: "#00FFFF" },
  { label: "Design Engineering", color: "#14F195" },
  { label: "AI Integration", color: "#BD00FF" },
  { label: "Figma", color: "#00FFFF" },
  { label: "React / Next.js", color: "#14F195" },
  { label: "Claude Code", color: "#BD00FF" },
  { label: "Design Systems", color: "#FF003F" },
  { label: "Prototyping", color: "#00FFA3" },
  { label: "User Research", color: "#00FFFF" },
];

const LINKS = [
  { label: "Portfolio", url: "https://www.giulopesgalvao.com.br", icon: "🌐" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/giulopesg", icon: "💼" },
];

/* ------------------------------------------------------------------ */
/*  LinkChip sub-component                                              */
/* ------------------------------------------------------------------ */

function LinkChip({ label, url, icon }: { label: string; url: string; icon: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 1.5,
        textTransform: "uppercase" as const,
        textDecoration: "none",
        color: hovered ? "#00FFFF" : "#8A8FA8",
        background: hovered ? "rgba(0,255,255,0.06)" : "var(--surface-1)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: hovered ? "#00FFFF" : "rgba(0,255,255,0.08)",
        boxShadow: hovered ? "0 0 15px rgba(0,255,255,0.15)" : "none",
        transition: "all 0.15s ease",
        clipPath:
          "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
      }}
    >
      <span>{icon}</span>
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav active="about" />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute animate-pulse-glow"
          style={{
            width: 500,
            height: 500,
            background: "#BD00FF",
            opacity: 0.03,
            filter: "blur(120px)",
            top: -100,
            left: "30%",
          }}
        />
        <div
          className="absolute animate-pulse-glow"
          style={{
            width: 400,
            height: 400,
            background: "#00FFFF",
            opacity: 0.03,
            filter: "blur(120px)",
            bottom: "10%",
            right: "10%",
            animationDelay: "2s",
          }}
        />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#4A5070",
              marginBottom: 12,
            }}
          >
            About the creator
          </div>
          <h1
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(22px, 5vw, 32px)",
              fontWeight: 800,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            <span className="gradient-text">Giuliana Lopes Galvão</span>
          </h1>
          <p
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 14,
              color: "#8A8FA8",
              lineHeight: 1.8,
              maxWidth: 600,
            }}
          >
            UX Designer + Design Engineer based in Brazil.
            Building at the intersection of design, AI, and Web3.
          </p>
        </div>

        {/* Bio section */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              background: "var(--surface-1)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(0,255,255,0.08)",
              padding: 32,
              position: "relative",
              overflow: "hidden",
              clipPath:
                "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
            }}
          >
            {/* Gradient top line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent, #00FFFF, #BD00FF, transparent)",
                opacity: 0.4,
              }}
            />
            <h2
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#00FFFF",
                marginBottom: 16,
              }}
            >
              Background
            </h2>
            <div
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 13,
                color: "#8A8FA8",
                lineHeight: 2,
              }}
            >
              <p style={{ marginBottom: 16 }}>
                Designer with a background in Graphic Design (ULBRA, 2014) and
                Future Thinking (PUC-PR), combining creative vision with
                technical execution. Experienced in building digital products for
                major brands across fintech, banking, and enterprise sectors.
              </p>
              <p style={{ marginBottom: 16 }}>
                Currently focused on Design Engineering — bridging the gap
                between design and code with AI-assisted development. Active
                builder with Claude Code, Claude API, and Figma, creating tools
                that make complex knowledge accessible.
              </p>
              <p>
                Passionate about organized systems, visual storytelling, and
                making technology feel human. Believes the best interfaces are
                the ones that teach you something while you use them.
              </p>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#4A5070",
              marginBottom: 16,
            }}
          >
            Skills & Tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SKILLS.map((s) => (
              <span
                key={s.label}
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  padding: "6px 14px",
                  color: s.color,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: `${s.color}40`,
                  background: `${s.color}08`,
                  clipPath:
                    "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#4A5070",
              marginBottom: 20,
            }}
          >
            Experience
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {EXPERIENCE.map((exp) => (
              <div
                key={exp.company}
                style={{
                  background: "var(--surface-1)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(0,255,255,0.08)",
                  padding: 24,
                  position: "relative",
                  overflow: "hidden",
                  clipPath:
                    "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
                }}
              >
                {/* Left accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    bottom: 8,
                    left: 0,
                    width: 2,
                    background: exp.color,
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        color: exp.color,
                        marginBottom: 4,
                      }}
                    >
                      {exp.company}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 12,
                        color: "#8A8FA8",
                      }}
                    >
                      {exp.role}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Fira Code', monospace",
                      fontSize: 10,
                      color: "#4A5070",
                      padding: "3px 10px",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "rgba(0,255,255,0.08)",
                      clipPath:
                        "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
                    }}
                  >
                    {exp.period}
                  </span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {exp.highlights.map((h, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 12,
                        color: "#4A5070",
                        lineHeight: 2,
                        paddingLeft: 16,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: exp.color,
                          opacity: 0.6,
                        }}
                      >
                        &gt;
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* About this project */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              background: "var(--surface-1)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(0,255,255,0.08)",
              padding: 32,
              position: "relative",
              overflow: "hidden",
              clipPath:
                "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent, #14F195, #00FFFF, transparent)",
                opacity: 0.4,
              }}
            />
            <h2
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#14F195",
                marginBottom: 16,
              }}
            >
              About Solana WTF
            </h2>
            <div
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 13,
                color: "#8A8FA8",
                lineHeight: 2,
              }}
            >
              <p style={{ marginBottom: 16 }}>
                <span style={{ color: "#00FFFF" }}>Solana WTF — What The Fork?!</span> is a
                gamified glossary built for the Superteam Brazil Solana Glossary
                bounty. It transforms 1000+ Solana ecosystem terms into an
                interactive learning experience.
              </p>
              <p>
                Built with Next.js, React 19, and the{" "}
                <span style={{ color: "#00FFFF" }}>@stbr/solana-glossary</span>{" "}
                SDK. Designed and developed with AI-assisted workflows using
                Claude Code.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#4A5070",
              marginBottom: 16,
            }}
          >
            Connect
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LINKS.map((l) => (
              <LinkChip key={l.label} {...l} />
            ))}
          </div>
        </section>
      </main>

      <CyberFooter />
    </div>
  );
}
