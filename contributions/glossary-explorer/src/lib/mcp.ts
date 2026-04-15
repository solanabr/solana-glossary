import "server-only";

const DEFAULT_MCP_URL =
  "https://solana-glossary-production-5f40.up.railway.app/mcp";

interface McpTextContent {
  type: string;
  text?: string;
}

interface McpResultEnvelope {
  result?: {
    content?: McpTextContent[];
  };
  error?: {
    message?: string;
  };
}

export async function callMcpTool<TArguments extends Record<string, unknown>>(
  name: string,
  args: TArguments,
) {
  const response = await fetch(
    process.env.GLOSSARY_MCP_URL ?? DEFAULT_MCP_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name,
          arguments: args,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`MCP request failed with ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  let parsed: McpResultEnvelope;

  if (contentType.includes("text/event-stream")) {
    parsed = JSON.parse(extractSseData(raw)) as McpResultEnvelope;
  } else {
    try {
      parsed = JSON.parse(raw) as McpResultEnvelope;
    } catch {
      parsed = JSON.parse(extractSseData(raw)) as McpResultEnvelope;
    }
  }

  if (parsed.error) {
    throw new Error(parsed.error.message ?? `MCP tool "${name}" failed`);
  }

  const text = (parsed.result?.content ?? [])
    .filter((item) => item.type === "text" && item.text)
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    text,
    raw: parsed,
  };
}

function extractSseData(raw: string) {
  const chunks = raw.split("\n\n");

  for (const chunk of chunks) {
    const dataLines = chunk
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""))
      .join("\n");

    if (dataLines) {
      return dataLines;
    }
  }

  throw new Error("MCP response did not contain SSE data");
}
