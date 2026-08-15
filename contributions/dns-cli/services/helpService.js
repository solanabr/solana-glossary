// services/helpService.js
// Help response — ASCII-only (DNS TXT records must not contain multi-byte Unicode)

export function getHelpLines(serverHost = "sdns.fun") {
  const h = serverHost;
  return [
    `Solana Glossary DNS CLI - access 1000+ Solana terms via DNS queries directly from CLI.`,
    "============================================================",
    `ALIAS SETUP (for shortcut):`,
    `  echo 'sol() { dig +short "${1}" @sdns.fun; }' >> ~/.bashrc && source ~/.bashrc`,
    `  Then just type: sol help | sol poh | sol find.defi`,
    "============================================================",
    `AVAILABLE DNS COMMANDS:`,
    `sol <term>              - Look up a Solana glossary term`,
    `sol find.<category>     - Browse terms by category (e.g. sol find.defi)`,
    `sol search.<word>       - Search terms by keyword`,
    `sol pt.<term>           - Look up term in Portuguese (pt-BR)`,
    `sol es.<term>           - Look up term in Spanish`,
    `sol categories          - List all available categories`,
    `sol random              - Show a random Solana term`,
    `sol today               - Show the term of the day`,
    `sol help                - Show this commands list`,
    ``,
    `REPO: github.com/solanabr/solana-glossary`,
  ];
}
