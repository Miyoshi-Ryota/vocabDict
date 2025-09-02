/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const { waitFor, waitForElement } = require('../helpers/wait-helpers');
const DictionaryService = require('../../src/services/dictionary-service');
const VocabularyList = require('../../src/services/vocabulary-list');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Popup Integration Tests', () => {
  let popupHTML;
  let dictionary;
  let mockList;

  beforeEach(() => {
    // Load actual popup HTML
    popupHTML = fs.readFileSync(
      path.join(__dirname, '../../src/popup/popup.html'),
      'utf8'
    );

    // Also load CSS for computed styles
    const popupCSS = fs.readFileSync(
      path.join(__dirname, '../../src/popup/popup.css'),
      'utf8'
    );
    const style = document.createElement('style');
    style.innerHTML = popupCSS;
    document.head.appendChild(style);

    document.body.innerHTML = popupHTML;
    
    // Setup dictionary and mock list
    dictionary = new DictionaryService(dictionaryData);
    mockList = new VocabularyList('My Vocabulary', dictionary, true);
    
    // Mock native messages and browser runtime
    browser.runtime.sendNativeMessage.mockImplementation((message) => {
      if (message.action === 'fetchAllVocabularyLists') {
        return Promise.resolve({ 
          vocabularyLists: [mockList.toJSON()]
        });
      }
      if (message.action === 'addWordToVocabularyList') {
        const wordEntry = {
          word: message.word,
          dateAdded: new Date().toISOString(),
          difficulty: message.metadata?.difficulty || 5000,
          customNotes: message.metadata?.customNotes || '',
          lastReviewed: null,
          nextReview: new Date(Date.now() + 86400000).toISOString(),
          reviewHistory: []
        };
        mockList.words[message.word.toLowerCase()] = wordEntry;
        return Promise.resolve({ 
          success: true,
          data: wordEntry
        });
      }
      if (message.action === 'getRecentSearches') {
        return Promise.resolve({ recentSearches: [] });
      }
      if (message.action === 'addRecentSearch') {
        return Promise.resolve({ success: true });
      }
      if (message.action === 'fetchSettings') {
        return Promise.resolve({ 
          settings: {
            theme: 'dark',
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }
        });
      }
      return Promise.resolve({ success: true });
    });
    
    browser.runtime.sendMessage.mockImplementation((message) => {
      if (message.action === 'lookupWord') {
        const result = dictionary.getDictionaryData(message.word);
        if (result) {
          return Promise.resolve({ success: true, data: result });
        }
        const suggestions = dictionary.fuzzyMatch(message.word, 5);
        if (suggestions.length > 0) {
          return Promise.resolve({ success: true, data: null, suggestions });
        }
        return Promise.resolve({ success: false, error: 'Word not found' });
      }
      if (message.action === 'getLists') {
        return Promise.resolve({ success: true, data: [mockList.toJSON()] });
      }
      if (message.action === 'addToList') {
        return browser.runtime.sendNativeMessage({
          action: 'addWordToVocabularyList',
          listId: message.listId,
          word: message.word,
          metadata: message.metadata || {}
        }).then(response => {
          if (response.error) {
            return { success: false, error: response.error };
          }
          return { success: true, data: response.data };
        });
      }
      if (message.action === 'getRecentSearches') {
        return browser.runtime.sendNativeMessage({ action: 'fetchRecentSearches' })
          .then(response => ({ success: true, data: response.recentSearches || [] }));
      }
      if (message.action === 'getSettings') {
        return browser.runtime.sendNativeMessage({ action: 'fetchSettings' })
          .then(response => ({ success: true, data: response.settings }));
      }
      if (message.action === 'getReviewQueue') {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true });
    });

    // Load popup JS
    require('../../src/popup/popup.js');

    // Trigger DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  });

  describe('Search functionality', () => {
    test('should search for a word and display results', async () => {
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');

      // Type in search input
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for word card to appear
      const wordCard = await waitForElement('.word-card', searchResults);
      expect(wordCard).toBeTruthy();

      // Verify the correct word is displayed
      const wordTitle = wordCard.querySelector('.word-title');
      expect(wordTitle.textContent).toBe('hello');

      // Check pronunciation is displayed
      const pronunciation = wordCard.querySelector('.word-pronunciation');
      expect(pronunciation).toBeTruthy();
      expect(pronunciation.textContent).toContain('/həˈloʊ/');

      // Check definition is displayed
      const definition = wordCard.querySelector('.word-definition');
      expect(definition).toBeTruthy();
      expect(definition.textContent).toContain('挨拶');
    });

    test('should handle search with no results', async () => {
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');

      // Search for non-existent word
      searchInput.value = 'xyzabc123notaword';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for error message to appear
      const errorMessage = await waitForElement('.error-message', searchResults);
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Word not found');
    });

    test('should clear search when input is empty', async () => {
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');

      // First search for a word
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for results
      await waitForElement('.word-card', searchResults);

      // Clear search
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for results to clear
      await waitFor(() => {
        const cards = searchResults.querySelectorAll('.word-card');
        return cards.length === 0;
      });

      expect(searchResults.querySelector('.word-card')).toBeNull();
    });
  });

  describe('Tab navigation', () => {
    test('should switch to lists tab when clicked', async () => {
      const listsTab = document.querySelector('[data-tab="lists"]');
      const listsContent = document.querySelector('#lists-tab');

      // Initially lists tab should be hidden
      expect(listsContent.classList.contains('active')).toBe(false);

      // Click lists tab
      listsTab.click();

      // Wait for tab to become active
      await waitFor(() => listsContent.classList.contains('active'));

      expect(listsContent.classList.contains('active')).toBe(true);
      expect(listsTab.classList.contains('active')).toBe(true);
    });

    test('should switch to learn tab when clicked', async () => {
      const learnTab = document.querySelector('[data-tab="learn"]');
      const learnContent = document.querySelector('#learn-tab');

      // Click learn tab
      learnTab.click();

      // Wait for tab to become active
      await waitFor(() => learnContent.classList.contains('active'));

      expect(learnContent.classList.contains('active')).toBe(true);
      expect(learnTab.classList.contains('active')).toBe(true);
    });

    test('should switch to settings tab when clicked', async () => {
      const settingsTab = document.querySelector('[data-tab="settings"]');
      const settingsContent = document.querySelector('#settings-tab');

      // Click settings tab
      settingsTab.click();

      // Wait for tab to become active
      await waitFor(() => settingsContent.classList.contains('active'));

      expect(settingsContent.classList.contains('active')).toBe(true);
      expect(settingsTab.classList.contains('active')).toBe(true);
    });
  });

  describe('Add to list functionality', () => {
    test('should show add to list button on word card', async () => {
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');

      // Search for a word
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for word card
      const wordCard = await waitForElement('.word-card', searchResults);
      
      // Check for add button with correct class name
      const addButton = wordCard.querySelector('.add-to-list-btn');
      expect(addButton).toBeTruthy();
    });

    test('should add word to list when button is clicked', async () => {
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');

      // Search for a word
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for word card
      const wordCard = await waitForElement('.word-card', searchResults);
      
      // Click add button with correct class name
      const addButton = wordCard.querySelector('.add-to-list-btn');
      addButton.click();

      // Wait for the word to be added (button should change)
      await waitFor(() => {
        return browser.runtime.sendMessage.mock.calls.some(
          call => call[0].action === 'addToList' && call[0].word === 'hello'
        );
      });

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'addToList',
          word: 'hello'
        })
      );
    });
  });

  describe('Dark/Light theme toggle', () => {
    test('should toggle theme when changing theme select', async () => {
      // Switch to settings tab
      const settingsTab = document.querySelector('[data-tab="settings"]');
      settingsTab.click();

      // Wait for settings tab to be active
      await waitFor(() => document.querySelector('#settings-tab').classList.contains('active'));

      // Find theme select element
      const themeSelect = document.querySelector('#theme-select');
      expect(themeSelect).toBeTruthy();

      // Record initial theme and style values
      const initialTheme = document.documentElement.getAttribute('data-theme');
      const initialBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-primary')
        .trim();

      // Change theme by updating select value
      themeSelect.value = initialTheme === 'dark' ? 'light' : 'dark';
      const changeEvent = new Event('change', { bubbles: true });
      themeSelect.dispatchEvent(changeEvent);

      // Wait for theme attribute to change
      await waitFor(() => document.documentElement.getAttribute('data-theme') !== initialTheme);

      const newTheme = document.documentElement.getAttribute('data-theme');
      const newBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-primary')
        .trim();

      expect(newTheme).not.toBe(initialTheme);
      expect(newBg).not.toBe(initialBg);
    });
  });
});