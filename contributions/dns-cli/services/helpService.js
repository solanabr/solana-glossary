// services/helpService.js
// Returns the help / command list shown when user queries "glossary.help"

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

export function getHelpLines(serverIp = "<your-server-ip>", port = 5300) {
  const d = (cmd) => `  dig @${serverIp} -p ${port} ${cmd} +short`;

  return [
    DIVIDER_THICK,
    "  SOLANA GLOSSARY DNS CLI",
    "  Query 1001 Solana terms from your terminal. No install needed.",
    DIVIDER_THICK,
    "",
    "  LOOK UP A TERM (by ID or alias):",
    d("proof-of-history"),
    d("poh"),
    d("pda"),
    d("amm"),
    "",
    DIVIDER_THIN,
    "  BROWSE A CATEGORY:",
    d("find.defi"),
    d("find.core-protocol"),
    d("find.web3"),
    d("find.security"),
    d("find.ai-ml"),
    "",
    DIVIDER_THIN,
    "  OTHER COMMANDS:",
    d("categories          ") + "  — list all 14 categories",
    d("random              ") + "  — show a random term",
    d("glossary.help       ") + "  — this help page",
    "",
    DIVIDER_THIN,
    "  ALL 14 CATEGORIES:",
    "  core-protocol | programming-model | token-ecosystem | defi",
    "  zk-compression | infrastructure | security | dev-tools",
    "  network | blockchain-general | web3 | programming-fundamentals",
    "  ai-ml | solana-ecosystem",
    "",
    DIVIDER_THIN,
    "  SHORTCUT (add to ~/.bashrc):",
    `  alias sol='dig @${serverIp} -p ${port} +short'`,
    "  Then just run:  sol pda   or   sol find.defi",
    DIVIDER_THICK,
    "  Built for Superteam Brazil Bounty — Solana Glossary",
    "  Repo: github.com/solanabr/solana-glossary",
    DIVIDER_THICK,
  ];
}
