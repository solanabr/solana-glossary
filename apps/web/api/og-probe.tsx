// TEMPORARY diagnostic twin of og.tsx — same imports/compile shape, but every
// failure is caught and returned as text. Removed after diagnosis.
import React from "react";

export const config = { runtime: "nodejs" };

async function handler(): Promise<Response> {
  const steps: string[] = [`node=${process.version}`];
  try {
    steps.push("importing @vercel/og…");
    const { ImageResponse } = await import("@vercel/og");
    steps.push("imported ok; rendering JSX ImageResponse…");
    const img = new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D1117",
          color: "#14F195",
          fontSize: 48,
        }}
      >
        og probe
      </div>,
      { width: 400, height: 200 },
    );
    const buf = await img.arrayBuffer();
    steps.push(`rendered ok bytes=${buf.byteLength}`);
    return new Response(steps.join("\n"), { status: 200 });
  } catch (e) {
    steps.push("ERR: " + String((e as Error)?.stack ?? e).slice(0, 1500));
    return new Response(steps.join("\n"), { status: 200 });
  }
}

export default { fetch: handler };
