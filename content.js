// content.js

function extractChatGPTDialogue() {
    const dialogues = [];
  
    // Iterate over each article element in the conversation
    document.querySelectorAll('article').forEach(article => {
      // Check if the article contains a user message element
      const userElem = article.querySelector('.whitespace-pre-wrap');
      if (userElem) {
        dialogues.push({ role: 'user', text: userElem.innerText });
        return; // move to the next article
      }
  
      // Check if the article contains an AI message element
      const aiElem = article.querySelector('.markdown.prose.w-full.break-words');
      if (aiElem) {
        let messageText = '';
        // Concatenate parts of the AI message if needed
        aiElem.querySelectorAll('[data-start][data-end]').forEach(part => {
          messageText += part.innerText;
        });
        dialogues.push({ role: 'ai', text: messageText });
      }
    });
  
    return dialogues;
  }
  
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
  
  function injectExtractButton() {
    // Target the container that holds the input field (adjust the selector if necessary)
    const inputContainer = document.querySelector('form .group.relative');
    
    if (!inputContainer) {
      return setTimeout(injectExtractButton, 1000);
    }
  
    const extractBtn = document.createElement('button');
    extractBtn.innerText = 'Extract Dialogue';
    extractBtn.style.marginLeft = '10px';
    extractBtn.style.padding = '5px 10px';
    extractBtn.style.cursor = 'pointer';
  
    // Append the button so it appears next to the input field.
    inputContainer.appendChild(extractBtn);
  
    // When clicked, extract dialogue and download as a JSON file.
    extractBtn.addEventListener('click', () => {
      const dialogues = extractChatGPTDialogue();
      downloadJSON(dialogues);
    });
  }
  
  injectExtractButton();
  