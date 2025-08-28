const DictionaryService = require('../services/dictionary-service');
const { handleMessage } = require('./message-handler');
const dictionaryData = require('../data/dictionary.json');

// Initialize services
const dictionary = new DictionaryService(dictionaryData);

// Popup word state management
const popupWordState = {
  pendingSearch: null,

  setPendingSearch(word) {
    this.pendingSearch = word;
  },

  getPendingSearch() {
    const word = this.pendingSearch;
    this.pendingSearch = null; // 取得と同時にクリア
    return word;
  },

  clear() {
    this.pendingSearch = null;
  }
};

// Service instances to pass to message handler
const services = {
  dictionary,
  popupWordState
};

/**
 * Handle installation event
 */
browser.runtime.onInstalled.addListener(async () => {
  console.log('VocabDict extension installed');

  // Initialize default vocabulary list if none exists
  try {
    const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
    const lists = response.vocabularyLists || [];
    if (lists.length === 0) {
      // Create default list via native message
      await browser.runtime.sendNativeMessage({
        action: "createVocabularyList",
        name: "My Vocabulary",
        isDefault: true
      });
      console.log('Created default vocabulary list');
    }
  } catch (error) {
    console.error('Error initializing default vocabulary list:', error);
  }

  // Create context menu for macOS
  if (browser.contextMenus) {
    browser.contextMenus.create({
      id: 'lookup-vocabdict',
      title: 'Look up in VocabDict',
      contexts: ['selection']
    });
    console.log('Context menu created');
  }
});

/**
 * Handle context menu clicks
 */
async function handleContextMenuClick(info, _tab) {
  if (info.menuItemId === 'lookup-vocabdict' && info.selectionText) {
    console.log('Context menu clicked:', info.selectionText);

    // Use the messaging system for consistency
    browser.runtime.sendMessage({
      type: 'open_popup_with_word',
      word: info.selectionText
    }).catch(error => {
      console.error('Error sending context menu message:', error);
    });
  }
}

if (browser.contextMenus && browser.contextMenus.onClicked) {
  browser.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Handle messages from popup and content scripts
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  // Handle the message asynchronously
  handleMessage(message, services)
    .then(response => {
      console.log('Sending response:', response);
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate we'll send response asynchronously
  return true;
});

/**
 * Handle connections from popup for persistent communication
 */
browser.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);

  port.onMessage.addListener(async (message) => {
    try {
      const response = await handleMessage(message, services);
      port.postMessage(response);
    } catch (error) {
      port.postMessage({ success: false, error: error.message });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});


// Export for testing
module.exports = {
  services,
  dictionary,
  handleContextMenuClick,
  popupWordState
};
