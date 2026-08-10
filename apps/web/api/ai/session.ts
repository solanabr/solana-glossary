// POST /api/ai/session — verifies a Turnstile token and mints a short-lived
// HMAC session token the client presents on subsequent AI calls. In dev (no
// Turnstile secret) verification is a no-op and a token is still minted so the
// client flow is uniform.

import {
  clientIp,
  corsPreflight,
  ipIdentity,
  jsonResponse,
  readJson,
} from "../_lib/guard.js";
import { config as cfg } from "../_lib/config.js";
import { turnstile } from "../_lib/turnstile.js";
import type { SessionMintRequest, SessionMintResponse } from "../_lib/types.js";

export const config = { runtime: "nodejs" };

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight(req);

  // Prod fails closed: refuse to mint if the bot gate or session secret is
  // missing (an ephemeral per-instance secret would 401 across instances).
  if (
    cfg.isProd &&
    !cfg.allowUnmeteredAi &&
    (!cfg.hasTurnstile || !cfg.hasSessionSecret)
  ) {
    return jsonResponse({ mode: "disabled" }, 503, {}, req);
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as SessionMintRequest;

  const ip = clientIp(req);
  const verified = await turnstile.verifyToken(body.turnstileToken, ip);
  if (!verified) {
    return jsonResponse(
      { error: "Turnstile verification failed" },
      403,
      {},
      req,
    );
  }

  const { token, expiresAt } = turnstile.mintSession(ipIdentity(ip));
  const response: SessionMintResponse = { token, expiresAt };
  return jsonResponse(response, 200, {}, req);
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
