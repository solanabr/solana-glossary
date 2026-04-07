import { stdin, stdout } from "node:process";

import { readResource, resourceCatalog } from "./resources/index.js";
import { getTool, tools } from "./tools/index.js";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: Record<string, unknown>;
};

type JsonRpcError = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
};

const SERVER_INFO = {
  name: "solana-glossary-actions",
  version: "0.1.0",
};

function writeMessage(payload: JsonRpcSuccess | JsonRpcError): void {
  const json = JSON.stringify(payload);
  const message = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  stdout.write(message);
}

function writeError(id: JsonRpcId, code: number, message: string, data?: unknown): void {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  });
}

function writeResult(id: JsonRpcId, result: Record<string, unknown>): void {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result,
  });
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
  const id = request.id ?? null;

  switch (request.method) {
    case "initialize":
      writeResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: SERVER_INFO,
      });
      return;
    case "notifications/initialized":
      return;
    case "ping":
      writeResult(id, {});
      return;
    case "tools/list":
      writeResult(id, {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          metadata: tool.metadata,
          inputSchema: tool.inputSchema,
        })),
      });
      return;
    case "resources/list":
      writeResult(id, {
        resources: resourceCatalog,
      });
      return;
    case "resources/read": {
      const uri = typeof request.params?.uri === "string" ? request.params.uri : "";
      if (!uri) {
        writeError(id, -32602, "resources/read requires a uri.");
        return;
      }

      try {
        const resource = readResource(uri);
        writeResult(id, {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: resource.text,
            },
          ],
        });
      } catch (error) {
        writeError(id, -32000, error instanceof Error ? error.message : "Resource read failed");
      }
      return;
    }
    case "tools/call": {
      const name = typeof request.params?.name === "string" ? request.params.name : "";
      const args =
        request.params && typeof request.params.arguments === "object" && request.params.arguments
          ? (request.params.arguments as Record<string, unknown>)
          : {};

      const tool = getTool(name);
      if (!tool) {
        writeError(id, -32602, `Unknown tool: ${name}`);
        return;
      }

      try {
        const result = await tool.handler(args);
        writeResult(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      } catch (error) {
        writeError(id, -32000, error instanceof Error ? error.message : "Tool execution failed");
      }
      return;
    }
    default:
      writeError(id, -32601, `Method not found: ${request.method}`);
  }
}

export async function startServer(): Promise<void> {
  stdin.setEncoding("utf8");
  stdin.resume();

  return await new Promise(() => {
    const keepAlive = setInterval(() => {}, 1 << 30);
    let buffer = "";
    let expectedLength: number | null = null;

    const teardown = () => {
      clearInterval(keepAlive);
    };

    stdin.on("end", teardown);
    stdin.on("close", teardown);

    stdin.on("data", async (chunk: string) => {
      buffer += chunk;

      while (true) {
        if (expectedLength === null) {
          const headerEnd = buffer.indexOf("\r\n\r\n");
          if (headerEnd === -1) return;

          const header = buffer.slice(0, headerEnd);
          const match = header.match(/Content-Length:\s*(\d+)/i);
          if (!match) {
            buffer = "";
            return;
          }

          expectedLength = Number.parseInt(match[1], 10);
          buffer = buffer.slice(headerEnd + 4);
        }

        if (expectedLength === null || buffer.length < expectedLength) return;

        const body = buffer.slice(0, expectedLength);
        buffer = buffer.slice(expectedLength);
        expectedLength = null;

        let request: JsonRpcRequest;
        try {
          request = JSON.parse(body) as JsonRpcRequest;
        } catch {
          writeError(null, -32700, "Parse error");
          continue;
        }

        await handleRequest(request);
      }
    });
  });
}
