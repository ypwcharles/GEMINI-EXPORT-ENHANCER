// src/background.ts
console.log('Background script loaded.'); // For debugging

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_IMAGE_AS_DATA_URL") {
    const imageUrl = message.url;
    console.log(`Background: Received request to fetch image: ${imageUrl}`);

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Background: Invalid image URL received.');
      sendResponse({ success: false, error: 'Invalid URL' });
      return false; // No async response here
    }

    fetch(imageUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${imageUrl}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          console.log(`Background: Successfully fetched and converted image to Data URL: ${imageUrl.substring(0, 100)}...`);
          sendResponse({ success: true, dataUrl: dataUrl });
        };
        reader.onerror = () => {
          console.error('Background: FileReader error for image:', imageUrl);
          sendResponse({ success: false, error: 'FileReader error' });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error(`Background: Error fetching image ${imageUrl}:`, error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Indicates that the response will be sent asynchronously.
  }
  // Optional: handle other message types in the future
  // return false; // if not handling this message type or if sendResponse is synchronous
});
