# Solana Glossary DNS CLI

> Query **1001 Solana terms** straight from your terminal — no browser, no SDK, no install.  
> Works like [dns.toys](https://www.dns.toys/) but for the Solana ecosystem.

Built as a contribution to [Superteam Brazil's Solana Glossary](https://github.com/solanabr/solana-glossary) bounty.

---

## 🌐 Live Public Server — `sdns.fun`

```bash
# One-time setup (add to ~/.bashrc or ~/.zshrc, then restart terminal)
sol() { dig +short "${1}" @sdns.fun; }
```

That's it. Now just type:

```bash
sol poh                  # Proof of History
sol amm                  # Automated Market Maker
sol pda                  # Program Derived Address
sol find.defi            # Browse all 135 DeFi terms
sol random               # Surprise me
sol glossary.help        # All commands
```

---

## 📺 Demo

<!-- DEMO GIF PLACEHOLDER -->
<!-- Replace with: ![Solana Glossary DNS CLI Demo](./demo.gif) -->
<!-- Record with: asciinema or ttyrec, then convert to GIF with agg/termtosvg -->
![Demo](https://github.com/monikadhayal/solana-glossary/blob/feat/dns-cli-glossary/glossary_cli_demo.gif)


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

```
$ sol find.defi

"============================================================"
"  CATEGORY: DEFI -- 135 terms"
"============================================================"
"  amm | liquidity-pool | serum | jupiter | orca"
"  drift-protocol | marinade | jito | raydium | phoenix"
"  ...and 125 more"
"------------------------------------------------------------"
"  Tip: sol <term-id>  or  dig <term-id> @sdns.fun +short"
"============================================================"
```

---

## Commands Reference

| Command | Example | Description |
|---------|---------|-------------|
| `<term-id>` | `sol proof-of-history` | Look up by kebab-case ID |
| `<alias>` | `sol poh` · `sol amm` · `sol pda` | Look up by alias |
| `find.<category>` | `sol find.defi` | List all terms in a category |
| `categories` | `sol categories` | All 14 categories with term counts |
| `random` | `sol random` | Random term |
| `today` | `sol today` | Term of the day (deterministic, changes daily) |
| `search.<keyword>` | `sol search.wallet` | Keyword search across all 1001 terms |
| `pt.<term-id>` | `sol pt.proof-of-history` | Term in Portuguese (pt-BR) |
| `es.<term-id>` | `sol es.proof-of-history` | Term in Spanish |
| `glossary.help` | `sol glossary.help` | Full command reference |

### All 14 Categories

| Category | Terms | Category | Terms |
|----------|-------|----------|-------|
| `solana-ecosystem` | 138 | `defi` | 135 |
| `core-protocol` | 86 | `blockchain-general` | 84 |
| `web3` | 80 | `programming-model` | 69 |
| `dev-tools` | 64 | `token-ecosystem` | 59 |
| `network` | 58 | `ai-ml` | 55 |
| `security` | 48 | `programming-fundamentals` | 47 |
| `infrastructure` | 44 | `zk-compression` | 34 |

---

## Install the `sol` alias

**Linux / WSL:**
```bash
echo 'sol() { dig +short "${1}" @sdns.fun; }' >> ~/.bashrc && source ~/.bashrc
```

**macOS (zsh):**
```bash
echo 'sol() { dig +short "${1}" @sdns.fun; }' >> ~/.zshrc && source ~/.zshrc
```

**Windows (PowerShell):**
```powershell
# Add to your $PROFILE
function sol { dig +short $args[0] @sdns.fun }
```

> **Why `+short`?** `dig` by default prints full DNS protocol headers. `+short` strips them and shows only the TXT record content. The `sol` function wraps this so you never have to type it.

---

## Also works with bare `dig` (no alias needed)

```bash
dig proof-of-history @sdns.fun +short
dig find.defi @sdns.fun +short
dig search.staking @sdns.fun +short
dig pt.proof-of-history @sdns.fun +short
```

---

## Self-Hosting

### Prerequisites

- Node.js 18+
- `dig` (`sudo apt install dnsutils` on Linux, built-in on macOS)

### Run locally

```bash
# From the root of the solana-glossary repo:
cd contributions/dns-cli
npm install
node server.js
# Server starts on UDP port 5300
```

Local alias:
```bash
sol() { dig +short "${1}" @127.0.0.1 -p 5300; }
```

### Deploy to your own server (AWS EC2 / DigitalOcean / any VPS)

```bash
# 1. Clone the feature branch
git clone -b feat/dns-cli-glossary https://github.com/monikadhayal/solana-glossary.git
cd solana-glossary/contributions/dns-cli
npm install

# 2. Forward port 53 → 5300 (so Node runs without root)
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 5300
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 5300
sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save

# 3. Start with PM2 (daemon + auto-restart)
PUBLIC_HOST=sdns.fun pm2 start server.js --name solana-dns
pm2 save && pm2 startup

# 4. Test
dig poh @127.0.0.1 -p 5300 +short
```

See `.env.example` for all environment variables.

---

## How It Works

```
User types:  sol poh
         ↓
sol() { dig +short "poh" @sdns.fun; }
         ↓
DNS UDP query → A record sdns.fun → EC2 3.236.22.2
         ↓
iptables: port 53 → 5300
         ↓
Node.js DNS server decodes packet → routes "poh"
         ↓
loader.js looks up alias "poh" → proof-of-history term
         ↓
termService.js formats the definition into lines
         ↓
Each line → DNS TXT record answer
         ↓
dig +short prints only the TXT values — clean output ✅
```

1. **Data** — `loader.js` reads all 14 `data/terms/*.json` at startup, builds 3 in-memory maps: `id→term`, `alias→term`, `category→[terms]`. Zero API calls after boot.
2. **Server** — `server.js` decodes DNS packets with `dns-packet`, routes the query label, and sends back an array of TXT records.
3. **i18n** — `i18nService.js` loads `data/i18n/pt.json` and `es.json` on first use for Portuguese and Spanish lookups.

---

## Project Structure

```
contributions/dns-cli/
├── server.js              DNS server + query router (entry point)
├── loader.js              Reads data/terms/*.json, builds indexes
├── services/
│   ├── termService.js     Format a term for DNS output
│   ├── searchService.js   Category browse, keyword search, random, today
│   ├── helpService.js     Help text and command list
│   └── i18nService.js     Portuguese & Spanish localization
├── .env.example           Environment variable reference
├── package.json
├── .gitignore
└── README.md
```

---

## Data Source

Reads directly from the monorepo's `data/terms/*.json` — no `@stbr/solana-glossary` npm package required.

---

## License

MIT — See [LICENSE](../../LICENSE)
