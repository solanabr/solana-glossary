// server.js — Solana Glossary DNS CLI Server
//
// Usage after starting:
//   dig @127.0.0.1 -p 5353 proof-of-history +short
//   dig @127.0.0.1 -p 5353 poh              +short
//   dig @127.0.0.1 -p 5353 find.defi        +short
//   dig @127.0.0.1 -p 5353 categories       +short
//   dig @127.0.0.1 -p 5353 random           +short
//   dig @127.0.0.1 -p 5353 glossary.help    +short

import dgram from "node:dgram";
import dnsPacket from "dns-packet";

import { loadGlossary, getTerm } from "./loader.js";
import { formatTerm, termNotFound } from "./services/termService.js";
import { getCategoryTerms, getAllCategories, getRandomTermFormatted } from "./services/searchService.js";
import { getHelpLines } from "./services/helpService.js";

const PORT = 5300;
const HOST = "0.0.0.0"; // Listen on all interfaces (localhost + LAN)

// ─── Bootstrap: Load glossary data ──────────────────────────────────────────
await loadGlossary();

// ─── DNS Server ──────────────────────────────────────────────────────────────
const server = dgram.createSocket("udp4");

server.on("error", (err) => {
  console.error(`DNS server error: ${err.message}`);
});

server.on("message", async (msg, rinfo) => {
  try {
    const incoming = dnsPacket.decode(msg);
    const question = incoming.questions[0];
    const name = question.name.toLowerCase().trim();

    console.log(`[${new Date().toISOString()}] Query: "${name}" from ${rinfo.address}:${rinfo.port}`);

    // ─── Route the query ───────────────────────────────────────────────────
    let lines = [];

    if (name === "glossary.help") {
      // Show help
      lines = getHelpLines("127.0.0.1", PORT);

    } else if (name === "categories") {
      // List all 14 categories
      lines = getAllCategories();

    } else if (name === "random") {
      // Random term
      lines = getRandomTermFormatted();

    } else if (name.startsWith("find.")) {
      // Category search: "find.defi" → category = "defi"
      const category = name.slice("find.".length);
      lines = getCategoryTerms(category);

    } else {
      // Term lookup by ID or alias
      const term = getTerm(name);
      if (term) {
        lines = formatTerm(term);
      } else {
        lines = termNotFound(name);
      }
    }

    // ─── Safety: ensure lines is always an array of strings ───────────────
    if (!Array.isArray(lines)) {
      lines = ["Error: unexpected response format. Please try again."];
    }
    // Remove any null/undefined entries
    lines = lines.filter((l) => l !== null && l !== undefined).map(String);

    // ─── Build DNS TXT response ────────────────────────────────────────────
    // Each line becomes a separate TXT answer record.
    // `dig +short` prints each record on its own line.
    const answers = lines.map((line) => ({
      type: "TXT",
      name: question.name,
      class: "IN",
      ttl: 30,
      data: line,
    }));

    const response = dnsPacket.encode({
      type: "response",
      id: incoming.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: [question],
      answers,
    });

    server.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error(`Error sending response: ${err.message}`);
      } else {
        console.log(`  → Sent ${answers.length} TXT records`);
      }
    });

  } catch (err) {
    console.error(`Error processing DNS request: ${err.message}`);

    // Try to send an error response so dig doesn't just hang
    try {
      const errPacket = dnsPacket.decode(msg);
      const errResponse = dnsPacket.encode({
        type: "response",
        id: errPacket.id,
        questions: errPacket.questions,
        answers: [{
          type: "TXT",
          name: errPacket.questions[0].name,
          class: "IN",
          ttl: 30,
          data: "Error processing request. Please try again.",
        }],
      });
      server.send(errResponse, rinfo.port, rinfo.address);
    } catch (_) {
      // If even the error response fails, just log it
    }
  }
});

// ─── Start listening ─────────────────────────────────────────────────────────
server.bind(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║        Solana Glossary DNS CLI Server — Running          ║
╠══════════════════════════════════════════════════════════╣
║  Port    : ${PORT}                                        ║
║  Protocol: UDP / DNS TXT records                         ║
╟──────────────────────────────────────────────────────────╢
║  Try it:                                                 ║
║  dig @127.0.0.1 -p ${PORT} proof-of-history +short      ║
║  dig @127.0.0.1 -p ${PORT} poh              +short      ║
║  dig @127.0.0.1 -p ${PORT} find.defi        +short      ║
║  dig @127.0.0.1 -p ${PORT} random           +short      ║
║  dig @127.0.0.1 -p ${PORT} glossary.help    +short      ║
╚══════════════════════════════════════════════════════════╝
  `);
});
