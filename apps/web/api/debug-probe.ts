// TEMPORARY diagnostic — reports which module import crashes on Vercel and the
// runtime node version. No env values are exposed. Removed after diagnosis.

async function handler(): Promise<Response> {
  const results: Record<string, string> = {
    node: process.version,
    hasGlobalCrypto: String(typeof crypto !== "undefined"),
  };
  const probes: Record<string, () => Promise<unknown>> = {
    "npm:@upstash/redis": () => import("@upstash/redis"),
    "npm:@upstash/ratelimit": () => import("@upstash/ratelimit"),
    "npm:@vercel/edge-config": () => import("@vercel/edge-config"),
    "npm:@vercel/og": () => import("@vercel/og"),
    "npm:@google/genai": () => import("@google/genai"),
    "lib:config": () => import("./_lib/config.js"),
    "lib:redis": () => import("./_lib/redis.js"),
    "lib:turnstile": () => import("./_lib/turnstile.js"),
    "lib:budget": () => import("./_lib/budget.js"),
    "lib:guard": () => import("./_lib/guard.js"),
    "lib:gemini": () => import("./_lib/gemini.js"),
    "mod:meta": () => import("./meta.js"),
    "mod:status": () => import("./ai/status.js"),
  };
  for (const [name, run] of Object.entries(probes)) {
    try {
      await run();
      results[name] = "ok";
    } catch (e) {
      results[name] = String(e).slice(0, 400);
    }
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "content-type": "application/json" },
  });
}

export default { fetch: handler };
