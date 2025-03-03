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

  function createConversationName(){
    // check url, then create a name with randomized id + the website name. It can be gpt, claude or deepseek for now.
    // randomize id
    const randomId = Math.floor(Math.random() * 1000000);

    const url = window.location.href;
    // Try to inject based on URL patterns
    if (url.includes('chatgpt.com')) {
      return "ChatGPT Conversation" + randomId;
    } else if (url.includes('claude.ai')) {
      return "Claude Conversation" + randomId;
    } else if (url.includes('deepseek.com') || url.includes('deepseek.ai')) {
      return "DeepSeek Conversation" + randomId;
    }else {
      return "Conversation" + randomId;
    }
  }
  


  // Function to send conversation to backend using stored API key.
  async function sendConversationToBackend(isAutoSave = false) {
    // Retrieve API key from chrome storage.
    chrome.storage.sync.get(['apiKey'], async (items) => {
      const apiKey = items.apiKey;
      if (!apiKey) {
        alert("Warning: API Key is missing. Please set them in the extension options.");
        return;
      }
      
      const dialogues = extractDialogue();
      const chatId = extractConversationId();

      if(chatId === null || chatId === undefined){
        console.error("Chat ID not found.");
        return;
      }
  
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
        imageUrl: null,                // Set to null or use a URL if available
        image: null,                     // Empty string representing no conversation-level image
        name: createConversationName(), // Customize as needed
        model: getConversationModel(),              // Customize as needed
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
        if (!isAutoSave) {
          alert("Conversation sent successfully!");
        }
      })
      .catch(error => {
        console.error("Error sending conversation:", error);
        if (!isAutoSave){
          alert("Error sending conversation: " + error.message);
        }
      });
    });
  }
    