document.getElementById('extract').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: extractChatGPTDialogue
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        const dialogues = results[0].result;
        displayOutput(dialogues);
      });
    });
  });
  
  function extractChatGPTDialogue() {
    let dialogues = [];
  
    // Extract user messages
    document.querySelectorAll('article .whitespace-pre-wrap').forEach(elem => {
      dialogues.push({ role: 'user', text: elem.innerText });
    });
  
    // Extract AI messages
    document.querySelectorAll('article .markdown.prose.w-full.break-words').forEach(elem => {
      let messageText = '';
      elem.querySelectorAll('[data-start][data-end]').forEach(part => {
        messageText += part.innerText;
      });
      dialogues.push({ role: 'ai', text: messageText });
    });
  
    return dialogues;
  }
  
  function displayOutput(dialogues) {
    const outputElement = document.getElementById('output');
    outputElement.textContent = JSON.stringify(dialogues, null, 2);
  }
  