// services/helpService.js
// Help response — shows all available DNS commands with proper formatting

export function getHelpLines(serverHost = "sdns.fun") {
  const h = serverHost;
  return [
    `Solana Glossary DNS CLI — access 1000+ Solana terms via DNS queries.`,
    `This DNS server takes creative liberties with the DNS protocol to offer`,
    `handy Solana Glossary utilities easily accessible via CLI.`,
    ``,
    `QUICK ALIAS (add to ~/.bashrc or ~/.zshrc, then: source ~/.bashrc):`,
    `  sol() { dig +short "\${1}" @${h}; }`,
    `  Then just type: sol help  |  sol poh  |  sol find.defi`,
    ``,
    `AVAILABLE DNS COMMANDS:`,
    `------------------------------`,
    `sol <term>              - Look up a Solana glossary term (e.g. sol poh)`,
    `sol find.<category>     - Browse terms by category (e.g. sol find.defi)`,
    `sol search.<word>       - Search terms by keyword (e.g. sol search.stake)`,
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
