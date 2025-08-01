const DictionaryService = require('../services/dictionary-service');
const StorageManager = require('../services/storage');
const { MessageTypes, handleMessage } = require('./message-handler');
const dictionaryData = require('../data/dictionary.json');

// Initialize services
const dictionary = new DictionaryService(dictionaryData);
const storage = StorageManager;

// Service instances to pass to message handler
const services = {
  dictionary,
  storage
};

/**
 * Handle installation event
 */
browser.runtime.onInstalled.addListener(async () => {
  console.log('VocabDict extension installed');

  // Initialize default vocabulary list if none exists
  const lists = await storage.get('vocab_lists');
  if (!lists || lists.length === 0) {
    const VocabularyList = require('../services/vocabulary-list');
    const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
    await storage.set('vocab_lists', [defaultList.toJSON()]);
    console.log('Created default vocabulary list');
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
if (browser.contextMenus && browser.contextMenus.onClicked) {
  browser.contextMenus.onClicked.addListener(async (info, _tab) => {
    if (info.menuItemId === 'lookup-vocabdict' && info.selectionText) {
      console.log('Context menu clicked:', info.selectionText);

      // Look up the word
      const response = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: info.selectionText
      }, services);

      // Store the lookup result in cache for popup to display
      if (response.success && response.data) {
        await storage.set('last_lookup', {
          word: info.selectionText,
          result: response.data,
          timestamp: new Date().toISOString()
        });

        // Open the extension popup to show the result
        if (browser.action && browser.action.openPopup) {
          browser.action.openPopup();
        }
      }
    }
  });
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
  storage
};
