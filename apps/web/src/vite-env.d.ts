/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Phase-1 AI gate. `"true"` enables the Copilot/AI surfaces. Defaults off. */
  readonly VITE_AI_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
