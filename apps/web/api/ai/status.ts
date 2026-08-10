// GET /api/ai/status — public, coarse per-surface availability. Never leaks
// budget numbers. Cached ~30s at the edge; the client falls back to
// VITE_AI_ENABLED when the fetch fails.

import { corsPreflight, jsonResponse } from "../_lib/guard";
import { config as cfg } from "../_lib/config";
import { budget } from "../_lib/budget";
import { turnstile } from "../_lib/turnstile";
import type { AiStatus, FeatureState } from "../_lib/types";

export const config = { runtime: "nodejs" };

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight(req);

  // Mirror the guard's prod fail-closed check so the client shows "disabled"
  // when any prod protection (metering / bot gate / session secret) is missing.
  const globallyDown =
    !cfg.aiEnabled ||
    !cfg.hasGemini ||
    (cfg.isProd &&
      !cfg.allowUnmeteredAi &&
      (!cfg.hasUpstash || !cfg.hasTurnstile || !cfg.hasSessionSecret));

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

  return jsonResponse(
    status,
    200,
    { "Cache-Control": "public, max-age=30, s-maxage=30" },
    req,
  );
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
