// content.js
// import sending, injectors and extractors functions

// Track when the user starts being active
let activeStart = Date.now();
// Accumulate total active time (in milliseconds)
let totalActiveTime = 0;

// Listen for visibility changes on the document
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // When the tab becomes hidden, record the time spent during this active period
    totalActiveTime += Date.now() - activeStart;
  } else {
    // When the tab becomes visible again, restart the timer
    activeStart = Date.now();
  }
});

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


// Initial attempt to inject button
function initialize() {
  // Try immediate injection
  detectPlatformAndInject();
  
  // Set up observer for future DOM changes
  const observer = setupMutationObserver();
  
  // Also try at intervals for the first 10 seconds
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (attempts >= maxAttempts || document.querySelector('.extract-btn')) {
      clearInterval(interval);
    } else {
      detectPlatformAndInject();
    }
  }, 500);
  
  // Add window event listeners
  window.addEventListener('load', detectPlatformAndInject);
  window.addEventListener('DOMContentLoaded', detectPlatformAndInject);
  window.addEventListener('hashchange', detectPlatformAndInject);
  window.addEventListener('popstate', detectPlatformAndInject);

  setupAutoSave();
}

// Wait for the page to fully load and settle
function waitForPageToSettle() {
  return new Promise(resolve => {
    // First wait for load event
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        // After load, wait a bit more for JS frameworks to initialize
        setTimeout(resolve, 1500);
      });
    } else {
      // If already loaded, just wait a bit for JS frameworks
      setTimeout(resolve, 1500);
    }
  });
}

// Check if we're on a chat page
function isChatPage() {
  const url = window.location.href;
  
  // ChatGPT: any page on chat.openai.com is likely a chat page
  if (url.includes('chatgpt.com') && url.includes('/c/')) {
    return true;
  }
  
  // Claude: check for chat in the URL
  if (url.includes('claude.ai') && (url.includes('/chat') || url.includes('/c/'))) {
    return true;
  }
  
  // DeepSeek: check for chat in the URL
  if ((url.includes('chat.deepseek.com') || url.includes('deepseek.ai')) && 
      (url.includes('/chat') || url.includes('/a/') || url.includes('/s/'))) {
    return true;
  }

  // Gemini: check for chat in the URL
  if (url.includes('gemini.google.com')) {
    return true;
  }
  
  // If we can find chat UI elements, we're probably on a chat page
  const chatUIElements = document.querySelector(
    // ChatGPT chat elements
    'form .group.relative, .flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4, ' +
    // Claude chat elements
    'fieldset.flex.w-full.min-w-0.flex-col-reverse, div[data-testid="input-container"], ' +
    // DeepSeek chat elements
    'div.fad49dec, .textarea-container, .input-container'
  );
  
  return !!chatUIElements;
}

// Main entry point - add this to replace your current initialize function
async function enhancedInitialize() {
  // Wait for page to be fully loaded and settled
  await waitForPageToSettle();
  
  // Check if we're on a relevant chat page
  if (!isChatPage()) {
    // If not on a chat page yet, set up an observer to detect navigation to chat pages
    const observer = new MutationObserver((mutations, obs) => {
      if (isChatPage()) {
        console.log("Chat page detected, initializing extractor...");
        initialize(); // Your original initialize function
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also check periodically
    const intervalCheck = setInterval(() => {
      if (isChatPage()) {
        console.log("Chat page detected on interval check, initializing extractor...");
        initialize();
        clearInterval(intervalCheck);
      }
    }, 2000);
    
    return;
  }
  
  // If we are on a chat page, proceed with normal initialization
  console.log("On chat page, initializing extractor immediately...");
  initialize(); // Your original initialize function
}

// Declare this at the top of your script (or module)
const handledInputs = new WeakSet();

function setupAutoSave() {
  console.log("auto save setup");
  
  const handleKeyDown = (e) => {
    // Optional: Prevent repeated events from holding down the key
    if (e.repeat) return;

    if (e.key === "Enter" && !e.shiftKey) {
      console.log("enter pressed. sending conversation to backend");
      setTimeout(() => {
        chrome.storage.sync.get(["autoSaveEnabled"], (result) => {
          console.log("Auto-save enabled:", result.autoSaveEnabled);
          if (result.autoSaveEnabled) {
            sendConversationToBackend(true);
          }
        });
      }, 100);
    }
  };

  const addListenerIfExists = (element) => {
    if (!element || handledInputs.has(element)) return;
    element.addEventListener("keydown", handleKeyDown);
    handledInputs.add(element);
  };

  // Finding and adding listeners to the different chat inputs
  const chatGPTInput = document.getElementById('prompt-textarea');
  addListenerIfExists(chatGPTInput);

  const deepseekInput = document.getElementById('chat-input');
  addListenerIfExists(deepseekInput);

  const claudeInput = document.querySelector('[aria-label="Write your prompt to Claude"] [contenteditable="true"]');
  addListenerIfExists(claudeInput);

  const geminiInput = document.querySelector('.ql-editor.textarea[contenteditable="true"]');
  addListenerIfExists(geminiInput);
}




// Start the enhanced initialization process
enhancedInitialize();