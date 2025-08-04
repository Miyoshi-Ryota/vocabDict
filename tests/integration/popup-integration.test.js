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

  describe('Learning Mode', () => {
    beforeEach(async () => {
      // Setup test data using existing functionality
      // First create a list
      const createListResponse = await browser.runtime.sendMessage({
        type: 'create_list',
        name: 'Learning Test List'
      });

      expect(createListResponse.success).toBe(true);
      const listId = createListResponse.data.id;

      // Add words that exist in dictionary
      await browser.runtime.sendMessage({
        type: 'add_to_list',
        word: 'hello',
        listId
      });

      await browser.runtime.sendMessage({
        type: 'add_to_list',
        word: 'eloquent',
        listId
      });

      await browser.runtime.sendMessage({
        type: 'add_to_list',
        word: 'serendipity',
        listId
      });

      // Now manually update the words to have review dates
      // This is the only direct storage manipulation we need
      const result = await browser.storage.local.get('vocab_lists');
      const list = result.vocab_lists.find(l => l.id === listId);

      // Set review dates for testing
      list.words.hello.nextReview = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago - due
      list.words.hello.lastReviewed = new Date(Date.now() - 24 * 3600000).toISOString();

      list.words.eloquent.nextReview = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago - due
      list.words.eloquent.lastReviewed = new Date(Date.now() - 48 * 3600000).toISOString();

      list.words.serendipity.nextReview = new Date(Date.now() + 24 * 3600000).toISOString(); // Tomorrow - not due
      list.words.serendipity.lastReviewed = new Date(Date.now() - 72 * 3600000).toISOString();

      await browser.storage.local.set({ vocab_lists: result.vocab_lists });
    });

    test('should display review queue status on Learn tab', async () => {
      // Switch to learn tab
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      // Wait for review queue to load
      await waitFor(() => {
        const startBtn = document.querySelector('#start-review-btn');
        return startBtn && startBtn.textContent.includes('Start Review');
      });

      // Check start review button is displayed
      const startBtn = document.querySelector('#start-review-btn');
      expect(startBtn).toBeTruthy();
      expect(startBtn.textContent).toContain('Start Review Session');

      // Check review stats
      const container = document.querySelector('.learn-container');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('Words Due');
    });

    test('should display "All caught up" when no words due', async () => {
      // Clear existing data and set words with future review dates
      await browser.storage.local.set({
        vocab_lists: [{
          id: 'test-list-1',
          name: 'Test List',
          created: new Date().toISOString(),
          words: {
            serendipity: {
              word: 'serendipity',
              dateAdded: new Date().toISOString(),
              nextReview: new Date(Date.now() + 24 * 3600000).toISOString(), // Tomorrow
              difficulty: 'hard'
            },
            aesthetic: {
              word: 'aesthetic',
              dateAdded: new Date().toISOString(),
              nextReview: new Date(Date.now() + 48 * 3600000).toISOString(), // 2 days from now
              difficulty: 'medium'
            }
          }
        }]
      });

      // Switch to learn tab
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      // Wait for empty state to display
      await waitFor(() => {
        const container = document.querySelector('.learn-container');
        return container && container.textContent.includes('All caught up!');
      });

      const container = document.querySelector('.learn-container');
      expect(container.textContent).toContain('No words are due for review');
    });

    test('should start review session and display flashcard', async () => {
      // Switch to learn tab
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      // Wait for and click start button
      await waitFor(() => {
        const startBtn = document.querySelector('#start-review-btn');
        return startBtn !== null;
      });

      const startBtn = document.querySelector('#start-review-btn');
      startBtn.click();

      // Wait for flashcard to appear
      await waitFor(() => {
        const flashcard = document.querySelector('#flashcard');
        return flashcard !== null;
      });

      const flashcard = document.querySelector('#flashcard');
      expect(flashcard).toBeTruthy();
      expect(flashcard.classList.contains('flipped')).toBe(false);

      // Check front of card shows word (should be one of the due words)
      const frontContent = flashcard.querySelector('.flashcard-front .word-display');
      expect(['hello', 'eloquent']).toContain(frontContent.textContent);

      // Check progress indicator
      const progressText = document.querySelector('.progress-minimal');
      expect(progressText.textContent).toBe('1/2');
    });

    test('should flip card on click and show definition', async () => {
      // Start review session
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      await waitFor(() => document.querySelector('#start-review-btn'));
      document.querySelector('#start-review-btn').click();

      await waitFor(() => document.querySelector('#flashcard'));
      const flashcard = document.querySelector('#flashcard');

      // Click to flip
      flashcard.click();

      // Check card is flipped
      expect(flashcard.classList.contains('flipped')).toBe(true);

      // Check review actions are visible
      const reviewActions = document.querySelector('.review-actions');
      expect(reviewActions.classList.contains('visible')).toBe(true);

      // Check action buttons exist
      expect(document.getElementById('known-btn')).toBeTruthy();
      expect(document.getElementById('unknown-btn')).toBeTruthy();
      expect(document.getElementById('skip-btn')).toBeTruthy();
      expect(document.getElementById('mastered-btn')).toBeTruthy();

      // Check back of card shows definition from dictionary
      const backContent = flashcard.querySelector('.flashcard-back');
      const wordTitle = backContent.querySelector('.flashcard-word-title');
      expect(['hello', 'eloquent']).toContain(wordTitle.textContent);

      // Check pronunciation is shown
      const pronunciation = backContent.querySelector('.flashcard-pronunciation');
      expect(pronunciation).toBeTruthy();
      if (wordTitle.textContent === 'hello') {
        expect(pronunciation.textContent).toContain('/həˈloʊ/');
      } else if (wordTitle.textContent === 'eloquent') {
        expect(pronunciation.textContent).toContain('/ˈelˌəkwənt/');
      }
    });

    test('should handle review actions and progress to next word', async () => {
      // Start review
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      await waitFor(() => document.querySelector('#start-review-btn'));
      document.querySelector('#start-review-btn').click();

      await waitFor(() => document.querySelector('#flashcard'));

      // Get first word
      const firstWord = document.querySelector('.word-display').textContent;

      // Flip first card
      document.querySelector('#flashcard').click();

      // Click "known" button
      await waitFor(() => document.querySelector('#known-btn'));
      document.querySelector('#known-btn').click();

      // Should display second word
      await waitFor(() => {
        const wordDisplay = document.querySelector('.word-display');
        return wordDisplay && wordDisplay.textContent !== firstWord;
      });

      const secondWord = document.querySelector('.word-display').textContent;
      expect(['hello', 'eloquent']).toContain(secondWord);
      expect(secondWord).not.toBe(firstWord);

      // Check progress updated
      const progressText = document.querySelector('.progress-minimal');
      expect(progressText.textContent).toBe('2/2');
    });

    test('should complete session and show summary', async () => {
      // Start review
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      await waitFor(() => document.querySelector('#start-review-btn'));
      document.querySelector('#start-review-btn').click();

      // Complete first word
      await waitFor(() => document.querySelector('#flashcard'));
      document.querySelector('#flashcard').click();

      await waitFor(() => document.querySelector('#known-btn'));
      document.querySelector('#known-btn').click();

      // Complete second word
      await waitFor(() => {
        const progressText = document.querySelector('.progress-minimal');
        return progressText && progressText.textContent === '2/2';
      });

      document.querySelector('#flashcard').click();
      document.querySelector('#unknown-btn').click();

      // Wait for session complete screen
      await waitFor(() => {
        const container = document.querySelector('.learn-container');
        return container && container.textContent.includes('Session Complete!');
      });

      // Check summary stats
      const container = document.querySelector('.learn-container');
      expect(container.textContent).toContain('Words Reviewed:');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('Known:');
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('Learning:');
      expect(container.textContent).toContain('1');

      // Check completion buttons
      expect(document.getElementById('review-more-btn')).toBeTruthy();
      expect(document.getElementById('finish-session-btn')).toBeTruthy();
    });

    test('should handle keyboard shortcuts for review actions', async () => {
      // Start review
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      await waitFor(() => document.querySelector('#start-review-btn'));
      document.querySelector('#start-review-btn').click();

      await waitFor(() => document.querySelector('#flashcard'));

      // Test space key to flip
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(spaceEvent);

      await waitFor(() => {
        const flashcard = document.getElementById('flashcard');
        return flashcard && flashcard.classList.contains('flipped');
      });

      // Wait for actions to be visible
      await waitFor(() => {
        const actions = document.querySelector('.review-actions');
        return actions && actions.classList.contains('visible');
      });

      // Test keyboard shortcut '1' for 'known' action
      const key1Event = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(key1Event);

      // Should advance the session (either to next word or complete)
      await waitFor(() => {
        const progressText = document.querySelector('.progress-text');
        const sessionComplete = document.querySelector('.session-complete');

        // Either should show progress to second word or complete the session
        return (progressText && progressText.textContent.trim() === '2 of 2') ||
               (sessionComplete !== null);
      });
    });

    test('should update nextReview date after review action', async () => {
      // Start review
      const learnTab = document.querySelector('[data-tab="learn"]');
      learnTab.click();

      await waitFor(() => document.querySelector('#start-review-btn'));
      document.querySelector('#start-review-btn').click();

      await waitFor(() => document.querySelector('#flashcard'));

      // Get the word being reviewed
      const wordDisplay = document.querySelector('.word-display').textContent;

      // Flip and mark as known
      document.querySelector('#flashcard').click();
      await waitFor(() => document.querySelector('#known-btn'));
      document.querySelector('#known-btn').click();

      // Wait for action to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that the word's nextReview was updated in storage
      const result = await browser.storage.local.get('vocab_lists');
      const list = result.vocab_lists[0];
      const reviewedWord = list.words[wordDisplay];

      // nextReview should be updated to a future date
      expect(new Date(reviewedWord.nextReview)).toBeInstanceOf(Date);
      expect(new Date(reviewedWord.nextReview).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Context Menu Integration', () => {
    test('should display lookup results when popup opens after context menu action', async () => {
      // Simulate user right-clicking on "serendipity" and selecting "Look up in VocabDict"
      await browser.contextMenus.simulateClick({
        menuItemId: 'lookup-vocabdict',
        selectionText: 'serendipity'
      });

      // browser.action.openPopup will trigger DOMContentLoaded automatically
      // Wait for the popup to initialize and display results
      const searchResults = document.querySelector('.search-results');
      const wordCard = await waitForElement('.word-card', searchResults);

      expect(wordCard).toBeTruthy();

      // Verify the word from context menu is displayed
      const wordTitle = wordCard.querySelector('.word-title');
      expect(wordTitle.textContent).toBe('serendipity');

      // Verify the search input shows the context menu word
      const searchInput = document.querySelector('.search-input');
      expect(searchInput.value).toBe('serendipity');

      // Verify recent searches are hidden when showing results
      const recentSearches = document.querySelector('.recent-searches');
      expect(recentSearches.style.display).toBe('none');
    });
  });
});
