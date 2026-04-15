const DEFAULTS = { maxNodesPerPass: 15000 };

function load() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["maxNodesPerPass"], (r) => {
      resolve({ ...DEFAULTS, ...r });
    });
  });
}

function save(patch) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(patch, resolve);
  });
}

async function init() {
  const s = await load();
  const maxNodes = document.getElementById("maxNodes");
  const status = document.getElementById("status");
  maxNodes.value = String(s.maxNodesPerPass ?? DEFAULTS.maxNodesPerPass);

  maxNodes.addEventListener("change", async () => {
    const v = Math.max(1000, Math.min(100000, parseInt(maxNodes.value, 10) || DEFAULTS.maxNodesPerPass));
    maxNodes.value = String(v);
    await save({ maxNodesPerPass: v });
    status.textContent = "Saved.";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  });
}

init();
