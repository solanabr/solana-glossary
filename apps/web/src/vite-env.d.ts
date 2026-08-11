/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build-time AI fallback. `"true"` enables AI surfaces when the status API is unreachable. */
  readonly VITE_AI_ENABLED?: string;
  /** Public Cloudflare Turnstile site key. When set, AI calls present a minted session token. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ── Cloudflare Turnstile (injected script; see lib/ai-session.ts) ──
interface TurnstileRenderOptions {
  sitekey: string;
  size?: "normal" | "flexible" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  retry?: "auto" | "never";
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "timeout-callback"?: () => void;
  "expired-callback"?: () => void;
  /** Fires when the challenge escalates to an interactive (visible) check. */
  "before-interactive-callback"?: () => void;
  "after-interactive-callback"?: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement | string, opts: TurnstileRenderOptions) => string;
  execute: (id: string) => void;
  remove: (id: string) => void;
  reset: (id?: string) => void;
}

interface Window {
  turnstile?: TurnstileApi;
}
