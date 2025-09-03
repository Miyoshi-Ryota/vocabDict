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

          return { success: true, data: result };
        }

        // Try fuzzy search using the fuzzy match method
        const suggestions = dictionary.fuzzyMatch(message.word, 5);
        if (suggestions.length > 0) {
          return {
            success: true,
            data: null,
            suggestions
          };
        }

        return { success: false, error: 'Word not found' };
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
          const response = await browser.runtime.sendNativeMessage(payload);
          const vrAdd = validators.validateResponse('addWordToVocabularyList', response);
          if (!vrAdd.valid) {
            console.warn('Invalid addWordToVocabularyList response:', vrAdd.error);
          }

          if (response.error) {
            return { success: false, error: response.error };
          }

          return { success: true, data: response.data };
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
        const response = await browser.runtime.sendNativeMessage(payload);
        const vrLists = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists.valid) {
          console.warn('Invalid fetchAllVocabularyLists response:', vrLists.error);
        }
        console.log("Received vocabulary lists:", response);
        return { success: true, data: response.vocabularyLists || [] };
      }

      case MessageTypes.FETCH_VOCABULARY_LIST_WORDS: {
        if (!message.listId) {
          return { success: false, error: 'ListId is required' };
        }

        const payloadLists = { action: "fetchAllVocabularyLists" };
        const vrReq = validators.validateRequest('fetchAllVocabularyLists', payloadLists);
        if (!vrReq.valid) {
          return { success: false, error: `Invalid request: ${vrReq.error}` };
        }
        const response = await browser.runtime.sendNativeMessage(payloadLists);
        const vrLists2 = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists2.valid) {
          console.warn('Invalid fetchAllVocabularyLists response:', vrLists2.error);
        }
        const lists = response.vocabularyLists || [];
        const listData = lists.find(l => l.id === message.listId);

        if (!listData) {
          return { success: false, error: 'List not found' };
        }

        // Create VocabularyList instance
        const list = VocabularyList.fromJSON(listData, dictionary);

        // Get all words
        let words = await list.getWords();

        // Apply filtering first
        if (message.filterBy && message.filterBy !== 'all') {
          words = await list.filterBy('difficulty', message.filterBy);
        }

        // Enhance words with lookup count data BEFORE sorting
        const enhancedWords = await Promise.all(words.map(async word => ({
          ...word,
          lookupCount: await dictionary.getLookupCount(word.word)
        })));

        // Apply sorting to the filtered and enhanced results
        if (message.sortBy && enhancedWords.length > 0) {
          const sortOrder = message.sortOrder || 'asc';

          // Create a temporary list with the enhanced words
          const tempList = new VocabularyList('temp', dictionary);
          enhancedWords.forEach(word => {
            tempList.words[word.word] = word;
          });

          // Sort using the temporary list
          const sortedWords = await tempList.sortBy(message.sortBy, sortOrder);
          return { success: true, data: sortedWords };
        }

        const result = { success: true, data: enhancedWords };
        const vrResp = validators.validateResponse('fetchVocabularyListWords', result);
        if (!vrResp.valid) {
          console.warn('Invalid fetchVocabularyListWords response:', vrResp.error);
        }
        return result;
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
        const response = await browser.runtime.sendNativeMessage(payload);
        const vrCreate = validators.validateResponse('createVocabularyList', response);
        if (!vrCreate.valid) {
          console.warn('Invalid createVocabularyList response:', vrCreate.error);
        }
        
        if (response.error) {
          return { success: false, error: response.error };
        }

        return { success: true, data: response.vocabularyList };
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
          const response = await browser.runtime.sendNativeMessage(payload);

          if (response.error) {
            return { success: false, error: response.error };
          }

          return { success: true, data: response.data };
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
        const response = await browser.runtime.sendNativeMessage(payload);
        const vrLists3 = validators.validateResponse('fetchAllVocabularyLists', response);
        if (!vrLists3.valid) {
          console.warn('Invalid fetchAllVocabularyLists response:', vrLists3.error);
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
          console.warn('Invalid fetchReviewQueue response:', vrResp.error);
        }
        return result;
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
          const reviewResponse = await browser.runtime.sendNativeMessage(payload);
          const vrReview = validators.validateResponse('submitReview', reviewResponse);
          if (!vrReview.valid) {
            console.warn('Invalid submitReview response:', vrReview.error);
          }


          if (reviewResponse.error) {
            return { success: false, error: reviewResponse.error };
          }

          return { 
            success: true, 
            data: reviewResponse.data 
          };
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
          console.warn('Invalid getPendingContextSearch response:', vrResp.error);
        }
        return result;
      }

      case MessageTypes.FETCH_RECENT_SEARCHES: {
        try {
          const payload = { action: "fetchRecentSearches" };
          const vrReq = validators.validateRequest('fetchRecentSearches', payload);
          if (!vrReq.valid) {
            return { success: false, error: `Invalid request: ${vrReq.error}` };
          }
          const response = await browser.runtime.sendNativeMessage(payload);
          const vrRecent = validators.validateResponse('fetchRecentSearches', response);
          if (!vrRecent.valid) {
            console.warn('Invalid fetchRecentSearches response:', vrRecent.error);
          }
          return { success: true, data: response.recentSearches || [] };
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
          const response = await browser.runtime.sendNativeMessage(payload);
          const vrSettings = validators.validateResponse('fetchSettings', response);
          if (!vrSettings.valid) {
            console.warn('Invalid fetchSettings response:', vrSettings.error);
          }
          return { success: true, data: response.settings || {
            theme: 'dark',
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }};
        } catch (error) {
          console.error('Failed to get settings:', error);
          // Return default settings on error
          return { success: true, data: {
            theme: 'dark',
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }};
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
          const response = await browser.runtime.sendNativeMessage(payload);
          const vrUpdateSettings = validators.validateResponse('updateSettings', response);
          if (!vrUpdateSettings.valid) {
            console.warn('Invalid updateSettings response:', vrUpdateSettings.error);
          }
          return { success: true, data: response.settings };
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
              console.warn('Invalid openPopupWithWord response:', vrResp.error);
            }
            return result;
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
