#!/usr/bin/env node

import { startServer } from "./server.js";

startServer().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  process.stderr.write(`Glossary MCP server failed to start: ${message}\n`);
  process.exitCode = 1;
});
