// Automatically open the options page when the extension is installed.
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.runtime.openOptionsPage();
    }
  });
  