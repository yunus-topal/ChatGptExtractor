// content.js

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
  
//-------------------------------Dialogues Extraction--------------------------------
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

function extractClaudeDialogue() {
  // Select the conversation container (adjust the selector if needed)
  const container = document.querySelector('div.flex-1.flex.flex-col.gap-3.px-4.max-w-3xl.mx-auto.w-full.pt-1');
  if (!container) {
    console.error('Conversation container not found.');
    return [];
  }

  const dialogues = [];

  // Loop over each direct child of the container to preserve message order.
  Array.from(container.children).forEach(child => {
    // Check for a user message element
    const userMsgElement = child.querySelector('[data-testid="user-message"]');
    if (userMsgElement) {
      dialogues.push({
        role: 'user',
        text: userMsgElement.innerText.trim()
      });
      return; // Proceed to next child
    }

    // Check for an AI message element (Claude's message)
    const aiMsgElement = child.querySelector('.font-claude-message');
    if (aiMsgElement) {
      dialogues.push({
        role: 'ai', // Using "ai" instead of "claude" for the role
        text: aiMsgElement.innerText.trim()
      });
      return;
    }
  });

  return dialogues;
}

function extractDeepseekDialogue() {
  const dialogues = [];
  // Each conversation turn is assumed to be wrapped in a div with class "dad65929".
  const turns = document.querySelectorAll('div.dad65929');
  
  turns.forEach(turn => {
    // Extract the user message from the element with class "fbb737a4"
    const userElem = turn.querySelector('div.fbb737a4');
    if (userElem) {
      // Often the text is mixed with icon button elements.
      // We can loop through the child nodes and only capture text nodes.
      let userText = '';
      userElem.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          userText += node.textContent;
        }
      });
      dialogues.push({ role: 'user', text: userText.trim() });
    }
    
    // Extract the AI message from the element with class "ds-markdown ds-markdown--block"
    const aiElem = turn.querySelector('div.ds-markdown.ds-markdown--block');
    if (aiElem) {
      dialogues.push({ role: 'ai', text: aiElem.innerText.trim() });
    }
  });
  
  return dialogues;
}

function extractConversationId() {
  try {
    const url = window.location.href;
    const parsedUrl = new URL(url);
    // Split the pathname into segments and filter out empty parts.
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    // return the last segment.
    return pathSegments[pathSegments.length - 1];
  } catch (error) {
    console.error("Invalid URL provided:", url, error);
    return null;
  }
}
//-------------------------------Dialogues Extraction--------------------------------  

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
    const chatId = extractConversationId();

    // If the document is visible when sending the request, add the current active period
    const currentActiveTime = document.hidden ? 0 : Date.now() - activeStart;
    const totalTimeInSeconds = (totalActiveTime + currentActiveTime) / 1000;
    
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
      chatId: chatId,
      projectId: projectId,
      imageUrl: null,                // Set to null or use a URL if available
      image: null,                     // Empty string representing no conversation-level image
      name: "ChatGPT Conversation",  // Customize as needed
      model: "ChatGPT",              // Customize as needed
      timestamp: new Date().toISOString(),
      time: totalTimeInSeconds,         // Total active time in milliseconds
      prompts: prompts
    };
    
    const backendUrl = "https://hai.edu.sot.tum.de/api/browserextension"; // Replace with your backend URL.
  
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
  
//---------------------------------Menu Creation-------------------------------------
function createOptionsMenu(parentElement, extractBtn, extractFunction) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.extract-options');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }
  
  // Create options menu
  const menu = document.createElement('div');
  menu.classList.add('extract-options');
  
  // JSON export option
  const jsonBtn = document.createElement('button');
  jsonBtn.innerText = 'Export as JSON';
  jsonBtn.classList.add('extract-option-button');
  jsonBtn.addEventListener('click', () => {
    const dialogues = extractFunction();
    downloadJSON(dialogues);
    menu.remove();
  });
  
  // Send to backend option
  const sendBtn = document.createElement('button');
  sendBtn.innerText = 'Send to Backend';
  sendBtn.classList.add('extract-option-button');
  sendBtn.addEventListener('click', () => {
    sendConversationToBackend();
    menu.remove();
  });
  
  menu.appendChild(jsonBtn);
  menu.appendChild(sendBtn);
  
  // Position the menu
  menu.style.visibility = 'hidden';
  parentElement.appendChild(menu);
  
  const menuHeight = menu.offsetHeight;
  menu.style.top = (extractBtn.offsetTop - menuHeight - 5) + 'px';
  menu.style.left = extractBtn.offsetLeft + 'px';
  menu.style.visibility = 'visible';
  
  // Close the menu when clicking outside
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target) && e.target !== extractBtn) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}

