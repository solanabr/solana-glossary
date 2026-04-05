import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"ABC Diatype"', '"DM Sans"', "system-ui", "sans-serif"],
        body: ['"ABC Diatype"', '"DM Sans"', "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      colors: {
        sol: {
          purple: "#9945FF",
          green: "#14F195",
          blue: "#00C2FF",
          dark: "#09090b",
          darker: "#050506",
          card: "#121214",
          surface: "#121214",
          "surface-elevated": "#18181c",
          border: "#23232b",
          line: "#23232b",
          "line-strong": "#34343f",
          muted: "#52525e",
          text: "#ececf1",
          subtle: "#9494a8",
          accent: "#14F195",
          "accent-muted": "rgba(20, 241, 149, 0.12)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "sheet-from-bottom":
          "sheetFromBottom 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "flip-in": "flipIn 0.5s ease forwards",
        "flip-out": "flipOut 0.3s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        sheetFromBottom: {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        flipIn: {
          from: { opacity: "0", transform: "rotateY(-90deg) scale(0.95)" },
          to: { opacity: "1", transform: "rotateY(0deg) scale(1)" },
        },
        flipOut: {
          from: { opacity: "1", transform: "rotateY(0deg)" },
          to: { opacity: "0", transform: "rotateY(90deg)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(153, 69, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(20, 241, 149, 0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-sol":
          "linear-gradient(135deg, #9945FF 0%, #00C2FF 50%, #14F195 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(153,69,255,0.08) 0%, rgba(20,241,149,0.04) 100%)",
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [typography],
};

export default config;
