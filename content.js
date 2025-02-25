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
  
  
  // Convert the dialogue array to a Markdown formatted string.
  function convertToMarkdown(dialogues) {
    let mdContent = "# ChatGPT Conversation\n\n";
    dialogues.forEach(entry => {
      if (entry.role === 'user') {
        mdContent += `**User:**\n\n${entry.text}\n\n`;
      } else if (entry.role === 'ai') {
        mdContent += `**ChatGPT:**\n\n${entry.text}\n\n`;
      }
    });
    return mdContent;
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
  
  // Download the markdown content as a .md file.
  function downloadMarkdown(markdown, filename = 'chatgpt-dialogue.md') {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Function to send conversation to backend
function sendConversationToBackend() {
    const dialogues = extractChatGPTDialogue();
    const backendUrl = "https://localhost:7136/api/your-endpoint"; // Replace with your backend URL.
    const apiKey = "YOUR_API_KEY"; // Replace with your actual API key.
    
    fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ dialogues: dialogues })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Conversation sent successfully:", data);
      alert("Conversation sent successfully!");
    })
    .catch(error => {
      console.error("Error sending conversation:", error);
      alert("Error sending conversation: " + error.message);
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
  
      // Create Markdown export option.
      const mdBtn = document.createElement('button');
      mdBtn.innerText = 'Export as Markdown';
      mdBtn.classList.add('extract-option-button');
      mdBtn.addEventListener('click', () => {
        const dialogues = extractChatGPTDialogue();
        const markdown = convertToMarkdown(dialogues);
        downloadMarkdown(markdown);
        menu.remove();
      });
  
      menu.appendChild(jsonBtn);
      menu.appendChild(mdBtn);
  
      // Append the menu first with hidden visibility so we can measure its height.
      menu.style.visibility = 'hidden';
      inputContainer.appendChild(menu);
  
      // Now position the menu above the extractor button.
      const menuHeight = menu.offsetHeight;
      // Positioning relative to the extractBtn.
      menu.style.top = (extractBtn.offsetTop - menuHeight - 5) + 'px';
      menu.style.left = extractBtn.offsetLeft + 'px';
      menu.style.visibility = 'visible';
    });
  }
  
  injectExtractButton();
  