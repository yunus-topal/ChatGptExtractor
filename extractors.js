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
  // Select the conversation container.
  // Adjust this selector if your conversation container has a different class or structure.
  const container = document.querySelector('.flex-1.flex.flex-col.gap-3.px-4.max-w-3xl.mx-auto.w-full.pt-1');
  if (!container) {
    console.error("Conversation container not found.");
    return [];
  }

  // Find all elements that represent either a user or an AI message.
  // User messages have a data-testid attribute "user-message"
  // and AI messages are contained in elements with the class "font-claude-message"
  const messageNodes = container.querySelectorAll('[data-testid="user-message"], .font-claude-message');

  const dialogues = [];
  messageNodes.forEach(node => {
    let role = '';
    // Determine role based on the selector matched.
    if (node.matches('[data-testid="user-message"]')) {
      role = 'user';
    } else if (node.matches('.font-claude-message')) {
      role = 'ai';
    }
    // Extract the visible text content.
    const text = node.innerText.trim();
    if (role && text) {
      dialogues.push({ role, text });
    }
  });

  return dialogues;
  }
  
  function extractDeepSeekDialogue() {
  // Select the outer container of the conversation.
  const container = document.querySelector('.dad65929');
  if (!container) {
    console.error("Conversation container not found.");
    return [];
  }
  
  // Select user messages and AI messages:
  // - User messages are in .fa81 > .fbb737a4
  // - AI messages are in .f9bf7997
  const messageNodes = container.querySelectorAll('.fa81 .fbb737a4, .f9bf7997');
  const dialogues = [];
  
  messageNodes.forEach(node => {
    let role = '';
    if (node.matches('.fbb737a4')) {
      role = 'user';
    } else if (node.matches('.f9bf7997')) {
      role = 'ai';
    }
    
    // Extract and trim the text content.
    const text = node.innerText.trim();
    if (role && text) {
      dialogues.push({ role, text });
    }
  });
  
  return dialogues;
  }
  
  function extractDialogue() {
    const url = window.location.href;
    // Try to inject based on URL patterns
    if (url.includes('chatgpt.com')) {
      return extractChatGPTDialogue();
    } else if (url.includes('claude.ai')) {
      return extractClaudeDialogue();
    } else if (url.includes('deepseek.com') || url.includes('deepseek.ai')) {
      return extractDeepSeekDialogue();
    }else {
      return "Unknown Model";
    }
  }

  function extractChatGPTModel(){
    const modelButton = document.querySelector('[data-testid="model-switcher-dropdown-button"]');
    if (modelButton) {
      // The button contains a div with text "ChatGPT" and a span with the model identifier (e.g., "o3-mini-high")
      const span = modelButton.querySelector('span');
      if (span && span.textContent.trim() !== '') {
        return span.textContent.trim();
      }
      // Fallback: if the span is not found, try to remove "ChatGPT" from the full text.
      const fullText = modelButton.textContent.trim();
      if (fullText.startsWith('ChatGPT')) {
        return fullText.replace('ChatGPT', '').trim() || 'ChatGPT';
      }
    }
    return 'ChatGPT'; // Default fallback if no button is found.
  }

  function extractClaudeModel() {
    try {
      // Look for the model selector dropdown element
      const modelSelectorButton = document.querySelector('[data-testid="model-selector-dropdown"]');
      
      if (modelSelectorButton) {
        // Find the div that contains the model name text
        const modelNameDiv = modelSelectorButton.querySelector('.whitespace-nowrap.tracking-tight');
        
        if (modelNameDiv && modelNameDiv.textContent) {
          // Get the text content and trim any whitespace
          const modelName = modelNameDiv.textContent.trim();
          
          // If we found something, return "Claude " + the model name
          if (modelName) {
            return `Claude ${modelName}`;
          }
        }
      }
      
      // Alternative approach: try looking for the text near the Claude logo
      const claudeLogoSvg = document.querySelector('.claude-logo-model-selector');
      if (claudeLogoSvg) {
        const parentElement = claudeLogoSvg.closest('div');
        if (parentElement) {
          const modelTextElement = parentElement.querySelector('div.whitespace-nowrap');
          if (modelTextElement && modelTextElement.textContent) {
            return `Claude ${modelTextElement.textContent.trim()}`;
          }
        }
      }
      
      // If we couldn't find it through any method, return the default
      return "Claude";
    } catch (error) {
      console.error("Error extracting Claude model:", error);
      return "Claude";
    }
  }

  function extractDeepSeekModel(){
    return "DeepSeek"; // No model information available in the chat UI.
  }

  function getConversationModel(){

    const url = window.location.href;
    // Try to inject based on URL patterns
    if (url.includes('chatgpt.com')) {
      return extractChatGPTModel();
    } else if (url.includes('claude.ai')) {
      return extractClaudeModel();
    } else if (url.includes('deepseek.com') || url.includes('deepseek.ai')) {
      return extractDeepSeekModel();
    }else {
      return "Unknown Model";
    }
  }  

  
  function extractConversationId() {
    try {
      const url = window.location.href;
      const parsedUrl = new URL(url);
      // Split the pathname into segments and filter out empty parts.
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      // return the last segment.
      const lastSegment = pathSegments[pathSegments.length - 1];
      console.log("Extracted conversation ID:", lastSegment);
      return lastSegment;
    } catch (error) {
      console.error("Invalid URL provided:", url, error);
      return null;
    }
  }