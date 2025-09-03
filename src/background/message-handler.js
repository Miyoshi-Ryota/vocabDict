const VocabularyList = require('../services/vocabulary-list');
const validators = require('../generated/validators');

const MessageTypes = {
  LOOKUP_WORD: 'lookupWord',
  ADD_WORD_TO_VOCABULARY_LIST: 'addWordToVocabularyList',
  FETCH_ALL_VOCABULARY_LISTS: 'fetchAllVocabularyLists',
  FETCH_VOCABULARY_LIST_WORDS: 'fetchVocabularyListWords',
  CREATE_VOCABULARY_LIST: 'createVocabularyList',
  UPDATE_WORD: 'updateWord',
  FETCH_REVIEW_QUEUE: 'fetchReviewQueue',
  SUBMIT_REVIEW: 'submitReview',

  GET_PENDING_CONTEXT_SEARCH: 'getPendingContextSearch',
  FETCH_RECENT_SEARCHES: 'fetchRecentSearches',
  FETCH_SETTINGS: 'fetchSettings',
  UPDATE_SETTINGS: 'updateSettings',
  OPEN_POPUP_WITH_WORD: 'openPopupWithWord'
};

/**
 * Handle messages from popup or content script
 * @param {Object} message - Message object
 * @param {Object} services - Service instances (dictionary, popupWordState)
 * @returns {Promise<Object>} Response object
 */
