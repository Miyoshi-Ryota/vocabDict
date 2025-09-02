/******/ (() => { // webpackBootstrap
/*!****************************!*\
  !*** ./src/popup/popup.js ***!
  \****************************/
// Popup script for VocabDict Safari Extension

// Browser API compatibility - MUST be first
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = chrome;
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Initialize managers
  ThemeManager.init();
  TabManager.init();
});

// Theme Management
const ThemeManager = {
  init() {
    this.loadTheme();
    this.setupThemeListeners();
  },
  loadTheme() {
    // Check for saved theme preference
    browser.runtime.sendMessage({
      action: 'getSettings'
    }).then(response => {
      if (response.success) {
        const theme = response.data.theme || 'dark';
        this.applyTheme(theme);

        // Update theme selector if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
          themeSelect.value = theme;
        }
      }
    });
  },
  applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  },
  setupThemeListeners() {
    // Listen for theme selector changes
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', async e => {
        const theme = e.target.value;
        this.applyTheme(theme);

        // Save preference
        await browser.runtime.sendMessage({
          action: 'updateSettings',
          settings: {
            theme
          }
        });
      });
    }
  }
};

// Tab Navigation
const TabManager = {
  init() {
    this.setupTabListeners();
    this.showTab('search'); // Default tab
  },
  setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.showTab(tabName);
      });
    });
  },
  showTab(tabName) {
    // Update buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive);
    });

    // Update panels
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
      const isActive = panel.id === `${tabName}-tab`;
      panel.classList.toggle('active', isActive);
    });

    // Initialize tab-specific content
    switch (tabName) {
      case 'search':
        SearchTab.init();
        break;
      case 'lists':
        ListsTab.init();
        break;
      case 'learn':
        LearnTab.init();
        break;
      case 'settings':
        SettingsTab.init();
        break;
    }
  }
};

// Search Tab
const SearchTab = {
  searchTimeout: null,
  recentSearches: [],
  init() {
    this.setupSearchInput();
    this.loadRecentSearches();
    this.checkPendingContextSearch();
  },
  async checkPendingContextSearch() {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getPendingContextSearch'
      });
      if (response.success && response.data) {
        const word = response.data;

        // Set the search input value
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = word;
        }

        // Perform the search using the normal flow
        this.performSearch(word);
      }
    } catch (error) {
      console.error('Failed to check pending context search:', error);
    }
  },
  setupSearchInput() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', e => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      if (query.length === 0) {
        this.clearSearchResults();
        return;
      }

      // Debounce search
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        clearTimeout(this.searchTimeout);
        const query = e.target.value.trim();
        if (query) {
          this.performSearch(query);
        }
      }
    });
  },
  async performSearch(query) {
    try {
      // Send search request to background
      const response = await browser.runtime.sendMessage({
        action: 'lookupWord',
        word: query
      });
      if (response.success) {
        if (response.data) {
          this.displaySearchResult(response.data);
          // Reload recent searches to show the new search immediately
          await this.loadRecentSearches();
        } else {
          this.displayNoResults(query, response.suggestions);
        }
      } else {
        this.displayError(response.error);
      }
    } catch (error) {
      console.error('Search error:', error);
      this.displayError('Failed to search. Please try again.');
    }
  },
  displaySearchResult(wordData) {
    const resultsContainer = document.querySelector('.search-results');
    const recentSearches = document.querySelector('.recent-searches');

    // Hide recent searches when showing search results
    if (recentSearches) {
      recentSearches.style.display = 'none';
    }

    // Add class to enable flex growth
    resultsContainer.classList.add('has-content');
    resultsContainer.innerHTML = `
      <div class="word-card">
        <div class="word-header">
          <div class="word-info">
            <div class="word-title">${wordData.word}</div>
            <div class="word-pronunciation">${wordData.pronunciation}</div>
          </div>
          <button class="add-to-list-btn" title="Add to list">📚</button>
        </div>
        ${wordData.definitions.map(def => `
          <div class="definition-section">
            <div class="word-part-of-speech">${def.partOfSpeech}</div>
            <div class="word-definition">${def.meaning}</div>
            ${def.examples.length > 0 ? `
              <div class="word-examples">
                <h4>Examples:</h4>
                <ul>
                  ${def.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
        ${wordData.synonyms.length > 0 ? `
          <div class="word-synonyms">
            <strong>Synonyms:</strong> ${wordData.synonyms.join(', ')}
          </div>
        ` : ''}
        ${wordData.antonyms.length > 0 ? `
          <div class="word-synonyms">
            <strong>Antonyms:</strong> ${wordData.antonyms.join(', ')}
          </div>
        ` : ''}
      </div>
    `;

    // Add event listener for "Add to List" button
    const addButton = resultsContainer.querySelector('.add-to-list-btn');
    addButton.addEventListener('click', () => this.addToList(wordData));
  },
  displayNoResults(query, suggestions = []) {
    const resultsContainer = document.querySelector('.search-results');
    const recentSearches = document.querySelector('.recent-searches');

    // Hide recent searches when showing search results
    if (recentSearches) {
      recentSearches.style.display = 'none';
    }

    // Add class to enable flex growth
    resultsContainer.classList.add('has-content');
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No results found for "<strong>${query}</strong>"</p>
        ${suggestions.length > 0 ? `
          <p class="small-text">Did you mean:</p>
          <ul class="suggestions-list">
            ${suggestions.map(s => `
              <li><a href="#" data-suggestion="${s}">${s}</a></li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    `;

    // Add click handlers for suggestions
    resultsContainer.querySelectorAll('[data-suggestion]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const suggestion = e.target.dataset.suggestion;
        document.querySelector('.search-input').value = suggestion;
        this.performSearch(suggestion);
      });
    });
  },
  displayError(error) {
    const resultsContainer = document.querySelector('.search-results');
    const recentSearches = document.querySelector('.recent-searches');

    // Hide recent searches when showing error
    if (recentSearches) {
      recentSearches.style.display = 'none';
    }

    // Add class to enable flex growth
    resultsContainer.classList.add('has-content');
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>Error: ${error}</p>
      </div>
    `;
  },
  clearSearchResults() {
    const resultsContainer = document.querySelector('.search-results');
    const recentSearches = document.querySelector('.recent-searches');
    resultsContainer.innerHTML = '';

    // Remove class to disable flex growth
    resultsContainer.classList.remove('has-content');

    // Show recent searches when clearing results
    if (recentSearches) {
      recentSearches.style.display = 'block';
    }
  },
  async addToList(wordData) {
    try {
      // Get default list
      const listsResponse = await browser.runtime.sendMessage({
        action: 'getLists'
      });
      const lists = listsResponse.success ? listsResponse.data : [];
      const defaultList = lists.find(l => l.isDefault) || lists[0];
      if (!defaultList) {
        NotificationManager.show('No vocabulary lists found', 'error');
        return;
      }

      // Send add to list request
      const addResponse = await browser.runtime.sendMessage({
        action: 'addToList',
        word: wordData.word,
        listId: defaultList.id
      });
      if (addResponse.success) {
        NotificationManager.show(`Added "${wordData.word}" to ${defaultList.name}`, 'success');
      } else {
        NotificationManager.show(addResponse.error || 'Failed to add word', 'error');
      }
    } catch (error) {
      console.error('Add to list error:', error);
      NotificationManager.show('Failed to add word to list', 'error');
    }
  },
  async loadRecentSearches() {
    const response = await browser.runtime.sendMessage({
      action: 'getRecentSearches'
    });
    if (response.success) {
      this.recentSearches = response.data;
      this.displayRecentSearches();
    }
  },
  displayRecentSearches() {
    const container = document.querySelector('.recent-searches-list');
    if (!container || this.recentSearches.length === 0) return;
    container.innerHTML = this.recentSearches.slice(0, 5).map(search => `<li data-search="${search}">${search}</li>`).join('');

    // Add click handlers
    container.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        const search = item.dataset.search;
        document.querySelector('.search-input').value = search;
        this.performSearch(search);
      });
    });
  }
};

