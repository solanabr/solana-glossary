/**
 * Solana Glossary Embeddable Widget
 *
 * Usage:
 *   <script src="widget.js"></script>
 *   <script>SolanaGlossary.init({ theme: 'dark' })</script>
 *
 * Or auto-init via data attributes:
 *   <script src="widget.js" data-auto data-theme="dark"></script>
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WidgetConfig {
  theme?: "dark" | "light" | "auto";
  locale?: "en" | "pt" | "es";
  highlight?: boolean;
  position?: "bottom" | "top" | "cursor";
  exclude?: string[];
  maxTerms?: number;
  onTermClick?: (term: TermEntry) => void;
}

interface TermEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  related?: string[];
}

// ─── Embedded term data (top 200 most important terms) ──────────────────────
// In production this would fetch from API; for now we embed a curated subset.

const MCP_ENDPOINT =
  "https://solana-glossary-production-5f40.up.railway.app/mcp";

let _termsCache: TermEntry[] | null = null;
let _termMap: Map<string, TermEntry> | null = null;
let _scanPatterns: { pattern: RegExp; termId: string }[] = [];

async function loadTerms(): Promise<TermEntry[]> {
  if (_termsCache) return _termsCache;

  try {
    // Try loading from MCP server
    const res = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "glossary_stats",
          arguments: {},
        },
      }),
    });

    if (!res.ok) throw new Error("MCP request failed");

    // For the widget, we'll use the search endpoint to get terms
    // But actually, let's use a simpler approach - load from the glossary data
  } catch {
    // Fallback: use embedded terms
  }

  // Embedded essential terms for offline/fallback usage
  _termsCache = EMBEDDED_TERMS;
  _termMap = new Map(_termsCache.map((t) => [t.id, t]));

  // Build scan patterns
  _scanPatterns = [];
  for (const term of _termsCache) {
    // Match term name and aliases (case-insensitive, word boundaries)
    const names = [term.term, ...(term.aliases ?? [])];
    for (const name of names) {
      if (name.length < 3) continue; // Skip very short aliases
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      _scanPatterns.push({
        pattern: new RegExp(`\\b${escaped}\\b`, "gi"),
        termId: term.id,
      });
    }
  }

  // Sort by pattern length (longest first for greedy matching)
  _scanPatterns.sort(
    (a, b) => b.pattern.source.length - a.pattern.source.length,
  );

  return _termsCache;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function injectStyles(theme: "dark" | "light") {
  const isDark = theme === "dark";
  const id = "solana-glossary-widget-styles";

  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .sg-term {
      text-decoration: underline;
      text-decoration-style: dotted;
      text-decoration-color: ${isDark ? "rgba(153,69,255,0.5)" : "rgba(153,69,255,0.4)"};
      text-underline-offset: 3px;
      cursor: help;
      transition: text-decoration-color 0.2s;
    }
    .sg-term:hover {
      text-decoration-color: ${isDark ? "#14F195" : "#9945FF"};
    }
    .sg-tooltip {
      position: fixed;
      z-index: 999999;
      max-width: 360px;
      padding: 16px;
      border-radius: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.15s, transform 0.15s;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      background: ${isDark ? "rgba(15,15,20,0.96)" : "rgba(255,255,255,0.98)"};
      color: ${isDark ? "#e2e2e2" : "#1a1a2e"};
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .sg-tooltip.sg-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .sg-tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .sg-tooltip-term {
      font-weight: 700;
      font-size: 15px;
      color: ${isDark ? "#fff" : "#1a1a2e"};
    }
    .sg-tooltip-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(153,69,255,0.15);
      color: #9945FF;
    }
    .sg-tooltip-def {
      color: ${isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)"};
      margin: 0;
    }
    .sg-tooltip-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
    }
    .sg-tooltip-brand {
      font-size: 10px;
      font-weight: 600;
      background: linear-gradient(135deg, #9945FF, #14F195);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sg-tooltip-aliases {
      font-size: 11px;
      color: ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"};
    }
  `;
  document.head.appendChild(style);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

let tooltipEl: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

function getTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.className = "sg-tooltip";
  tooltipEl.addEventListener("mouseenter", () => {
    if (hideTimeout) clearTimeout(hideTimeout);
  });
  tooltipEl.addEventListener("mouseleave", () => {
    hideTooltip();
  });
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function showTooltip(
  term: TermEntry,
  rect: DOMRect,
  position: "bottom" | "top" | "cursor",
) {
  if (hideTimeout) clearTimeout(hideTimeout);

  const tip = getTooltip();

  const aliases =
    term.aliases && term.aliases.length > 0
      ? `<span class="sg-tooltip-aliases">${term.aliases.join(", ")}</span>`
      : "";

  tip.innerHTML = `
    <div class="sg-tooltip-header">
      <span class="sg-tooltip-term">${escapeHtml(term.term)}</span>
      <span class="sg-tooltip-badge">${escapeHtml(term.category)}</span>
    </div>
    ${aliases}
    <p class="sg-tooltip-def">${escapeHtml(term.definition)}</p>
    <div class="sg-tooltip-footer">
      <span class="sg-tooltip-brand">solexicon</span>
    </div>
  `;

  // Position
  const tipWidth = 360;
  let left = rect.left + rect.width / 2 - tipWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));

  let top: number;
  if (position === "top") {
    top = rect.top - 8;
    tip.style.transform = "translateY(-100%)";
  } else {
    top = rect.bottom + 8;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.style.width = `${tipWidth}px`;

  // Force reflow then show
  tip.offsetHeight;
  tip.classList.add("sg-visible");
}

function hideTooltip() {
  hideTimeout = setTimeout(() => {
    tooltipEl?.classList.remove("sg-visible");
  }, 150);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── DOM Scanner ─────────────────────────────────────────────────────────────

function scanAndHighlight(
  root: Element,
  config: Required<WidgetConfig>,
): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // Skip script, style, and already-processed elements
      const tag = parent.tagName.toLowerCase();
      if (
        tag === "script" ||
        tag === "style" ||
        tag === "textarea" ||
        tag === "input" ||
        tag === "code" ||
        tag === "pre"
      )
        return NodeFilter.FILTER_REJECT;

      if (parent.classList.contains("sg-term")) return NodeFilter.FILTER_REJECT;

      // Skip excluded selectors
      for (const selector of config.exclude) {
        if (parent.closest(selector)) return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  let count = 0;
  const matched = new Set<string>();

  for (const textNode of textNodes) {
    if (count >= config.maxTerms) break;

    const text = textNode.textContent ?? "";
    if (text.trim().length < 3) continue;

    for (const { pattern, termId } of _scanPatterns) {
      if (count >= config.maxTerms) break;
      if (matched.has(termId)) continue; // One highlight per term

      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (!match) continue;

      const term = _termMap?.get(termId);
      if (!term) continue;

      matched.add(termId);
      count++;

      // Split text node and wrap match
      const before = text.slice(0, match.index);
      const matchText = match[0];
      const after = text.slice(match.index + matchText.length);

      const span = document.createElement("span");
      span.className = "sg-term";
      span.textContent = matchText;
      span.dataset.termId = termId;

      span.addEventListener("mouseenter", () => {
        const rect = span.getBoundingClientRect();
        showTooltip(term, rect, config.position);
      });

      span.addEventListener("mouseleave", () => {
        hideTooltip();
      });

      span.addEventListener("click", () => {
        config.onTermClick(term);
      });

      const parent = textNode.parentNode;
      if (!parent) continue;

      if (before)
        parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(span, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);

      break; // Only process first match per text node
    }
  }

  return count;
}

// ─── Public API ──────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<WidgetConfig> = {
  theme: "dark",
  locale: "en",
  highlight: true,
  position: "bottom",
  exclude: [".no-glossary", ".sg-tooltip"],
  maxTerms: 100,
  onTermClick: (term) => {
    window.open(
      `https://github.com/solanabr/solana-glossary#${term.id}`,
      "_blank",
    );
  },
};

let _initialized = false;

export async function init(userConfig: WidgetConfig = {}): Promise<number> {
  if (_initialized) {
    console.warn("[SolanaGlossary] Already initialized");
    return 0;
  }

  const config: Required<WidgetConfig> = { ...DEFAULT_CONFIG, ...userConfig };

  // Resolve auto theme
  if (config.theme === ("auto" as string)) {
    config.theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // Load terms
  await loadTerms();

  // Inject styles
  injectStyles(config.theme);

  // Scan page
  let count = 0;
  if (config.highlight) {
    count = scanAndHighlight(document.body, config);
  }

  _initialized = true;
  console.log(`[SolanaGlossary] Initialized — ${count} terms highlighted`);
  return count;
}

export function destroy(): void {
  // Remove all highlights
  document.querySelectorAll(".sg-term").forEach((el) => {
    const text = el.textContent ?? "";
    el.replaceWith(document.createTextNode(text));
  });

  // Remove tooltip
  tooltipEl?.remove();
  tooltipEl = null;

  // Remove styles
  document.getElementById("solana-glossary-widget-styles")?.remove();

  _initialized = false;
}

// ─── Auto-init from script tag ───────────────────────────────────────────────

if (typeof document !== "undefined") {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script?.hasAttribute("data-auto")) {
    const config: WidgetConfig = {};
    if (script.dataset.theme)
      config.theme = script.dataset.theme as WidgetConfig["theme"];
    if (script.dataset.locale)
      config.locale = script.dataset.locale as WidgetConfig["locale"];
    if (script.dataset.position)
      config.position = script.dataset.position as WidgetConfig["position"];

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(config));
    } else {
      init(config);
    }
  }
}

// ─── Embedded Terms (curated subset) ─────────────────────────────────────────

const EMBEDDED_TERMS: TermEntry[] = [
  {
    id: "solana",
    term: "Solana",
    definition:
      "A high-performance layer-1 blockchain designed for mass adoption, achieving high throughput through innovations like Proof of History and parallel transaction processing via Sealevel.",
    category: "core-protocol",
    aliases: ["SOL"],
  },
  {
    id: "proof-of-history",
    term: "Proof of History",
    definition:
      "A cryptographic clock that creates a historical record proving that an event occurred at a specific moment in time, enabling Solana validators to agree on time ordering without communication overhead.",
    category: "core-protocol",
    aliases: ["PoH"],
  },
  {
    id: "program",
    term: "Program",
    definition:
      "Executable code deployed on the Solana blockchain that processes instructions. Equivalent to smart contracts on other chains, programs are stateless and store data in separate accounts.",
    category: "programming-model",
  },
  {
    id: "account",
    term: "Account",
    definition:
      "A record in the Solana ledger that can hold data and/or SOL. Everything on Solana is stored in accounts, including programs, tokens, and user data.",
    category: "programming-model",
  },
  {
    id: "program-derived-address",
    term: "Program Derived Address",
    definition:
      "A public key deterministically derived from a program ID and a set of seeds. PDAs are not on the ed25519 curve, meaning no private key exists and only the program can sign for them.",
    category: "programming-model",
    aliases: ["PDA"],
  },
  {
    id: "transaction",
    term: "Transaction",
    definition:
      "An atomic unit of execution on Solana containing one or more instructions signed by required authorities. Transactions are processed in parallel when they don't conflict.",
    category: "core-protocol",
    aliases: ["tx"],
  },
  {
    id: "instruction",
    term: "Instruction",
    definition:
      "A single operation within a transaction that specifies a program to invoke, the accounts to pass, and serialized input data. Multiple instructions can be composed in one transaction.",
    category: "programming-model",
    aliases: ["ix"],
  },
  {
    id: "validator",
    term: "Validator",
    definition:
      "A node that validates transactions, produces blocks, and participates in consensus. Validators earn rewards through staking and vote on the validity of blocks.",
    category: "core-protocol",
  },
  {
    id: "slot",
    term: "Slot",
    definition:
      "A time window (~400ms) during which a designated leader validator can produce a block. Slots are the basic unit of time in Solana.",
    category: "core-protocol",
  },
  {
    id: "epoch",
    term: "Epoch",
    definition:
      "A period of approximately 2-3 days (~432,000 slots) after which the leader schedule rotates. Stake delegations and rewards are calculated at epoch boundaries.",
    category: "core-protocol",
  },
  {
    id: "lamport",
    term: "Lamport",
    definition:
      "The smallest unit of SOL (1 SOL = 1,000,000,000 lamports). Named after Leslie Lamport, whose research on distributed systems influenced Solana's design.",
    category: "core-protocol",
  },
  {
    id: "anchor-framework",
    term: "Anchor Framework",
    definition:
      "The most popular development framework for Solana programs, providing a Rust eDSL with macros for account validation, serialization, and common security checks.",
    category: "dev-tools",
    aliases: ["Anchor"],
  },
  {
    id: "spl-token",
    term: "SPL Token",
    definition:
      "The standard token program on Solana that enables creation and management of fungible tokens. Equivalent to ERC-20 on Ethereum.",
    category: "token-ecosystem",
    aliases: ["SPL"],
  },
  {
    id: "token-2022",
    term: "Token-2022",
    definition:
      "An enhanced token program with built-in extensions like transfer fees, confidential transfers, interest-bearing tokens, and metadata support.",
    category: "token-ecosystem",
    aliases: ["Token Extensions"],
  },
  {
    id: "non-fungible-token",
    term: "Non-Fungible Token",
    definition:
      "A unique digital asset on the blockchain representing ownership of items like art, collectibles, or in-game items. On Solana, NFTs are typically SPL tokens with supply of 1.",
    category: "token-ecosystem",
    aliases: ["NFT"],
  },
  {
    id: "decentralized-finance",
    term: "Decentralized Finance",
    definition:
      "Financial services built on blockchain without traditional intermediaries. Includes lending, borrowing, trading, and yield generation protocols.",
    category: "defi",
    aliases: ["DeFi"],
  },
  {
    id: "automated-market-maker",
    term: "Automated Market Maker",
    definition:
      "A decentralized exchange mechanism that uses mathematical formulas (like constant product) to determine asset prices and enable trading without order books.",
    category: "defi",
    aliases: ["AMM"],
  },
  {
    id: "jupiter",
    term: "Jupiter",
    definition:
      "The leading DEX aggregator on Solana that finds the best swap routes across all liquidity sources, including limit orders and DCA features.",
    category: "solana-ecosystem",
  },
  {
    id: "rpc",
    term: "RPC",
    definition:
      "Remote Procedure Call interface that allows applications to interact with the Solana blockchain by sending transactions and querying state.",
    category: "infrastructure",
    aliases: ["JSON-RPC"],
  },
  {
    id: "cross-program-invocation",
    term: "Cross-Program Invocation",
    definition:
      "The mechanism by which one Solana program calls another program's instruction. Enables composability between programs on the runtime level.",
    category: "programming-model",
    aliases: ["CPI"],
  },
  {
    id: "rent",
    term: "Rent",
    definition:
      "A fee charged for storing data on the Solana ledger. Accounts must maintain a minimum balance (rent-exempt threshold) to persist without being garbage collected.",
    category: "programming-model",
  },
  {
    id: "staking",
    term: "Staking",
    definition:
      "The process of delegating SOL to a validator to help secure the network and earn rewards. Stakers receive a share of inflation rewards proportional to their stake.",
    category: "infrastructure",
  },
  {
    id: "mev",
    term: "MEV",
    definition:
      "Maximum Extractable Value — the profit validators or searchers can extract by reordering, inserting, or censoring transactions within a block.",
    category: "defi",
    aliases: ["Maximal Extractable Value"],
  },
  {
    id: "metaplex",
    term: "Metaplex",
    definition:
      "The leading NFT standard and tooling provider on Solana, offering programs for minting, selling, and managing digital assets and collections.",
    category: "solana-ecosystem",
  },
  {
    id: "ai-agent",
    term: "AI Agent",
    definition:
      "An autonomous software program that uses artificial intelligence to perform tasks, make decisions, and interact with blockchain protocols without constant human supervision.",
    category: "ai-ml",
  },
  {
    id: "liquid-staking",
    term: "Liquid Staking",
    definition:
      "A mechanism that allows users to stake their SOL while receiving a liquid derivative token (like mSOL, jitoSOL) that can be used in DeFi protocols.",
    category: "defi",
  },
  {
    id: "compressed-nft",
    term: "Compressed NFT",
    definition:
      "NFTs stored using state compression with Merkle trees, reducing minting costs by up to 99.9% compared to traditional NFTs.",
    category: "token-ecosystem",
    aliases: ["cNFT"],
  },
  {
    id: "jito",
    term: "Jito",
    definition:
      "A liquid staking protocol and MEV infrastructure provider on Solana that distributes MEV rewards to stakers through JitoSOL.",
    category: "solana-ecosystem",
  },
  {
    id: "depin",
    term: "DePIN",
    definition:
      "Decentralized Physical Infrastructure Networks — blockchain-based systems that incentivize building and maintaining real-world infrastructure like wireless networks, computing, and energy grids.",
    category: "ai-ml",
    aliases: ["Decentralized Physical Infrastructure"],
  },
  {
    id: "wallet",
    term: "Wallet",
    definition:
      "Software or hardware that manages cryptographic keys and enables users to sign transactions and interact with the blockchain. Common Solana wallets include Phantom, Solflare, and Backpack.",
    category: "web3",
  },
];
