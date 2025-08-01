/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const { waitFor, waitForElement } = require('../helpers/wait-helpers');

describe('Popup Integration Tests', () => {
  let popupHTML;

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

      // Wait for word card to appear (this handles both debounce and async response)
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
      expect(definition.textContent).toContain('greeting');
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

    test('should save recent searches', async () => {
      // Initial state - no recent searches
      const recentSearchesList = document.querySelector('.recent-searches-list');
      expect(recentSearchesList.children.length).toBe(0);

      // Perform a search
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for search results to appear (confirming search completed)
      await waitForElement('.word-card', searchResults);

      // Navigate away and back to see recent searches
      // (Recent searches are loaded when the search tab is shown)
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();
      const searchTab = document.querySelector('[data-tab="search"]');
      searchTab.click();

      // Wait for recent search to appear in the list
      await waitFor(() => {
        const items = recentSearchesList.querySelectorAll('li');
        return items.length > 0 &&
               Array.from(items).some(item => item.textContent === 'hello');
      });

      // Verify the recent search is displayed
      const recentItems = recentSearchesList.querySelectorAll('li');
      expect(recentItems.length).toBeGreaterThan(0);
      expect(recentItems[0].textContent).toBe('hello');
    });

    test('should search when clicking on recent search item', async () => {
      // Set up initial recent searches
      await browser.storage.local.set({ recentSearches: ['previous', 'search'] });

      // Switch to a different tab and back to trigger reload of recent searches
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();
      const searchTab = document.querySelector('[data-tab="search"]');
      searchTab.click();

      // Wait for recent searches to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Click on a recent search item
      const recentItems = document.querySelectorAll('.recent-searches-list li');
      expect(recentItems.length).toBeGreaterThan(0);

      recentItems[0].click();

      // Check if search was triggered
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'lookup_word',
        word: 'previous'
      });

      // Check if search input was updated
      const searchInput = document.querySelector('.search-input');
      expect(searchInput.value).toBe('previous');
    });
  });

  describe('Tab navigation', () => {
    test('should switch between tabs', () => {
      // Initial state - search tab is active
      const searchTab = document.querySelector('[data-tab="search"]');
      const listsTab = document.querySelector('[data-tab="lists"]');
      const searchPanel = document.getElementById('search-tab');
      const listsPanel = document.getElementById('lists-tab');

      expect(searchTab.classList.contains('active')).toBe(true);
      expect(searchPanel.classList.contains('active')).toBe(true);
      expect(listsTab.classList.contains('active')).toBe(false);
      expect(listsPanel.classList.contains('active')).toBe(false);

      // Click lists tab
      listsTab.click();

      // Check state after switch
      expect(searchTab.classList.contains('active')).toBe(false);
      expect(searchPanel.classList.contains('active')).toBe(false);
      expect(listsTab.classList.contains('active')).toBe(true);
      expect(listsPanel.classList.contains('active')).toBe(true);
    });
  });

  describe('Lists management', () => {
    test('should create a new list', async () => {
      // Switch to lists tab
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      // Wait for tab to be active
      await waitFor(() => {
        const listTab = document.getElementById('lists-tab');
        return listTab.classList.contains('active');
      });

      // Click new list button to open dialog
      const newListBtn = document.getElementById('new-list-button');
      newListBtn.click();

      // Wait for dialog to appear
      await waitFor(() => {
        const dialog = document.getElementById('new-list-dialog');
        return dialog.style.display === 'flex';
      });

      // Fill in the dialog input
      const nameInput = document.getElementById('new-list-name');
      nameInput.value = 'My New List';
      nameInput.dispatchEvent(new Event('input'));

      // Click create button
      const createBtn = document.getElementById('confirm-new-list');
      createBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if create list was called
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'create_list',
        name: 'My New List'
      });

      // Check if lists were reloaded
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'get_lists'
      });

      // Check if dialog was closed
      const dialog = document.getElementById('new-list-dialog');
      expect(dialog.style.display).toBe('none');
    });

    test('should display lists and allow selection', async () => {
      // Set up test lists
      await browser.storage.local.set({
        vocab_lists: [
          {
            id: 'list1',
            name: 'Test List 1',
            words: { test: { word: 'test' } },
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          },
          {
            id: 'list2',
            name: 'Test List 2',
            words: {},
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        ]
      });

      // Switch to lists tab
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      // Wait for lists to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if lists are displayed
      const listItems = document.querySelectorAll('.list-item');
      expect(listItems.length).toBe(2);

      // Click on first list
      listItems[0].click();

      // Check if list is selected
      expect(listItems[0].classList.contains('selected')).toBe(true);

      // Check if words are displayed
      await new Promise(resolve => setTimeout(resolve, 100));
      const wordsContainer = document.querySelector('.words-in-list');
      expect(wordsContainer.textContent).toContain('Test List 1');
    });
  });

  describe('Add to list functionality', () => {
    test('should add word to default list', async () => {
      // Set up a default list
      await browser.storage.local.set({
        vocab_lists: [{
          id: 'default-list',
          name: 'My Words',
          isDefault: true,
          words: {},
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }]
      });

      // Search for a word
      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');
      searchInput.value = 'hello';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for search results to appear
      await waitForElement('.word-card', searchResults);

      // Click add to list button
      const addToListBtn = document.querySelector('.add-to-list-btn');
      expect(addToListBtn).toBeTruthy();
      addToListBtn.click();

      // Wait for success toast notification
      const toastContainer = document.querySelector('.toast-container');
      const successToast = await waitForElement('.toast.success', toastContainer);

      // Verify success message
      expect(successToast).toBeTruthy();
      expect(successToast.textContent).toContain('Added "hello" to My Words');
    });
  });

  describe('Lists Tab - Sorting and Filtering', () => {
    beforeEach(async () => {
      // Set up test data with multiple lists and words
      await browser.storage.local.set({
        vocab_lists: [{
          id: 'test-list-1',
          name: 'Test List',
          created: new Date().toISOString(),
          words: {
            hello: {
              word: 'hello',
              dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
              difficulty: 'easy',
              lastReviewed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            eloquent: {
              word: 'eloquent',
              dateAdded: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              difficulty: 'medium',
              lastReviewed: null
            },
            serendipity: {
              word: 'serendipity',
              dateAdded: new Date().toISOString(), // today
              difficulty: 'hard',
              lastReviewed: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
            },
            aesthetic: {
              word: 'aesthetic',
              dateAdded: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
              difficulty: 'easy',
              lastReviewed: null
            }
          }
        }]
      });
    });

    afterEach(async () => {
      // Reset filter and sort to defaults to prevent test interference
      const filterSelect = document.getElementById('filter-select');
      const sortSelect = document.getElementById('sort-select');

      if (filterSelect) {
        filterSelect.value = 'all';
        filterSelect.dispatchEvent(new Event('change'));

        // Wait for filter to be applied
        await waitFor(() => {
          const wordItems = document.querySelectorAll('.word-list-item');
          return wordItems.length === 4; // All words should be visible
        });
      }

      if (sortSelect) {
        sortSelect.value = 'recent';
        sortSelect.dispatchEvent(new Event('change'));

        // Wait for sort to be applied
        await waitFor(() => {
          const firstWord = document.querySelector('.word-list-word');
          return firstWord && firstWord.textContent === 'serendipity'; // Most recent word first
        });
      }
    });

    test('should display list and select it', async () => {
      // Switch to lists tab
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      // Wait for lists to load
      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      // Click on the list to select it
      const listItem = document.querySelector('.list-item');
      listItem.click();

      // Wait for words to load
      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Verify all words are displayed initially
      const wordItems = document.querySelectorAll('.word-list-word');
      expect(wordItems.length).toBe(4);
    });

    test('should sort words alphabetically', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Change sort to alphabetical
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'alphabetical';
      sortSelect.dispatchEvent(new Event('change'));

      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check order
      const wordItems = document.querySelectorAll('.word-list-word');
      expect(wordItems[0].textContent).toBe('aesthetic');
      expect(wordItems[1].textContent).toBe('eloquent');
      expect(wordItems[2].textContent).toBe('hello');
      expect(wordItems[3].textContent).toBe('serendipity');
    });

    test('should sort words by date added', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Change sort to date added
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'dateAdded';
      sortSelect.dispatchEvent(new Event('change'));

      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check order (newest first)
      const wordItems = document.querySelectorAll('.word-list-word');
      expect(wordItems[0].textContent).toBe('serendipity'); // today
      expect(wordItems[1].textContent).toBe('eloquent'); // 1 day ago
      expect(wordItems[2].textContent).toBe('hello'); // 2 days ago
      expect(wordItems[3].textContent).toBe('aesthetic'); // 3 days ago
    });

    test('should filter words by difficulty', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Filter by easy difficulty
      const filterSelect = document.getElementById('filter-select');
      filterSelect.value = 'easy';
      filterSelect.dispatchEvent(new Event('change'));

      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check only easy words are shown
      const wordItems = document.querySelectorAll('.word-list-word');
      expect(wordItems.length).toBe(2);
      expect(wordItems[0].textContent).toBe('hello');
      expect(wordItems[1].textContent).toBe('aesthetic');

      // Change filter to medium
      filterSelect.value = 'medium';
      filterSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      const mediumWords = document.querySelectorAll('.word-list-word');
      expect(mediumWords.length).toBe(1);
      expect(mediumWords[0].textContent).toBe('eloquent');

      // Reset to all
      filterSelect.value = 'all';
      filterSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      const allWords = document.querySelectorAll('.word-list-word');
      expect(allWords.length).toBe(4);
    });

    test('should apply both sorting and filtering together', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Filter by easy difficulty
      const filterSelect = document.getElementById('filter-select');
      filterSelect.value = 'easy';
      filterSelect.dispatchEvent(new Event('change'));

      // Sort alphabetically
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'alphabetical';
      sortSelect.dispatchEvent(new Event('change'));

      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check filtered and sorted results
      const wordItems = document.querySelectorAll('.word-list-word');
      expect(wordItems.length).toBe(2); // Only easy words
      expect(wordItems[0].textContent).toBe('aesthetic'); // First alphabetically
      expect(wordItems[1].textContent).toBe('hello'); // Second alphabetically
    });
  });

  describe('Enhanced UI/UX for Sorting and Filtering', () => {
    beforeEach(async () => {
      // Set up test vocabulary list
      await browser.storage.local.set({
        vocab_lists: [{
          id: 'test-list-1',
          name: 'Test List',
          created: new Date().toISOString(),
          words: {
            hello: {
              word: 'hello',
              dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
              difficulty: 'easy',
              lastReviewed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            eloquent: {
              word: 'eloquent',
              dateAdded: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              difficulty: 'medium',
              lastReviewed: null
            },
            serendipity: {
              word: 'serendipity',
              dateAdded: new Date().toISOString(), // today
              difficulty: 'hard',
              lastReviewed: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
            },
            aesthetic: {
              word: 'aesthetic',
              dateAdded: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
              difficulty: 'easy',
              lastReviewed: null
            }
          }
        }]
      });

      // Create lookup statistics by performing actual lookups
      // This simulates real user behavior instead of artificially setting storage

      // aesthetic: 1 lookup
      await browser.runtime.sendMessage({ type: 'lookup_word', word: 'aesthetic' });

      // eloquent: 2 lookups
      await browser.runtime.sendMessage({ type: 'lookup_word', word: 'eloquent' });
      await browser.runtime.sendMessage({ type: 'lookup_word', word: 'eloquent' });

      // hello: 5 lookups
      for (let i = 0; i < 5; i++) {
        await browser.runtime.sendMessage({ type: 'lookup_word', word: 'hello' });
      }

      // serendipity: 8 lookups
      for (let i = 0; i < 8; i++) {
        await browser.runtime.sendMessage({ type: 'lookup_word', word: 'serendipity' });
      }
    });

    test('should display lookup counts when sorting by lookup count', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Sort by lookup count
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'lookupCount';
      sortSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that lookup counts are displayed
      const wordItems = document.querySelectorAll('.word-list-item');
      wordItems.forEach(item => {
        const lookupCount = item.querySelector('.lookup-count');
        expect(lookupCount).toBeTruthy();
        expect(lookupCount.textContent).toMatch(/\d+ lookups?/);
      });

      // Verify sort order (ascending by default)
      const words = Array.from(document.querySelectorAll('.word-list-word')).map(el => el.textContent);
      expect(words[0]).toBe('aesthetic'); // 1 lookup
      expect(words[1]).toBe('eloquent'); // 2 lookups
      expect(words[2]).toBe('hello'); // 5 lookups
      expect(words[3]).toBe('serendipity'); // 8 lookups
    });

    test('should display date information when sorting by date', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Sort by date added
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'dateAdded';
      sortSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that date information is displayed
      const wordItems = document.querySelectorAll('.word-list-item');
      wordItems.forEach(item => {
        const dateInfo = item.querySelector('.date-added');
        expect(dateInfo).toBeTruthy();
        expect(dateInfo.textContent).toMatch(/Added: (today|yesterday|\d+ days ago)/);
      });
    });

    test('should display difficulty indicators clearly when sorting by difficulty', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Sort by difficulty
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'difficulty';
      sortSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that difficulty is prominently displayed
      const wordItems = document.querySelectorAll('.word-list-item');
      wordItems.forEach(item => {
        const difficultyBadge = item.querySelector('.difficulty-badge');
        expect(difficultyBadge).toBeTruthy();
        expect(difficultyBadge.textContent).toMatch(/^(Easy|Medium|Hard)$/);
      });

      // Verify sort order (easy to hard)
      const difficulties = Array.from(document.querySelectorAll('.difficulty-badge')).map(el => el.textContent);

      // Easy words first
      expect(difficulties[0]).toBe('Easy');
      expect(difficulties[1]).toBe('Easy');
      // Then medium
      expect(difficulties[2]).toBe('Medium');
      // Then hard
      expect(difficulties[3]).toBe('Hard');
    });

    test('should show sort direction indicator', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Reset sort to default (recent)
      const sortSelect = document.getElementById('sort-select');
      sortSelect.value = 'recent';
      sortSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that sort indicator is displayed
      const sortIndicator = document.getElementById('sort-indicator');
      expect(sortIndicator).toBeTruthy();

      // Default should be "Most Recent (newest first)"
      expect(sortIndicator.textContent).toContain('Most Recent');
      expect(sortIndicator.textContent).toContain('newest first');

      // Change to alphabetical
      sortSelect.value = 'alphabetical';
      sortSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(sortIndicator.textContent).toContain('Alphabetical');
      expect(sortIndicator.textContent).toContain('A-Z');
    });

    test('should show active filter status and result count', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Check initial result count
      const resultCount = document.getElementById('result-count');
      expect(resultCount).toBeTruthy();
      expect(resultCount.textContent).toBe('4 words');

      // Apply filter
      const filterSelect = document.getElementById('filter-select');
      filterSelect.value = 'easy';
      filterSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check filter indicator
      const filterIndicator = document.getElementById('filter-indicator');
      expect(filterIndicator).toBeTruthy();
      expect(filterIndicator.textContent).toContain('Easy difficulty only');

      // Check updated result count
      expect(resultCount.textContent).toBe('2 words');
    });

    test('should show status section when list is selected', async () => {
      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Check that status section is visible
      const listStatus = document.getElementById('list-status');
      expect(listStatus).toBeTruthy();
      expect(listStatus.style.display).not.toBe('none');
    });

    test('should correctly apply filter changes when list is already selected', async () => {
      // This test reproduces a real user scenario where filter changes might not apply

      // Switch to lists tab and select list
      const listsTab = document.querySelector('[data-tab="lists"]');
      listsTab.click();

      await waitFor(() => {
        const listItems = document.querySelectorAll('.list-item');
        return listItems.length > 0;
      });

      const listItem = document.querySelector('.list-item');
      listItem.click();

      await waitFor(() => {
        const wordItems = document.querySelectorAll('.word-list-item');
        return wordItems.length === 4;
      });

      // Apply easy filter
      const filterSelect = document.getElementById('filter-select');
      filterSelect.value = 'easy';
      filterSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify filter was applied
      let wordItems = document.querySelectorAll('.word-list-item');
      expect(wordItems.length).toBe(2);

      // Now change filter back to all
      filterSelect.value = 'all';
      filterSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify all words are shown again
      wordItems = document.querySelectorAll('.word-list-item');
      expect(wordItems.length).toBe(4);
    });
  });

  describe('Settings management', () => {
    test('should change theme', async () => {
      // Switch to settings tab
      const settingsTab = document.querySelector('[data-tab="settings"]');
      settingsTab.click();

      // Get theme selector
      const themeSelect = document.getElementById('theme-select');
      expect(themeSelect.value).toBe('dark');

      // Change theme to light
      themeSelect.value = 'light';
      themeSelect.dispatchEvent(new Event('change'));

      // Check if theme was applied
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // Check if setting was saved
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        settings: { theme: 'light' }
      });
    });

    test('should toggle auto-add setting', async () => {
      // Switch to settings tab
      const settingsTab = document.querySelector('[data-tab="settings"]');
      settingsTab.click();

      // Get auto-add toggle
      const autoAddToggle = document.getElementById('auto-add-toggle');
      expect(autoAddToggle.checked).toBe(true);

      // Toggle off
      autoAddToggle.click();

      // Check if setting was saved
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({ autoAddLookups: false })
      });
    });
  });
});
