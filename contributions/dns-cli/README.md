# Solana Glossary DNS CLI

Query any of the **1001 Solana glossary terms** directly from your terminal — **no installation, no SDK, no browser needed.**

---

## 🌐 Live Public Server

The server is live at **`sdns.fun`**. Set up the `sol` shortcut once and you're done:

```bash
# Add to ~/.bashrc or ~/.zshrc (Linux / macOS / WSL)
sol() { dig +short "${1}" @sdns.fun; }
```

Then just type:

```bash
sol poh
sol proof-of-history
sol find.defi
sol random
sol glossary.help
```

> **Why `+short`?** The `dig` tool prints full DNS protocol headers by default. `+short` strips the noise and shows only the response text. The `sol` function wraps this automatically so users never have to type it.

---

## 📦 One-Time Install (copy-paste, then restart terminal)

**Linux / macOS / WSL:**
```bash
echo 'sol() { dig +short "${1}" @sdns.fun; }' >> ~/.bashrc && source ~/.bashrc
```

**macOS (zsh):**
```bash
echo 'sol() { dig +short "${1}" @sdns.fun; }' >> ~/.zshrc && source ~/.zshrc
```

After this, `sol` is available system-wide. No npm install, no PATH changes.

---

## Quick Demo

```bash
sol poh                  # ← proof-of-history (by alias)
sol amm                  # ← automated market maker
sol pda                  # ← program derived address
sol find.defi            # ← browse all DeFi terms
sol find.core-protocol   # ← browse core protocol terms
sol categories           # ← list all 14 categories
sol random               # ← surprise me
sol glossary.help        # ← show all commands
```

Or use bare `dig` without the alias:

```bash
dig poh @sdns.fun +short
dig proof-of-history @sdns.fun +short
dig find.defi @sdns.fun +short
```

---

## Example Output

```
$ sol proof-of-history

"============================================================"
"  PROOF OF HISTORY (POH)"
"============================================================"
"  ID       : proof-of-history"
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
| `today` | Term of the day (changes daily, deterministic) |
| `search.<keyword>` | Keyword search across all terms |
| `pt.<term-id>` | Look up term in Portuguese (pt-BR) |
| `es.<term-id>` | Look up term in Spanish |
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

## Self-Hosting

### Prerequisites

- Node.js 18+
- `dig` command (`sudo apt install dnsutils` on Linux, built-in on macOS)

### Install & Run

```bash
# From the root of the solana-glossary repo:
cd contributions/dns-cli

npm install

node server.js
# Server starts on UDP port 5300
```

### Local alias (no public server)

```bash
sol() { dig +short "${1}" @127.0.0.1 -p 5300; }

sol poh
sol find.defi
sol random
```

---

## How It Works

1. **Data layer** — `loader.js` reads all 14 `data/terms/*.json` files at startup and builds three in-memory lookup indexes (`byId`, `byAlias`, `byCategory`). No API calls, no SDK dependency.

2. **DNS server** — `server.js` listens on UDP port 5300. Incoming DNS queries are decoded with `dns-packet`, routed to the right service, and the response is a list of strings encoded as DNS TXT records.

3. **Output** — Each line of the response becomes a separate TXT record. `dig +short` strips the DNS wrapper and prints each on its own line — the `sol` alias handles this transparently.

4. **Deployment** — Running on AWS EC2 (t2.micro) with PM2. `iptables` redirects port 53 → 5300 so users don't need `-p 5300`.

---

## Project Structure

```
contributions/dns-cli/
├── server.js              Main DNS server & query router
├── loader.js              Reads data/terms/*.json & builds indexes
├── services/
│   ├── termService.js     Formats term definitions for output
│   ├── searchService.js   Category search, random, keyword search
│   ├── helpService.js     Help text & command list
│   └── i18nService.js     Portuguese & Spanish localization
├── .env.example           Environment variable reference
├── package.json
├── .gitignore
└── README.md
```

---

## Data Source

This tool reads directly from the glossary repository's `data/terms/*.json` files — no `@stbr/solana-glossary` npm package dependency required.

---

## License

MIT — See [LICENSE](../../LICENSE)
