const DictionaryService = require('../services/dictionary-service');
const StorageManager = require('../services/storage');
const { handleMessage } = require('./message-handler');
const dictionaryData = require('../data/dictionary.json');

// Initialize services
const dictionary = new DictionaryService(dictionaryData, StorageManager);
const storage = StorageManager;

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
  storage,
  popupWordState
};

/**
 * Initialize services
 */
async function initializeServices() {
  await dictionary.loadLookupStatistics();
  console.log('Dictionary lookup statistics loaded');
}

/**
 * Handle installation event
 */
browser.runtime.onInstalled.addListener(async () => {
  console.log('VocabDict extension installed');

  // Initialize services
  await initializeServices();

  // Initialize default vocabulary list if none exists
  const lists = await browser.sendMessage({ type: 'get_lists' }).data;
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

// Initialize services on startup
initializeServices().catch(console.error);

// Export for testing
module.exports = {
  services,
  dictionary,
  storage,
  handleContextMenuClick,
  popupWordState
};
