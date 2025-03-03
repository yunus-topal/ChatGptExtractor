// popup.js
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("autoSaveToggle").addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  chrome.storage.sync.set({ autoSaveEnabled: isChecked });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["autoSaveEnabled", "apiKey"], (result) => {
    document.getElementById("autoSaveToggle").checked = result.autoSaveEnabled || false;
    if (!result.apiKey) {
      document.getElementById("warning").style.display = "block";
    }
  });
});