async function handleMessage(message, services) {
  const { dictionary, popupWordState } = services;

  // Validate incoming request if validators are available
  if (validators && message.action) {
    const validation = validators.validateRequest(message.action, message);
    if (!validation.valid) {
      console.error(`Request validation failed for ${message.action}:`, validation.error);
      return { success: false, error: `Invalid request: ${validation.error}` };
    }
  }

  try {
    switch (message.action) {
      case MessageTypes.LOOKUP_WORD: {
        if (!message.word) {
          return { success: false, error: 'Word parameter is required' };
        }

        const result = await dictionary.lookup(message.word);
        if (result) {
          // Add to recent searches automatically on successful lookup
          try {
            await browser.runtime.sendNativeMessage({
              action: "addRecentSearch",
              word: message.word
            });
          } catch (error) {
            console.error('Failed to add recent search:', error);
          }
          const out = { success: true, data: result };
          const v = validators.validateResponse('lookupWord', out);
          if (!v.valid) return { success: false, error: `Invalid response: ${v.error}` };
          return v.data;
        }

        // Try fuzzy search using the fuzzy match method
        const suggestions = dictionary.fuzzyMatch(message.word, 5);
        if (suggestions.length > 0) {
          const out = { success: true, data: null, suggestions };
          const v = validators.validateResponse('lookupWord', out);
          if (!v.valid) return { success: false, error: `Invalid response: ${v.error}` };
          return v.data;
        }

        const out = { success: false, error: 'Word not found' };
        const v = validators.validateResponse('lookupWord', out);
        if (!v.valid) return { success: false, error: `Invalid response: ${v.error}` };
        return v.data;
      }

      case MessageTypes.ADD_WORD_TO_VOCABULARY_LIST: {
        if (!message.word || !message.listId) {
          return { success: false, error: 'Word and listId are required' };
        }

        // Check if word exists in dictionary
        const wordData = await dictionary.lookup(message.word);
        if (!wordData) {
          return { success: false, error: 'Word not found in dictionary' };
        }

        try {
          const payload = {
            action: "addWordToVocabularyList",
            listId: message.listId,
            word: message.word,
            metadata: message.metadata || {}
          };
          const vrReq = validators.validateRequest('addWordToVocabularyList', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          // Send to native handler to add word to SwiftData/CloudKit
          const response = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrAdd = validators.validateResponse('addWordToVocabularyList', response);
          if (!vrAdd.valid) {
            return { success: false, error: `Invalid response: ${vrAdd.error}` };
          }

          if (response.error) {
            return { success: false, error: response.error };
          }

          return vrAdd.data;
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.FETCH_ALL_VOCABULARY_LISTS: {
        console.log("Fetching vocabulary lists from native messaging");
        const payload = { action: "fetchAllVocabularyLists" };
        const vrReq = validators.validateRequest('fetchAllVocabularyLists', payload);
        if (!vrReq.valid) {
          return { success: false, error: `Invalid request: ${vrReq.error}` };
        }
        const response = await browser.runtime.sendNativeMessage(vrReq.data);
        const vrLists = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists.valid) {
          return { success: false, error: `Invalid response: ${vrLists.error}` };
        }
        console.log("Received vocabulary lists:", response);
        return vrLists.data;
      }

      case MessageTypes.FETCH_VOCABULARY_LIST_WORDS: {
        if (!message.listId) {
          return { success: false, error: 'ListId is required' };
        }

        // Fetch all lists to locate the target list
        const payloadLists = { action: "fetchAllVocabularyLists" };
        const vrReq = validators.validateRequest('fetchAllVocabularyLists', payloadLists);
        if (!vrReq.valid) {
          return { success: false, error: `Invalid request: ${vrReq.error}` };
        }
        const response = await browser.runtime.sendNativeMessage(vrReq.data);
        const vrLists2 = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists2.valid) {
          return { success: false, error: `Invalid response: ${vrLists2.error}` };
        }
        const lists = response.vocabularyLists || [];
        const listData = lists.find(l => l.id === message.listId);
        if (!listData) {
          return { success: false, error: 'List not found' };
        }

        // Build words array from list data (UserWordData only)
        let words = Object.values(listData.words || {});

        // Filtering by difficulty bucket if requested
        if (message.filterBy && message.filterBy !== 'all') {
          const bucketOf = (d) => {
            const val = typeof d === 'number' ? d : Number.MAX_SAFE_INTEGER;
            return val <= 3000 ? 'easy' : (val < 10000 ? 'medium' : 'hard');
          };
          words = words.filter(w => bucketOf(w.difficulty) === message.filterBy);
        }

        // Build lookupStats map for current words
        const lookupStats = {};
        for (const w of words) {
          const count = await dictionary.getLookupCount(w.word);
          // Only count is strictly needed; word key included for completeness
          lookupStats[w.word] = { word: w.word, count };
        }

        // Sorting
        if (message.sortBy && words.length > 0) {
          const sortOrder = message.sortOrder || 'asc';
          const order = (n) => sortOrder === 'desc' ? -n : n;
          const toNum = (v) => (typeof v === 'number') ? v : Number.MAX_SAFE_INTEGER;
          const cmp = {
            alphabetical: (a, b) => order(a.word.localeCompare(b.word)),
            dateAdded: (a, b) => order(new Date(a.dateAdded) - new Date(b.dateAdded)),
            lastReviewed: (a, b) => {
              const aHas = !!a.lastReviewed, bHas = !!b.lastReviewed;
              if (!aHas && !bHas) return 0;
              if (!aHas) return order(1);
              if (!bHas) return order(-1);
              return order(new Date(a.lastReviewed) - new Date(b.lastReviewed));
            },
            difficulty: (a, b) => order(toNum(a.difficulty) - toNum(b.difficulty)),
            lookupCount: (a, b) => order((lookupStats[a.word]?.count || 0) - (lookupStats[b.word]?.count || 0))
          }[message.sortBy];
          if (cmp) {
            words.sort(cmp);
          }
        }

        const result = { success: true, data: { words, lookupStats } };
        const vrResp = validators.validateResponse('fetchVocabularyListWords', result);
        if (!vrResp.valid) {
          return { success: false, error: `Invalid response: ${vrResp.error}` };
        }
        return vrResp.data;
      }

      case MessageTypes.CREATE_VOCABULARY_LIST: {
        if (!message.name) {
          return { success: false, error: 'List name is required' };
        }

        const trimmedName = message.name.trim();
        if (!trimmedName) {
          return { success: false, error: 'List name cannot be empty' };
        }

        const payload = { 
          action: "createVocabularyList",
          name: trimmedName,
          isDefault: message.isDefault || false
        };
        const vrReq = validators.validateRequest('createVocabularyList', payload);
        if (!vrReq.valid) {
          return { success: false, error: `Invalid request: ${vrReq.error}` };
        }
        const response = await browser.runtime.sendNativeMessage(vrReq.data);
        const vrCreate = validators.validateResponse('createVocabularyList', response);
        if (!vrCreate.valid) {
          return { success: false, error: `Invalid response: ${vrCreate.error}` };
        }
        return vrCreate.data;
      }

      case MessageTypes.UPDATE_WORD: {
        if (!message.listId || !message.word || !message.updates) {
          return { success: false, error: 'ListId, word, and updates are required' };
        }

        try {
          const payload = {
            action: "updateWord",
            listId: message.listId,
            word: message.word,
            updates: message.updates
          };
          const vrReq = validators.validateRequest('updateWord', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const response = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrUpd = validators.validateResponse('updateWord', response);
          if (!vrUpd.valid) {
            return { success: false, error: `Invalid response: ${vrUpd.error}` };
          }
          if (response.error) {
            return { success: false, error: response.error };
          }

          return vrUpd.data;
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.FETCH_REVIEW_QUEUE: {
        const payload = { action: "fetchAllVocabularyLists" };
        const vrReq = validators.validateRequest('fetchAllVocabularyLists', payload);
        if (!vrReq.valid) {
          return { success: false, error: `Invalid request: ${vrReq.error}` };
        }
        const response = await browser.runtime.sendNativeMessage(vrReq.data);
        const vrLists3 = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists3.valid) {
          return { success: false, error: `Invalid response: ${vrLists3.error}` };
        }
        const lists = response.vocabularyLists || [];
        const maxWords = message.maxWords || 30;
        const now = new Date();

        // Collect all words from all lists
        const allWords = [];

        for (const listData of lists) {
          const list = VocabularyList.fromJSON(listData, dictionary);
          const words = await list.getWords();

          for (const word of words) {
            allWords.push({
              ...word,
              listId: listData.id,
              listName: listData.name
            });
          }
        }

        // Filter words that are due for review
        const queue = allWords.filter(word => {
          return word.nextReview && 
                 word.nextReview !== null && 
                 new Date(word.nextReview) <= now;
        }).sort((a, b) => {
          // Sort by nextReview date (oldest first)
          return new Date(a.nextReview) - new Date(b.nextReview);
        }).slice(0, maxWords);

        const result = { success: true, data: queue };
        const vrResp = validators.validateResponse('fetchReviewQueue', result);
        if (!vrResp.valid) {
          console.error('fetchReviewQueue response validation error:', vrResp.error, JSON.stringify(result).slice(0,200));
          return { success: false, error: `Invalid response: ${vrResp.error}` };
        }
        return vrResp.data;
      }

      case MessageTypes.SUBMIT_REVIEW: {

        if (!message.listId || !message.word || !message.reviewResult) {
          return { success: false, error: 'ListId, word, and reviewResult are required' };
        }

        try {
          // Simply forward to native submitReview
          const payload = {
            action: "submitReview",
            listId: message.listId,
            word: message.word,
            reviewResult: message.reviewResult,
            timeSpent: message.timeSpent || 0.0
          };
          const vrReq = validators.validateRequest('submitReview', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const reviewResponse = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrReview = validators.validateResponse('submitReview', reviewResponse);
          if (!vrReview.valid) {
            return { success: false, error: `Invalid response: ${vrReview.error}` };
          }
          return vrReview.data;
        } catch (error) {
          console.error('Submit review error:', error);
          return { success: false, error: error.message };
        }
      }

      

      case MessageTypes.GET_PENDING_CONTEXT_SEARCH: {
        if (!popupWordState) {
          return { success: false, error: 'Popup word state not available' };
        }

        const pendingWord = popupWordState.getPendingSearch();
        const result = { success: true, data: pendingWord ?? null };
        const vrResp = validators.validateResponse('getPendingContextSearch', result);
        if (!vrResp.valid) {
          return { success: false, error: `Invalid response: ${vrResp.error}` };
        }
        return vrResp.data;
      }

      case MessageTypes.FETCH_RECENT_SEARCHES: {
        try {
          const payload = { action: "fetchRecentSearches" };
          const vrReq = validators.validateRequest('fetchRecentSearches', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const response = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrRecent = validators.validateResponse('fetchRecentSearches', response);
          if (!vrRecent.valid) {
            return { success: false, error: `Invalid response: ${vrRecent.error}` };
          }
          return vrRecent.data;
        } catch (error) {
          console.error('Failed to get recent searches:', error);
          return { success: true, data: [] };
        }
      }

      case MessageTypes.FETCH_SETTINGS: {
        try {
          const payload = { action: "fetchSettings" };
          const vrReq = validators.validateRequest('fetchSettings', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const response = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrSettings = validators.validateResponse('fetchSettings', response);
          if (!vrSettings.valid) {
            return { success: false, error: `Invalid response: ${vrSettings.error}` };
          }
          return vrSettings.data;
        } catch (error) {
          console.error('Failed to get settings:', error);
          // Return default settings on error
          const fallback = { success: true, settings: {
            theme: 'dark',
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }};
          const v = validators.validateResponse('fetchSettings', fallback);
          if (!v.valid) return { success: false, error: `Invalid response: ${v.error}` };
          return v.data;
        }
      }

      case MessageTypes.UPDATE_SETTINGS: {
        if (!message.settings) {
          return { success: false, error: 'Settings object is required' };
        }

        try {
          const payload = {
            action: "updateSettings",
            settings: message.settings
          };
          const vrReq = validators.validateRequest('updateSettings', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const response = await browser.runtime.sendNativeMessage(vrReq.data);
          const vrUpdateSettings = validators.validateResponse('updateSettings', response);
          if (!vrUpdateSettings.valid) {
            return { success: false, error: `Invalid response: ${vrUpdateSettings.error}` };
          }
          return vrUpdateSettings.data;
        } catch (error) {
          console.error('Failed to update settings:', error);
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.OPEN_POPUP_WITH_WORD: {
        if (!message.word) {
          return { success: false, error: 'Word parameter is required' };
        }

        if (!popupWordState) {
          return { success: false, error: 'Popup word state not available' };
        }

        // Store the word for popup to search
        popupWordState.setPendingSearch(message.word);

        // Open the extension popup using browser.action.openPopup
        if (typeof browser !== 'undefined' && browser.action && browser.action.openPopup) {
          try {
            await browser.action.openPopup();
            const result = { success: true, data: { popupOpened: true } };
            const vrResp = validators.validateResponse('openPopupWithWord', result);
            if (!vrResp.valid) {
              return { success: false, error: `Invalid response: ${vrResp.error}` };
            }
            return vrResp.data;
          } catch (error) {
            console.error('Failed to open popup:', error);
            return { success: false, error: 'Failed to open popup' };
          }
        } else {
          return { success: false, error: 'Popup opening not supported' };
        }
      }

      default:
        return { success: false, error: `Unknown message action: ${message.action}` };
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  MessageTypes,
  handleMessage
};