// Lists Tab
const ListsTab = {
  currentListId: null,
  currentList: null,
  currentSort: 'recent',
  currentFilter: 'all',
  init() {
    this.loadLists();
    this.setupListControls();
  },
  async loadLists() {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getLists'
      });
      if (response.success) {
        this.displayLists(response.data);
      }
    } catch (error) {
      console.error('Load lists error:', error);
    }
  },
  displayLists(lists) {
    const container = document.querySelector('.lists-container');
    if (lists.length === 0) {
      container.innerHTML = '<p class="text-center">No vocabulary lists yet</p>';
      return;
    }
    container.innerHTML = lists.map(list => `
      <div class="list-item" data-list-id="${list.id}">
        <div class="list-item-header">
          <span class="list-icon">📁</span>
          <span class="list-name">${list.name}</span>
          <span class="list-count">${Object.keys(list.words).length} words</span>
        </div>
        <div class="list-updated">Last updated: ${this.formatDate(list.updated || list.created)}</div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', () => {
        const listId = item.dataset.listId;
        this.selectList(listId);
      });
    });
  },
  selectList(listId) {
    // Update UI
    document.querySelectorAll('.list-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.listId === listId);
    });
    this.currentListId = listId;
    this.loadListWords(listId);
  },
  async loadListWords(listId) {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getLists'
      });
      if (response.success) {
        const list = response.data.find(l => l.id === listId);
        if (list) {
          this.currentList = list;
          this.displayListWords(list);
        }
      }
    } catch (error) {
      console.error('Load list words error:', error);
    }
  },
  refreshWordsList() {
    if (this.currentList) {
      this.displayListWords(this.currentList);
    }
  },
  async displayListWords(list) {
    const container = document.querySelector('.words-in-list');
    try {
      // Get sorted and filtered words from background
      const sortBy = this.currentSort === 'recent' ? 'dateAdded' : this.currentSort;
      let sortOrder = 'asc';

      // Use desc order for date-based sorting to show newest first
      if (sortBy === 'dateAdded' || sortBy === 'lastReviewed') {
        sortOrder = 'desc';
      }
      const response = await browser.runtime.sendMessage({
        action: 'getListWords',
        listId: list.id,
        sortBy,
        sortOrder,
        filterBy: this.currentFilter
      });
      if (!response.success) {
        container.innerHTML = '<p class="text-center">Error loading words</p>';
        return;
      }
      const words = response.data || [];

      // Show status section
      this.updateStatusSection(words.length);
      if (words.length === 0) {
        container.innerHTML = '<p class="text-center">No words in this list</p>';
        return;
      }
      container.innerHTML = `
        <h3 class="section-title">Words in "${list.name}"</h3>
        ${words.map(word => this.renderWordItem(word)).join('')}
      `;
    } catch (error) {
      console.error('Error displaying words:', error);
      container.innerHTML = '<p class="text-center">Error loading words</p>';
    }
  },
  updateStatusSection(wordCount) {
    const listStatus = document.getElementById('list-status');
    const sortIndicator = document.getElementById('sort-indicator');
    const filterIndicator = document.getElementById('filter-indicator');
    const resultCount = document.getElementById('result-count');

    // Show status section
    listStatus.style.display = 'block';

    // Update sort indicator
    const sortLabels = {
      recent: 'Most Recent (newest first)',
      alphabetical: 'Alphabetical (A-Z)',
      dateAdded: 'Date Added (newest first)',
      lastReviewed: 'Last Reviewed (newest first)',
      difficulty: 'Difficulty (easy to hard)',
      lookupCount: 'Lookup Count (least to most)'
    };
    sortIndicator.textContent = `Sorted by: ${sortLabels[this.currentSort] || 'Most Recent'}`;

    // Update filter indicator
    if (this.currentFilter && this.currentFilter !== 'all') {
      const filterLabels = {
        easy: 'Easy difficulty only',
        medium: 'Medium difficulty only',
        hard: 'Hard difficulty only'
      };
      filterIndicator.textContent = `Filter: ${filterLabels[this.currentFilter]}`;
      filterIndicator.style.display = 'inline';
    } else {
      filterIndicator.style.display = 'none';
    }

    // Update result count
    resultCount.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
  },
  renderWordItem(word) {
    const sortBy = this.currentSort === 'recent' ? 'dateAdded' : this.currentSort;

    // Base word item structure
    let wordItem = `
      <div class="word-list-item">
        <div class="difficulty-indicator difficulty-${word.difficulty || 'medium'}"></div>
        <div class="word-list-text">
          <div class="word-list-word">${word.word}</div>
          <div class="word-list-status">
    `;

    // Add sort-specific information
    if (sortBy === 'lookupCount') {
      const count = word.lookupCount || 0;
      wordItem += `
        <span class="lookup-count">${count} lookup${count !== 1 ? 's' : ''}</span>
      `;
    } else if (sortBy === 'dateAdded') {
      wordItem += `
        <span class="date-added">Added: ${this.formatDate(word.dateAdded)}</span>
      `;
    } else if (sortBy === 'difficulty') {
      const difficultyMap = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      };
      wordItem += `
        <span class="difficulty-badge">${difficultyMap[word.difficulty] || 'Medium'}</span>
      `;
    } else {
      // Default status
      wordItem += word.lastReviewed ? `Last reviewed: ${this.formatDate(word.lastReviewed)}` : 'Not reviewed yet';
    }
    wordItem += `
          </div>
        </div>
        <div class="word-actions">
          <button class="word-action-btn" title="Edit notes">📝</button>
        </div>
      </div>
    `;
    return wordItem;
  },
  setupListControls() {
    // New list button
    const newListBtn = document.getElementById('new-list-button');
    if (newListBtn) {
      newListBtn.addEventListener('click', () => this.showNewListDialog());
    }

    // Dialog controls
    const cancelBtn = document.getElementById('cancel-new-list');
    const confirmBtn = document.getElementById('confirm-new-list');
    const nameInput = document.getElementById('new-list-name');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideNewListDialog());
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.createNewList());
    }
    if (nameInput) {
      nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.createNewList();
        } else if (e.key === 'Escape') {
          this.hideNewListDialog();
        }
      });
    }

    // Sort and filter controls
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        this.currentSort = e.target.value;
        this.refreshWordsList();
      });
    }
    if (filterSelect) {
      filterSelect.addEventListener('change', e => {
        this.currentFilter = e.target.value;
        this.refreshWordsList();
      });
    }
  },
  showNewListDialog() {
    const dialog = document.getElementById('new-list-dialog');
    const nameInput = document.getElementById('new-list-name');
    if (dialog) {
      dialog.style.display = 'flex';
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    }
  },
  hideNewListDialog() {
    const dialog = document.getElementById('new-list-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
  },
  async createNewList() {
    const nameInput = document.getElementById('new-list-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      NotificationManager.show('Please enter a list name', 'warning');
      return;
    }
    try {
      const response = await browser.runtime.sendMessage({
        action: 'createList',
        name
      });
      if (response.success) {
        NotificationManager.show(`Created list "${name}"`, 'success');
        this.hideNewListDialog();
        this.loadLists();
      } else {
        NotificationManager.show(response.error || 'Failed to create list', 'error');
      }
    } catch (error) {
      console.error('Create list error:', error);
      NotificationManager.show('Failed to create list', 'error');
    }
  },
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
};

// Learn Tab
const LearnTab = {
  currentSession: null,
  currentWordIndex: 0,
  sessionWords: [],
  isFlipped: false,
  sessionStats: {
    total: 0,
    completed: 0,
    known: 0,
    unknown: 0,
    skipped: 0,
    mastered: 0
  },
  init() {
    this.setupLearnControls();
    this.loadReviewQueue();
  },
  setupLearnControls() {
    // Start review button
    const startBtn = document.getElementById('start-review-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startReviewSession());
    }

    // Action buttons
    const knownBtn = document.getElementById('known-btn');
    const unknownBtn = document.getElementById('unknown-btn');
    const skipBtn = document.getElementById('skip-btn');
    const masteredBtn = document.getElementById('mastered-btn');
    if (knownBtn) {
      knownBtn.addEventListener('click', () => this.handleReviewAction('known'));
    }
    if (unknownBtn) {
      unknownBtn.addEventListener('click', () => this.handleReviewAction('unknown'));
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.handleReviewAction('skipped'));
    }
    if (masteredBtn) {
      masteredBtn.addEventListener('click', () => this.handleReviewAction('mastered'));
    }

    // Flashcard flip
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => this.flipCard());
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (!this.currentSession) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          this.flipCard();
          break;
        case '1':
          e.preventDefault();
          this.handleReviewAction('known');
          break;
        case '2':
          e.preventDefault();
          this.handleReviewAction('unknown');
          break;
        case '3':
          e.preventDefault();
          this.handleReviewAction('skipped');
          break;
        case '4':
          e.preventDefault();
          this.handleReviewAction('mastered');
          break;
      }
    });
  },
  async loadReviewQueue() {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getReviewQueue'
      });
      if (response.success) {
        const dueWordsCount = response.data.length;
        this.updateDueWordsCount(dueWordsCount);
        this.displayReviewStatus(dueWordsCount);
      }
    } catch (error) {
      console.error('Load review queue error:', error);
    }
  },
  updateDueWordsCount(_count) {
    // Due word count is now displayed in the review start screen
    // No need for separate header element
  },
  displayReviewStatus(dueWordsCount) {
    const container = document.querySelector('.learn-container');
    if (dueWordsCount === 0) {
      container.innerHTML = `
        <div class="no-reviews">
          <div class="no-reviews-icon">🎉</div>
          <h3>All caught up!</h3>
          <p>No words are due for review right now.</p>
          <p class="small-text">Come back later or add more words to your lists.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = `
      <div class="review-start">
        <div class="review-header">
          <div class="review-icon">🎓</div>
          <h2 class="review-title">Ready to Learn</h2>
          <p class="review-subtitle">Let's review your vocabulary words</p>
        </div>
        
        <div class="review-stats">
          <div class="stat-item">
            <span class="stat-number">${dueWordsCount}</span>
            <span class="stat-label">Words Due</span>
          </div>
        </div>
        
        <button id="start-review-btn" class="btn-primary btn-large start-session-btn">
          <span class="btn-icon">🚀</span>
          <span class="btn-text">Start Review Session</span>
        </button>
        
        <div class="review-tips">
          <h4>💡 Review Tips</h4>
          <ul>
            <li>Click the card or press <kbd>Space</kbd> to flip</li>
            <li>Use number keys <kbd>1-4</kbd> for quick actions</li>
            <li>Be honest with your self-assessment for better learning</li>
            <li>Regular practice leads to better retention</li>
          </ul>
        </div>
      </div>
    `;

    // Re-setup controls after DOM update
    this.setupLearnControls();
  },
  async startReviewSession() {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getReviewQueue'
      });
      if (!response.success || response.data.length === 0) {
        NotificationManager.show('No words available for review', 'info');
        return;
      }
      this.sessionWords = response.data;
      this.currentWordIndex = 0;
      this.sessionStats = {
        total: this.sessionWords.length,
        completed: 0,
        known: 0,
        unknown: 0,
        skipped: 0,
        mastered: 0
      };
      this.currentSession = {
        startTime: new Date(),
        results: []
      };
      this.displayCurrentWord();
    } catch (error) {
      console.error('Start review session error:', error);
      NotificationManager.show('Failed to start review session', 'error');
    }
  },
  displayCurrentWord() {
    if (!this.currentSession || this.currentWordIndex >= this.sessionWords.length) {
      this.endReviewSession();
      return;
    }

    // Reset flip state before generating HTML to ensure new card shows front
    this.isFlipped = false;
    const word = this.sessionWords[this.currentWordIndex];
    const container = document.querySelector('.learn-container');
    container.innerHTML = `
      <div class="review-session">
        <div class="flashcard-container">
          <div id="flashcard" class="flashcard ${this.isFlipped ? 'flipped' : ''}" data-word="${word.word}">
            <div class="flashcard-front">
              <div class="card-content">
                <div class="flashcard-header">
                  <div class="word-number">${this.currentWordIndex + 1}</div>
                  <div class="progress-minimal">${this.currentWordIndex + 1}/${this.sessionWords.length}</div>
                </div>
                <h2 class="word-display">${word.word}</h2>
                ${word.pronunciation ? `<div class="front-pronunciation">${word.pronunciation}</div>` : ''}
                <div class="flip-hint">
                  <span class="hint-icon">👆</span>
                  <span class="hint-text">Click to reveal definition</span>
                </div>
              </div>
            </div>
            <div class="flashcard-back">
              <div class="card-content">
                <div class="definition-header">
                  <h3 class="flashcard-word-title">${word.word}</h3>
                  ${word.pronunciation ? `<div class="flashcard-pronunciation">${word.pronunciation}</div>` : ''}
                </div>
                
                <div class="definitions-container">
                  ${word.definitions && word.definitions.length > 0 ? word.definitions.map(def => `
                    <div class="definition-item">
                      <span class="part-of-speech">${def.partOfSpeech}</span>
                      <div class="definition-text">${def.meaning}</div>
                      ${def.examples && def.examples.length > 0 ? `
                        <div class="examples">
                          ${def.examples.slice(0, 2).map(ex => `<div class="example">"${ex}"</div>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('') : '<div class="no-definition">No definition available</div>'}
                </div>
                
                ${word.synonyms && word.synonyms.length > 0 ? `
                  <div class="word-synonyms">
                    <strong>Synonyms:</strong> ${word.synonyms.slice(0, 3).join(', ')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="review-actions ${this.isFlipped ? 'visible' : 'hidden'}">
          <button id="known-btn" class="review-btn btn-known" title="I know this (1)">
            <span class="btn-icon">✅</span>
            <span class="btn-text">Know</span>
            <span class="btn-key">1</span>
          </button>
          <button id="unknown-btn" class="review-btn btn-unknown" title="I don't know this (2)">
            <span class="btn-icon">❌</span>
            <span class="btn-text">Learning</span>
            <span class="btn-key">2</span>
          </button>
          <button id="skip-btn" class="review-btn btn-skip" title="Skip for now (3)">
            <span class="btn-icon">⏭️</span>
            <span class="btn-text">Skip</span>
            <span class="btn-key">3</span>
          </button>
          <button id="mastered-btn" class="review-btn btn-mastered" title="I've mastered this (4)">
            <span class="btn-icon">🎯</span>
            <span class="btn-text">Mastered</span>
            <span class="btn-key">4</span>
          </button>
        </div>
      </div>
    `;

    // Re-setup controls
    this.setupLearnControls();
  },
  flipCard() {
    if (!this.currentSession) return;
    const flashcard = document.getElementById('flashcard');
    const actions = document.querySelector('.review-actions');
    this.isFlipped = !this.isFlipped;
    if (flashcard) {
      flashcard.classList.toggle('flipped', this.isFlipped);
    }
    if (actions) {
      actions.classList.toggle('visible', this.isFlipped);
      actions.classList.toggle('hidden', !this.isFlipped);
    }
  },
  async handleReviewAction(action) {
    if (!this.currentSession || this.currentWordIndex >= this.sessionWords.length) return;
    const word = this.sessionWords[this.currentWordIndex];
    const reviewResult = {
      word: word.word,
      action,
      timestamp: new Date()
    };

    // Update session stats
    this.sessionStats.completed++;
    this.sessionStats[action]++;
    this.currentSession.results.push(reviewResult);
    try {
      // Send review result to background
      await browser.runtime.sendMessage({
        action: 'processReview',
        word: word.word,
        result: action,
        listId: word.listId || null
      });

      // Move to next word
      this.currentWordIndex++;
      this.displayCurrentWord();
    } catch (error) {
      console.error('Process review error:', error);
      NotificationManager.show('Failed to save review result', 'error');
    }
  },
  endReviewSession() {
    if (!this.currentSession) return;
    const endTime = new Date();
    const duration = Math.round((endTime - this.currentSession.startTime) / 1000); // seconds
    const container = document.querySelector('.learn-container');
    container.innerHTML = `
      <div class="session-complete">
        <div class="completion-icon">🎉</div>
        <h3>Session Complete!</h3>
        
        <div class="session-summary">
          <div class="summary-stats">
            <div class="stat-row">
              <span class="stat-label">Words Reviewed:</span>
              <span class="stat-value">${this.sessionStats.completed}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Known:</span>
              <span class="stat-value known">${this.sessionStats.known}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Learning:</span>
              <span class="stat-value unknown">${this.sessionStats.unknown}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mastered:</span>
              <span class="stat-value mastered">${this.sessionStats.mastered}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Duration:</span>
              <span class="stat-value">${Math.floor(duration / 60)}m ${duration % 60}s</span>
            </div>
          </div>
        </div>
        
        <div class="session-actions">
          <button id="review-more-btn" class="btn-primary">Review More</button>
          <button id="finish-session-btn" class="btn-secondary">Finish</button>
        </div>
      </div>
    `;

    // Setup completion actions
    const reviewMoreBtn = document.getElementById('review-more-btn');
    const finishBtn = document.getElementById('finish-session-btn');
    if (reviewMoreBtn) {
      reviewMoreBtn.addEventListener('click', () => this.loadReviewQueue());
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.loadReviewQueue());
    }

    // Clear session
    this.currentSession = null;
    this.sessionWords = [];
    this.currentWordIndex = 0;

    // Show completion notification
    NotificationManager.show(`Review session completed! ${this.sessionStats.completed} words reviewed.`, 'success');
  }
};

