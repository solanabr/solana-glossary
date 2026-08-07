// GET /api/ai/status — public, coarse per-surface availability. Never leaks
// budget numbers. Cached ~30s at the edge; the client falls back to
// VITE_AI_ENABLED when the fetch fails.

import { corsPreflight, jsonResponse } from "../_lib/guard";
import { config as cfg } from "../_lib/config";
import { budget } from "../_lib/budget";
import { turnstile } from "../_lib/turnstile";
import type { AiStatus, FeatureState } from "../_lib/types";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight();

  const globallyDown =
    !cfg.aiEnabled ||
    !cfg.hasGemini ||
    (cfg.isProd && !cfg.hasUpstash && !cfg.allowUnmeteredAi);

  const tier = await budget.globalTier();

  const state = (featureEnabled: boolean): FeatureState => {
    if (globallyDown || !featureEnabled) return "disabled";
    // normal/economy/canned all still return useful content → "on".
    return tier === "resting" ? "resting" : "on";
  };

  const status: AiStatus = {
    copilot: state(cfg.copilotEnabled),
    quiz: state(cfg.quizEnabled),
    applyCode: state(cfg.applyCodeEnabled),
    requiresSession: turnstile.required,
  };

  return jsonResponse(status, 200, {
    "Cache-Control": "public, max-age=30, s-maxage=30",
  });
}
