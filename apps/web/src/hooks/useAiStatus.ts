/**
 * Runtime AI availability, driven by `GET /api/ai/status`.
 *
 * The endpoint is the source of truth for whether each AI surface (copilot,
 * quiz, apply-code) is `on`, `resting`, or `disabled`. Results are shared across
 * the app and cached ~30s. When the fetch fails or 404s — dev without a backend,
 * or the static Phase-1 deploy — we fall back to the build-time `VITE_AI_ENABLED`
 * flag so the app still behaves sensibly and glossary browsing is never affected.
 *
 * `useAiStatus()` returns the full per-surface status; `useAiEnabled(surface)` is
 * the common "is this surface fully on?" boolean for gating a single surface.
 */
import { useSyncExternalStore } from "react";
import type { AiStatus, FeatureState } from "@/lib/ai-types";

export type AiSurface = "copilot" | "quiz" | "applyCode";

const STATUS_ENDPOINT = "/api/ai/status";
const CACHE_TTL_MS = 30_000;

function envEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED === "true";
}

/** Uniform status derived from the build-time flag, used until/unless the API answers. */
function fallbackStatus(): AiStatus {
  const state: FeatureState = envEnabled() ? "on" : "disabled";
  return {
    copilot: state,
    quiz: state,
    applyCode: state,
    requiresSession: false,
  };
}

function isFeatureState(value: unknown): value is FeatureState {
  return value === "on" || value === "resting" || value === "disabled";
}

/** Validate an API payload before trusting it; return null when malformed. */
function parseAiStatus(value: unknown): AiStatus | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    !isFeatureState(v.copilot) ||
    !isFeatureState(v.quiz) ||
    !isFeatureState(v.applyCode)
  ) {
    return null;
  }
  return {
    copilot: v.copilot,
    quiz: v.quiz,
    applyCode: v.applyCode,
    requiresSession: v.requiresSession === true,
  };
}

function statusEqual(a: AiStatus, b: AiStatus): boolean {
  return (
    a.copilot === b.copilot &&
    a.quiz === b.quiz &&
    a.applyCode === b.applyCode &&
    a.requiresSession === b.requiresSession
  );
}

// ── Shared module store (one fetch, shared 30s cache, no polling loop) ──
let current: AiStatus = fallbackStatus();
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: AiStatus): void {
  fetchedAt = Date.now();
  if (statusEqual(current, next)) return; // keep referential stability
  current = next;
  for (const listener of listeners) listener();
}

async function refresh(): Promise<void> {
  try {
    const resp = await fetch(STATUS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) {
      emit(fallbackStatus());
      return;
    }
    const parsed = parseAiStatus(await resp.json());
    emit(parsed ?? fallbackStatus());
  } catch {
    // Network error / no backend → build-time fallback. Glossary is unaffected.
    emit(fallbackStatus());
  }
}

function maybeRefresh(): void {
  if (inFlight) return;
  if (Date.now() - fetchedAt < CACHE_TTL_MS) return;
  inFlight = refresh().finally(() => {
    inFlight = null;
  });
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  maybeRefresh();
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): AiStatus {
  return current;
}

/** Full per-surface AI status. Re-renders when the shared status changes. */
export function useAiStatus(): AiStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience: is a single surface fully available (state === "on")? */
export function useAiEnabled(surface: AiSurface): boolean {
  return useAiStatus()[surface] === "on";
}
