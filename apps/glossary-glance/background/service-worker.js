/**
 * MV3 background — keeps service worker alive for install message only.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      enabled: true,
      locale: "en",
      skipCode: true,
      maxNodesPerPass: 15000,
    });
  }
});