// Settings Tab
const SettingsTab = {
  init() {
    this.loadSettings();
    this.setupSettingsListeners();
  },
  async loadSettings() {
    const response = await browser.runtime.sendMessage({
      action: 'getSettings'
    });
    const settings = response.success ? response.data : {
      theme: 'dark',
      autoAddLookups: true,
      dailyReviewLimit: 30,
      textSelectionMode: 'inline'
    };

    // Update UI
    const autoAddToggle = document.getElementById('auto-add-toggle');
    if (autoAddToggle) autoAddToggle.checked = settings.autoAddLookups;
    const reviewLimit = document.getElementById('review-limit');
    if (reviewLimit) reviewLimit.value = settings.dailyReviewLimit;

    // Text selection mode radio buttons
    const textSelectionMode = settings.textSelectionMode || 'inline';
    const inlineRadio = document.getElementById('text-selection-inline');
    const popupRadio = document.getElementById('text-selection-popup');
    if (inlineRadio && popupRadio) {
      if (textSelectionMode === 'popup') {
        popupRadio.checked = true;
      } else {
        inlineRadio.checked = true;
      }
    }
  },
  setupSettingsListeners() {
    // Auto-add toggle
    const autoAddToggle = document.getElementById('auto-add-toggle');
    if (autoAddToggle) {
      autoAddToggle.addEventListener('change', e => {
        this.updateSetting('autoAddLookups', e.target.checked);
      });
    }

    // Review limit
    const reviewLimit = document.getElementById('review-limit');
    if (reviewLimit) {
      reviewLimit.addEventListener('change', e => {
        this.updateSetting('dailyReviewLimit', parseInt(e.target.value));
      });
    }

    // Text selection mode radio buttons
    const inlineRadio = document.getElementById('text-selection-inline');
    const popupRadio = document.getElementById('text-selection-popup');
    if (inlineRadio) {
      inlineRadio.addEventListener('change', e => {
        if (e.target.checked) {
          this.updateSetting('textSelectionMode', 'inline');
        }
      });
    }
    if (popupRadio) {
      popupRadio.addEventListener('change', e => {
        if (e.target.checked) {
          this.updateSetting('textSelectionMode', 'popup');
        }
      });
    }

    // Export/Import buttons would be implemented here
  },
  async updateSetting(key, value) {
    await browser.runtime.sendMessage({
      action: 'updateSettings',
      settings: {
        [key]: value
      }
    });
  }
};

