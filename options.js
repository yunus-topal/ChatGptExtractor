document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const apiKey = document.getElementById('apiKey').value;
    const projectId = document.getElementById('projectId').value;
    
    chrome.storage.sync.set({ apiKey, projectId }, function() {
      document.getElementById('status').innerText = 'Settings saved successfully!';
      setTimeout(() => {
        document.getElementById('status').innerText = '';
      }, 2000);
    });
  });
  
  // Load existing settings when the options page loads.
  document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['apiKey', 'projectId'], function(items) {
      if (items.apiKey) {
        document.getElementById('apiKey').value = items.apiKey;
      }
      if (items.projectId) {
        document.getElementById('projectId').value = items.projectId;
      }
    });
  });
  