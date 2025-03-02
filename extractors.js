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