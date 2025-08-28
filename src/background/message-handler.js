const VocabularyList = require('../services/vocabulary-list');

const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  GET_LIST_WORDS: 'get_list_words',
  CREATE_LIST: 'create_list',
  UPDATE_WORD: 'update_word',  // どこでも使われてないかも？不要？
  GET_REVIEW_QUEUE: 'get_review_queue',
  SUBMIT_REVIEW: 'submit_review',
  PROCESS_REVIEW: 'process_review',  // 追加
  GET_PENDING_CONTEXT_SEARCH: 'get_pending_context_search',
  GET_RECENT_SEARCHES: 'get_recent_searches',
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTINGS: 'update_settings',
  OPEN_POPUP_WITH_WORD: 'open_popup_with_word'
};

/**
 * Handle messages from popup or content script
 * @param {Object} message - Message object
 * @param {Object} services - Service instances (dictionary, storage)
 * @returns {Promise<Object>} Response object
 */
async function handleMessage(message, services) {
  const { dictionary, storage, popupWordState } = services;

  try {
    switch (message.type) {
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

      case MessageTypes.ADD_TO_LIST: {
        if (!message.word || !message.listId) {
          return { success: false, error: 'Word and listId are required' };
        }

        // Check if word exists in dictionary
        const wordData = await dictionary.lookup(message.word);
        if (!wordData) {
          return { success: false, error: 'Word not found in dictionary' };
        }

        try {
          // Send to native handler to add word to SwiftData/CloudKit
          const response = await browser.runtime.sendNativeMessage({ 
            action: "addWordToList",
            listId: message.listId,
            word: message.word,
            metadata: message.metadata || {}
          });

          if (response.error) {
            return { success: false, error: response.error };
          }

          return { success: true, data: response.data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.GET_LISTS: {
        console.log("Fetching vocabulary lists from native messaging");
        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        console.log("Received vocabulary lists:", response);
        return { success: true, data: response.vocabularyLists || [] };
      }

      case MessageTypes.GET_LIST_WORDS: {
        if (!message.listId) {
          return { success: false, error: 'ListId is required' };
        }

        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
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

        return { success: true, data: enhancedWords };
      }

      case MessageTypes.CREATE_LIST: {
        if (!message.name) {
          return { success: false, error: 'List name is required' };
        }

        const trimmedName = message.name.trim();
        if (!trimmedName) {
          return { success: false, error: 'List name cannot be empty' };
        }

        const response = await browser.runtime.sendNativeMessage({ 
          action: "createVocabularyList",
          name: trimmedName,
          isDefault: message.isDefault || false
        });
        
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
          const response = await browser.runtime.sendNativeMessage({
            action: "updateWord",
            listId: message.listId,
            word: message.word,
            updates: message.updates
          });

          if (response.error) {
            return { success: false, error: response.error };
          }

          return { success: true, data: response.data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.GET_REVIEW_QUEUE: {
        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
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

        return { success: true, data: queue };
      }

      case MessageTypes.SUBMIT_REVIEW: {

        if (!message.listId || !message.word || !message.reviewResult) {
          return { success: false, error: 'ListId, word, and reviewResult are required' };
        }

        try {
          // Simply forward to native submitReview
          const reviewResponse = await browser.runtime.sendNativeMessage({
            action: "submitReview",
            listId: message.listId,
            word: message.word,
            result: message.reviewResult,
            timeSpent: message.timeSpent || 0.0
          });


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

      case MessageTypes.PROCESS_REVIEW: {
        const { word, result, listId } = message;

        if (!word || !result || !listId) {
          return { success: false, error: 'Word, result, and listId are required' };
        }

        try {
          // Simply forward to native submitReview
          const reviewResponse = await browser.runtime.sendNativeMessage({
            action: "submitReview",
            listId: listId,
            word: word,
            result: result,
            timeSpent: 0.0
          });


          if (reviewResponse.error) {
            return { success: false, error: reviewResponse.error };
          }

          return { 
            success: true, 
            data: reviewResponse.data 
          };
        } catch (error) {
          console.error('Process review error:', error);
          return { success: false, error: error.message };
        }
      }

      case MessageTypes.GET_PENDING_CONTEXT_SEARCH: {
        if (!popupWordState) {
          return { success: false, error: 'Popup word state not available' };
        }

        const pendingWord = popupWordState.getPendingSearch();
        return { success: true, data: pendingWord };
      }

      case MessageTypes.GET_RECENT_SEARCHES: {
        try {
          const response = await browser.runtime.sendNativeMessage({
            action: "getRecentSearches"
          });
          return { success: true, data: response.recentSearches || [] };
        } catch (error) {
          console.error('Failed to get recent searches:', error);
          return { success: true, data: [] };
        }
      }

      case MessageTypes.GET_SETTINGS: {
        try {
          const response = await browser.runtime.sendNativeMessage({
            action: "getSettings"
          });
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
          const response = await browser.runtime.sendNativeMessage({
            action: "updateSettings",
            settings: message.settings
          });
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
            return { success: true, data: { popupOpened: true } };
          } catch (error) {
            console.error('Failed to open popup:', error);
            return { success: false, error: 'Failed to open popup' };
          }
        } else {
          return { success: false, error: 'Popup opening not supported' };
        }
      }

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
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
