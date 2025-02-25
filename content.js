// content.js

// Append custom CSS to the page so the extractor button and options menu stand out.
function addCustomStyles() {
  if (document.getElementById('extractor-style')) return;
  const style = document.createElement('style');
  style.id = 'extractor-style';
  style.textContent = `
    .extract-btn {
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      transition: background-color 0.3s ease;
      margin-left: 10px;
      cursor: pointer;
      position: relative;
    }
    .extract-btn:hover {
      background-color: #0056b3;
    }
    .extract-options {
      display: flex;
      flex-direction: column;
      position: absolute;
      background-color: #fff;
      border: 1px solid #ccc;
      padding: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 10000;
    }
    .extract-option-button {
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 14px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .extract-option-button:last-child {
      margin-bottom: 0;
    }
    .extract-option-button:hover {
      background-color: #0056b3;
    }
  `;
  document.head.appendChild(style);
}
  
// Extracts dialogue from ChatGPT while preserving the message order.
function extractChatGPTDialogue() {
  const dialogues = [];
  document.querySelectorAll('article').forEach(article => {
    // Check for user messages.
    const userElem = article.querySelector('.whitespace-pre-wrap');
    if (userElem) {
      dialogues.push({ role: 'user', text: userElem.innerText });
      return;
    }
    // Check for AI messages.
    const aiElem = article.querySelector('.markdown.prose.w-full.break-words');
    if (aiElem) {
      let messageText = '';
      aiElem.querySelectorAll('[data-start][data-end]').forEach(part => {
        messageText += part.innerText;
      });
      // Also capture images if any.
      const images = [];
      aiElem.querySelectorAll('img').forEach(img => {
        images.push({
          src: img.src,
          alt: img.alt || ''
        });
      });
      dialogues.push({ role: 'ai', text: messageText, images: images });
    }
  });
  return dialogues;
}
  
// Download the data as a JSON file.
function downloadJSON(data, filename = 'chatgpt-dialogue.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
  
// Helper: Convert an image URL to a base64-encoded string.
function convertImageToBase64(url) {
  return fetch(url)
    .then(response => response.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data prefix (e.g., "data:image/png;base64,")
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}
  
// Function to send conversation to backend using stored API key and project ID.
async function sendConversationToBackend() {
  // Retrieve API key and project ID from chrome storage.
  chrome.storage.sync.get(['apiKey', 'projectId'], async (items) => {
    const apiKey = items.apiKey;
    const projectId = items.projectId;
    if (!apiKey || !projectId) {
      alert("Warning: API Key or Project ID are missing. Please set them in the extension options.");
      return;
    }
    
    const dialogues = extractChatGPTDialogue();
    
    // Convert each dialogue into a BrowserPrompt record.
    const prompts = await Promise.all(dialogues.map(async (dialogue) => {
      let imageData = null;
      // If there are images in the dialogue, convert the first one.
      if (dialogue.images && dialogue.images.length > 0) {
        try {
          imageData = await convertImageToBase64(dialogue.images[0].src);
        } catch (e) {
          console.error("Error converting image:", e);
        }
      }
      return {
        role: dialogue.role,
        text: dialogue.text,
        image: imageData  // Base64 string or null if no image
      };
    }));
    
    // Build the BrowserConversation payload.
    const conversation = {
      projectId: projectId,
      imageUrl: null,                // Set to null or use a URL if available
      image: null,                     // Empty string representing no conversation-level image
      name: "ChatGPT Conversation",  // Customize as needed
      model: "ChatGPT",              // Customize as needed
      timestamp: new Date().toISOString(),
      prompts: prompts
    };
    
    const backendUrl = "https://localhost:7136/api/browserextension"; // Replace with your backend URL.
  
    fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(conversation)
    })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    })
    .then(data => {
      console.log("Conversation sent successfully:", data);
      alert("Conversation sent successfully!");
    })
    .catch(error => {
      console.error("Error sending conversation:", error);
      alert("Error sending conversation: " + error.message);
    });
  });
}
  
// Inject the extractor button next to the input field.
function injectExtractButton() {
  // Target the container that holds the input area.
  const inputContainer = document.querySelector('form .group.relative');
  if (!inputContainer) {
    return setTimeout(injectExtractButton, 1000);
  }
  // Ensure the container is positioned relatively for absolute positioning.
  inputContainer.style.position = 'relative';
  
  // Add custom styles.
  addCustomStyles();
  
  // Create the extractor button.
  const extractBtn = document.createElement('button');
  extractBtn.innerText = 'Extract Dialogue';
  extractBtn.classList.add('extract-btn');
  
  // Append the button so it appears next to the input field.
  inputContainer.appendChild(extractBtn);
  
  // When the extractor button is clicked, show options above it.
  extractBtn.addEventListener('click', (e) => {
    // Remove any existing options menu.
    const existingMenu = document.querySelector('.extract-options');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }
  
    // Create the options menu.
    const menu = document.createElement('div');
    menu.classList.add('extract-options');
  
    // Create JSON export option.
    const jsonBtn = document.createElement('button');
    jsonBtn.innerText = 'Export as JSON';
    jsonBtn.classList.add('extract-option-button');
    jsonBtn.addEventListener('click', () => {
      const dialogues = extractChatGPTDialogue();
      downloadJSON(dialogues);
      menu.remove();
    });
  
    // Create Send to Backend option.
    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send to Backend';
    sendBtn.classList.add('extract-option-button');
    sendBtn.addEventListener('click', () => {
      sendConversationToBackend();
      menu.remove();
    });
  
    menu.appendChild(jsonBtn);
    menu.appendChild(sendBtn);
  
    // Append the menu first with hidden visibility so we can measure its height.
    menu.style.visibility = 'hidden';
    inputContainer.appendChild(menu);
  
    // Now position the menu above the extractor button.
    const menuHeight = menu.offsetHeight;
    menu.style.top = (extractBtn.offsetTop - menuHeight - 5) + 'px';
    menu.style.left = extractBtn.offsetLeft + 'px';
    menu.style.visibility = 'visible';
  });
}
  
injectExtractButton();
