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
    