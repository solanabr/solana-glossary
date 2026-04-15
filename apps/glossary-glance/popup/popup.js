const DEFAULTS = {
  enabled: true,
  locale: "en",
  skipCode: true,
  maxNodesPerPass: 15000,
};

function load() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(Object.keys(DEFAULTS), (r) => {
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
  const enabled = document.getElementById("enabled");
  const locale = document.getElementById("locale");
  const skipCode = document.getElementById("skipCode");

  enabled.checked = !!s.enabled;
  locale.value = s.locale || "en";
  skipCode.checked = s.skipCode !== false;

  enabled.addEventListener("change", () => save({ enabled: enabled.checked }));
  locale.addEventListener("change", () => save({ locale: locale.value }));
  skipCode.addEventListener("change", () => save({ skipCode: skipCode.checked }));

  document.getElementById("openOptions").addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
  });
}

init();
