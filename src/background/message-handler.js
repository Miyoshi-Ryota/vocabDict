const VocabularyList = require('../services/vocabulary-list');
const validators = require('../generated/validators');
const { sendNative } = require('../utils/native');

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
            await sendNative('addRecentSearch', { word: message.word });
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
          const resp = await sendNative('addWordToVocabularyList', {
            listId: message.listId,
            word: message.word,
            metadata: message.metadata || {}
          });
          if (resp.error) return { success: false, error: resp.error };
          return resp;
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.FETCH_ALL_VOCABULARY_LISTS: {
        const resp = await sendNative('fetchAllVocabularyLists');
        return resp;
      }

      case MessageTypes.FETCH_VOCABULARY_LIST_WORDS: {
        if (!message.listId) {
          return { success: false, error: 'ListId is required' };
        }
        // Forward to native handler to build words + lookupStats
        const resp = await sendNative('fetchVocabularyListWords', {
          listId: message.listId,
          filterBy: message.filterBy,
          sortBy: message.sortBy,
          sortOrder: message.sortOrder
        });
        return resp;
      }

      case MessageTypes.CREATE_VOCABULARY_LIST: {
        if (!message.name) {
          return { success: false, error: 'List name is required' };
        }

        const trimmedName = message.name.trim();
        if (!trimmedName) {
          return { success: false, error: 'List name cannot be empty' };
        }

        const resp = await sendNative('createVocabularyList', {
          name: trimmedName,
          isDefault: message.isDefault || false
        });
        return resp;
      }

      case MessageTypes.UPDATE_WORD: {
        if (!message.listId || !message.word || !message.updates) {
          return { success: false, error: 'ListId, word, and updates are required' };
        }

        try {
          const resp = await sendNative('updateWord', {
            listId: message.listId,
            word: message.word,
            updates: message.updates
          });
          if (resp.error) return { success: false, error: resp.error };
          return resp;
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.FETCH_REVIEW_QUEUE: {
        const payload = { action: "fetchAllVocabularyLists" };
        const response = await sendNative('fetchAllVocabularyLists');
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
          const resp = await sendNative('submitReview', {
            listId: message.listId,
            word: message.word,
            reviewResult: message.reviewResult,
            timeSpent: message.timeSpent || 0.0
          });
          return resp;
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
          const resp = await sendNative('fetchRecentSearches');
          return resp;
        } catch (error) {
          console.error('Failed to get recent searches:', error);
          return { success: true, data: [] };
        }
      }

      case MessageTypes.FETCH_SETTINGS: {
        try {
          const resp = await sendNative('fetchSettings');
          return resp;
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
          const resp = await sendNative('updateSettings', { settings: message.settings });
          return resp;
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
