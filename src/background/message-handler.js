const VocabularyList = require('../services/vocabulary-list');
const SpacedRepetition = require('../services/spaced-repetition');

const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  GET_LIST_WORDS: 'get_list_words',
  CREATE_LIST: 'create_list',
  UPDATE_WORD: 'update_word',  // どこでも使われてないかも？不要？
  GET_REVIEW_QUEUE: 'get_review_queue',
  SUBMIT_REVIEW: 'submit_review',
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

        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        const lists = response.vocabularyLists || [];
        const listIndex = lists.findIndex(l => l.id === message.listId);

        if (listIndex === -1) {
          return { success: false, error: 'List not found' };
        }

        const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
        const updated = list.updateWord(message.word, message.updates);

        if (!updated) {
          return { success: false, error: 'Word not found in list' };
        }

        lists[listIndex] = list.toJSON();
        await storage.set('vocab_lists', lists);

        return { success: true, data: updated };
      }

      case MessageTypes.GET_REVIEW_QUEUE: {
        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        const lists = response.vocabularyLists || [];
        const maxWords = message.maxWords || 30;

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

        // Use SpacedRepetition service to get review queue
        const queue = SpacedRepetition.getReviewQueue(allWords, maxWords);

        return { success: true, data: queue };
      }

      case MessageTypes.SUBMIT_REVIEW: {
        if (!message.listId || !message.word || !message.reviewResult) {
          return { success: false, error: 'ListId, word, and reviewResult are required' };
        }

        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        const lists = response.vocabularyLists || [];
        const listIndex = lists.findIndex(l => l.id === message.listId);

        if (listIndex === -1) {
          return { success: false, error: 'List not found' };
        }

        const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
        const wordData = list.getWord(message.word);

        if (!wordData) {
          return { success: false, error: 'Word not found in list' };
        }

        // Calculate intervals using SpacedRepetition service
        const currentInterval = SpacedRepetition.getCurrentInterval(wordData.lastReviewed);
        const nextInterval = SpacedRepetition.calculateNextReview(currentInterval, message.reviewResult);

        // Handle mastered words
        if (nextInterval === null) {
          // Remove from active reviews by setting nextReview to null
          const updates = {
            lastReviewed: new Date().toISOString(),
            nextReview: null,
            reviewHistory: [...(wordData.reviewHistory || []), {
              date: new Date().toISOString(),
              result: message.reviewResult,
              timeSpent: message.timeSpent || 0
            }]
          };

          list.updateWord(message.word, updates);
        } else {
          // Calculate next review date
          const nextReviewDate = SpacedRepetition.getNextReviewDate(nextInterval);

          const updates = {
            lastReviewed: new Date().toISOString(),
            nextReview: nextReviewDate.toISOString(),
            reviewHistory: [...(wordData.reviewHistory || []), {
              date: new Date().toISOString(),
              result: message.reviewResult,
              timeSpent: message.timeSpent || 0
            }]
          };

          list.updateWord(message.word, updates);
        }

        lists[listIndex] = list.toJSON();
        await storage.set('vocab_lists', lists);

        return { success: true, data: { nextInterval } };
      }

      case 'get_review_queue': {
        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        const lists = response.vocabularyLists || [];
        const SpacedRepetition = require('../services/spaced-repetition');

        // Collect all words from all lists that need review
        let allWords = [];

        for (const listData of lists) {
          const list = VocabularyList.fromJSON(listData, dictionary);
          const listWords = await list.getWords();

          // Add list ID to each word for reference
          const wordsWithListId = listWords.map(word => ({
            ...word,
            listId: listData.id
          }));

          allWords = allWords.concat(wordsWithListId);
        }

        // Get words due for review using SpacedRepetition service
        const dueWords = SpacedRepetition.getReviewQueue(allWords);

        // Enhance with dictionary data
        const enhancedWords = dueWords.map(word => {
          const dictEntry = dictionary.lookup(word.word);
          return {
            ...word,
            ...dictEntry // Merge in pronunciation, definitions, synonyms, etc.
          };
        }).filter(word => word.word); // Filter out words not found in dictionary

        return { success: true, data: enhancedWords };
      }

      case 'process_review': {
        const { word, result, listId } = message;
        const SpacedRepetition = require('../services/spaced-repetition');

        if (!word || !result) {
          return { success: false, error: 'Word and result are required' };
        }

        const response = await browser.runtime.sendNativeMessage({ action: "getVocabularyLists" });
        const lists = response.vocabularyLists || [];
        const listIndex = lists.findIndex(l => l.id === listId);

        if (listIndex === -1) {
          return { success: false, error: 'List not found' };
        }

        const list = VocabularyList.fromJSON(lists[listIndex], dictionary);
        const wordData = list.getWord(word);

        if (!wordData) {
          return { success: false, error: 'Word not found in list' };
        }

        // Calculate next review interval
        const currentInterval = SpacedRepetition.getCurrentInterval(wordData.lastReviewed);
        const nextInterval = SpacedRepetition.calculateNextReview(currentInterval, result);

        // Update word data
        const now = new Date().toISOString();
        const updates = {
          lastReviewed: now,
          reviewHistory: [...(wordData.reviewHistory || []), {
            date: now,
            result,
            timeSpent: 0 // Could be enhanced to track actual time
          }]
        };

        // Set next review date
        if (nextInterval !== null) {
          updates.nextReview = SpacedRepetition.getNextReviewDate(nextInterval).toISOString();
        } else {
          // Mastered - remove from review queue
          updates.nextReview = null;
        }

        list.updateWord(word, updates);
        lists[listIndex] = list.toJSON();
        await storage.set('vocab_lists', lists);

        return { success: true, data: { nextInterval, nextReview: updates.nextReview } };
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
