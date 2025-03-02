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
  
  
  function injectChatGptExtractButton() {
    // First check if button already exists to avoid duplicates
    if (document.querySelector('.extract-btn')) {
      return false; // Button already exists, don't create another one
    }
    
    const selectors = [
      'form .group.relative',
      '.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4',
      'form div[data-testid="send-button"]'
    ];
    
    let inputContainer = null;
    for (const selector of selectors) {
      inputContainer = document.querySelector(selector);
      if (inputContainer) break;
    }
    
    if (!inputContainer) {
      return false; // Container not found
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
    extractBtn.style.bottom = '10px';
    extractBtn.style.right = sendButton ? (sendButton.offsetWidth + 80) + 'px' : '90px';
    
    // Handle button click
    extractBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      createOptionsMenu(inputContainer, extractBtn, extractChatGPTDialogue);
    });
    
    // Append button to the container
    inputContainer.appendChild(extractBtn);
    
    // Handle form submission to clean up and re-inject the button
    const form = inputContainer.closest('form');
    if (form) {
      form.addEventListener('submit', handleFormSubmit, { once: true });
    }
    
    return true;
  }
  
  function handleFormSubmit() {
    // Remove the current button
    const extractBtn = document.querySelector('.extract-btn');
    if (extractBtn) {
      extractBtn.remove();
    }
    
    // Set a simple timeout to add the button again after submission completes
    setTimeout(() => {
      injectChatGptExtractButton();
    }, 1000); // Wait 1 second for the form submission to complete
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
    if (url.includes('chatgpt.com')) {
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