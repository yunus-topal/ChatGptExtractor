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
      // Show notification here
      showNotification('Sending data to backend...');

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

// Function to show a simple notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.innerText = message;

  // Basic styling for the notification
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '1000'; // Ensure it's on top

  document.body.appendChild(notification);

  // Remove the notification after a few seconds
  setTimeout(() => {
      notification.remove();
  }, 3000); // Remove after 3 seconds
}
  
  
  function injectChatGptExtractButton() {
    //console.log("injectChatGptExtractButton called");
    // First check if button already exists to avoid duplicates
    if (document.querySelector('.extract-btn')) {
      return false; // Button already exists, don't create another one
    }
    
    const selectors = [
      'form .group.relative',
      '.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4',
      'form div[data-testid="send-button"]',
      'form[data-type="unified-composer"]'
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

    extractBtn.style.zIndex = '9999'; // <-- important to bring it above overlapping elements
    extractBtn.style.cursor = 'pointer';

    
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


  function injectGeminiExtractButton() {
    //console.log("injectGeminiExtractButton called");
    // Avoid duplicates by checking if the button already exists.
    if (document.querySelector('.extract-btn')) {
      return false; // Already injected.
    }
  
    // Try several selectors to get the container where we want to inject the button.
    // In our case, we target the input area inside the Gemini input container.
    const selectors = [
      'input-container .input-area-container',
      'input-container .text-input-field_textarea-inner',
      'input-container'
    ];
    
    let inputContainer = null;
    for (const selector of selectors) {
      inputContainer = document.querySelector(selector);
      if (inputContainer) break;
    }
    
    if (!inputContainer) {
      console.error("Input container not found.");
      return false;
    }
    
    // Look for a reference element such as the send button.
    // In the provided HTML there is a send button inside a div with class "send-button-container"
    let sendButton = inputContainer.querySelector('.send-button-container button.send-button');
    if (!sendButton) {
      // If not found inside inputContainer, try a more generic selector.
      sendButton = document.querySelector('.send-button');
    }
    
    // Ensure the container is positioned relative
    inputContainer.style.position = 'relative';
    
    // Optionally, add any custom styles by calling your helper function.
    addCustomStyles && addCustomStyles();
  
    // Create the extract button.
    const extractBtn = document.createElement('button');
    extractBtn.innerText = 'Extract Dialogue';
    extractBtn.classList.add('extract-btn');
  
    // Position the button. Adjust bottom/right values as needed.
    extractBtn.style.position = 'absolute';
    extractBtn.style.bottom = '10px';
    if (sendButton) {
      extractBtn.style.right = (sendButton.offsetWidth + 80) + 'px';
    } else {
      extractBtn.style.right = '90px';
    }
    extractBtn.style.zIndex = '9999'; // Bring above overlapping elements
    extractBtn.style.cursor = 'pointer';
  
    // Handle button click:
    // Prevent default actions and then call your options menu and extraction function.
    extractBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      createOptionsMenu(inputContainer, extractBtn, extractGeminiDialogue);
    });
    
    // Append the button to the found container.
    inputContainer.appendChild(extractBtn);
  
    // If the input container is inside a form, ensure the button is re-injected after a submission.
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
      detectPlatformAndInject();
    }, 1000); // Wait 1 second for the form submission to complete
  }


// Claude Injection with improved positioning
function injectClaudeExtractButton() {
  //console.log("injectClaudeExtractButton called");
  
  // Use the updated container selector that targets the new HTML structure.
  const selectors = [
    'div.flex.flex-col.bg-bg-000', // new container from updated HTML
    'fieldset.flex.w-full.min-w-0.flex-col-reverse',
    'div[data-testid="input-container"]',
    '.relative.flex.w-full.flex-col' // alternative fallback
  ];
  
  let inputContainer = null;
  for (const selector of selectors) {
    inputContainer = document.querySelector(selector);
    if (inputContainer) break;
  }
  
  // If no container is found or button is already injected, exit early
  if (!inputContainer || inputContainer.querySelector('.extract-btn')) {
    return false;
  }
  
  // Find a reference element (send button or similar) using updated selectors:
  const sendButton = inputContainer.querySelector('[aria-label="Send message"]') ||
                     inputContainer.querySelector('button[type="submit"]') ||
                     inputContainer.querySelector('button:last-child');
  
  // Inject custom styles (assumed to be defined elsewhere)
  addCustomStyles();
  
  // Create a wrapper div for positioning the button
  const buttonWrapper = document.createElement('div');
  buttonWrapper.style.position = 'absolute';
  buttonWrapper.style.bottom = '10px';
  // Position the button relative to the send button's width if found; fallback otherwise.
  buttonWrapper.style.right = sendButton ? (sendButton.offsetWidth + 80) + 'px' : '90px';
  buttonWrapper.style.zIndex = '1000';
  
  // Create the Extract Dialogue button and add a CSS class.
  const extractBtn = document.createElement('button');
  extractBtn.innerText = 'Extract Dialogue';
  extractBtn.classList.add('extract-btn');
  
  // Attach click event: prevent default actions and open the options menu.
  extractBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createOptionsMenu(inputContainer, extractBtn, extractClaudeDialogue);
  });
  
  // Append the button to the wrapper, and then add it to the container.
  buttonWrapper.appendChild(extractBtn);
  inputContainer.appendChild(buttonWrapper);
  
  return true;
}

  
  // DeepSeek Injection with improved detection and resilience
  function injectDeepseekExtractButton() {
    //console.log("injectDeepseekExtractButton called");
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
      createOptionsMenu(parentContainer, extractBtn, extractDeepSeekDialogue);
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
    } else if (url.includes('gemini.google.com')) {
      return injectGeminiExtractButton();
    }
    
    // If URL doesn't match, try detecting based on DOM structure
    let injected = false;
    injected = injectChatGptExtractButton() || injected;
    injected = injectClaudeExtractButton() || injected;
    injected = injectDeepseekExtractButton() || injected;
    injected = injectGeminiExtractButton() || injected;
    
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