// Notification Manager
const NotificationManager = {
  show(message, type = 'info') {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Initialize popup when DOM is ready - moved to top with debug code
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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SSxDQUFDO0FBQzVDLG9DQUFvQ0QsT0FBTztBQUMzQyxLQUFLO0lBRUR4SCxTQUFTLENBQUNnSSxXQUFXLENBQUNOLEtBQUssQ0FBQzs7SUFFNUI7SUFDQXBLLFVBQVUsQ0FBQyxNQUFNO01BQ2ZvSyxLQUFLLENBQUM1SixLQUFLLENBQUNtSyxPQUFPLEdBQUcsR0FBRztNQUN6QjNLLFVBQVUsQ0FBQyxNQUFNb0ssS0FBSyxDQUFDdkksTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7SUFDdkMsQ0FBQyxFQUFFLElBQUksQ0FBQztFQUNWO0FBQ0YsQ0FBQzs7QUFFRCxvRSIsInNvdXJjZXMiOlsid2VicGFjazovL3ZvY2FiZGljdC8uL3NyYy9wb3B1cC9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3B1cCBzY3JpcHQgZm9yIFZvY2FiRGljdCBTYWZhcmkgRXh0ZW5zaW9uXG5cbi8vIEJyb3dzZXIgQVBJIGNvbXBhdGliaWxpdHkgLSBNVVNUIGJlIGZpcnN0XG5pZiAodHlwZW9mIGJyb3dzZXIgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjaHJvbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5icm93c2VyID0gY2hyb21lO1xufVxuXG4vLyBJbml0aWFsaXplIHBvcHVwIHdoZW4gRE9NIGlzIHJlYWR5XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICAvLyBJbml0aWFsaXplIG1hbmFnZXJzXG4gIFRoZW1lTWFuYWdlci5pbml0KCk7XG4gIFRhYk1hbmFnZXIuaW5pdCgpO1xufSk7XG5cbi8vIFRoZW1lIE1hbmFnZW1lbnRcbmNvbnN0IFRoZW1lTWFuYWdlciA9IHtcbiAgaW5pdCgpIHtcbiAgICB0aGlzLmxvYWRUaGVtZSgpO1xuICAgIHRoaXMuc2V0dXBUaGVtZUxpc3RlbmVycygpO1xuICB9LFxuXG4gIGxvYWRUaGVtZSgpIHtcbiAgICAvLyBDaGVjayBmb3Igc2F2ZWQgdGhlbWUgcHJlZmVyZW5jZVxuICAgIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICBhY3Rpb246ICdnZXRTZXR0aW5ncydcbiAgICB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIGNvbnN0IHRoZW1lID0gcmVzcG9uc2UuZGF0YS50aGVtZSB8fCAnZGFyayc7XG4gICAgICAgIHRoaXMuYXBwbHlUaGVtZSh0aGVtZSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZW1lIHNlbGVjdG9yIGlmIGl0IGV4aXN0c1xuICAgICAgICBjb25zdCB0aGVtZVNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZS1zZWxlY3QnKTtcbiAgICAgICAgaWYgKHRoZW1lU2VsZWN0KSB7XG4gICAgICAgICAgdGhlbWVTZWxlY3QudmFsdWUgPSB0aGVtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGFwcGx5VGhlbWUodGhlbWUpIHtcbiAgICBjb25zdCByb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgdGhlbWUpO1xuICB9LFxuXG4gIHNldHVwVGhlbWVMaXN0ZW5lcnMoKSB7XG4gICAgLy8gTGlzdGVuIGZvciB0aGVtZSBzZWxlY3RvciBjaGFuZ2VzXG4gICAgY29uc3QgdGhlbWVTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbWUtc2VsZWN0Jyk7XG4gICAgaWYgKHRoZW1lU2VsZWN0KSB7XG4gICAgICB0aGVtZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBjb25zdCB0aGVtZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmFwcGx5VGhlbWUodGhlbWUpO1xuXG4gICAgICAgIC8vIFNhdmUgcHJlZmVyZW5jZVxuICAgICAgICBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgIGFjdGlvbjogJ3VwZGF0ZVNldHRpbmdzJyxcbiAgICAgICAgICBzZXR0aW5nczogeyB0aGVtZSB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBUYWIgTmF2aWdhdGlvblxuY29uc3QgVGFiTWFuYWdlciA9IHtcbiAgaW5pdCgpIHtcbiAgICB0aGlzLnNldHVwVGFiTGlzdGVuZXJzKCk7XG4gICAgdGhpcy5zaG93VGFiKCdzZWFyY2gnKTsgLy8gRGVmYXVsdCB0YWJcbiAgfSxcblxuICBzZXR1cFRhYkxpc3RlbmVycygpIHtcbiAgICBjb25zdCB0YWJCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1idXR0b24nKTtcbiAgICB0YWJCdXR0b25zLmZvckVhY2goYnV0dG9uID0+IHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgY29uc3QgdGFiTmFtZSA9IGJ1dHRvbi5kYXRhc2V0LnRhYjtcbiAgICAgICAgdGhpcy5zaG93VGFiKHRhYk5hbWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc2hvd1RhYih0YWJOYW1lKSB7XG4gICAgLy8gVXBkYXRlIGJ1dHRvbnNcbiAgICBjb25zdCB0YWJCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1idXR0b24nKTtcbiAgICB0YWJCdXR0b25zLmZvckVhY2goYnV0dG9uID0+IHtcbiAgICAgIGNvbnN0IGlzQWN0aXZlID0gYnV0dG9uLmRhdGFzZXQudGFiID09PSB0YWJOYW1lO1xuICAgICAgYnV0dG9uLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScsIGlzQWN0aXZlKTtcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCBpc0FjdGl2ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgcGFuZWxzXG4gICAgY29uc3QgdGFiUGFuZWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1wYW5lbCcpO1xuICAgIHRhYlBhbmVscy5mb3JFYWNoKHBhbmVsID0+IHtcbiAgICAgIGNvbnN0IGlzQWN0aXZlID0gcGFuZWwuaWQgPT09IGAke3RhYk5hbWV9LXRhYmA7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnLCBpc0FjdGl2ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBJbml0aWFsaXplIHRhYi1zcGVjaWZpYyBjb250ZW50XG4gICAgc3dpdGNoICh0YWJOYW1lKSB7XG4gICAgICBjYXNlICdzZWFyY2gnOlxuICAgICAgICBTZWFyY2hUYWIuaW5pdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xpc3RzJzpcbiAgICAgICAgTGlzdHNUYWIuaW5pdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xlYXJuJzpcbiAgICAgICAgTGVhcm5UYWIuaW5pdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NldHRpbmdzJzpcbiAgICAgICAgU2V0dGluZ3NUYWIuaW5pdCgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbi8vIFNlYXJjaCBUYWJcbmNvbnN0IFNlYXJjaFRhYiA9IHtcbiAgc2VhcmNoVGltZW91dDogbnVsbCxcbiAgcmVjZW50U2VhcmNoZXM6IFtdLFxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5zZXR1cFNlYXJjaElucHV0KCk7XG4gICAgdGhpcy5sb2FkUmVjZW50U2VhcmNoZXMoKTtcbiAgICB0aGlzLmNoZWNrUGVuZGluZ0NvbnRleHRTZWFyY2goKTtcbiAgfSxcblxuICBhc3luYyBjaGVja1BlbmRpbmdDb250ZXh0U2VhcmNoKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogJ2dldFBlbmRpbmdDb250ZXh0U2VhcmNoJ1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzICYmIHJlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgY29uc3Qgd29yZCA9IHJlc3BvbnNlLmRhdGE7XG5cbiAgICAgICAgLy8gU2V0IHRoZSBzZWFyY2ggaW5wdXQgdmFsdWVcbiAgICAgICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLWlucHV0Jyk7XG4gICAgICAgIGlmIChzZWFyY2hJbnB1dCkge1xuICAgICAgICAgIHNlYXJjaElucHV0LnZhbHVlID0gd29yZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBlcmZvcm0gdGhlIHNlYXJjaCB1c2luZyB0aGUgbm9ybWFsIGZsb3dcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHdvcmQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY2hlY2sgcGVuZGluZyBjb250ZXh0IHNlYXJjaDonLCBlcnJvcik7XG4gICAgfVxuICB9LFxuXG4gIHNldHVwU2VhcmNoSW5wdXQoKSB7XG4gICAgY29uc3Qgc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLWlucHV0Jyk7XG4gICAgaWYgKCFzZWFyY2hJbnB1dCkgcmV0dXJuO1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoZSkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc2VhcmNoVGltZW91dCk7XG4gICAgICBjb25zdCBxdWVyeSA9IGUudGFyZ2V0LnZhbHVlLnRyaW0oKTtcblxuICAgICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLmNsZWFyU2VhcmNoUmVzdWx0cygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIERlYm91bmNlIHNlYXJjaFxuICAgICAgdGhpcy5zZWFyY2hUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChxdWVyeSk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc2VhcmNoVGltZW91dCk7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gZS50YXJnZXQudmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2gocXVlcnkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgYXN5bmMgcGVyZm9ybVNlYXJjaChxdWVyeSkge1xuICAgIHRyeSB7XG4gICAgICAvLyBTZW5kIHNlYXJjaCByZXF1ZXN0IHRvIGJhY2tncm91bmRcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgYWN0aW9uOiAnbG9va3VwV29yZCcsXG4gICAgICAgIHdvcmQ6IHF1ZXJ5XG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgICB0aGlzLmRpc3BsYXlTZWFyY2hSZXN1bHQocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgLy8gUmVsb2FkIHJlY2VudCBzZWFyY2hlcyB0byBzaG93IHRoZSBuZXcgc2VhcmNoIGltbWVkaWF0ZWx5XG4gICAgICAgICAgYXdhaXQgdGhpcy5sb2FkUmVjZW50U2VhcmNoZXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmRpc3BsYXlOb1Jlc3VsdHMocXVlcnksIHJlc3BvbnNlLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5RXJyb3IocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdTZWFyY2ggZXJyb3I6JywgZXJyb3IpO1xuICAgICAgdGhpcy5kaXNwbGF5RXJyb3IoJ0ZhaWxlZCB0byBzZWFyY2guIFBsZWFzZSB0cnkgYWdhaW4uJyk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BsYXlTZWFyY2hSZXN1bHQod29yZERhdGEpIHtcbiAgICBjb25zdCByZXN1bHRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaC1yZXN1bHRzJyk7XG4gICAgY29uc3QgcmVjZW50U2VhcmNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVjZW50LXNlYXJjaGVzJyk7XG5cbiAgICAvLyBIaWRlIHJlY2VudCBzZWFyY2hlcyB3aGVuIHNob3dpbmcgc2VhcmNoIHJlc3VsdHNcbiAgICBpZiAocmVjZW50U2VhcmNoZXMpIHtcbiAgICAgIHJlY2VudFNlYXJjaGVzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuXG4gICAgLy8gQWRkIGNsYXNzIHRvIGVuYWJsZSBmbGV4IGdyb3d0aFxuICAgIHJlc3VsdHNDb250YWluZXIuY2xhc3NMaXN0LmFkZCgnaGFzLWNvbnRlbnQnKTtcblxuICAgIHJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIndvcmQtY2FyZFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1oZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1pbmZvXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC10aXRsZVwiPiR7d29yZERhdGEud29yZH08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLXByb251bmNpYXRpb25cIj4ke3dvcmREYXRhLnByb251bmNpYXRpb259PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFkZC10by1saXN0LWJ0blwiIHRpdGxlPVwiQWRkIHRvIGxpc3RcIj7wn5OaPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICAke3dvcmREYXRhLmRlZmluaXRpb25zLm1hcChkZWYgPT4gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkZWZpbml0aW9uLXNlY3Rpb25cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLXBhcnQtb2Ytc3BlZWNoXCI+JHtkZWYucGFydE9mU3BlZWNofTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtZGVmaW5pdGlvblwiPiR7ZGVmLm1lYW5pbmd9PC9kaXY+XG4gICAgICAgICAgICAke2RlZi5leGFtcGxlcy5sZW5ndGggPiAwXG4/IGBcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtZXhhbXBsZXNcIj5cbiAgICAgICAgICAgICAgICA8aDQ+RXhhbXBsZXM6PC9oND5cbiAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAke2RlZi5leGFtcGxlcy5tYXAoZXggPT4gYDxsaT4ke2V4fTwvbGk+YCkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBgXG46ICcnfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgJHt3b3JkRGF0YS5zeW5vbnltcy5sZW5ndGggPiAwXG4/IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1zeW5vbnltc1wiPlxuICAgICAgICAgICAgPHN0cm9uZz5TeW5vbnltczo8L3N0cm9uZz4gJHt3b3JkRGF0YS5zeW5vbnltcy5qb2luKCcsICcpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgXG46ICcnfVxuICAgICAgICAke3dvcmREYXRhLmFudG9ueW1zLmxlbmd0aCA+IDBcbj8gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLXN5bm9ueW1zXCI+XG4gICAgICAgICAgICA8c3Ryb25nPkFudG9ueW1zOjwvc3Ryb25nPiAke3dvcmREYXRhLmFudG9ueW1zLmpvaW4oJywgJyl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGBcbjogJyd9XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciBcIkFkZCB0byBMaXN0XCIgYnV0dG9uXG4gICAgY29uc3QgYWRkQnV0dG9uID0gcmVzdWx0c0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuYWRkLXRvLWxpc3QtYnRuJyk7XG4gICAgYWRkQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5hZGRUb0xpc3Qod29yZERhdGEpKTtcbiAgfSxcblxuICBkaXNwbGF5Tm9SZXN1bHRzKHF1ZXJ5LCBzdWdnZXN0aW9ucyA9IFtdKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIGNvbnN0IHJlY2VudFNlYXJjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlY2VudC1zZWFyY2hlcycpO1xuXG4gICAgLy8gSGlkZSByZWNlbnQgc2VhcmNoZXMgd2hlbiBzaG93aW5nIHNlYXJjaCByZXN1bHRzXG4gICAgaWYgKHJlY2VudFNlYXJjaGVzKSB7XG4gICAgICByZWNlbnRTZWFyY2hlcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIEFkZCBjbGFzcyB0byBlbmFibGUgZmxleCBncm93dGhcbiAgICByZXN1bHRzQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2hhcy1jb250ZW50Jyk7XG5cbiAgICByZXN1bHRzQ29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJuby1yZXN1bHRzXCI+XG4gICAgICAgIDxwPk5vIHJlc3VsdHMgZm91bmQgZm9yIFwiPHN0cm9uZz4ke3F1ZXJ5fTwvc3Ryb25nPlwiPC9wPlxuICAgICAgICAke3N1Z2dlc3Rpb25zLmxlbmd0aCA+IDBcbj8gYFxuICAgICAgICAgIDxwIGNsYXNzPVwic21hbGwtdGV4dFwiPkRpZCB5b3UgbWVhbjo8L3A+XG4gICAgICAgICAgPHVsIGNsYXNzPVwic3VnZ2VzdGlvbnMtbGlzdFwiPlxuICAgICAgICAgICAgJHtzdWdnZXN0aW9ucy5tYXAocyA9PiBgXG4gICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGRhdGEtc3VnZ2VzdGlvbj1cIiR7c31cIj4ke3N9PC9hPjwvbGk+XG4gICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgICBgXG46ICcnfVxuICAgICAgPC9kaXY+XG4gICAgYDtcblxuICAgIC8vIEFkZCBjbGljayBoYW5kbGVycyBmb3Igc3VnZ2VzdGlvbnNcbiAgICByZXN1bHRzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXN1Z2dlc3Rpb25dJykuZm9yRWFjaChsaW5rID0+IHtcbiAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBlLnRhcmdldC5kYXRhc2V0LnN1Z2dlc3Rpb247XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtaW5wdXQnKS52YWx1ZSA9IHN1Z2dlc3Rpb247XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChzdWdnZXN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIGRpc3BsYXlFcnJvcihlcnJvcikge1xuICAgIGNvbnN0IHJlc3VsdHNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLXJlc3VsdHMnKTtcbiAgICBjb25zdCByZWNlbnRTZWFyY2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZWNlbnQtc2VhcmNoZXMnKTtcblxuICAgIC8vIEhpZGUgcmVjZW50IHNlYXJjaGVzIHdoZW4gc2hvd2luZyBlcnJvclxuICAgIGlmIChyZWNlbnRTZWFyY2hlcykge1xuICAgICAgcmVjZW50U2VhcmNoZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbiAgICAvLyBBZGQgY2xhc3MgdG8gZW5hYmxlIGZsZXggZ3Jvd3RoXG4gICAgcmVzdWx0c0NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdoYXMtY29udGVudCcpO1xuXG4gICAgcmVzdWx0c0NvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwiZXJyb3ItbWVzc2FnZVwiPlxuICAgICAgICA8cD5FcnJvcjogJHtlcnJvcn08L3A+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuICB9LFxuXG4gIGNsZWFyU2VhcmNoUmVzdWx0cygpIHtcbiAgICBjb25zdCByZXN1bHRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaC1yZXN1bHRzJyk7XG4gICAgY29uc3QgcmVjZW50U2VhcmNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVjZW50LXNlYXJjaGVzJyk7XG5cbiAgICByZXN1bHRzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuXG4gICAgLy8gUmVtb3ZlIGNsYXNzIHRvIGRpc2FibGUgZmxleCBncm93dGhcbiAgICByZXN1bHRzQ29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1jb250ZW50Jyk7XG5cbiAgICAvLyBTaG93IHJlY2VudCBzZWFyY2hlcyB3aGVuIGNsZWFyaW5nIHJlc3VsdHNcbiAgICBpZiAocmVjZW50U2VhcmNoZXMpIHtcbiAgICAgIHJlY2VudFNlYXJjaGVzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIH1cbiAgfSxcblxuICBhc3luYyBhZGRUb0xpc3Qod29yZERhdGEpIHtcbiAgICB0cnkge1xuICAgICAgLy8gR2V0IGRlZmF1bHQgbGlzdFxuICAgICAgY29uc3QgbGlzdHNSZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogJ2dldExpc3RzJ1xuICAgICAgfSk7XG4gICAgICBjb25zdCBsaXN0cyA9IGxpc3RzUmVzcG9uc2Uuc3VjY2VzcyA/IGxpc3RzUmVzcG9uc2UuZGF0YSA6IFtdO1xuICAgICAgY29uc3QgZGVmYXVsdExpc3QgPSBsaXN0cy5maW5kKGwgPT4gbC5pc0RlZmF1bHQpIHx8IGxpc3RzWzBdO1xuXG4gICAgICBpZiAoIWRlZmF1bHRMaXN0KSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnTm8gdm9jYWJ1bGFyeSBsaXN0cyBmb3VuZCcsICdlcnJvcicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbmQgYWRkIHRvIGxpc3QgcmVxdWVzdFxuICAgICAgY29uc3QgYWRkUmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICBhY3Rpb246ICdhZGRUb0xpc3QnLFxuICAgICAgICB3b3JkOiB3b3JkRGF0YS53b3JkLFxuICAgICAgICBsaXN0SWQ6IGRlZmF1bHRMaXN0LmlkXG4gICAgICB9KTtcblxuICAgICAgaWYgKGFkZFJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KGBBZGRlZCBcIiR7d29yZERhdGEud29yZH1cIiB0byAke2RlZmF1bHRMaXN0Lm5hbWV9YCwgJ3N1Y2Nlc3MnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdyhhZGRSZXNwb25zZS5lcnJvciB8fCAnRmFpbGVkIHRvIGFkZCB3b3JkJywgJ2Vycm9yJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0FkZCB0byBsaXN0IGVycm9yOicsIGVycm9yKTtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnRmFpbGVkIHRvIGFkZCB3b3JkIHRvIGxpc3QnLCAnZXJyb3InKTtcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgbG9hZFJlY2VudFNlYXJjaGVzKCkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgIGFjdGlvbjogJ2dldFJlY2VudFNlYXJjaGVzJ1xuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICB0aGlzLnJlY2VudFNlYXJjaGVzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgIHRoaXMuZGlzcGxheVJlY2VudFNlYXJjaGVzKCk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BsYXlSZWNlbnRTZWFyY2hlcygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVjZW50LXNlYXJjaGVzLWxpc3QnKTtcbiAgICBpZiAoIWNvbnRhaW5lciB8fCB0aGlzLnJlY2VudFNlYXJjaGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMucmVjZW50U2VhcmNoZXNcbiAgICAgIC5zbGljZSgwLCA1KVxuICAgICAgLm1hcChzZWFyY2ggPT4gYDxsaSBkYXRhLXNlYXJjaD1cIiR7c2VhcmNofVwiPiR7c2VhcmNofTwvbGk+YClcbiAgICAgIC5qb2luKCcnKTtcblxuICAgIC8vIEFkZCBjbGljayBoYW5kbGVyc1xuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdsaScpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWFyY2ggPSBpdGVtLmRhdGFzZXQuc2VhcmNoO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLWlucHV0JykudmFsdWUgPSBzZWFyY2g7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChzZWFyY2gpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIExpc3RzIFRhYlxuY29uc3QgTGlzdHNUYWIgPSB7XG4gIGN1cnJlbnRMaXN0SWQ6IG51bGwsXG4gIGN1cnJlbnRMaXN0OiBudWxsLFxuICBjdXJyZW50U29ydDogJ3JlY2VudCcsXG4gIGN1cnJlbnRGaWx0ZXI6ICdhbGwnLFxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkTGlzdHMoKTtcbiAgICB0aGlzLnNldHVwTGlzdENvbnRyb2xzKCk7XG4gIH0sXG5cbiAgYXN5bmMgbG9hZExpc3RzKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogJ2dldExpc3RzJ1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIHRoaXMuZGlzcGxheUxpc3RzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdMb2FkIGxpc3RzIGVycm9yOicsIGVycm9yKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlzcGxheUxpc3RzKGxpc3RzKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxpc3RzLWNvbnRhaW5lcicpO1xuICAgIGlmIChsaXN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnPHAgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPk5vIHZvY2FidWxhcnkgbGlzdHMgeWV0PC9wPic7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IGxpc3RzLm1hcChsaXN0ID0+IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJsaXN0LWl0ZW1cIiBkYXRhLWxpc3QtaWQ9XCIke2xpc3QuaWR9XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0LWl0ZW0taGVhZGVyXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXN0LWljb25cIj7wn5OBPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGlzdC1uYW1lXCI+JHtsaXN0Lm5hbWV9PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGlzdC1jb3VudFwiPiR7T2JqZWN0LmtleXMobGlzdC53b3JkcykubGVuZ3RofSB3b3Jkczwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0LXVwZGF0ZWRcIj5MYXN0IHVwZGF0ZWQ6ICR7dGhpcy5mb3JtYXREYXRlKGxpc3QudXBkYXRlZCB8fCBsaXN0LmNyZWF0ZWQpfTwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgYCkuam9pbignJyk7XG5cbiAgICAvLyBBZGQgY2xpY2sgaGFuZGxlcnNcbiAgICBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLmxpc3QtaXRlbScpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBsaXN0SWQgPSBpdGVtLmRhdGFzZXQubGlzdElkO1xuICAgICAgICB0aGlzLnNlbGVjdExpc3QobGlzdElkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHNlbGVjdExpc3QobGlzdElkKSB7XG4gICAgLy8gVXBkYXRlIFVJXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxpc3QtaXRlbScpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC50b2dnbGUoJ3NlbGVjdGVkJywgaXRlbS5kYXRhc2V0Lmxpc3RJZCA9PT0gbGlzdElkKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY3VycmVudExpc3RJZCA9IGxpc3RJZDtcbiAgICB0aGlzLmxvYWRMaXN0V29yZHMobGlzdElkKTtcbiAgfSxcblxuICBhc3luYyBsb2FkTGlzdFdvcmRzKGxpc3RJZCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogJ2dldExpc3RzJ1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIGNvbnN0IGxpc3QgPSByZXNwb25zZS5kYXRhLmZpbmQobCA9PiBsLmlkID09PSBsaXN0SWQpO1xuICAgICAgICBpZiAobGlzdCkge1xuICAgICAgICAgIHRoaXMuY3VycmVudExpc3QgPSBsaXN0O1xuICAgICAgICAgIHRoaXMuZGlzcGxheUxpc3RXb3JkcyhsaXN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdMb2FkIGxpc3Qgd29yZHMgZXJyb3I6JywgZXJyb3IpO1xuICAgIH1cbiAgfSxcblxuICByZWZyZXNoV29yZHNMaXN0KCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRMaXN0KSB7XG4gICAgICB0aGlzLmRpc3BsYXlMaXN0V29yZHModGhpcy5jdXJyZW50TGlzdCk7XG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIGRpc3BsYXlMaXN0V29yZHMobGlzdCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53b3Jkcy1pbi1saXN0Jyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gR2V0IHNvcnRlZCBhbmQgZmlsdGVyZWQgd29yZHMgZnJvbSBiYWNrZ3JvdW5kXG4gICAgICBjb25zdCBzb3J0QnkgPSB0aGlzLmN1cnJlbnRTb3J0ID09PSAncmVjZW50JyA/ICdkYXRlQWRkZWQnIDogdGhpcy5jdXJyZW50U29ydDtcbiAgICAgIGxldCBzb3J0T3JkZXIgPSAnYXNjJztcblxuICAgICAgLy8gVXNlIGRlc2Mgb3JkZXIgZm9yIGRhdGUtYmFzZWQgc29ydGluZyB0byBzaG93IG5ld2VzdCBmaXJzdFxuICAgICAgaWYgKHNvcnRCeSA9PT0gJ2RhdGVBZGRlZCcgfHwgc29ydEJ5ID09PSAnbGFzdFJldmlld2VkJykge1xuICAgICAgICBzb3J0T3JkZXIgPSAnZGVzYyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgYWN0aW9uOiAnZ2V0TGlzdFdvcmRzJyxcbiAgICAgICAgbGlzdElkOiBsaXN0LmlkLFxuICAgICAgICBzb3J0QnksXG4gICAgICAgIHNvcnRPcmRlcixcbiAgICAgICAgZmlsdGVyQnk6IHRoaXMuY3VycmVudEZpbHRlclxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5FcnJvciBsb2FkaW5nIHdvcmRzPC9wPic7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd29yZHMgPSByZXNwb25zZS5kYXRhIHx8IFtdO1xuXG4gICAgICAvLyBTaG93IHN0YXR1cyBzZWN0aW9uXG4gICAgICB0aGlzLnVwZGF0ZVN0YXR1c1NlY3Rpb24od29yZHMubGVuZ3RoKTtcblxuICAgICAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5ObyB3b3JkcyBpbiB0aGlzIGxpc3Q8L3A+JztcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgICA8aDMgY2xhc3M9XCJzZWN0aW9uLXRpdGxlXCI+V29yZHMgaW4gXCIke2xpc3QubmFtZX1cIjwvaDM+XG4gICAgICAgICR7d29yZHMubWFwKHdvcmQgPT4gdGhpcy5yZW5kZXJXb3JkSXRlbSh3b3JkKSkuam9pbignJyl9XG4gICAgICBgO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkaXNwbGF5aW5nIHdvcmRzOicsIGVycm9yKTtcbiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnPHAgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiPkVycm9yIGxvYWRpbmcgd29yZHM8L3A+JztcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlU3RhdHVzU2VjdGlvbih3b3JkQ291bnQpIHtcbiAgICBjb25zdCBsaXN0U3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3Qtc3RhdHVzJyk7XG4gICAgY29uc3Qgc29ydEluZGljYXRvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzb3J0LWluZGljYXRvcicpO1xuICAgIGNvbnN0IGZpbHRlckluZGljYXRvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaWx0ZXItaW5kaWNhdG9yJyk7XG4gICAgY29uc3QgcmVzdWx0Q291bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdWx0LWNvdW50Jyk7XG5cbiAgICAvLyBTaG93IHN0YXR1cyBzZWN0aW9uXG4gICAgbGlzdFN0YXR1cy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgIC8vIFVwZGF0ZSBzb3J0IGluZGljYXRvclxuICAgIGNvbnN0IHNvcnRMYWJlbHMgPSB7XG4gICAgICByZWNlbnQ6ICdNb3N0IFJlY2VudCAobmV3ZXN0IGZpcnN0KScsXG4gICAgICBhbHBoYWJldGljYWw6ICdBbHBoYWJldGljYWwgKEEtWiknLFxuICAgICAgZGF0ZUFkZGVkOiAnRGF0ZSBBZGRlZCAobmV3ZXN0IGZpcnN0KScsXG4gICAgICBsYXN0UmV2aWV3ZWQ6ICdMYXN0IFJldmlld2VkIChuZXdlc3QgZmlyc3QpJyxcbiAgICAgIGRpZmZpY3VsdHk6ICdEaWZmaWN1bHR5IChlYXN5IHRvIGhhcmQpJyxcbiAgICAgIGxvb2t1cENvdW50OiAnTG9va3VwIENvdW50IChsZWFzdCB0byBtb3N0KSdcbiAgICB9O1xuICAgIHNvcnRJbmRpY2F0b3IudGV4dENvbnRlbnQgPSBgU29ydGVkIGJ5OiAke3NvcnRMYWJlbHNbdGhpcy5jdXJyZW50U29ydF0gfHwgJ01vc3QgUmVjZW50J31gO1xuXG4gICAgLy8gVXBkYXRlIGZpbHRlciBpbmRpY2F0b3JcbiAgICBpZiAodGhpcy5jdXJyZW50RmlsdGVyICYmIHRoaXMuY3VycmVudEZpbHRlciAhPT0gJ2FsbCcpIHtcbiAgICAgIGNvbnN0IGZpbHRlckxhYmVscyA9IHtcbiAgICAgICAgZWFzeTogJ0Vhc3kgZGlmZmljdWx0eSBvbmx5JyxcbiAgICAgICAgbWVkaXVtOiAnTWVkaXVtIGRpZmZpY3VsdHkgb25seScsXG4gICAgICAgIGhhcmQ6ICdIYXJkIGRpZmZpY3VsdHkgb25seSdcbiAgICAgIH07XG4gICAgICBmaWx0ZXJJbmRpY2F0b3IudGV4dENvbnRlbnQgPSBgRmlsdGVyOiAke2ZpbHRlckxhYmVsc1t0aGlzLmN1cnJlbnRGaWx0ZXJdfWA7XG4gICAgICBmaWx0ZXJJbmRpY2F0b3Iuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBmaWx0ZXJJbmRpY2F0b3Iuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgcmVzdWx0IGNvdW50XG4gICAgcmVzdWx0Q291bnQudGV4dENvbnRlbnQgPSBgJHt3b3JkQ291bnR9IHdvcmQke3dvcmRDb3VudCAhPT0gMSA/ICdzJyA6ICcnfWA7XG4gIH0sXG5cbiAgcmVuZGVyV29yZEl0ZW0od29yZCkge1xuICAgIGNvbnN0IHNvcnRCeSA9IHRoaXMuY3VycmVudFNvcnQgPT09ICdyZWNlbnQnID8gJ2RhdGVBZGRlZCcgOiB0aGlzLmN1cnJlbnRTb3J0O1xuXG4gICAgLy8gQmFzZSB3b3JkIGl0ZW0gc3RydWN0dXJlXG4gICAgbGV0IHdvcmRJdGVtID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIndvcmQtbGlzdC1pdGVtXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkaWZmaWN1bHR5LWluZGljYXRvciBkaWZmaWN1bHR5LSR7d29yZC5kaWZmaWN1bHR5IHx8ICdtZWRpdW0nfVwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1saXN0LXRleHRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1saXN0LXdvcmRcIj4ke3dvcmQud29yZH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1saXN0LXN0YXR1c1wiPlxuICAgIGA7XG5cbiAgICAvLyBBZGQgc29ydC1zcGVjaWZpYyBpbmZvcm1hdGlvblxuICAgIGlmIChzb3J0QnkgPT09ICdsb29rdXBDb3VudCcpIHtcbiAgICAgIGNvbnN0IGNvdW50ID0gd29yZC5sb29rdXBDb3VudCB8fCAwO1xuICAgICAgd29yZEl0ZW0gKz0gYFxuICAgICAgICA8c3BhbiBjbGFzcz1cImxvb2t1cC1jb3VudFwiPiR7Y291bnR9IGxvb2t1cCR7Y291bnQgIT09IDEgPyAncycgOiAnJ308L3NwYW4+XG4gICAgICBgO1xuICAgIH0gZWxzZSBpZiAoc29ydEJ5ID09PSAnZGF0ZUFkZGVkJykge1xuICAgICAgd29yZEl0ZW0gKz0gYFxuICAgICAgICA8c3BhbiBjbGFzcz1cImRhdGUtYWRkZWRcIj5BZGRlZDogJHt0aGlzLmZvcm1hdERhdGUod29yZC5kYXRlQWRkZWQpfTwvc3Bhbj5cbiAgICAgIGA7XG4gICAgfSBlbHNlIGlmIChzb3J0QnkgPT09ICdkaWZmaWN1bHR5Jykge1xuICAgICAgY29uc3QgZGlmZmljdWx0eU1hcCA9IHsgZWFzeTogJ0Vhc3knLCBtZWRpdW06ICdNZWRpdW0nLCBoYXJkOiAnSGFyZCcgfTtcbiAgICAgIHdvcmRJdGVtICs9IGBcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJkaWZmaWN1bHR5LWJhZGdlXCI+JHtkaWZmaWN1bHR5TWFwW3dvcmQuZGlmZmljdWx0eV0gfHwgJ01lZGl1bSd9PC9zcGFuPlxuICAgICAgYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVmYXVsdCBzdGF0dXNcbiAgICAgIHdvcmRJdGVtICs9IHdvcmQubGFzdFJldmlld2VkXG4gICAgICAgID8gYExhc3QgcmV2aWV3ZWQ6ICR7dGhpcy5mb3JtYXREYXRlKHdvcmQubGFzdFJldmlld2VkKX1gXG4gICAgICAgIDogJ05vdCByZXZpZXdlZCB5ZXQnO1xuICAgIH1cblxuICAgIHdvcmRJdGVtICs9IGBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWFjdGlvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwid29yZC1hY3Rpb24tYnRuXCIgdGl0bGU9XCJFZGl0IG5vdGVzXCI+8J+TnTwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICByZXR1cm4gd29yZEl0ZW07XG4gIH0sXG5cbiAgc2V0dXBMaXN0Q29udHJvbHMoKSB7XG4gICAgLy8gTmV3IGxpc3QgYnV0dG9uXG4gICAgY29uc3QgbmV3TGlzdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXctbGlzdC1idXR0b24nKTtcbiAgICBpZiAobmV3TGlzdEJ0bikge1xuICAgICAgbmV3TGlzdEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuc2hvd05ld0xpc3REaWFsb2coKSk7XG4gICAgfVxuXG4gICAgLy8gRGlhbG9nIGNvbnRyb2xzXG4gICAgY29uc3QgY2FuY2VsQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbmNlbC1uZXctbGlzdCcpO1xuICAgIGNvbnN0IGNvbmZpcm1CdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlybS1uZXctbGlzdCcpO1xuICAgIGNvbnN0IG5hbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXctbGlzdC1uYW1lJyk7XG5cbiAgICBpZiAoY2FuY2VsQnRuKSB7XG4gICAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhpZGVOZXdMaXN0RGlhbG9nKCkpO1xuICAgIH1cblxuICAgIGlmIChjb25maXJtQnRuKSB7XG4gICAgICBjb25maXJtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jcmVhdGVOZXdMaXN0KCkpO1xuICAgIH1cblxuICAgIGlmIChuYW1lSW5wdXQpIHtcbiAgICAgIG5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgdGhpcy5jcmVhdGVOZXdMaXN0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgICAgdGhpcy5oaWRlTmV3TGlzdERpYWxvZygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTb3J0IGFuZCBmaWx0ZXIgY29udHJvbHNcbiAgICBjb25zdCBzb3J0U2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NvcnQtc2VsZWN0Jyk7XG4gICAgY29uc3QgZmlsdGVyU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbHRlci1zZWxlY3QnKTtcblxuICAgIGlmIChzb3J0U2VsZWN0KSB7XG4gICAgICBzb3J0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnQgPSBlLnRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5yZWZyZXNoV29yZHNMaXN0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyU2VsZWN0KSB7XG4gICAgICBmaWx0ZXJTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50RmlsdGVyID0gZS50YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMucmVmcmVzaFdvcmRzTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHNob3dOZXdMaXN0RGlhbG9nKCkge1xuICAgIGNvbnN0IGRpYWxvZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXctbGlzdC1kaWFsb2cnKTtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtbmFtZScpO1xuICAgIGlmIChkaWFsb2cpIHtcbiAgICAgIGRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKG5hbWVJbnB1dCkge1xuICAgICAgICBuYW1lSW5wdXQudmFsdWUgPSAnJztcbiAgICAgICAgbmFtZUlucHV0LmZvY3VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGhpZGVOZXdMaXN0RGlhbG9nKCkge1xuICAgIGNvbnN0IGRpYWxvZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXctbGlzdC1kaWFsb2cnKTtcbiAgICBpZiAoZGlhbG9nKSB7XG4gICAgICBkaWFsb2cuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgY3JlYXRlTmV3TGlzdCgpIHtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtbmFtZScpO1xuICAgIGNvbnN0IG5hbWUgPSBuYW1lSW5wdXQgPyBuYW1lSW5wdXQudmFsdWUudHJpbSgpIDogJyc7XG5cbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnUGxlYXNlIGVudGVyIGEgbGlzdCBuYW1lJywgJ3dhcm5pbmcnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICBhY3Rpb246ICdjcmVhdGVMaXN0JyxcbiAgICAgICAgbmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdyhgQ3JlYXRlZCBsaXN0IFwiJHtuYW1lfVwiYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgdGhpcy5oaWRlTmV3TGlzdERpYWxvZygpO1xuICAgICAgICB0aGlzLmxvYWRMaXN0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KHJlc3BvbnNlLmVycm9yIHx8ICdGYWlsZWQgdG8gY3JlYXRlIGxpc3QnLCAnZXJyb3InKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQ3JlYXRlIGxpc3QgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KCdGYWlsZWQgdG8gY3JlYXRlIGxpc3QnLCAnZXJyb3InKTtcbiAgICB9XG4gIH0sXG5cbiAgZm9ybWF0RGF0ZShkYXRlU3RyaW5nKSB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKGRhdGVTdHJpbmcpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZGlmZlRpbWUgPSBNYXRoLmFicyhub3cgLSBkYXRlKTtcbiAgICBjb25zdCBkaWZmRGF5cyA9IE1hdGguZmxvb3IoZGlmZlRpbWUgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuXG4gICAgaWYgKGRpZmZEYXlzID09PSAwKSByZXR1cm4gJ3RvZGF5JztcbiAgICBpZiAoZGlmZkRheXMgPT09IDEpIHJldHVybiAneWVzdGVyZGF5JztcbiAgICBpZiAoZGlmZkRheXMgPCA3KSByZXR1cm4gYCR7ZGlmZkRheXN9IGRheXMgYWdvYDtcbiAgICByZXR1cm4gZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKTtcbiAgfVxufTtcblxuLy8gTGVhcm4gVGFiXG5jb25zdCBMZWFyblRhYiA9IHtcbiAgY3VycmVudFNlc3Npb246IG51bGwsXG4gIGN1cnJlbnRXb3JkSW5kZXg6IDAsXG4gIHNlc3Npb25Xb3JkczogW10sXG4gIGlzRmxpcHBlZDogZmFsc2UsXG4gIHNlc3Npb25TdGF0czoge1xuICAgIHRvdGFsOiAwLFxuICAgIGNvbXBsZXRlZDogMCxcbiAgICBrbm93bjogMCxcbiAgICB1bmtub3duOiAwLFxuICAgIHNraXBwZWQ6IDAsXG4gICAgbWFzdGVyZWQ6IDBcbiAgfSxcblxuICBpbml0KCkge1xuICAgIHRoaXMuc2V0dXBMZWFybkNvbnRyb2xzKCk7XG4gICAgdGhpcy5sb2FkUmV2aWV3UXVldWUoKTtcbiAgfSxcblxuICBzZXR1cExlYXJuQ29udHJvbHMoKSB7XG4gICAgLy8gU3RhcnQgcmV2aWV3IGJ1dHRvblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0LXJldmlldy1idG4nKTtcbiAgICBpZiAoc3RhcnRCdG4pIHtcbiAgICAgIHN0YXJ0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5zdGFydFJldmlld1Nlc3Npb24oKSk7XG4gICAgfVxuXG4gICAgLy8gQWN0aW9uIGJ1dHRvbnNcbiAgICBjb25zdCBrbm93bkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdrbm93bi1idG4nKTtcbiAgICBjb25zdCB1bmtub3duQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Vua25vd24tYnRuJyk7XG4gICAgY29uc3Qgc2tpcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdza2lwLWJ0bicpO1xuICAgIGNvbnN0IG1hc3RlcmVkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hc3RlcmVkLWJ0bicpO1xuXG4gICAgaWYgKGtub3duQnRuKSB7XG4gICAgICBrbm93bkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdrbm93bicpKTtcbiAgICB9XG4gICAgaWYgKHVua25vd25CdG4pIHtcbiAgICAgIHVua25vd25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhhbmRsZVJldmlld0FjdGlvbigndW5rbm93bicpKTtcbiAgICB9XG4gICAgaWYgKHNraXBCdG4pIHtcbiAgICAgIHNraXBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhhbmRsZVJldmlld0FjdGlvbignc2tpcHBlZCcpKTtcbiAgICB9XG4gICAgaWYgKG1hc3RlcmVkQnRuKSB7XG4gICAgICBtYXN0ZXJlZEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdtYXN0ZXJlZCcpKTtcbiAgICB9XG5cbiAgICAvLyBGbGFzaGNhcmQgZmxpcFxuICAgIGNvbnN0IGZsYXNoY2FyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmbGFzaGNhcmQnKTtcbiAgICBpZiAoZmxhc2hjYXJkKSB7XG4gICAgICBmbGFzaGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmZsaXBDYXJkKCkpO1xuICAgIH1cblxuICAgIC8vIEtleWJvYXJkIHNob3J0Y3V0c1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTZXNzaW9uKSByZXR1cm47XG5cbiAgICAgIHN3aXRjaCAoZS5rZXkpIHtcbiAgICAgICAgY2FzZSAnICc6XG4gICAgICAgIGNhc2UgJ0VudGVyJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5mbGlwQ2FyZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcxJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXZpZXdBY3Rpb24oJ2tub3duJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzInOlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmhhbmRsZVJldmlld0FjdGlvbigndW5rbm93bicpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICczJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXZpZXdBY3Rpb24oJ3NraXBwZWQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnNCc6XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdtYXN0ZXJlZCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGFzeW5jIGxvYWRSZXZpZXdRdWV1ZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICBhY3Rpb246ICdnZXRSZXZpZXdRdWV1ZSdcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBjb25zdCBkdWVXb3Jkc0NvdW50ID0gcmVzcG9uc2UuZGF0YS5sZW5ndGg7XG4gICAgICAgIHRoaXMudXBkYXRlRHVlV29yZHNDb3VudChkdWVXb3Jkc0NvdW50KTtcbiAgICAgICAgdGhpcy5kaXNwbGF5UmV2aWV3U3RhdHVzKGR1ZVdvcmRzQ291bnQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdMb2FkIHJldmlldyBxdWV1ZSBlcnJvcjonLCBlcnJvcik7XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZUR1ZVdvcmRzQ291bnQoX2NvdW50KSB7XG4gICAgLy8gRHVlIHdvcmQgY291bnQgaXMgbm93IGRpc3BsYXllZCBpbiB0aGUgcmV2aWV3IHN0YXJ0IHNjcmVlblxuICAgIC8vIE5vIG5lZWQgZm9yIHNlcGFyYXRlIGhlYWRlciBlbGVtZW50XG4gIH0sXG5cbiAgZGlzcGxheVJldmlld1N0YXR1cyhkdWVXb3Jkc0NvdW50KSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxlYXJuLWNvbnRhaW5lcicpO1xuXG4gICAgaWYgKGR1ZVdvcmRzQ291bnQgPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJuby1yZXZpZXdzXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm5vLXJldmlld3MtaWNvblwiPvCfjok8L2Rpdj5cbiAgICAgICAgICA8aDM+QWxsIGNhdWdodCB1cCE8L2gzPlxuICAgICAgICAgIDxwPk5vIHdvcmRzIGFyZSBkdWUgZm9yIHJldmlldyByaWdodCBub3cuPC9wPlxuICAgICAgICAgIDxwIGNsYXNzPVwic21hbGwtdGV4dFwiPkNvbWUgYmFjayBsYXRlciBvciBhZGQgbW9yZSB3b3JkcyB0byB5b3VyIGxpc3RzLjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwicmV2aWV3LXN0YXJ0XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyZXZpZXctaGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1pY29uXCI+8J+OkzwvZGl2PlxuICAgICAgICAgIDxoMiBjbGFzcz1cInJldmlldy10aXRsZVwiPlJlYWR5IHRvIExlYXJuPC9oMj5cbiAgICAgICAgICA8cCBjbGFzcz1cInJldmlldy1zdWJ0aXRsZVwiPkxldCdzIHJldmlldyB5b3VyIHZvY2FidWxhcnkgd29yZHM8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1zdGF0c1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC1udW1iZXJcIj4ke2R1ZVdvcmRzQ291bnR9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+V29yZHMgRHVlPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgXG4gICAgICAgIDxidXR0b24gaWQ9XCJzdGFydC1yZXZpZXctYnRuXCIgY2xhc3M9XCJidG4tcHJpbWFyeSBidG4tbGFyZ2Ugc3RhcnQtc2Vzc2lvbi1idG5cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+8J+agDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi10ZXh0XCI+U3RhcnQgUmV2aWV3IFNlc3Npb248L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy10aXBzXCI+XG4gICAgICAgICAgPGg0PvCfkqEgUmV2aWV3IFRpcHM8L2g0PlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaT5DbGljayB0aGUgY2FyZCBvciBwcmVzcyA8a2JkPlNwYWNlPC9rYmQ+IHRvIGZsaXA8L2xpPlxuICAgICAgICAgICAgPGxpPlVzZSBudW1iZXIga2V5cyA8a2JkPjEtNDwva2JkPiBmb3IgcXVpY2sgYWN0aW9uczwvbGk+XG4gICAgICAgICAgICA8bGk+QmUgaG9uZXN0IHdpdGggeW91ciBzZWxmLWFzc2Vzc21lbnQgZm9yIGJldHRlciBsZWFybmluZzwvbGk+XG4gICAgICAgICAgICA8bGk+UmVndWxhciBwcmFjdGljZSBsZWFkcyB0byBiZXR0ZXIgcmV0ZW50aW9uPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBSZS1zZXR1cCBjb250cm9scyBhZnRlciBET00gdXBkYXRlXG4gICAgdGhpcy5zZXR1cExlYXJuQ29udHJvbHMoKTtcbiAgfSxcblxuICBhc3luYyBzdGFydFJldmlld1Nlc3Npb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgYWN0aW9uOiAnZ2V0UmV2aWV3UXVldWUnXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzIHx8IHJlc3BvbnNlLmRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnTm8gd29yZHMgYXZhaWxhYmxlIGZvciByZXZpZXcnLCAnaW5mbycpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2Vzc2lvbldvcmRzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgIHRoaXMuY3VycmVudFdvcmRJbmRleCA9IDA7XG4gICAgICB0aGlzLnNlc3Npb25TdGF0cyA9IHtcbiAgICAgICAgdG90YWw6IHRoaXMuc2Vzc2lvbldvcmRzLmxlbmd0aCxcbiAgICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgICBrbm93bjogMCxcbiAgICAgICAgdW5rbm93bjogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgbWFzdGVyZWQ6IDBcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuY3VycmVudFNlc3Npb24gPSB7XG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgcmVzdWx0czogW11cbiAgICAgIH07XG5cbiAgICAgIHRoaXMuZGlzcGxheUN1cnJlbnRXb3JkKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YXJ0IHJldmlldyBzZXNzaW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnRmFpbGVkIHRvIHN0YXJ0IHJldmlldyBzZXNzaW9uJywgJ2Vycm9yJyk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BsYXlDdXJyZW50V29yZCgpIHtcbiAgICBpZiAoIXRoaXMuY3VycmVudFNlc3Npb24gfHwgdGhpcy5jdXJyZW50V29yZEluZGV4ID49IHRoaXMuc2Vzc2lvbldvcmRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5lbmRSZXZpZXdTZXNzaW9uKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgZmxpcCBzdGF0ZSBiZWZvcmUgZ2VuZXJhdGluZyBIVE1MIHRvIGVuc3VyZSBuZXcgY2FyZCBzaG93cyBmcm9udFxuICAgIHRoaXMuaXNGbGlwcGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCB3b3JkID0gdGhpcy5zZXNzaW9uV29yZHNbdGhpcy5jdXJyZW50V29yZEluZGV4XTtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGVhcm4tY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1zZXNzaW9uXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBpZD1cImZsYXNoY2FyZFwiIGNsYXNzPVwiZmxhc2hjYXJkICR7dGhpcy5pc0ZsaXBwZWQgPyAnZmxpcHBlZCcgOiAnJ31cIiBkYXRhLXdvcmQ9XCIke3dvcmQud29yZH1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtZnJvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1udW1iZXJcIj4ke3RoaXMuY3VycmVudFdvcmRJbmRleCArIDF9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtbWluaW1hbFwiPiR7dGhpcy5jdXJyZW50V29yZEluZGV4ICsgMX0vJHt0aGlzLnNlc3Npb25Xb3Jkcy5sZW5ndGh9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzPVwid29yZC1kaXNwbGF5XCI+JHt3b3JkLndvcmR9PC9oMj5cbiAgICAgICAgICAgICAgICAke3dvcmQucHJvbnVuY2lhdGlvbiA/IGA8ZGl2IGNsYXNzPVwiZnJvbnQtcHJvbnVuY2lhdGlvblwiPiR7d29yZC5wcm9udW5jaWF0aW9ufTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxpcC1oaW50XCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImhpbnQtaWNvblwiPvCfkYY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImhpbnQtdGV4dFwiPkNsaWNrIHRvIHJldmVhbCBkZWZpbml0aW9uPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsYXNoY2FyZC1iYWNrXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzcz1cImZsYXNoY2FyZC13b3JkLXRpdGxlXCI+JHt3b3JkLndvcmR9PC9oMz5cbiAgICAgICAgICAgICAgICAgICR7d29yZC5wcm9udW5jaWF0aW9uID8gYDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtcHJvbnVuY2lhdGlvblwiPiR7d29yZC5wcm9udW5jaWF0aW9ufTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbnMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAke3dvcmQuZGVmaW5pdGlvbnMgJiYgd29yZC5kZWZpbml0aW9ucy5sZW5ndGggPiAwXG4/IHdvcmQuZGVmaW5pdGlvbnMubWFwKGRlZiA9PiBgXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkZWZpbml0aW9uLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhcnQtb2Ytc3BlZWNoXCI+JHtkZWYucGFydE9mU3BlZWNofTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbi10ZXh0XCI+JHtkZWYubWVhbmluZ308L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAke2RlZi5leGFtcGxlcyAmJiBkZWYuZXhhbXBsZXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZXhhbXBsZXNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZWYuZXhhbXBsZXMuc2xpY2UoMCwgMikubWFwKGV4ID0+IGA8ZGl2IGNsYXNzPVwiZXhhbXBsZVwiPlwiJHtleH1cIjwvZGl2PmApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgYFxuOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICBgKS5qb2luKCcnKVxuOiAnPGRpdiBjbGFzcz1cIm5vLWRlZmluaXRpb25cIj5ObyBkZWZpbml0aW9uIGF2YWlsYWJsZTwvZGl2Pid9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgJHt3b3JkLnN5bm9ueW1zICYmIHdvcmQuc3lub255bXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1zeW5vbnltc1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPlN5bm9ueW1zOjwvc3Ryb25nPiAke3dvcmQuc3lub255bXMuc2xpY2UoMCwgMykuam9pbignLCAnKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIGBcbjogJyd9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1hY3Rpb25zICR7dGhpcy5pc0ZsaXBwZWQgPyAndmlzaWJsZScgOiAnaGlkZGVuJ31cIj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwia25vd24tYnRuXCIgY2xhc3M9XCJyZXZpZXctYnRuIGJ0bi1rbm93blwiIHRpdGxlPVwiSSBrbm93IHRoaXMgKDEpXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+4pyFPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPktub3c8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1rZXlcIj4xPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJ1bmtub3duLWJ0blwiIGNsYXNzPVwicmV2aWV3LWJ0biBidG4tdW5rbm93blwiIHRpdGxlPVwiSSBkb24ndCBrbm93IHRoaXMgKDIpXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+4p2MPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPkxlYXJuaW5nPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4ta2V5XCI+Mjwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwic2tpcC1idG5cIiBjbGFzcz1cInJldmlldy1idG4gYnRuLXNraXBcIiB0aXRsZT1cIlNraXAgZm9yIG5vdyAoMylcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWljb25cIj7ij63vuI88L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi10ZXh0XCI+U2tpcDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWtleVwiPjM8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cIm1hc3RlcmVkLWJ0blwiIGNsYXNzPVwicmV2aWV3LWJ0biBidG4tbWFzdGVyZWRcIiB0aXRsZT1cIkkndmUgbWFzdGVyZWQgdGhpcyAoNClcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWljb25cIj7wn46vPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPk1hc3RlcmVkPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4ta2V5XCI+NDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgLy8gUmUtc2V0dXAgY29udHJvbHNcbiAgICB0aGlzLnNldHVwTGVhcm5Db250cm9scygpO1xuICB9LFxuXG4gIGZsaXBDYXJkKCkge1xuICAgIGlmICghdGhpcy5jdXJyZW50U2Vzc2lvbikgcmV0dXJuO1xuXG4gICAgY29uc3QgZmxhc2hjYXJkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZsYXNoY2FyZCcpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWFjdGlvbnMnKTtcblxuICAgIHRoaXMuaXNGbGlwcGVkID0gIXRoaXMuaXNGbGlwcGVkO1xuXG4gICAgaWYgKGZsYXNoY2FyZCkge1xuICAgICAgZmxhc2hjYXJkLmNsYXNzTGlzdC50b2dnbGUoJ2ZsaXBwZWQnLCB0aGlzLmlzRmxpcHBlZCk7XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbnMpIHtcbiAgICAgIGFjdGlvbnMuY2xhc3NMaXN0LnRvZ2dsZSgndmlzaWJsZScsIHRoaXMuaXNGbGlwcGVkKTtcbiAgICAgIGFjdGlvbnMuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZGVuJywgIXRoaXMuaXNGbGlwcGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgaGFuZGxlUmV2aWV3QWN0aW9uKGFjdGlvbikge1xuICAgIGlmICghdGhpcy5jdXJyZW50U2Vzc2lvbiB8fCB0aGlzLmN1cnJlbnRXb3JkSW5kZXggPj0gdGhpcy5zZXNzaW9uV29yZHMubGVuZ3RoKSByZXR1cm47XG5cbiAgICBjb25zdCB3b3JkID0gdGhpcy5zZXNzaW9uV29yZHNbdGhpcy5jdXJyZW50V29yZEluZGV4XTtcbiAgICBjb25zdCByZXZpZXdSZXN1bHQgPSB7XG4gICAgICB3b3JkOiB3b3JkLndvcmQsXG4gICAgICBhY3Rpb24sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICB9O1xuXG4gICAgLy8gVXBkYXRlIHNlc3Npb24gc3RhdHNcbiAgICB0aGlzLnNlc3Npb25TdGF0cy5jb21wbGV0ZWQrKztcbiAgICB0aGlzLnNlc3Npb25TdGF0c1thY3Rpb25dKys7XG4gICAgdGhpcy5jdXJyZW50U2Vzc2lvbi5yZXN1bHRzLnB1c2gocmV2aWV3UmVzdWx0KTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBTZW5kIHJldmlldyByZXN1bHQgdG8gYmFja2dyb3VuZFxuICAgICAgYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgYWN0aW9uOiAncHJvY2Vzc1JldmlldycsXG4gICAgICAgIHdvcmQ6IHdvcmQud29yZCxcbiAgICAgICAgcmVzdWx0OiBhY3Rpb24sXG4gICAgICAgIGxpc3RJZDogd29yZC5saXN0SWQgfHwgbnVsbFxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1vdmUgdG8gbmV4dCB3b3JkXG4gICAgICB0aGlzLmN1cnJlbnRXb3JkSW5kZXgrKztcbiAgICAgIHRoaXMuZGlzcGxheUN1cnJlbnRXb3JkKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Byb2Nlc3MgcmV2aWV3IGVycm9yOicsIGVycm9yKTtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnRmFpbGVkIHRvIHNhdmUgcmV2aWV3IHJlc3VsdCcsICdlcnJvcicpO1xuICAgIH1cbiAgfSxcblxuICBlbmRSZXZpZXdTZXNzaW9uKCkge1xuICAgIGlmICghdGhpcy5jdXJyZW50U2Vzc2lvbikgcmV0dXJuO1xuXG4gICAgY29uc3QgZW5kVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZHVyYXRpb24gPSBNYXRoLnJvdW5kKChlbmRUaW1lIC0gdGhpcy5jdXJyZW50U2Vzc2lvbi5zdGFydFRpbWUpIC8gMTAwMCk7IC8vIHNlY29uZHNcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGVhcm4tY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInNlc3Npb24tY29tcGxldGVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvbXBsZXRpb24taWNvblwiPvCfjok8L2Rpdj5cbiAgICAgICAgPGgzPlNlc3Npb24gQ29tcGxldGUhPC9oMz5cbiAgICAgICAgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJzZXNzaW9uLXN1bW1hcnlcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic3VtbWFyeS1zdGF0c1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtcm93XCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC1sYWJlbFwiPldvcmRzIFJldmlld2VkOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LXZhbHVlXCI+JHt0aGlzLnNlc3Npb25TdGF0cy5jb21wbGV0ZWR9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1yb3dcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+S25vd246PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtdmFsdWUga25vd25cIj4ke3RoaXMuc2Vzc2lvblN0YXRzLmtub3dufTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtcm93XCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC1sYWJlbFwiPkxlYXJuaW5nOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LXZhbHVlIHVua25vd25cIj4ke3RoaXMuc2Vzc2lvblN0YXRzLnVua25vd259PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1yb3dcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+TWFzdGVyZWQ6PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtdmFsdWUgbWFzdGVyZWRcIj4ke3RoaXMuc2Vzc2lvblN0YXRzLm1hc3RlcmVkfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtcm93XCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC1sYWJlbFwiPkR1cmF0aW9uOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LXZhbHVlXCI+JHtNYXRoLmZsb29yKGR1cmF0aW9uIC8gNjApfW0gJHtkdXJhdGlvbiAlIDYwfXM8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIFxuICAgICAgICA8ZGl2IGNsYXNzPVwic2Vzc2lvbi1hY3Rpb25zXCI+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cInJldmlldy1tb3JlLWJ0blwiIGNsYXNzPVwiYnRuLXByaW1hcnlcIj5SZXZpZXcgTW9yZTwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJmaW5pc2gtc2Vzc2lvbi1idG5cIiBjbGFzcz1cImJ0bi1zZWNvbmRhcnlcIj5GaW5pc2g8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgLy8gU2V0dXAgY29tcGxldGlvbiBhY3Rpb25zXG4gICAgY29uc3QgcmV2aWV3TW9yZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXctbW9yZS1idG4nKTtcbiAgICBjb25zdCBmaW5pc2hCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmluaXNoLXNlc3Npb24tYnRuJyk7XG5cbiAgICBpZiAocmV2aWV3TW9yZUJ0bikge1xuICAgICAgcmV2aWV3TW9yZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubG9hZFJldmlld1F1ZXVlKCkpO1xuICAgIH1cbiAgICBpZiAoZmluaXNoQnRuKSB7XG4gICAgICBmaW5pc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmxvYWRSZXZpZXdRdWV1ZSgpKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhciBzZXNzaW9uXG4gICAgdGhpcy5jdXJyZW50U2Vzc2lvbiA9IG51bGw7XG4gICAgdGhpcy5zZXNzaW9uV29yZHMgPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRXb3JkSW5kZXggPSAwO1xuXG4gICAgLy8gU2hvdyBjb21wbGV0aW9uIG5vdGlmaWNhdGlvblxuICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdyhcbiAgICAgIGBSZXZpZXcgc2Vzc2lvbiBjb21wbGV0ZWQhICR7dGhpcy5zZXNzaW9uU3RhdHMuY29tcGxldGVkfSB3b3JkcyByZXZpZXdlZC5gLFxuICAgICAgJ3N1Y2Nlc3MnXG4gICAgKTtcbiAgfVxufTtcblxuLy8gU2V0dGluZ3MgVGFiXG5jb25zdCBTZXR0aW5nc1RhYiA9IHtcbiAgaW5pdCgpIHtcbiAgICB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuc2V0dXBTZXR0aW5nc0xpc3RlbmVycygpO1xuICB9LFxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICBhY3Rpb246ICdnZXRTZXR0aW5ncydcbiAgICB9KTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHJlc3BvbnNlLnN1Y2Nlc3NcbiAgICAgID8gcmVzcG9uc2UuZGF0YVxuICAgICAgOiB7XG4gICAgICAgICAgdGhlbWU6ICdkYXJrJyxcbiAgICAgICAgICBhdXRvQWRkTG9va3VwczogdHJ1ZSxcbiAgICAgICAgICBkYWlseVJldmlld0xpbWl0OiAzMCxcbiAgICAgICAgICB0ZXh0U2VsZWN0aW9uTW9kZTogJ2lubGluZSdcbiAgICAgICAgfTtcblxuICAgIC8vIFVwZGF0ZSBVSVxuICAgIGNvbnN0IGF1dG9BZGRUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0by1hZGQtdG9nZ2xlJyk7XG4gICAgaWYgKGF1dG9BZGRUb2dnbGUpIGF1dG9BZGRUb2dnbGUuY2hlY2tlZCA9IHNldHRpbmdzLmF1dG9BZGRMb29rdXBzO1xuXG4gICAgY29uc3QgcmV2aWV3TGltaXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3LWxpbWl0Jyk7XG4gICAgaWYgKHJldmlld0xpbWl0KSByZXZpZXdMaW1pdC52YWx1ZSA9IHNldHRpbmdzLmRhaWx5UmV2aWV3TGltaXQ7XG5cbiAgICAvLyBUZXh0IHNlbGVjdGlvbiBtb2RlIHJhZGlvIGJ1dHRvbnNcbiAgICBjb25zdCB0ZXh0U2VsZWN0aW9uTW9kZSA9IHNldHRpbmdzLnRleHRTZWxlY3Rpb25Nb2RlIHx8ICdpbmxpbmUnO1xuICAgIGNvbnN0IGlubGluZVJhZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQtc2VsZWN0aW9uLWlubGluZScpO1xuICAgIGNvbnN0IHBvcHVwUmFkaW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGV4dC1zZWxlY3Rpb24tcG9wdXAnKTtcbiAgICBpZiAoaW5saW5lUmFkaW8gJiYgcG9wdXBSYWRpbykge1xuICAgICAgaWYgKHRleHRTZWxlY3Rpb25Nb2RlID09PSAncG9wdXAnKSB7XG4gICAgICAgIHBvcHVwUmFkaW8uY2hlY2tlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmxpbmVSYWRpby5jaGVja2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0dXBTZXR0aW5nc0xpc3RlbmVycygpIHtcbiAgICAvLyBBdXRvLWFkZCB0b2dnbGVcbiAgICBjb25zdCBhdXRvQWRkVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG8tYWRkLXRvZ2dsZScpO1xuICAgIGlmIChhdXRvQWRkVG9nZ2xlKSB7XG4gICAgICBhdXRvQWRkVG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU2V0dGluZygnYXV0b0FkZExvb2t1cHMnLCBlLnRhcmdldC5jaGVja2VkKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldmlldyBsaW1pdFxuICAgIGNvbnN0IHJldmlld0xpbWl0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlldy1saW1pdCcpO1xuICAgIGlmIChyZXZpZXdMaW1pdCkge1xuICAgICAgcmV2aWV3TGltaXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVTZXR0aW5nKCdkYWlseVJldmlld0xpbWl0JywgcGFyc2VJbnQoZS50YXJnZXQudmFsdWUpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRleHQgc2VsZWN0aW9uIG1vZGUgcmFkaW8gYnV0dG9uc1xuICAgIGNvbnN0IGlubGluZVJhZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQtc2VsZWN0aW9uLWlubGluZScpO1xuICAgIGNvbnN0IHBvcHVwUmFkaW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGV4dC1zZWxlY3Rpb24tcG9wdXAnKTtcblxuICAgIGlmIChpbmxpbmVSYWRpbykge1xuICAgICAgaW5saW5lUmFkaW8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgaWYgKGUudGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNldHRpbmcoJ3RleHRTZWxlY3Rpb25Nb2RlJywgJ2lubGluZScpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocG9wdXBSYWRpbykge1xuICAgICAgcG9wdXBSYWRpby5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuICAgICAgICBpZiAoZS50YXJnZXQuY2hlY2tlZCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlU2V0dGluZygndGV4dFNlbGVjdGlvbk1vZGUnLCAncG9wdXAnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRXhwb3J0L0ltcG9ydCBidXR0b25zIHdvdWxkIGJlIGltcGxlbWVudGVkIGhlcmVcbiAgfSxcblxuICBhc3luYyB1cGRhdGVTZXR0aW5nKGtleSwgdmFsdWUpIHtcbiAgICBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgYWN0aW9uOiAndXBkYXRlU2V0dGluZ3MnLFxuICAgICAgc2V0dGluZ3M6IHsgW2tleV06IHZhbHVlIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLy8gTm90aWZpY2F0aW9uIE1hbmFnZXJcbmNvbnN0IE5vdGlmaWNhdGlvbk1hbmFnZXIgPSB7XG4gIHNob3cobWVzc2FnZSwgdHlwZSA9ICdpbmZvJykge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50b2FzdC1jb250YWluZXInKTtcblxuICAgIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdG9hc3QuY2xhc3NOYW1lID0gYHRvYXN0ICR7dHlwZX1gO1xuXG4gICAgY29uc3QgaWNvbnMgPSB7XG4gICAgICBpbmZvOiAn4oS577iPJyxcbiAgICAgIHN1Y2Nlc3M6ICfinIUnLFxuICAgICAgd2FybmluZzogJ+KaoO+4jycsXG4gICAgICBlcnJvcjogJ+KdjCdcbiAgICB9O1xuXG4gICAgdG9hc3QuaW5uZXJIVE1MID0gYFxuICAgICAgPHNwYW4gY2xhc3M9XCJ0b2FzdC1pY29uXCI+JHtpY29uc1t0eXBlXX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cInRvYXN0LW1lc3NhZ2VcIj4ke21lc3NhZ2V9PC9zcGFuPlxuICAgIGA7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpO1xuXG4gICAgLy8gQXV0by1yZW1vdmUgYWZ0ZXIgMyBzZWNvbmRzXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0b2FzdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0b2FzdC5yZW1vdmUoKSwgMzAwKTtcbiAgICB9LCAzMDAwKTtcbiAgfVxufTtcblxuLy8gSW5pdGlhbGl6ZSBwb3B1cCB3aGVuIERPTSBpcyByZWFkeSAtIG1vdmVkIHRvIHRvcCB3aXRoIGRlYnVnIGNvZGVcbiJdLCJuYW1lcyI6WyJicm93c2VyIiwiY2hyb21lIiwid2luZG93IiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiVGhlbWVNYW5hZ2VyIiwiaW5pdCIsIlRhYk1hbmFnZXIiLCJsb2FkVGhlbWUiLCJzZXR1cFRoZW1lTGlzdGVuZXJzIiwicnVudGltZSIsInNlbmRNZXNzYWdlIiwiYWN0aW9uIiwidGhlbiIsInJlc3BvbnNlIiwic3VjY2VzcyIsInRoZW1lIiwiZGF0YSIsImFwcGx5VGhlbWUiLCJ0aGVtZVNlbGVjdCIsImdldEVsZW1lbnRCeUlkIiwidmFsdWUiLCJyb290IiwiZG9jdW1lbnRFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiZSIsInRhcmdldCIsInNldHRpbmdzIiwic2V0dXBUYWJMaXN0ZW5lcnMiLCJzaG93VGFiIiwidGFiQnV0dG9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJmb3JFYWNoIiwiYnV0dG9uIiwidGFiTmFtZSIsImRhdGFzZXQiLCJ0YWIiLCJpc0FjdGl2ZSIsImNsYXNzTGlzdCIsInRvZ2dsZSIsInRhYlBhbmVscyIsInBhbmVsIiwiaWQiLCJTZWFyY2hUYWIiLCJMaXN0c1RhYiIsIkxlYXJuVGFiIiwiU2V0dGluZ3NUYWIiLCJzZWFyY2hUaW1lb3V0IiwicmVjZW50U2VhcmNoZXMiLCJzZXR1cFNlYXJjaElucHV0IiwibG9hZFJlY2VudFNlYXJjaGVzIiwiY2hlY2tQZW5kaW5nQ29udGV4dFNlYXJjaCIsIndvcmQiLCJzZWFyY2hJbnB1dCIsInF1ZXJ5U2VsZWN0b3IiLCJwZXJmb3JtU2VhcmNoIiwiZXJyb3IiLCJjb25zb2xlIiwiY2xlYXJUaW1lb3V0IiwicXVlcnkiLCJ0cmltIiwibGVuZ3RoIiwiY2xlYXJTZWFyY2hSZXN1bHRzIiwic2V0VGltZW91dCIsImtleSIsImRpc3BsYXlTZWFyY2hSZXN1bHQiLCJkaXNwbGF5Tm9SZXN1bHRzIiwic3VnZ2VzdGlvbnMiLCJkaXNwbGF5RXJyb3IiLCJ3b3JkRGF0YSIsInJlc3VsdHNDb250YWluZXIiLCJzdHlsZSIsImRpc3BsYXkiLCJhZGQiLCJpbm5lckhUTUwiLCJwcm9udW5jaWF0aW9uIiwiZGVmaW5pdGlvbnMiLCJtYXAiLCJkZWYiLCJwYXJ0T2ZTcGVlY2giLCJtZWFuaW5nIiwiZXhhbXBsZXMiLCJleCIsImpvaW4iLCJzeW5vbnltcyIsImFudG9ueW1zIiwiYWRkQnV0dG9uIiwiYWRkVG9MaXN0IiwicyIsImxpbmsiLCJwcmV2ZW50RGVmYXVsdCIsInN1Z2dlc3Rpb24iLCJyZW1vdmUiLCJsaXN0c1Jlc3BvbnNlIiwibGlzdHMiLCJkZWZhdWx0TGlzdCIsImZpbmQiLCJsIiwiaXNEZWZhdWx0IiwiTm90aWZpY2F0aW9uTWFuYWdlciIsInNob3ciLCJhZGRSZXNwb25zZSIsImxpc3RJZCIsIm5hbWUiLCJkaXNwbGF5UmVjZW50U2VhcmNoZXMiLCJjb250YWluZXIiLCJzbGljZSIsInNlYXJjaCIsIml0ZW0iLCJjdXJyZW50TGlzdElkIiwiY3VycmVudExpc3QiLCJjdXJyZW50U29ydCIsImN1cnJlbnRGaWx0ZXIiLCJsb2FkTGlzdHMiLCJzZXR1cExpc3RDb250cm9scyIsImRpc3BsYXlMaXN0cyIsImxpc3QiLCJPYmplY3QiLCJrZXlzIiwid29yZHMiLCJmb3JtYXREYXRlIiwidXBkYXRlZCIsImNyZWF0ZWQiLCJzZWxlY3RMaXN0IiwibG9hZExpc3RXb3JkcyIsImRpc3BsYXlMaXN0V29yZHMiLCJyZWZyZXNoV29yZHNMaXN0Iiwic29ydEJ5Iiwic29ydE9yZGVyIiwiZmlsdGVyQnkiLCJ1cGRhdGVTdGF0dXNTZWN0aW9uIiwicmVuZGVyV29yZEl0ZW0iLCJ3b3JkQ291bnQiLCJsaXN0U3RhdHVzIiwic29ydEluZGljYXRvciIsImZpbHRlckluZGljYXRvciIsInJlc3VsdENvdW50Iiwic29ydExhYmVscyIsInJlY2VudCIsImFscGhhYmV0aWNhbCIsImRhdGVBZGRlZCIsImxhc3RSZXZpZXdlZCIsImRpZmZpY3VsdHkiLCJsb29rdXBDb3VudCIsInRleHRDb250ZW50IiwiZmlsdGVyTGFiZWxzIiwiZWFzeSIsIm1lZGl1bSIsImhhcmQiLCJ3b3JkSXRlbSIsImNvdW50IiwiZGlmZmljdWx0eU1hcCIsIm5ld0xpc3RCdG4iLCJzaG93TmV3TGlzdERpYWxvZyIsImNhbmNlbEJ0biIsImNvbmZpcm1CdG4iLCJuYW1lSW5wdXQiLCJoaWRlTmV3TGlzdERpYWxvZyIsImNyZWF0ZU5ld0xpc3QiLCJzb3J0U2VsZWN0IiwiZmlsdGVyU2VsZWN0IiwiZGlhbG9nIiwiZm9jdXMiLCJkYXRlU3RyaW5nIiwiZGF0ZSIsIkRhdGUiLCJub3ciLCJkaWZmVGltZSIsIk1hdGgiLCJhYnMiLCJkaWZmRGF5cyIsImZsb29yIiwidG9Mb2NhbGVEYXRlU3RyaW5nIiwiY3VycmVudFNlc3Npb24iLCJjdXJyZW50V29yZEluZGV4Iiwic2Vzc2lvbldvcmRzIiwiaXNGbGlwcGVkIiwic2Vzc2lvblN0YXRzIiwidG90YWwiLCJjb21wbGV0ZWQiLCJrbm93biIsInVua25vd24iLCJza2lwcGVkIiwibWFzdGVyZWQiLCJzZXR1cExlYXJuQ29udHJvbHMiLCJsb2FkUmV2aWV3UXVldWUiLCJzdGFydEJ0biIsInN0YXJ0UmV2aWV3U2Vzc2lvbiIsImtub3duQnRuIiwidW5rbm93bkJ0biIsInNraXBCdG4iLCJtYXN0ZXJlZEJ0biIsImhhbmRsZVJldmlld0FjdGlvbiIsImZsYXNoY2FyZCIsImZsaXBDYXJkIiwiZHVlV29yZHNDb3VudCIsInVwZGF0ZUR1ZVdvcmRzQ291bnQiLCJkaXNwbGF5UmV2aWV3U3RhdHVzIiwiX2NvdW50Iiwic3RhcnRUaW1lIiwicmVzdWx0cyIsImRpc3BsYXlDdXJyZW50V29yZCIsImVuZFJldmlld1Nlc3Npb24iLCJhY3Rpb25zIiwicmV2aWV3UmVzdWx0IiwidGltZXN0YW1wIiwicHVzaCIsInJlc3VsdCIsImVuZFRpbWUiLCJkdXJhdGlvbiIsInJvdW5kIiwicmV2aWV3TW9yZUJ0biIsImZpbmlzaEJ0biIsImxvYWRTZXR0aW5ncyIsInNldHVwU2V0dGluZ3NMaXN0ZW5lcnMiLCJhdXRvQWRkTG9va3VwcyIsImRhaWx5UmV2aWV3TGltaXQiLCJ0ZXh0U2VsZWN0aW9uTW9kZSIsImF1dG9BZGRUb2dnbGUiLCJjaGVja2VkIiwicmV2aWV3TGltaXQiLCJpbmxpbmVSYWRpbyIsInBvcHVwUmFkaW8iLCJ1cGRhdGVTZXR0aW5nIiwicGFyc2VJbnQiLCJtZXNzYWdlIiwidHlwZSIsInRvYXN0IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImljb25zIiwiaW5mbyIsIndhcm5pbmciLCJhcHBlbmRDaGlsZCIsIm9wYWNpdHkiXSwic291cmNlUm9vdCI6IiJ9