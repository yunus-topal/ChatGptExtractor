document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const apiKey = document.getElementById('apiKey').value;
    
    chrome.storage.sync.set({ apiKey }, function() {
      document.getElementById('status').innerText = 'Settings saved successfully!';
      setTimeout(() => {
        document.getElementById('status').innerText = '';
      }, 2000);
    });
  });
  
  // Load existing settings when the options page loads.
  document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['apiKey'], function(items) {
      if (items.apiKey) {
        document.getElementById('apiKey').value = items.apiKey;
      }
    });
  });
  