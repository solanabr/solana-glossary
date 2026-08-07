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
} from "../_lib/guard";
import { turnstile } from "../_lib/turnstile";
import type { SessionMintRequest, SessionMintResponse } from "../_lib/types";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight();

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as SessionMintRequest;

  const ip = clientIp(req);
  const verified = await turnstile.verifyToken(body.turnstileToken, ip);
  if (!verified) {
    return jsonResponse({ error: "Turnstile verification failed" }, 403);
  }

  const { token, expiresAt } = turnstile.mintSession(ipIdentity(ip));
  const response: SessionMintResponse = { token, expiresAt };
  return jsonResponse(response);
}