// ChatGPT Injection with improved positioning
function injectChatGptExtractButton() {
  const selectors = [
    'form .group.relative',
    '.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4', // Alternative selector
    'form div[data-testid="send-button"]' // Another possible location
  ];
  
  let inputContainer = null;
  for (const selector of selectors) {
    inputContainer = document.querySelector(selector);
    if (inputContainer) break;
  }
  
  if (!inputContainer || inputContainer.querySelector('.extract-btn')) {
    return false; // Container not found or button already exists
  }
  
  // Find the send button or a suitable reference element
  const sendButton = inputContainer.querySelector('[data-testid="send-button"]') || 
                     inputContainer.querySelector('button') ||
                     inputContainer.lastElementChild;
  
  // Ensure the container is positioned relatively
  inputContainer.style.position = 'relative';
  
  // Add custom styles
  addCustomStyles();
  
  // Create button
  const extractBtn = document.createElement('button');
  extractBtn.innerText = 'Extract Dialogue';
  extractBtn.classList.add('extract-btn');
  
  // Position the button outside the input field
  extractBtn.style.position = 'absolute';
  extractBtn.style.bottom = '10px'; // Position at the bottom
  extractBtn.style.right = sendButton ? (sendButton.offsetWidth + 80) + 'px' : '90px'; // Place to the left of send button
  
  // Handle button click
  extractBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createOptionsMenu(inputContainer, extractBtn, extractChatGPTDialogue);
  });
  
  // Append button to the container (not inside the input field)
  inputContainer.appendChild(extractBtn);
  return true;
}

// Claude Injection with improved positioning
function injectClaudeExtractButton() {
  const selectors = [
    'fieldset.flex.w-full.min-w-0.flex-col-reverse',
    'div[data-testid="input-container"]',
    '.relative.flex.w-full.flex-col' // Alternative selector
  ];
  
  let inputContainer = null;
  for (const selector of selectors) {
    inputContainer = document.querySelector(selector);
    if (inputContainer) break;
  }
  
  if (!inputContainer || inputContainer.querySelector('.extract-btn')) {
    return false; // Container not found or button already exists
  }
  
  // Find a reference element (send button or similar)
  const sendButton = inputContainer.querySelector('[data-testid="send-button"]') || 
                     inputContainer.querySelector('button[type="submit"]') ||
                     inputContainer.querySelector('button:last-child');
  
  // Add custom styles
  addCustomStyles();
  
  // Create a wrapper div for positioning
  const buttonWrapper = document.createElement('div');
  buttonWrapper.style.position = 'absolute';
  buttonWrapper.style.bottom = '10px';
  buttonWrapper.style.right = sendButton ? (sendButton.offsetWidth + 80) + 'px' : '90px';
  buttonWrapper.style.zIndex = '1000';
  
  // Create button
  const extractBtn = document.createElement('button');
  extractBtn.innerText = 'Extract Dialogue';
  extractBtn.classList.add('extract-btn');
  
  // Handle button click
  extractBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createOptionsMenu(inputContainer, extractBtn, extractClaudeDialogue);
  });
  
  // Append button to wrapper, then wrapper to container
  buttonWrapper.appendChild(extractBtn);
  inputContainer.appendChild(buttonWrapper);
  return true;
}

