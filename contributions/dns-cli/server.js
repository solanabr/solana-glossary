// server.js — Solana Glossary DNS CLI Server
//
// Local usage (self-hosted):
//   dig @127.0.0.1 -p 5300 poh              +short
//   dig @127.0.0.1 -p 5300 proof-of-history +short
//   dig @127.0.0.1 -p 5300 find.defi        +short
//   dig @127.0.0.1 -p 5300 categories       +short
//   dig @127.0.0.1 -p 5300 random           +short
//   dig @127.0.0.1 -p 5300 glossary.help    +short
//   dig @127.0.0.1 -p 5300 help             +short  (alias)
//
// Public server (sdns.fun):
//   dig poh @sdns.fun +short
//   sol poh    (after: sol() { dig +short "${1}" @sdns.fun; })

import dgram from "node:dgram";
import dnsPacket from "dns-packet";

import { loadGlossary, getTerm } from "./loader.js";
import { formatTerm, termNotFound } from "./services/termService.js";
import { getCategoryTerms, getAllCategories, getRandomTermFormatted, keywordSearch, getTermOfTheDay } from "./services/searchService.js";
import { getHelpLines } from "./services/helpService.js";
import { getLocalizedTerm } from "./services/i18nService.js";

const PORT = parseInt(process.env.DNS_PORT || "5300");
const HOST = "0.0.0.0";
const PUBLIC_HOST = process.env.PUBLIC_HOST || "127.0.0.1";

// ─── Bootstrap ───────────────────────────────────────────────────────────────
await loadGlossary();

// ─── Route a query name → array of response lines ────────────────────────────
async function resolveQuery(name) {
  if (name === "glossary.help" || name === "help") {
    return getHelpLines(PUBLIC_HOST);

  } else if (name === "categories") {
    return getAllCategories();

  } else if (name === "random") {
    return getRandomTermFormatted();

  } else if (name === "today") {
    return getTermOfTheDay();

  } else if (name.startsWith("search.")) {
    return keywordSearch(name.slice("search.".length));

  } else if (name.startsWith("pt.") || name.startsWith("es.")) {
    return getLocalizedTerm(name.slice(0, 2), name.slice(3));

  } else if (name.startsWith("find.")) {
    return getCategoryTerms(name.slice("find.".length));

  } else {
    const term = getTerm(name);
    return term ? formatTerm(term) : termNotFound(name);
  }
}

// ─── DNS UDP Server ───────────────────────────────────────────────────────────
const server = dgram.createSocket("udp4");

server.on("error", (err) => {
  console.error(`DNS server error: ${err.message}`);
});

server.on("message", async (msg, rinfo) => {
  try {
    const incoming = dnsPacket.decode(msg);
    if (!incoming.questions?.length) return;

    const question = incoming.questions[0];
    const name = question.name.toLowerCase().trim();
    console.log(`[${new Date().toISOString()}] Query: "${name}" from ${rinfo.address}:${rinfo.port}`);

    let lines = await resolveQuery(name);

    // Safety: always an array of clean strings
    if (!Array.isArray(lines)) lines = ["Error: unexpected response format."];
    lines = lines.filter((l) => l != null).map(String);

    // Build TXT answer records — one per line
    // Each string is chunked at 255 bytes (DNS TXT per-string limit)
    const answers = lines.map((line) => {
      const buf = Buffer.from(line, "utf8");
      const chunks = [];
      for (let i = 0; i < buf.length; i += 255) chunks.push(buf.subarray(i, i + 255));
      return { type: "TXT", name: question.name, class: "IN", ttl: 30, data: chunks };
    });

    const response = dnsPacket.encode({
      type: "response",
      id: incoming.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incoming.questions,
      answers,
      additionals: incoming.additionals, // echo EDNS0 OPT record back
    });

    server.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) console.error(`Send error: ${err.message}`);
      else console.log(`  → Sent ${answers.length} TXT records (${response.length} bytes)`);
    });

  } catch (err) {
    console.error(`Error processing request: ${err.message}`);
    try {
      const ep = dnsPacket.decode(msg);
      const errResp = dnsPacket.encode({
        type: "response",
        id: ep.id,
        questions: ep.questions,
        answers: [{
          type: "TXT", name: ep.questions[0].name, class: "IN", ttl: 30,
          data: [Buffer.from("Error processing request. Please try again.", "utf8")],
        }],
        additionals: ep.additionals,
      });
      server.send(errResp, rinfo.port, rinfo.address);
    } catch (_) {}
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.bind(PORT, HOST, () => {
  const sep  = "═".repeat(58);
  const thin = "─".repeat(58);
  const pad  = (s, n) => s + " ".repeat(Math.max(0, n - s.length));
  console.log([
    `╔${sep}╗`,
    `║   Solana Glossary DNS CLI Server — Running              ║`,
    `╠${sep}╣`,
    `║  Port       : ${pad(String(PORT), 42)}║`,
    `║  Public     : ${pad(PUBLIC_HOST, 42)}║`,
    `║  Protocol   : ${pad("UDP / DNS TXT records", 42)}║`,
    `╟${thin}╢`,
    `║  Quick start (add to ~/.bashrc):                        ║`,
    `║  ${pad(`sol() { dig +short "\${1}" @${PUBLIC_HOST}; }`, 56)}║`,
    `║  Then: sol poh  |  sol find.defi  |  sol random         ║`,
    `╚${sep}╝`,
  ].join("\n"));
});
