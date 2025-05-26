// src/background.ts
console.log('Background script loaded.'); // For debugging

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Background: onInstalled event triggered, reason:', details.reason);

  try {
    const rulesFileUrl = chrome.runtime.getURL('dnr_rules.json');
    console.log('Background: Loading DNR rules from:', rulesFileUrl);
    const response = await fetch(rulesFileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch dnr_rules.json: ${response.status} ${response.statusText}`);
    }
    const newRules = await response.json();

    if (!newRules || !Array.isArray(newRules) || newRules.length === 0) {
      console.warn('Background: No rules found in dnr_rules.json or format is incorrect.');
      // Optionally, still clear existing rules if that's desired behavior on empty new rules
      // const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      // const oldRuleIds = existingRules.map(rule => rule.id);
      // if (oldRuleIds.length > 0) {
      //   await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: oldRuleIds });
      //   console.log('Background: Cleared existing dynamic rules as new rules file was empty/invalid.');
      // }
      return;
    }

    console.log('Background: Fetched new DNR rules:', newRules);

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = existingRules.map(rule => rule.id);
    console.log('Background: Existing dynamic rule IDs to remove:', oldRuleIds);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules as chrome.declarativeNetRequest.Rule[] // Cast to type if needed
    });

    console.log('Background: Successfully updated dynamic DNR rules.');

    // Optional: Verify rules were set
    // const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    // console.log('Background: Current dynamic rules after update:', currentRules);

  } catch (error) {
    console.error('Background: Error updating DNR rules:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_IMAGE_AS_DATA_URL") {
    const imageUrl = message.url;
    console.log(`Background: Received request to fetch image: ${imageUrl}`);

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Background: Invalid image URL received.');
      sendResponse({ success: false, error: 'Invalid URL' });
      return false; // No async response here
    }

    fetch(imageUrl, { credentials: 'omit' }) // Added { credentials: 'omit' }
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
