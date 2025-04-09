

//-------------------------------Dialogues Extraction--------------------------------
function extractChatGPTDialogue() {
  const dialogues = [];

  // Instantiate the Turndown converter.
  const turndownService = new TurndownService();
  // Iterate over every article element that represents a message.
  document.querySelectorAll('article').forEach(article => {
    // Check for user messages.
    const userElem = article.querySelector('.whitespace-pre-wrap');
    if (userElem) {
      // Convert the HTML to Markdown.
      const markdown = turndownService.turndown(userElem.innerHTML);
      dialogues.push({ role: 'user', text: markdown });
      return;
    }
    // Check for AI messages.
    const aiElem = article.querySelector('.markdown.prose.w-full.break-words');
    if (aiElem) {
      // Convert the full HTML of the AI message to Markdown.
      const markdown = turndownService.turndown(aiElem.innerHTML);
      
      // Optionally, extract images separately (if needed),
      // though Turndown will also convert <img> tags by default.
      const images = [];
      aiElem.querySelectorAll('img').forEach(img => {
        images.push({
          src: img.src,
          alt: img.alt || ''
        });
      });
      
      dialogues.push({ role: 'ai', text: markdown, images: images });
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
    const dialogues = [];
  
    document.querySelectorAll('[class]').forEach(elem => {
      if (!elem.className.includes('dad65929')) return;
  
      const container = Array.from(elem.querySelectorAll('[class]')).find(el =>
        el.className.includes('_9663006')
      );
  
      if (container) {
        const userEl = Array.from(container.children).find(child =>
          child.className.includes('fbb737a4')
        );
        const userText = userEl?.textContent?.trim();
        if (userText) {
          dialogues.push({ role: 'user', text: userText });
        }
      }
  
      const aiText = elem.querySelector('.ds-markdown')?.innerText?.trim();
      if (aiText) {
        dialogues.push({ role: 'ai', text: aiText });
      }
    });
  
    return dialogues;
  }
  
  

  function extractGeminiDialogue() {
    const dialogues = [];
    //console.log("Gemini dialogue extraction started.");
    // Get all conversation blocks
    const conversationElems = document.querySelectorAll('.conversation-container');
  
    conversationElems.forEach(convo => {
      //console.log("cycling through conversation block", convo);
      // Extract user query
      const userQueryElem = convo.querySelector('user-query-content .query-text');
      const userText = userQueryElem?.innerText?.trim();
      if (userText) {
        dialogues.push({ role: 'user', text: userText });
      }
  
      // Extract AI response
      const aiResponseElem = convo.querySelector('message-content .markdown');
      const aiText = aiResponseElem?.innerText?.trim();
      if (aiText) {
        dialogues.push({ role: 'ai', text: aiText });
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
    } else if (url.includes('gemini.google.com')) {
      return extractGeminiDialogue();
    }
    else {
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

  function extractGeminiModel() {
    try {
      // Look for the attribution element that contains the Gemini model text.
      const attributionElement = document.querySelector('[data-test-id="attribution-text"]');
      
      if (attributionElement && attributionElement.textContent) {
        // Get the text, trim whitespace and prefix it with "Gemini ".
        const modelText = attributionElement.textContent.trim();
        if (modelText) {
          return `Gemini ${modelText}`;
        }
      }
      
      // Alternative approach: if needed, you could try to locate text via other nearby elements.
      // For example, sometimes the Gemini logo container might be used.
      const logoContainer = document.querySelector('.bard-logo-container');
      if (logoContainer) {
        // As an example, search for a nested span with data-test-id "bard-text" (which in this case is "Gemini")
        const geminiText = logoContainer.querySelector('[data-test-id="bard-text"]');
        if (geminiText && geminiText.textContent) {
          // Although this likely will always return "Gemini", we can use it as a fallback.
          return `Gemini ${geminiText.textContent.trim()}`;
        }
      }
      
      // If nothing is found, return a default value.
      return "Gemini";
    } catch (error) {
      console.error("Error extracting Gemini model:", error);
      return "Gemini";
    }
  }

  // TODO: create url variables instead of constants.
  function getConversationModel(){

    const url = window.location.href;
    // Try to inject based on URL patterns
    if (url.includes('chatgpt.com')) {
      return extractChatGPTModel();
    } else if (url.includes('claude.ai')) {
      return extractClaudeModel();
    } else if (url.includes('deepseek.com') || url.includes('deepseek.ai')) {
      return extractDeepSeekModel();
    } else if (url.includes('gemini.google.com')) {
      return extractGeminiModel();
    }
    else {
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
      let lastSegment = pathSegments[pathSegments.length - 1];
      // if the last segment has any query parameters, remove them.
      const lastSegmentWithoutQuery = lastSegment.split('?')[0];
      console.log("Extracted conversation ID:", lastSegmentWithoutQuery);
      return lastSegmentWithoutQuery;
    } catch (error) {
      console.error("Invalid URL provided:", url, error);
      return null;
    }
  }