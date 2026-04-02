/**
 * Glossary Glance — highlights Solana glossary terms and shows tooltips.
 * Data: dist/glossary-bundle.json (run npm run build first)
 */

(function () {
  const ATTR = "data-sgl-id";
  const MARK_CLASS = "sgl-mark";
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "BUTTON",
    "NOSCRIPT",
    "MARK",
    "SVG",
    "CANVAS",
    "CODE",
    "PRE",
    "KBD",
    "SAMP",
  ]);

  let bundle = null;
  let settings = {
    enabled: true,
    locale: "en",
    skipCode: true,
    maxNodesPerPass: 15000,
  };

  let tooltipHost = null;
  let tooltipEl = null;
  let hideTimer = null;

  function getStorage() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["enabled", "locale", "skipCode", "maxNodesPerPass"],
        (r) => resolve({ ...settings, ...r })
      );
    });
  }

  function normalizeLocale() {
    const l = (settings.locale || "en").toLowerCase();
    if (l.startsWith("pt")) return "pt";
    if (l.startsWith("es")) return "es";
    return "en";
  }

  function resolveTerm(id) {
    const t = bundle.terms[id];
    if (!t) return null;
    const loc = normalizeLocale();
    const ov =
      loc !== "en" && bundle.i18n?.[loc]?.[id]
        ? bundle.i18n[loc][id]
        : null;
    return {
      id,
      term: ov?.term ?? t.term,
      definition: ov?.definition ?? t.definition,
      category: t.category,
      related: t.related ?? [],
    };
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isBoundary(left, right) {
    const re = /[\p{L}\p{N}]/u;
    return (!left || !re.test(left)) && (!right || !re.test(right));
  }

  /** Index phrases by first char (lowercase) for faster scan */
  function buildPhraseIndex(phrases) {
    const maxLen = Math.max(...phrases.map((p) => p.phrase.length), 1);
    const byFirst = new Map();
    for (const { phrase, id } of phrases) {
      if (phrase.length < 2) continue;
      const first = phrase[0].toLowerCase();
      if (!byFirst.has(first)) byFirst.set(first, []);
      byFirst.get(first).push({ phrase, id, sortKey: phrase.length });
    }
    for (const [, arr] of byFirst) {
      arr.sort((a, b) => b.sortKey - a.sortKey);
    }
    return { byFirst, maxLen };
  }

  function matchPhraseAt(text, i, phrase) {
    if (i + phrase.length > text.length) return false;
    for (let k = 0; k < phrase.length; k++) {
      const a = text[i + k];
      const b = phrase[k];
      if (a === undefined) return false;
      if (a.toLowerCase() !== b.toLowerCase()) return false;
    }
    return true;
  }

  /**
   * Multi-word phrase with any run of whitespace between tokens (Markdown tables, etc.)
   */
  function matchSpacedPhraseLen(text, i, phrase) {
    const parts = phrase.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    let j = i;
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      if (!matchPhraseAt(text, j, part)) return null;
      j += part.length;
      if (p < parts.length - 1) {
        if (j >= text.length || !/\s/.test(text[j])) return null;
        while (j < text.length && /\s/.test(text[j])) j++;
      }
    }
    return j - i;
  }

  function matchLengthAt(text, i, phrase) {
    if (phrase.includes(" ")) {
      return matchSpacedPhraseLen(text, i, phrase);
    }
    if (!matchPhraseAt(text, i, phrase)) return null;
    return phrase.length;
  }

  /**
   * Find longest matching phrase at index i (phrases already longest-first per bucket)
   */
  function findAt(text, i, index) {
    const c = text[i].toLowerCase();
    const bucket = index.byFirst.get(c);
    if (!bucket) return null;
    const left = i > 0 ? text[i - 1] : "";
    for (const { phrase, id } of bucket) {
      const len = matchLengthAt(text, i, phrase);
      if (len == null) continue;
      const right = i + len < text.length ? text[i + len] : "";
      if (!isBoundary(left, right)) continue;
      return { id, len, phrase };
    }
    return null;
  }

  function highlightText(text, index) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      const m = findAt(text, i, index);
      if (m) {
        out.push({ type: "hit", id: m.id, text: text.slice(i, i + m.len) });
        i += m.len;
      } else {
        const start = i;
        i++;
        while (i < text.length && !findAt(text, i, index)) {
          i++;
        }
        out.push({ type: "plain", text: text.slice(start, i) });
      }
    }
    return out;
  }

  function shouldSkipNode(el) {
    if (!settings.skipCode) return false;
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const tag = cur.tagName;
      if (tag === "CODE" || tag === "PRE" || tag === "KBD" || tag === "SAMP")
        return true;
      cur = cur.parentElement;
    }
    return false;
  }

  /** True if any ancestor should not be scanned (code blocks, our marks, etc.) */
  function shouldRejectTextNodeParent(parentEl) {
    if (!parentEl) return true;
    if (parentEl.closest(`mark.${MARK_CLASS}`)) return true;
    let cur = parentEl;
    while (cur && cur !== document.documentElement) {
      if (SKIP_TAGS.has(cur.tagName)) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  function processTextNode(node, index, budget) {
    if (budget.count > settings.maxNodesPerPass) return;
    const text = node.nodeValue;
    if (!text || text.length < 2) return;
    const parent = node.parentNode;
    if (!parent || parent.isContentEditable) return;
    if (shouldSkipNode(parent)) return;

    budget.count++;
    const parts = highlightText(text, index);
    const hasHit = parts.some((p) => p.type === "hit");
    if (!hasHit) return;

    const frag = document.createDocumentFragment();
    for (const p of parts) {
      if (p.type === "plain") {
        frag.appendChild(document.createTextNode(p.text));
      } else {
        const mark = document.createElement("mark");
        mark.className = MARK_CLASS;
        mark.setAttribute(ATTR, p.id);
        mark.textContent = p.text;
        frag.appendChild(mark);
      }
    }
    parent.replaceChild(frag, node);
  }

  function walkAndHighlight(root, index) {
    const budget = { count: 0 };
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const p = node.parentElement;
          if (shouldRejectTextNodeParent(p)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      nodes.push(n);
    }
    for (const node of nodes) {
      processTextNode(node, index, budget);
    }
  }

  function ensureTooltip() {
    if (tooltipHost) return;
    tooltipHost = document.createElement("div");
    tooltipHost.id = "sgl-tooltip-host";
    document.documentElement.appendChild(tooltipHost);
    tooltipEl = document.createElement("div");
    tooltipEl.className = "sgl-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipHost.appendChild(tooltipEl);
  }

  function positionTooltip(rect) {
    if (!tooltipHost || !tooltipEl) return;
    const pad = 8;
    tooltipHost.style.left = "0";
    tooltipHost.style.top = "0";
    tooltipEl.style.visibility = "hidden";
    tooltipHost.style.left = "0";
    tooltipHost.style.top = "0";
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    let x = rect.left + rect.width / 2 - tw / 2;
    let y = rect.top - th - pad;
    if (y < 4) y = rect.bottom + pad;
    x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - th - 8));
    tooltipHost.style.left = `${x}px`;
    tooltipHost.style.top = `${y}px`;
    tooltipEl.style.visibility = "visible";
  }

  function showTooltip(mark) {
    const id = mark.getAttribute(ATTR);
    const t = resolveTerm(id);
    if (!t || !t.definition) return;
    ensureTooltip();
    const rel =
      t.related
        ?.slice(0, 4)
        .map((rid) => bundle.terms[rid]?.term || rid)
        .filter(Boolean)
        .join(" · ") || "";
    tooltipEl.innerHTML = `
      <div class="sgl-tooltip__cat">${escapeHtml(t.category.replace(/-/g, " "))}</div>
      <div class="sgl-tooltip__title">${escapeHtml(t.term)}</div>
      <p class="sgl-tooltip__def">${escapeHtml(t.definition)}</p>
      ${
        rel
          ? `<div class="sgl-tooltip__foot">Related: ${escapeHtml(rel)}</div>`
          : ""
      }
      <div class="sgl-tooltip__foot"><a href="https://github.com/solanabr/solana-glossary" target="_blank" rel="noreferrer">Solana Glossary</a> · ST Brasil</div>
    `;
    mark.classList.add("sgl-mark--active");
    positionTooltip(mark.getBoundingClientRect());
    tooltipHost.style.opacity = "1";
  }

  function hideTooltip() {
    document.querySelectorAll(`.${MARK_CLASS}.sgl-mark--active`).forEach((m) => {
      m.classList.remove("sgl-mark--active");
    });
    if (tooltipHost) tooltipHost.style.opacity = "0";
  }

  function onPointerOver(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const mark = t.closest(`mark.${MARK_CLASS}`);
    if (!mark) {
      hideTooltip();
      return;
    }
    clearTimeout(hideTimer);
    showTooltip(mark);
  }

  function onPointerOut(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const mark = t.closest(`mark.${MARK_CLASS}`);
    if (!mark) return;
    hideTimer = setTimeout(hideTooltip, 120);
  }

  function attachListeners() {
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
  }

  async function loadBundle() {
    const url = chrome.runtime.getURL("dist/glossary-bundle.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error("glossary bundle missing — run npm run build");
    return res.json();
  }

  async function run() {
    settings = await getStorage();
    if (!settings.enabled) return;

    try {
      bundle = await loadBundle();
    } catch (e) {
      console.warn("[Glossary Glance]", e);
      return;
    }

    const index = buildPhraseIndex(bundle.matchPhrases);
    walkAndHighlight(document.body, index);
    attachListeners();

    const obs = new MutationObserver((muts) => {
      if (!settings.enabled) return;
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            walkAndHighlight(node, index);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            const budget = { count: 0 };
            processTextNode(node, index, budget);
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled) {
      location.reload();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
