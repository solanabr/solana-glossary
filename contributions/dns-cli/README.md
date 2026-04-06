# Solana Glossary DNS CLI

Query any of the **1001 Solana glossary terms** directly from your terminal using standard `dig` commands — **no installation, no SDK, no browser needed.**

This tool runs a lightweight DNS server that answers queries with glossary definitions as TXT records, readable with any standard DNS client tool (`dig`, `nslookup`).

Built as a contribution to [Superteam Brazil's Solana Glossary](https://github.com/solanabr/solana-glossary) bounty.

---

## Quick Demo

```bash
# Look up a term by ID
dig @127.0.0.1 -p 5300 proof-of-history +short

# Look up by alias (case-insensitive)
dig @127.0.0.1 -p 5300 poh    +short
dig @127.0.0.1 -p 5300 pda    +short
dig @127.0.0.1 -p 5300 amm    +short

# Browse a category
dig @127.0.0.1 -p 5300 find.defi          +short
dig @127.0.0.1 -p 5300 find.core-protocol +short
dig @127.0.0.1 -p 5300 find.security      +short
dig @127.0.0.1 -p 5300 find.ai-ml         +short

# List all 14 categories with term counts
dig @127.0.0.1 -p 5300 categories +short

# Get a random term
dig @127.0.0.1 -p 5300 random +short

# Show all commands
dig @127.0.0.1 -p 5300 glossary.help +short
```

---

## Example Output

```
$ dig @127.0.0.1 -p 5300 proof-of-history +short

"============================================================"
"  PROOF OF HISTORY (POH)"
"============================================================"
"  Category : core-protocol"
"  Aliases  : PoH"
"------------------------------------------------------------"
"  A clock mechanism that cryptographically proves the"
"  passage of time between events. PoH uses a sequential"
"  SHA-256 hash chain where each output becomes the next"
"  input, creating a verifiable ordering of events without"
"  requiring consensus."
"------------------------------------------------------------"
"  Related  : slot | leader-schedule | vdf"
"============================================================"
```

---

## Available Commands

| Command | Description |
|---|---|
| `<term-id>` | Look up a term by its kebab-case ID |
| `<alias>` | Look up by alias (e.g. `poh`, `amm`, `PDA`) |
| `find.<category>` | List all terms in a category |
| `categories` | List all 14 categories with term counts |
| `random` | Show a random term |
| `glossary.help` | Show all commands |

### All 14 Categories

| Category | Terms |
|---|---|
| `core-protocol` | 86 |
| `programming-model` | 69 |
| `token-ecosystem` | 59 |
| `defi` | 135 |
| `zk-compression` | 34 |
| `infrastructure` | 44 |
| `security` | 48 |
| `dev-tools` | 64 |
| `network` | 58 |
| `blockchain-general` | 84 |
| `web3` | 80 |
| `programming-fundamentals` | 47 |
| `ai-ml` | 55 |
| `solana-ecosystem` | 138 |

---

## Setup & Self-Hosting

### Prerequisites

- Node.js 18+
- `dig` command available (`sudo apt install dnsutils` on Linux, built-in on macOS)

### Install & Run

```bash
# From the root of the solana-glossary repo:
cd contributions/dns-cli

npm install

node server.js
```

The server starts on **UDP port 5353**.

### Shortcut Alias (add to `~/.bashrc` or `~/.zshrc`)

```bash
alias sol='dig @127.0.0.1 -p 5300 +short'
```

Then use simply:

```bash
sol proof-of-history
sol find.defi
sol random
```

---

## How It Works

1. **Data layer** — `loader.js` reads all 14 `data/terms/*.json` files at startup and builds three in-memory lookup indexes (`byId`, `byAlias`, `byCategory`). No API calls, no SDK dependency.

2. **DNS server** — `server.js` listens on UDP port 5353. Incoming DNS queries are decoded with `dns-packet`, routed to the right service, and the response is a list of strings encoded as DNS TXT records.

3. **Output** — Each line of the response becomes a separate TXT record. `dig +short` strips the DNS wrapper and prints each on its own line.

---

## Project Structure

```
contributions/dns-cli/
├── server.js              Main DNS server & query router
├── loader.js              Reads data/terms/*.json & builds indexes
├── services/
│   ├── termService.js     Formats term definitions for output
│   ├── searchService.js   Category search & random term
│   └── helpService.js     Help text & command list
├── package.json
├── .gitignore
└── README.md
```

---

## Data Source

This tool reads directly from the glossary repository's `data/terms/*.json` files — no `@stbr/solana-glossary` npm package dependency required. The data path is resolved automatically relative to the repo root.

---

## License

MIT — See [LICENSE](../../LICENSE)
