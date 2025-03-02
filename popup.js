// popup.js
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("autoSaveToggle").addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  chrome.storage.sync.set({ autoSaveEnabled: isChecked });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["autoSaveEnabled", "projectId", "apiKey"], (result) => {
    document.getElementById("autoSaveToggle").checked = result.autoSaveEnabled || false;
    if (!result.projectId || !result.apiKey) {
      document.getElementById("warning").style.display = "block";
    }
  });
});
