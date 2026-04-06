// services/helpService.js
// Returns the help / command list shown when user queries "glossary.help"

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

export function getHelpLines(serverHost = "sdns.fun", port = 5300) {
  // If on public server (not localhost), no -p flag needed (iptables handles 53→5300)
  const isPublic = serverHost !== "127.0.0.1" && serverHost !== "localhost";
  const d = (cmd) =>
    isPublic
      ? `  dig ${cmd} @${serverHost} +short`
      : `  dig @${serverHost} -p ${port} ${cmd} +short`;

  return [
    DIVIDER_THICK,
    "  SOLANA GLOSSARY DNS CLI",
    "  Query 1001 Solana terms from your terminal. No install needed.",
    DIVIDER_THICK,
    "",
    "  QUICKEST SETUP (one-time, then just type: sol <term>):",
    `  echo 'sol() { dig +short "\${1}" @${serverHost}; }' >> ~/.bashrc && source ~/.bashrc`,
    "",
    DIVIDER_THIN,
    "  LOOK UP A TERM (by ID or alias):",
    `  sol poh`,
    `  sol proof-of-history`,
    `  sol amm`,
    `  sol pda`,
    "",
    DIVIDER_THIN,
    "  BROWSE A CATEGORY:",
    `  sol find.defi`,
    `  sol find.core-protocol`,
    `  sol find.web3`,
    `  sol find.security`,
    `  sol find.ai-ml`,
    "",
    DIVIDER_THIN,
    "  OTHER COMMANDS:",
    `  sol categories      — list all 14 categories`,
    `  sol random          — show a random term`,
    `  sol today           — term of the day`,
    `  sol search.<word>   — search by keyword e.g. sol search.amm`,
    `  sol pt.<term-id>    — look up in Portuguese`,
    `  sol es.<term-id>    — look up in Spanish`,
    `  sol glossary.help   — this help page`,
    "",
    DIVIDER_THIN,
    "  OR USE dig DIRECTLY (without alias):",
    d("poh"),
    d("find.defi"),
    d("random"),
    "",
    DIVIDER_THIN,
    "  ALL 14 CATEGORIES:",
    "  core-protocol | programming-model | token-ecosystem | defi",
    "  zk-compression | infrastructure | security | dev-tools",
    "  network | blockchain-general | web3 | programming-fundamentals",
    "  ai-ml | solana-ecosystem",
    "",
    DIVIDER_THICK,
    "  Built for Superteam Brazil Bounty — Solana Glossary",
    "  Repo: github.com/solanabr/solana-glossary",
    DIVIDER_THICK,
  ];
}