// DeepSeek Injection with improved detection and resilience
function injectDeepseekExtractButton() {
  // More comprehensive set of selectors to try
  const selectors = [
    'div.fad49dec',
    '.textarea-container',
    '.input-container',
    // Additional selectors that might match DeepSeek's input area
    'textarea', 
    '.chat-input',
    'div[contenteditable="true"]',
    // Parent containers that might work better
    '.bottom-container',
    '.footer-container',
    '.input-area'
  ];
  
  let inputContainer = null;
  
  // First try direct selectors
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    // Try each matching element
    for (const el of elements) {
      // Check if this is likely an input container (has textarea, contenteditable, etc.)
      if (el.querySelector('textarea') || 
          el.querySelector('[contenteditable="true"]') || 
          el.tagName === 'TEXTAREA' ||
          el.getAttribute('contenteditable') === 'true') {
        inputContainer = el;
        break;
      }
      
      // If it's a container with limited height at the bottom of the page, it's likely the input area
      const rect = el.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 150 && 
          rect.height < 200 && 
          rect.width > 300) {
        inputContainer = el;
        break;
      }
    }
    if (inputContainer) break;
  }
  
  // If still not found, try to find by scanning the DOM for likely candidates
  if (!inputContainer) {
    console.log("DeepSeek input container not found with selectors, trying alternative detection...");
    
    // Look for elements that appear to be at the bottom of the page
    const allElements = document.querySelectorAll('div');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      // Look for elements that are positioned at the bottom of the viewport with reasonable dimensions
      if (rect.bottom > window.innerHeight - 150 && 
          rect.height < 200 && 
          rect.width > 300) {
        // Check if it or its children contain input-like elements
        if (el.querySelector('textarea') || 
            el.querySelector('[contenteditable="true"]') || 
            el.querySelector('input')) {
          inputContainer = el;
          console.log("Found potential DeepSeek input container:", el);
          break;
        }
      }
    }
  }
  
  // Final check - if button already exists or container not found
  if (!inputContainer || document.querySelector('.extract-btn')) {
    console.log("DeepSeek button not injected: container not found or button already exists");
    return false;
  }
  
  console.log("DeepSeek input container found:", inputContainer);
  
  // Find the parent container for better positioning
  // Go up to 3 levels to find a suitable container
  let parentContainer = inputContainer;
  let containerLevel = 0;
  while (containerLevel < 3) {
    if (parentContainer.parentElement) {
      parentContainer = parentContainer.parentElement;
    }
    containerLevel++;
  }
  
  // Make sure parent container can position absolute elements
  if (getComputedStyle(parentContainer).position === 'static') {
    parentContainer.style.position = 'relative';
  }
  
  // Add custom styles
  addCustomStyles();
  
  // Create a positioned container for the button
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.bottom = '15px';
  buttonContainer.style.right = '100px';
  buttonContainer.style.zIndex = '10000'; // Higher z-index to ensure visibility
  
  // Create button
  const extractBtn = document.createElement('button');
  extractBtn.innerText = 'Extract Dialogue';
  extractBtn.classList.add('extract-btn');
  extractBtn.style.padding = '8px 12px';
  extractBtn.style.borderRadius = '4px';
  extractBtn.style.backgroundColor = '#5c7cfa';
  extractBtn.style.color = 'white';
  extractBtn.style.border = 'none';
  extractBtn.style.cursor = 'pointer';
  
  // Handle button click
  extractBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof createOptionsMenu === 'function' && typeof extractDeepseekDialogue === 'function') {
      createOptionsMenu(parentContainer, extractBtn, extractDeepseekDialogue);
    } else {
      console.error("Required functions not available");
      alert("Extract functionality not available yet. Please try again in a moment.");
    }
  });
  
  // Append button to its container, then to parent container
  buttonContainer.appendChild(extractBtn);
  parentContainer.appendChild(buttonContainer);
  
  // Monitor for visibility issues and reposition if needed
  setTimeout(() => {
    const rect = extractBtn.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0 || 
        rect.right > window.innerWidth || 
        rect.bottom > window.innerHeight) {
      // Button is not visible, try repositioning
      console.log("DeepSeek button positioned outside viewport, repositioning...");
      buttonContainer.style.bottom = '50px';
      buttonContainer.style.right = '50px';
    }
  }, 500);
  
  console.log("DeepSeek button injected successfully");
  return true;
}

// Detect which platform we're on and inject the appropriate button
function detectPlatformAndInject() {
  const url = window.location.href;
  
  // Try to inject based on URL patterns
  if (url.includes('chat.openai.com')) {
    return injectChatGptExtractButton();
  } else if (url.includes('claude.ai')) {
    return injectClaudeExtractButton();
  } else if (url.includes('deepseek.com') || url.includes('deepseek.ai')) {
    return injectDeepseekExtractButton();
  }
  
  // If URL doesn't match, try detecting based on DOM structure
  let injected = false;
  injected = injectChatGptExtractButton() || injected;
  injected = injectClaudeExtractButton() || injected;
  injected = injectDeepseekExtractButton() || injected;
  
  return injected;
}

// Mutation observer to watch for DOM changes
function setupMutationObserver() {
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    // If button injection was successful, no need to keep trying
    if (detectPlatformAndInject()) {
      // Check again after a short delay in case the DOM changes
      setTimeout(() => {
        if (!document.querySelector('.extract-btn')) {
          detectPlatformAndInject();
        }
      }, 500);
    }
  });
  
  // Start observing the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
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
}

// Start everything when the script loads
initialize();



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
  if (url.includes('chat.openai.com')) {
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

// Start the enhanced initialization process
enhancedInitialize();