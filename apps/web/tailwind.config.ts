import type { Config } from "tailwindcss";
import palette from "tailwindcss/colors";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

// The `-300`/`-400` rungs below are used as chip and icon *text* on tinted
// surfaces (src/lib/category-colors.ts and its consumers). Stock Tailwind tunes
// them for dark backgrounds, where they fail on light ones — so those rungs
// alone resolve through CSS variables that each theme redefines in index.css.
// Every other rung stays stock.
const themedText = (name: string, shade: number) =>
  `hsl(var(--pal-${name}-${shade}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        surface: {
          elevated: "hsl(var(--surface-elevated))",
          hover: "hsl(var(--surface-hover))",
        },
        subtle: "hsl(var(--text-subtle))",
        code: {
          DEFAULT: "hsl(var(--code-bg) / <alpha-value>)",
          foreground: "hsl(var(--code-fg) / <alpha-value>)",
        },

        slate: { ...palette.slate, 400: themedText("slate", 400) },
        red: {
          ...palette.red,
          300: themedText("red", 300),
          400: themedText("red", 400),
        },
        orange: { ...palette.orange, 400: themedText("orange", 400) },
        yellow: { ...palette.yellow, 400: themedText("yellow", 400) },
        emerald: {
          ...palette.emerald,
          300: themedText("emerald", 300),
          400: themedText("emerald", 400),
        },
        teal: { ...palette.teal, 400: themedText("teal", 400) },
        cyan: { ...palette.cyan, 400: themedText("cyan", 400) },
        sky: { ...palette.sky, 400: themedText("sky", 400) },
        blue: { ...palette.blue, 400: themedText("blue", 400) },
        indigo: { ...palette.indigo, 400: themedText("indigo", 400) },
        violet: {
          ...palette.violet,
          300: themedText("violet", 300),
          400: themedText("violet", 400),
        },
        purple: { ...palette.purple, 400: themedText("purple", 400) },
        pink: { ...palette.pink, 400: themedText("pink", 400) },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "typing-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-2px)" },
          "80%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;
