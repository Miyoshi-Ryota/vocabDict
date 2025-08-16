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
      type: 'get_settings'
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
          type: 'update_settings',
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
        type: 'get_pending_context_search'
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
        type: 'lookup_word',
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
        type: 'get_lists'
      });
      const lists = listsResponse.success ? listsResponse.data : [];
      const defaultList = lists.find(l => l.isDefault) || lists[0];
      if (!defaultList) {
        NotificationManager.show('No vocabulary lists found', 'error');
        return;
      }

      // Send add to list request
      const addResponse = await browser.runtime.sendMessage({
        type: 'add_to_list',
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
      type: 'get_recent_searches'
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
        type: 'get_lists'
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
        type: 'get_lists'
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
        type: 'get_list_words',
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
        type: 'create_list',
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
        type: 'get_review_queue'
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
        type: 'get_review_queue'
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
        type: 'process_review',
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
      type: 'get_settings'
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
      type: 'update_settings',
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TixJQUFJLENBQUM7QUFDNUMsb0NBQW9Dc04sT0FBTztBQUMzQyxLQUFLO0lBRUR6SCxTQUFTLENBQUNnSSxXQUFXLENBQUNOLEtBQUssQ0FBQzs7SUFFNUI7SUFDQXBLLFVBQVUsQ0FBQyxNQUFNO01BQ2ZvSyxLQUFLLENBQUM1SixLQUFLLENBQUNtSyxPQUFPLEdBQUcsR0FBRztNQUN6QjNLLFVBQVUsQ0FBQyxNQUFNb0ssS0FBSyxDQUFDdkksTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7SUFDdkMsQ0FBQyxFQUFFLElBQUksQ0FBQztFQUNWO0FBQ0YsQ0FBQzs7QUFFRCxvRSIsInNvdXJjZXMiOlsid2VicGFjazovL3ZvY2FiZGljdC8uL3NyYy9wb3B1cC9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3B1cCBzY3JpcHQgZm9yIFZvY2FiRGljdCBTYWZhcmkgRXh0ZW5zaW9uXG5cbi8vIEJyb3dzZXIgQVBJIGNvbXBhdGliaWxpdHkgLSBNVVNUIGJlIGZpcnN0XG5pZiAodHlwZW9mIGJyb3dzZXIgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjaHJvbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5icm93c2VyID0gY2hyb21lO1xufVxuXG4vLyBJbml0aWFsaXplIHBvcHVwIHdoZW4gRE9NIGlzIHJlYWR5XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICAvLyBJbml0aWFsaXplIG1hbmFnZXJzXG4gIFRoZW1lTWFuYWdlci5pbml0KCk7XG4gIFRhYk1hbmFnZXIuaW5pdCgpO1xufSk7XG5cbi8vIFRoZW1lIE1hbmFnZW1lbnRcbmNvbnN0IFRoZW1lTWFuYWdlciA9IHtcbiAgaW5pdCgpIHtcbiAgICB0aGlzLmxvYWRUaGVtZSgpO1xuICAgIHRoaXMuc2V0dXBUaGVtZUxpc3RlbmVycygpO1xuICB9LFxuXG4gIGxvYWRUaGVtZSgpIHtcbiAgICAvLyBDaGVjayBmb3Igc2F2ZWQgdGhlbWUgcHJlZmVyZW5jZVxuICAgIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnZ2V0X3NldHRpbmdzJ1xuICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgY29uc3QgdGhlbWUgPSByZXNwb25zZS5kYXRhLnRoZW1lIHx8ICdkYXJrJztcbiAgICAgICAgdGhpcy5hcHBseVRoZW1lKHRoZW1lKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlbWUgc2VsZWN0b3IgaWYgaXQgZXhpc3RzXG4gICAgICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lLXNlbGVjdCcpO1xuICAgICAgICBpZiAodGhlbWVTZWxlY3QpIHtcbiAgICAgICAgICB0aGVtZVNlbGVjdC52YWx1ZSA9IHRoZW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgYXBwbHlUaGVtZSh0aGVtZSkge1xuICAgIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgcm9vdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnLCB0aGVtZSk7XG4gIH0sXG5cbiAgc2V0dXBUaGVtZUxpc3RlbmVycygpIHtcbiAgICAvLyBMaXN0ZW4gZm9yIHRoZW1lIHNlbGVjdG9yIGNoYW5nZXNcbiAgICBjb25zdCB0aGVtZVNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZS1zZWxlY3QnKTtcbiAgICBpZiAodGhlbWVTZWxlY3QpIHtcbiAgICAgIHRoZW1lU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGNvbnN0IHRoZW1lID0gZS50YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuYXBwbHlUaGVtZSh0aGVtZSk7XG5cbiAgICAgICAgLy8gU2F2ZSBwcmVmZXJlbmNlXG4gICAgICAgIGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ3VwZGF0ZV9zZXR0aW5ncycsXG4gICAgICAgICAgc2V0dGluZ3M6IHsgdGhlbWUgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufTtcblxuLy8gVGFiIE5hdmlnYXRpb25cbmNvbnN0IFRhYk1hbmFnZXIgPSB7XG4gIGluaXQoKSB7XG4gICAgdGhpcy5zZXR1cFRhYkxpc3RlbmVycygpO1xuICAgIHRoaXMuc2hvd1RhYignc2VhcmNoJyk7IC8vIERlZmF1bHQgdGFiXG4gIH0sXG5cbiAgc2V0dXBUYWJMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgdGFiQnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItYnV0dG9uJyk7XG4gICAgdGFiQnV0dG9ucy5mb3JFYWNoKGJ1dHRvbiA9PiB7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhYk5hbWUgPSBidXR0b24uZGF0YXNldC50YWI7XG4gICAgICAgIHRoaXMuc2hvd1RhYih0YWJOYW1lKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHNob3dUYWIodGFiTmFtZSkge1xuICAgIC8vIFVwZGF0ZSBidXR0b25zXG4gICAgY29uc3QgdGFiQnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItYnV0dG9uJyk7XG4gICAgdGFiQnV0dG9ucy5mb3JFYWNoKGJ1dHRvbiA9PiB7XG4gICAgICBjb25zdCBpc0FjdGl2ZSA9IGJ1dHRvbi5kYXRhc2V0LnRhYiA9PT0gdGFiTmFtZTtcbiAgICAgIGJ1dHRvbi5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnLCBpc0FjdGl2ZSk7XG4gICAgICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgaXNBY3RpdmUpO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHBhbmVsc1xuICAgIGNvbnN0IHRhYlBhbmVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItcGFuZWwnKTtcbiAgICB0YWJQYW5lbHMuZm9yRWFjaChwYW5lbCA9PiB7XG4gICAgICBjb25zdCBpc0FjdGl2ZSA9IHBhbmVsLmlkID09PSBgJHt0YWJOYW1lfS10YWJgO1xuICAgICAgcGFuZWwuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJywgaXNBY3RpdmUpO1xuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0YWItc3BlY2lmaWMgY29udGVudFxuICAgIHN3aXRjaCAodGFiTmFtZSkge1xuICAgICAgY2FzZSAnc2VhcmNoJzpcbiAgICAgICAgU2VhcmNoVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsaXN0cyc6XG4gICAgICAgIExpc3RzVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsZWFybic6XG4gICAgICAgIExlYXJuVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzZXR0aW5ncyc6XG4gICAgICAgIFNldHRpbmdzVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG4vLyBTZWFyY2ggVGFiXG5jb25zdCBTZWFyY2hUYWIgPSB7XG4gIHNlYXJjaFRpbWVvdXQ6IG51bGwsXG4gIHJlY2VudFNlYXJjaGVzOiBbXSxcblxuICBpbml0KCkge1xuICAgIHRoaXMuc2V0dXBTZWFyY2hJbnB1dCgpO1xuICAgIHRoaXMubG9hZFJlY2VudFNlYXJjaGVzKCk7XG4gICAgdGhpcy5jaGVja1BlbmRpbmdDb250ZXh0U2VhcmNoKCk7XG4gIH0sXG5cbiAgYXN5bmMgY2hlY2tQZW5kaW5nQ29udGV4dFNlYXJjaCgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnZ2V0X3BlbmRpbmdfY29udGV4dF9zZWFyY2gnXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MgJiYgcmVzcG9uc2UuZGF0YSkge1xuICAgICAgICBjb25zdCB3b3JkID0gcmVzcG9uc2UuZGF0YTtcblxuICAgICAgICAvLyBTZXQgdGhlIHNlYXJjaCBpbnB1dCB2YWx1ZVxuICAgICAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtaW5wdXQnKTtcbiAgICAgICAgaWYgKHNlYXJjaElucHV0KSB7XG4gICAgICAgICAgc2VhcmNoSW5wdXQudmFsdWUgPSB3b3JkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGVyZm9ybSB0aGUgc2VhcmNoIHVzaW5nIHRoZSBub3JtYWwgZmxvd1xuICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2god29yZCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjaGVjayBwZW5kaW5nIGNvbnRleHQgc2VhcmNoOicsIGVycm9yKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0dXBTZWFyY2hJbnB1dCgpIHtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtaW5wdXQnKTtcbiAgICBpZiAoIXNlYXJjaElucHV0KSByZXR1cm47XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lb3V0KTtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gZS50YXJnZXQudmFsdWUudHJpbSgpO1xuXG4gICAgICBpZiAocXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuY2xlYXJTZWFyY2hSZXN1bHRzKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRGVib3VuY2Ugc2VhcmNoXG4gICAgICB0aGlzLnNlYXJjaFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHF1ZXJ5KTtcbiAgICAgIH0sIDMwMCk7XG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lb3V0KTtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBlLnRhcmdldC52YWx1ZS50cmltKCk7XG4gICAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChxdWVyeSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBhc3luYyBwZXJmb3JtU2VhcmNoKHF1ZXJ5KSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFNlbmQgc2VhcmNoIHJlcXVlc3QgdG8gYmFja2dyb3VuZFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnbG9va3VwX3dvcmQnLFxuICAgICAgICB3b3JkOiBxdWVyeVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5U2VhcmNoUmVzdWx0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIC8vIFJlbG9hZCByZWNlbnQgc2VhcmNoZXMgdG8gc2hvdyB0aGUgbmV3IHNlYXJjaCBpbW1lZGlhdGVseVxuICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFJlY2VudFNlYXJjaGVzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5Tm9SZXN1bHRzKHF1ZXJ5LCByZXNwb25zZS5zdWdnZXN0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGlzcGxheUVycm9yKHJlc3BvbnNlLmVycm9yKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignU2VhcmNoIGVycm9yOicsIGVycm9yKTtcbiAgICAgIHRoaXMuZGlzcGxheUVycm9yKCdGYWlsZWQgdG8gc2VhcmNoLiBQbGVhc2UgdHJ5IGFnYWluLicpO1xuICAgIH1cbiAgfSxcblxuICBkaXNwbGF5U2VhcmNoUmVzdWx0KHdvcmREYXRhKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIGNvbnN0IHJlY2VudFNlYXJjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlY2VudC1zZWFyY2hlcycpO1xuXG4gICAgLy8gSGlkZSByZWNlbnQgc2VhcmNoZXMgd2hlbiBzaG93aW5nIHNlYXJjaCByZXN1bHRzXG4gICAgaWYgKHJlY2VudFNlYXJjaGVzKSB7XG4gICAgICByZWNlbnRTZWFyY2hlcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIEFkZCBjbGFzcyB0byBlbmFibGUgZmxleCBncm93dGhcbiAgICByZXN1bHRzQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2hhcy1jb250ZW50Jyk7XG5cbiAgICByZXN1bHRzQ29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWNhcmRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtaGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtaW5mb1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtdGl0bGVcIj4ke3dvcmREYXRhLndvcmR9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1wcm9udW5jaWF0aW9uXCI+JHt3b3JkRGF0YS5wcm9udW5jaWF0aW9ufTwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhZGQtdG8tbGlzdC1idG5cIiB0aXRsZT1cIkFkZCB0byBsaXN0XCI+8J+TmjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgJHt3b3JkRGF0YS5kZWZpbml0aW9ucy5tYXAoZGVmID0+IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbi1zZWN0aW9uXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1wYXJ0LW9mLXNwZWVjaFwiPiR7ZGVmLnBhcnRPZlNwZWVjaH08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWRlZmluaXRpb25cIj4ke2RlZi5tZWFuaW5nfTwvZGl2PlxuICAgICAgICAgICAgJHtkZWYuZXhhbXBsZXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWV4YW1wbGVzXCI+XG4gICAgICAgICAgICAgICAgPGg0PkV4YW1wbGVzOjwvaDQ+XG4gICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgJHtkZWYuZXhhbXBsZXMubWFwKGV4ID0+IGA8bGk+JHtleH08L2xpPmApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYFxuOiAnJ31cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICR7d29yZERhdGEuc3lub255bXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtc3lub255bXNcIj5cbiAgICAgICAgICAgIDxzdHJvbmc+U3lub255bXM6PC9zdHJvbmc+ICR7d29yZERhdGEuc3lub255bXMuam9pbignLCAnKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuOiAnJ31cbiAgICAgICAgJHt3b3JkRGF0YS5hbnRvbnltcy5sZW5ndGggPiAwXG4/IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1zeW5vbnltc1wiPlxuICAgICAgICAgICAgPHN0cm9uZz5BbnRvbnltczo8L3N0cm9uZz4gJHt3b3JkRGF0YS5hbnRvbnltcy5qb2luKCcsICcpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgXG46ICcnfVxuICAgICAgPC9kaXY+XG4gICAgYDtcblxuICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgXCJBZGQgdG8gTGlzdFwiIGJ1dHRvblxuICAgIGNvbnN0IGFkZEJ1dHRvbiA9IHJlc3VsdHNDb250YWluZXIucXVlcnlTZWxlY3RvcignLmFkZC10by1saXN0LWJ0bicpO1xuICAgIGFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuYWRkVG9MaXN0KHdvcmREYXRhKSk7XG4gIH0sXG5cbiAgZGlzcGxheU5vUmVzdWx0cyhxdWVyeSwgc3VnZ2VzdGlvbnMgPSBbXSkge1xuICAgIGNvbnN0IHJlc3VsdHNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLXJlc3VsdHMnKTtcbiAgICBjb25zdCByZWNlbnRTZWFyY2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZWNlbnQtc2VhcmNoZXMnKTtcblxuICAgIC8vIEhpZGUgcmVjZW50IHNlYXJjaGVzIHdoZW4gc2hvd2luZyBzZWFyY2ggcmVzdWx0c1xuICAgIGlmIChyZWNlbnRTZWFyY2hlcykge1xuICAgICAgcmVjZW50U2VhcmNoZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbiAgICAvLyBBZGQgY2xhc3MgdG8gZW5hYmxlIGZsZXggZ3Jvd3RoXG4gICAgcmVzdWx0c0NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdoYXMtY29udGVudCcpO1xuXG4gICAgcmVzdWx0c0NvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm8tcmVzdWx0c1wiPlxuICAgICAgICA8cD5ObyByZXN1bHRzIGZvdW5kIGZvciBcIjxzdHJvbmc+JHtxdWVyeX08L3N0cm9uZz5cIjwvcD5cbiAgICAgICAgJHtzdWdnZXN0aW9ucy5sZW5ndGggPiAwXG4/IGBcbiAgICAgICAgICA8cCBjbGFzcz1cInNtYWxsLXRleHRcIj5EaWQgeW91IG1lYW46PC9wPlxuICAgICAgICAgIDx1bCBjbGFzcz1cInN1Z2dlc3Rpb25zLWxpc3RcIj5cbiAgICAgICAgICAgICR7c3VnZ2VzdGlvbnMubWFwKHMgPT4gYFxuICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBkYXRhLXN1Z2dlc3Rpb249XCIke3N9XCI+JHtzfTwvYT48L2xpPlxuICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgYFxuOiAnJ31cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBBZGQgY2xpY2sgaGFuZGxlcnMgZm9yIHN1Z2dlc3Rpb25zXG4gICAgcmVzdWx0c0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1zdWdnZXN0aW9uXScpLmZvckVhY2gobGluayA9PiB7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBzdWdnZXN0aW9uID0gZS50YXJnZXQuZGF0YXNldC5zdWdnZXN0aW9uO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLWlucHV0JykudmFsdWUgPSBzdWdnZXN0aW9uO1xuICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2goc3VnZ2VzdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBkaXNwbGF5RXJyb3IoZXJyb3IpIHtcbiAgICBjb25zdCByZXN1bHRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaC1yZXN1bHRzJyk7XG4gICAgY29uc3QgcmVjZW50U2VhcmNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVjZW50LXNlYXJjaGVzJyk7XG5cbiAgICAvLyBIaWRlIHJlY2VudCBzZWFyY2hlcyB3aGVuIHNob3dpbmcgZXJyb3JcbiAgICBpZiAocmVjZW50U2VhcmNoZXMpIHtcbiAgICAgIHJlY2VudFNlYXJjaGVzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuXG4gICAgLy8gQWRkIGNsYXNzIHRvIGVuYWJsZSBmbGV4IGdyb3d0aFxuICAgIHJlc3VsdHNDb250YWluZXIuY2xhc3NMaXN0LmFkZCgnaGFzLWNvbnRlbnQnKTtcblxuICAgIHJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cImVycm9yLW1lc3NhZ2VcIj5cbiAgICAgICAgPHA+RXJyb3I6ICR7ZXJyb3J9PC9wPlxuICAgICAgPC9kaXY+XG4gICAgYDtcbiAgfSxcblxuICBjbGVhclNlYXJjaFJlc3VsdHMoKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIGNvbnN0IHJlY2VudFNlYXJjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlY2VudC1zZWFyY2hlcycpO1xuXG4gICAgcmVzdWx0c0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcblxuICAgIC8vIFJlbW92ZSBjbGFzcyB0byBkaXNhYmxlIGZsZXggZ3Jvd3RoXG4gICAgcmVzdWx0c0NvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtY29udGVudCcpO1xuXG4gICAgLy8gU2hvdyByZWNlbnQgc2VhcmNoZXMgd2hlbiBjbGVhcmluZyByZXN1bHRzXG4gICAgaWYgKHJlY2VudFNlYXJjaGVzKSB7XG4gICAgICByZWNlbnRTZWFyY2hlcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgYWRkVG9MaXN0KHdvcmREYXRhKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCBkZWZhdWx0IGxpc3RcbiAgICAgIGNvbnN0IGxpc3RzUmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnZ2V0X2xpc3RzJ1xuICAgICAgfSk7XG4gICAgICBjb25zdCBsaXN0cyA9IGxpc3RzUmVzcG9uc2Uuc3VjY2VzcyA/IGxpc3RzUmVzcG9uc2UuZGF0YSA6IFtdO1xuICAgICAgY29uc3QgZGVmYXVsdExpc3QgPSBsaXN0cy5maW5kKGwgPT4gbC5pc0RlZmF1bHQpIHx8IGxpc3RzWzBdO1xuXG4gICAgICBpZiAoIWRlZmF1bHRMaXN0KSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnTm8gdm9jYWJ1bGFyeSBsaXN0cyBmb3VuZCcsICdlcnJvcicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbmQgYWRkIHRvIGxpc3QgcmVxdWVzdFxuICAgICAgY29uc3QgYWRkUmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnYWRkX3RvX2xpc3QnLFxuICAgICAgICB3b3JkOiB3b3JkRGF0YS53b3JkLFxuICAgICAgICBsaXN0SWQ6IGRlZmF1bHRMaXN0LmlkXG4gICAgICB9KTtcblxuICAgICAgaWYgKGFkZFJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KGBBZGRlZCBcIiR7d29yZERhdGEud29yZH1cIiB0byAke2RlZmF1bHRMaXN0Lm5hbWV9YCwgJ3N1Y2Nlc3MnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdyhhZGRSZXNwb25zZS5lcnJvciB8fCAnRmFpbGVkIHRvIGFkZCB3b3JkJywgJ2Vycm9yJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0FkZCB0byBsaXN0IGVycm9yOicsIGVycm9yKTtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnRmFpbGVkIHRvIGFkZCB3b3JkIHRvIGxpc3QnLCAnZXJyb3InKTtcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgbG9hZFJlY2VudFNlYXJjaGVzKCkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdnZXRfcmVjZW50X3NlYXJjaGVzJ1xuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICB0aGlzLnJlY2VudFNlYXJjaGVzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgIHRoaXMuZGlzcGxheVJlY2VudFNlYXJjaGVzKCk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BsYXlSZWNlbnRTZWFyY2hlcygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVjZW50LXNlYXJjaGVzLWxpc3QnKTtcbiAgICBpZiAoIWNvbnRhaW5lciB8fCB0aGlzLnJlY2VudFNlYXJjaGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMucmVjZW50U2VhcmNoZXNcbiAgICAgIC5zbGljZSgwLCA1KVxuICAgICAgLm1hcChzZWFyY2ggPT4gYDxsaSBkYXRhLXNlYXJjaD1cIiR7c2VhcmNofVwiPiR7c2VhcmNofTwvbGk+YClcbiAgICAgIC5qb2luKCcnKTtcblxuICAgIC8vIEFkZCBjbGljayBoYW5kbGVyc1xuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdsaScpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWFyY2ggPSBpdGVtLmRhdGFzZXQuc2VhcmNoO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLWlucHV0JykudmFsdWUgPSBzZWFyY2g7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChzZWFyY2gpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIExpc3RzIFRhYlxuY29uc3QgTGlzdHNUYWIgPSB7XG4gIGN1cnJlbnRMaXN0SWQ6IG51bGwsXG4gIGN1cnJlbnRMaXN0OiBudWxsLFxuICBjdXJyZW50U29ydDogJ3JlY2VudCcsXG4gIGN1cnJlbnRGaWx0ZXI6ICdhbGwnLFxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkTGlzdHMoKTtcbiAgICB0aGlzLnNldHVwTGlzdENvbnRyb2xzKCk7XG4gIH0sXG5cbiAgYXN5bmMgbG9hZExpc3RzKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdnZXRfbGlzdHMnXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5TGlzdHMocmVzcG9uc2UuZGF0YSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0xvYWQgbGlzdHMgZXJyb3I6JywgZXJyb3IpO1xuICAgIH1cbiAgfSxcblxuICBkaXNwbGF5TGlzdHMobGlzdHMpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGlzdHMtY29udGFpbmVyJyk7XG4gICAgaWYgKGxpc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8cCBjbGFzcz1cInRleHQtY2VudGVyXCI+Tm8gdm9jYWJ1bGFyeSBsaXN0cyB5ZXQ8L3A+JztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gbGlzdHMubWFwKGxpc3QgPT4gYFxuICAgICAgPGRpdiBjbGFzcz1cImxpc3QtaXRlbVwiIGRhdGEtbGlzdC1pZD1cIiR7bGlzdC5pZH1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtaXRlbS1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImxpc3QtaWNvblwiPvCfk4E8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXN0LW5hbWVcIj4ke2xpc3QubmFtZX08L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXN0LWNvdW50XCI+JHtPYmplY3Qua2V5cyhsaXN0LndvcmRzKS5sZW5ndGh9IHdvcmRzPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtdXBkYXRlZFwiPkxhc3QgdXBkYXRlZDogJHt0aGlzLmZvcm1hdERhdGUobGlzdC51cGRhdGVkIHx8IGxpc3QuY3JlYXRlZCl9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgKS5qb2luKCcnKTtcblxuICAgIC8vIEFkZCBjbGljayBoYW5kbGVyc1xuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtJykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpc3RJZCA9IGl0ZW0uZGF0YXNldC5saXN0SWQ7XG4gICAgICAgIHRoaXMuc2VsZWN0TGlzdChsaXN0SWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc2VsZWN0TGlzdChsaXN0SWQpIHtcbiAgICAvLyBVcGRhdGUgVUlcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtJykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnLCBpdGVtLmRhdGFzZXQubGlzdElkID09PSBsaXN0SWQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jdXJyZW50TGlzdElkID0gbGlzdElkO1xuICAgIHRoaXMubG9hZExpc3RXb3JkcyhsaXN0SWQpO1xuICB9LFxuXG4gIGFzeW5jIGxvYWRMaXN0V29yZHMobGlzdElkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ2dldF9saXN0cydcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBjb25zdCBsaXN0ID0gcmVzcG9uc2UuZGF0YS5maW5kKGwgPT4gbC5pZCA9PT0gbGlzdElkKTtcbiAgICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRMaXN0ID0gbGlzdDtcbiAgICAgICAgICB0aGlzLmRpc3BsYXlMaXN0V29yZHMobGlzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignTG9hZCBsaXN0IHdvcmRzIGVycm9yOicsIGVycm9yKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVmcmVzaFdvcmRzTGlzdCgpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50TGlzdCkge1xuICAgICAgdGhpcy5kaXNwbGF5TGlzdFdvcmRzKHRoaXMuY3VycmVudExpc3QpO1xuICAgIH1cbiAgfSxcblxuICBhc3luYyBkaXNwbGF5TGlzdFdvcmRzKGxpc3QpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud29yZHMtaW4tbGlzdCcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCBzb3J0ZWQgYW5kIGZpbHRlcmVkIHdvcmRzIGZyb20gYmFja2dyb3VuZFxuICAgICAgY29uc3Qgc29ydEJ5ID0gdGhpcy5jdXJyZW50U29ydCA9PT0gJ3JlY2VudCcgPyAnZGF0ZUFkZGVkJyA6IHRoaXMuY3VycmVudFNvcnQ7XG4gICAgICBsZXQgc29ydE9yZGVyID0gJ2FzYyc7XG5cbiAgICAgIC8vIFVzZSBkZXNjIG9yZGVyIGZvciBkYXRlLWJhc2VkIHNvcnRpbmcgdG8gc2hvdyBuZXdlc3QgZmlyc3RcbiAgICAgIGlmIChzb3J0QnkgPT09ICdkYXRlQWRkZWQnIHx8IHNvcnRCeSA9PT0gJ2xhc3RSZXZpZXdlZCcpIHtcbiAgICAgICAgc29ydE9yZGVyID0gJ2Rlc2MnO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdnZXRfbGlzdF93b3JkcycsXG4gICAgICAgIGxpc3RJZDogbGlzdC5pZCxcbiAgICAgICAgc29ydEJ5LFxuICAgICAgICBzb3J0T3JkZXIsXG4gICAgICAgIGZpbHRlckJ5OiB0aGlzLmN1cnJlbnRGaWx0ZXJcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8cCBjbGFzcz1cInRleHQtY2VudGVyXCI+RXJyb3IgbG9hZGluZyB3b3JkczwvcD4nO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdvcmRzID0gcmVzcG9uc2UuZGF0YSB8fCBbXTtcblxuICAgICAgLy8gU2hvdyBzdGF0dXMgc2VjdGlvblxuICAgICAgdGhpcy51cGRhdGVTdGF0dXNTZWN0aW9uKHdvcmRzLmxlbmd0aCk7XG5cbiAgICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8cCBjbGFzcz1cInRleHQtY2VudGVyXCI+Tm8gd29yZHMgaW4gdGhpcyBsaXN0PC9wPic7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgICAgPGgzIGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPldvcmRzIGluIFwiJHtsaXN0Lm5hbWV9XCI8L2gzPlxuICAgICAgICAke3dvcmRzLm1hcCh3b3JkID0+IHRoaXMucmVuZGVyV29yZEl0ZW0od29yZCkpLmpvaW4oJycpfVxuICAgICAgYDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZGlzcGxheWluZyB3b3JkczonLCBlcnJvcik7XG4gICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5FcnJvciBsb2FkaW5nIHdvcmRzPC9wPic7XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZVN0YXR1c1NlY3Rpb24od29yZENvdW50KSB7XG4gICAgY29uc3QgbGlzdFN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0LXN0YXR1cycpO1xuICAgIGNvbnN0IHNvcnRJbmRpY2F0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc29ydC1pbmRpY2F0b3InKTtcbiAgICBjb25zdCBmaWx0ZXJJbmRpY2F0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsdGVyLWluZGljYXRvcicpO1xuICAgIGNvbnN0IHJlc3VsdENvdW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3VsdC1jb3VudCcpO1xuXG4gICAgLy8gU2hvdyBzdGF0dXMgc2VjdGlvblxuICAgIGxpc3RTdGF0dXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgICAvLyBVcGRhdGUgc29ydCBpbmRpY2F0b3JcbiAgICBjb25zdCBzb3J0TGFiZWxzID0ge1xuICAgICAgcmVjZW50OiAnTW9zdCBSZWNlbnQgKG5ld2VzdCBmaXJzdCknLFxuICAgICAgYWxwaGFiZXRpY2FsOiAnQWxwaGFiZXRpY2FsIChBLVopJyxcbiAgICAgIGRhdGVBZGRlZDogJ0RhdGUgQWRkZWQgKG5ld2VzdCBmaXJzdCknLFxuICAgICAgbGFzdFJldmlld2VkOiAnTGFzdCBSZXZpZXdlZCAobmV3ZXN0IGZpcnN0KScsXG4gICAgICBkaWZmaWN1bHR5OiAnRGlmZmljdWx0eSAoZWFzeSB0byBoYXJkKScsXG4gICAgICBsb29rdXBDb3VudDogJ0xvb2t1cCBDb3VudCAobGVhc3QgdG8gbW9zdCknXG4gICAgfTtcbiAgICBzb3J0SW5kaWNhdG9yLnRleHRDb250ZW50ID0gYFNvcnRlZCBieTogJHtzb3J0TGFiZWxzW3RoaXMuY3VycmVudFNvcnRdIHx8ICdNb3N0IFJlY2VudCd9YDtcblxuICAgIC8vIFVwZGF0ZSBmaWx0ZXIgaW5kaWNhdG9yXG4gICAgaWYgKHRoaXMuY3VycmVudEZpbHRlciAmJiB0aGlzLmN1cnJlbnRGaWx0ZXIgIT09ICdhbGwnKSB7XG4gICAgICBjb25zdCBmaWx0ZXJMYWJlbHMgPSB7XG4gICAgICAgIGVhc3k6ICdFYXN5IGRpZmZpY3VsdHkgb25seScsXG4gICAgICAgIG1lZGl1bTogJ01lZGl1bSBkaWZmaWN1bHR5IG9ubHknLFxuICAgICAgICBoYXJkOiAnSGFyZCBkaWZmaWN1bHR5IG9ubHknXG4gICAgICB9O1xuICAgICAgZmlsdGVySW5kaWNhdG9yLnRleHRDb250ZW50ID0gYEZpbHRlcjogJHtmaWx0ZXJMYWJlbHNbdGhpcy5jdXJyZW50RmlsdGVyXX1gO1xuICAgICAgZmlsdGVySW5kaWNhdG9yLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJztcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsdGVySW5kaWNhdG9yLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHJlc3VsdCBjb3VudFxuICAgIHJlc3VsdENvdW50LnRleHRDb250ZW50ID0gYCR7d29yZENvdW50fSB3b3JkJHt3b3JkQ291bnQgIT09IDEgPyAncycgOiAnJ31gO1xuICB9LFxuXG4gIHJlbmRlcldvcmRJdGVtKHdvcmQpIHtcbiAgICBjb25zdCBzb3J0QnkgPSB0aGlzLmN1cnJlbnRTb3J0ID09PSAncmVjZW50JyA/ICdkYXRlQWRkZWQnIDogdGhpcy5jdXJyZW50U29ydDtcblxuICAgIC8vIEJhc2Ugd29yZCBpdGVtIHN0cnVjdHVyZVxuICAgIGxldCB3b3JkSXRlbSA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWxpc3QtaXRlbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZGlmZmljdWx0eS1pbmRpY2F0b3IgZGlmZmljdWx0eS0ke3dvcmQuZGlmZmljdWx0eSB8fCAnbWVkaXVtJ31cIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtbGlzdC10ZXh0XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtbGlzdC13b3JkXCI+JHt3b3JkLndvcmR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtbGlzdC1zdGF0dXNcIj5cbiAgICBgO1xuXG4gICAgLy8gQWRkIHNvcnQtc3BlY2lmaWMgaW5mb3JtYXRpb25cbiAgICBpZiAoc29ydEJ5ID09PSAnbG9va3VwQ291bnQnKSB7XG4gICAgICBjb25zdCBjb3VudCA9IHdvcmQubG9va3VwQ291bnQgfHwgMDtcbiAgICAgIHdvcmRJdGVtICs9IGBcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJsb29rdXAtY291bnRcIj4ke2NvdW50fSBsb29rdXAke2NvdW50ICE9PSAxID8gJ3MnIDogJyd9PC9zcGFuPlxuICAgICAgYDtcbiAgICB9IGVsc2UgaWYgKHNvcnRCeSA9PT0gJ2RhdGVBZGRlZCcpIHtcbiAgICAgIHdvcmRJdGVtICs9IGBcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJkYXRlLWFkZGVkXCI+QWRkZWQ6ICR7dGhpcy5mb3JtYXREYXRlKHdvcmQuZGF0ZUFkZGVkKX08L3NwYW4+XG4gICAgICBgO1xuICAgIH0gZWxzZSBpZiAoc29ydEJ5ID09PSAnZGlmZmljdWx0eScpIHtcbiAgICAgIGNvbnN0IGRpZmZpY3VsdHlNYXAgPSB7IGVhc3k6ICdFYXN5JywgbWVkaXVtOiAnTWVkaXVtJywgaGFyZDogJ0hhcmQnIH07XG4gICAgICB3b3JkSXRlbSArPSBgXG4gICAgICAgIDxzcGFuIGNsYXNzPVwiZGlmZmljdWx0eS1iYWRnZVwiPiR7ZGlmZmljdWx0eU1hcFt3b3JkLmRpZmZpY3VsdHldIHx8ICdNZWRpdW0nfTwvc3Bhbj5cbiAgICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZmF1bHQgc3RhdHVzXG4gICAgICB3b3JkSXRlbSArPSB3b3JkLmxhc3RSZXZpZXdlZFxuICAgICAgICA/IGBMYXN0IHJldmlld2VkOiAke3RoaXMuZm9ybWF0RGF0ZSh3b3JkLmxhc3RSZXZpZXdlZCl9YFxuICAgICAgICA6ICdOb3QgcmV2aWV3ZWQgeWV0JztcbiAgICB9XG5cbiAgICB3b3JkSXRlbSArPSBgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1hY3Rpb25zXCI+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIndvcmQtYWN0aW9uLWJ0blwiIHRpdGxlPVwiRWRpdCBub3Rlc1wiPvCfk508L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgcmV0dXJuIHdvcmRJdGVtO1xuICB9LFxuXG4gIHNldHVwTGlzdENvbnRyb2xzKCkge1xuICAgIC8vIE5ldyBsaXN0IGJ1dHRvblxuICAgIGNvbnN0IG5ld0xpc3RCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtYnV0dG9uJyk7XG4gICAgaWYgKG5ld0xpc3RCdG4pIHtcbiAgICAgIG5ld0xpc3RCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNob3dOZXdMaXN0RGlhbG9nKCkpO1xuICAgIH1cblxuICAgIC8vIERpYWxvZyBjb250cm9sc1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW5jZWwtbmV3LWxpc3QnKTtcbiAgICBjb25zdCBjb25maXJtQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpcm0tbmV3LWxpc3QnKTtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtbmFtZScpO1xuXG4gICAgaWYgKGNhbmNlbEJ0bikge1xuICAgICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5oaWRlTmV3TGlzdERpYWxvZygpKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlybUJ0bikge1xuICAgICAgY29uZmlybUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY3JlYXRlTmV3TGlzdCgpKTtcbiAgICB9XG5cbiAgICBpZiAobmFtZUlucHV0KSB7XG4gICAgICBuYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgIHRoaXMuY3JlYXRlTmV3TGlzdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgICAgICAgIHRoaXMuaGlkZU5ld0xpc3REaWFsb2coKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBhbmQgZmlsdGVyIGNvbnRyb2xzXG4gICAgY29uc3Qgc29ydFNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzb3J0LXNlbGVjdCcpO1xuICAgIGNvbnN0IGZpbHRlclNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaWx0ZXItc2VsZWN0Jyk7XG5cbiAgICBpZiAoc29ydFNlbGVjdCkge1xuICAgICAgc29ydFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0ID0gZS50YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMucmVmcmVzaFdvcmRzTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlclNlbGVjdCkge1xuICAgICAgZmlsdGVyU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudEZpbHRlciA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLnJlZnJlc2hXb3Jkc0xpc3QoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBzaG93TmV3TGlzdERpYWxvZygpIHtcbiAgICBjb25zdCBkaWFsb2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtZGlhbG9nJyk7XG4gICAgY29uc3QgbmFtZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25ldy1saXN0LW5hbWUnKTtcbiAgICBpZiAoZGlhbG9nKSB7XG4gICAgICBkaWFsb2cuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIGlmIChuYW1lSW5wdXQpIHtcbiAgICAgICAgbmFtZUlucHV0LnZhbHVlID0gJyc7XG4gICAgICAgIG5hbWVJbnB1dC5mb2N1cygpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoaWRlTmV3TGlzdERpYWxvZygpIHtcbiAgICBjb25zdCBkaWFsb2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtZGlhbG9nJyk7XG4gICAgaWYgKGRpYWxvZykge1xuICAgICAgZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIGNyZWF0ZU5ld0xpc3QoKSB7XG4gICAgY29uc3QgbmFtZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25ldy1saXN0LW5hbWUnKTtcbiAgICBjb25zdCBuYW1lID0gbmFtZUlucHV0ID8gbmFtZUlucHV0LnZhbHVlLnRyaW0oKSA6ICcnO1xuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICBOb3RpZmljYXRpb25NYW5hZ2VyLnNob3coJ1BsZWFzZSBlbnRlciBhIGxpc3QgbmFtZScsICd3YXJuaW5nJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ2NyZWF0ZV9saXN0JyxcbiAgICAgICAgbmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdyhgQ3JlYXRlZCBsaXN0IFwiJHtuYW1lfVwiYCwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgdGhpcy5oaWRlTmV3TGlzdERpYWxvZygpO1xuICAgICAgICB0aGlzLmxvYWRMaXN0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KHJlc3BvbnNlLmVycm9yIHx8ICdGYWlsZWQgdG8gY3JlYXRlIGxpc3QnLCAnZXJyb3InKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQ3JlYXRlIGxpc3QgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KCdGYWlsZWQgdG8gY3JlYXRlIGxpc3QnLCAnZXJyb3InKTtcbiAgICB9XG4gIH0sXG5cbiAgZm9ybWF0RGF0ZShkYXRlU3RyaW5nKSB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKGRhdGVTdHJpbmcpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZGlmZlRpbWUgPSBNYXRoLmFicyhub3cgLSBkYXRlKTtcbiAgICBjb25zdCBkaWZmRGF5cyA9IE1hdGguZmxvb3IoZGlmZlRpbWUgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuXG4gICAgaWYgKGRpZmZEYXlzID09PSAwKSByZXR1cm4gJ3RvZGF5JztcbiAgICBpZiAoZGlmZkRheXMgPT09IDEpIHJldHVybiAneWVzdGVyZGF5JztcbiAgICBpZiAoZGlmZkRheXMgPCA3KSByZXR1cm4gYCR7ZGlmZkRheXN9IGRheXMgYWdvYDtcbiAgICByZXR1cm4gZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKTtcbiAgfVxufTtcblxuLy8gTGVhcm4gVGFiXG5jb25zdCBMZWFyblRhYiA9IHtcbiAgY3VycmVudFNlc3Npb246IG51bGwsXG4gIGN1cnJlbnRXb3JkSW5kZXg6IDAsXG4gIHNlc3Npb25Xb3JkczogW10sXG4gIGlzRmxpcHBlZDogZmFsc2UsXG4gIHNlc3Npb25TdGF0czoge1xuICAgIHRvdGFsOiAwLFxuICAgIGNvbXBsZXRlZDogMCxcbiAgICBrbm93bjogMCxcbiAgICB1bmtub3duOiAwLFxuICAgIHNraXBwZWQ6IDAsXG4gICAgbWFzdGVyZWQ6IDBcbiAgfSxcblxuICBpbml0KCkge1xuICAgIHRoaXMuc2V0dXBMZWFybkNvbnRyb2xzKCk7XG4gICAgdGhpcy5sb2FkUmV2aWV3UXVldWUoKTtcbiAgfSxcblxuICBzZXR1cExlYXJuQ29udHJvbHMoKSB7XG4gICAgLy8gU3RhcnQgcmV2aWV3IGJ1dHRvblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0LXJldmlldy1idG4nKTtcbiAgICBpZiAoc3RhcnRCdG4pIHtcbiAgICAgIHN0YXJ0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5zdGFydFJldmlld1Nlc3Npb24oKSk7XG4gICAgfVxuXG4gICAgLy8gQWN0aW9uIGJ1dHRvbnNcbiAgICBjb25zdCBrbm93bkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdrbm93bi1idG4nKTtcbiAgICBjb25zdCB1bmtub3duQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Vua25vd24tYnRuJyk7XG4gICAgY29uc3Qgc2tpcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdza2lwLWJ0bicpO1xuICAgIGNvbnN0IG1hc3RlcmVkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hc3RlcmVkLWJ0bicpO1xuXG4gICAgaWYgKGtub3duQnRuKSB7XG4gICAgICBrbm93bkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdrbm93bicpKTtcbiAgICB9XG4gICAgaWYgKHVua25vd25CdG4pIHtcbiAgICAgIHVua25vd25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhhbmRsZVJldmlld0FjdGlvbigndW5rbm93bicpKTtcbiAgICB9XG4gICAgaWYgKHNraXBCdG4pIHtcbiAgICAgIHNraXBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhhbmRsZVJldmlld0FjdGlvbignc2tpcHBlZCcpKTtcbiAgICB9XG4gICAgaWYgKG1hc3RlcmVkQnRuKSB7XG4gICAgICBtYXN0ZXJlZEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdtYXN0ZXJlZCcpKTtcbiAgICB9XG5cbiAgICAvLyBGbGFzaGNhcmQgZmxpcFxuICAgIGNvbnN0IGZsYXNoY2FyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmbGFzaGNhcmQnKTtcbiAgICBpZiAoZmxhc2hjYXJkKSB7XG4gICAgICBmbGFzaGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmZsaXBDYXJkKCkpO1xuICAgIH1cblxuICAgIC8vIEtleWJvYXJkIHNob3J0Y3V0c1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTZXNzaW9uKSByZXR1cm47XG5cbiAgICAgIHN3aXRjaCAoZS5rZXkpIHtcbiAgICAgICAgY2FzZSAnICc6XG4gICAgICAgIGNhc2UgJ0VudGVyJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5mbGlwQ2FyZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcxJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXZpZXdBY3Rpb24oJ2tub3duJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzInOlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmhhbmRsZVJldmlld0FjdGlvbigndW5rbm93bicpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICczJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXZpZXdBY3Rpb24oJ3NraXBwZWQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnNCc6XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuaGFuZGxlUmV2aWV3QWN0aW9uKCdtYXN0ZXJlZCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGFzeW5jIGxvYWRSZXZpZXdRdWV1ZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnZ2V0X3Jldmlld19xdWV1ZSdcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBjb25zdCBkdWVXb3Jkc0NvdW50ID0gcmVzcG9uc2UuZGF0YS5sZW5ndGg7XG4gICAgICAgIHRoaXMudXBkYXRlRHVlV29yZHNDb3VudChkdWVXb3Jkc0NvdW50KTtcbiAgICAgICAgdGhpcy5kaXNwbGF5UmV2aWV3U3RhdHVzKGR1ZVdvcmRzQ291bnQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdMb2FkIHJldmlldyBxdWV1ZSBlcnJvcjonLCBlcnJvcik7XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZUR1ZVdvcmRzQ291bnQoX2NvdW50KSB7XG4gICAgLy8gRHVlIHdvcmQgY291bnQgaXMgbm93IGRpc3BsYXllZCBpbiB0aGUgcmV2aWV3IHN0YXJ0IHNjcmVlblxuICAgIC8vIE5vIG5lZWQgZm9yIHNlcGFyYXRlIGhlYWRlciBlbGVtZW50XG4gIH0sXG5cbiAgZGlzcGxheVJldmlld1N0YXR1cyhkdWVXb3Jkc0NvdW50KSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxlYXJuLWNvbnRhaW5lcicpO1xuXG4gICAgaWYgKGR1ZVdvcmRzQ291bnQgPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJuby1yZXZpZXdzXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm5vLXJldmlld3MtaWNvblwiPvCfjok8L2Rpdj5cbiAgICAgICAgICA8aDM+QWxsIGNhdWdodCB1cCE8L2gzPlxuICAgICAgICAgIDxwPk5vIHdvcmRzIGFyZSBkdWUgZm9yIHJldmlldyByaWdodCBub3cuPC9wPlxuICAgICAgICAgIDxwIGNsYXNzPVwic21hbGwtdGV4dFwiPkNvbWUgYmFjayBsYXRlciBvciBhZGQgbW9yZSB3b3JkcyB0byB5b3VyIGxpc3RzLjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwicmV2aWV3LXN0YXJ0XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyZXZpZXctaGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1pY29uXCI+8J+OkzwvZGl2PlxuICAgICAgICAgIDxoMiBjbGFzcz1cInJldmlldy10aXRsZVwiPlJlYWR5IHRvIExlYXJuPC9oMj5cbiAgICAgICAgICA8cCBjbGFzcz1cInJldmlldy1zdWJ0aXRsZVwiPkxldCdzIHJldmlldyB5b3VyIHZvY2FidWxhcnkgd29yZHM8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1zdGF0c1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC1udW1iZXJcIj4ke2R1ZVdvcmRzQ291bnR9PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+V29yZHMgRHVlPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgXG4gICAgICAgIDxidXR0b24gaWQ9XCJzdGFydC1yZXZpZXctYnRuXCIgY2xhc3M9XCJidG4tcHJpbWFyeSBidG4tbGFyZ2Ugc3RhcnQtc2Vzc2lvbi1idG5cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+8J+agDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi10ZXh0XCI+U3RhcnQgUmV2aWV3IFNlc3Npb248L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy10aXBzXCI+XG4gICAgICAgICAgPGg0PvCfkqEgUmV2aWV3IFRpcHM8L2g0PlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaT5DbGljayB0aGUgY2FyZCBvciBwcmVzcyA8a2JkPlNwYWNlPC9rYmQ+IHRvIGZsaXA8L2xpPlxuICAgICAgICAgICAgPGxpPlVzZSBudW1iZXIga2V5cyA8a2JkPjEtNDwva2JkPiBmb3IgcXVpY2sgYWN0aW9uczwvbGk+XG4gICAgICAgICAgICA8bGk+QmUgaG9uZXN0IHdpdGggeW91ciBzZWxmLWFzc2Vzc21lbnQgZm9yIGJldHRlciBsZWFybmluZzwvbGk+XG4gICAgICAgICAgICA8bGk+UmVndWxhciBwcmFjdGljZSBsZWFkcyB0byBiZXR0ZXIgcmV0ZW50aW9uPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBSZS1zZXR1cCBjb250cm9scyBhZnRlciBET00gdXBkYXRlXG4gICAgdGhpcy5zZXR1cExlYXJuQ29udHJvbHMoKTtcbiAgfSxcblxuICBhc3luYyBzdGFydFJldmlld1Nlc3Npb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ2dldF9yZXZpZXdfcXVldWUnXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzIHx8IHJlc3BvbnNlLmRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnTm8gd29yZHMgYXZhaWxhYmxlIGZvciByZXZpZXcnLCAnaW5mbycpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2Vzc2lvbldvcmRzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgIHRoaXMuY3VycmVudFdvcmRJbmRleCA9IDA7XG4gICAgICB0aGlzLnNlc3Npb25TdGF0cyA9IHtcbiAgICAgICAgdG90YWw6IHRoaXMuc2Vzc2lvbldvcmRzLmxlbmd0aCxcbiAgICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgICBrbm93bjogMCxcbiAgICAgICAgdW5rbm93bjogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgbWFzdGVyZWQ6IDBcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuY3VycmVudFNlc3Npb24gPSB7XG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgcmVzdWx0czogW11cbiAgICAgIH07XG5cbiAgICAgIHRoaXMuZGlzcGxheUN1cnJlbnRXb3JkKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YXJ0IHJldmlldyBzZXNzaW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgIE5vdGlmaWNhdGlvbk1hbmFnZXIuc2hvdygnRmFpbGVkIHRvIHN0YXJ0IHJldmlldyBzZXNzaW9uJywgJ2Vycm9yJyk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BsYXlDdXJyZW50V29yZCgpIHtcbiAgICBpZiAoIXRoaXMuY3VycmVudFNlc3Npb24gfHwgdGhpcy5jdXJyZW50V29yZEluZGV4ID49IHRoaXMuc2Vzc2lvbldvcmRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5lbmRSZXZpZXdTZXNzaW9uKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgZmxpcCBzdGF0ZSBiZWZvcmUgZ2VuZXJhdGluZyBIVE1MIHRvIGVuc3VyZSBuZXcgY2FyZCBzaG93cyBmcm9udFxuICAgIHRoaXMuaXNGbGlwcGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCB3b3JkID0gdGhpcy5zZXNzaW9uV29yZHNbdGhpcy5jdXJyZW50V29yZEluZGV4XTtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGVhcm4tY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1zZXNzaW9uXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBpZD1cImZsYXNoY2FyZFwiIGNsYXNzPVwiZmxhc2hjYXJkICR7dGhpcy5pc0ZsaXBwZWQgPyAnZmxpcHBlZCcgOiAnJ31cIiBkYXRhLXdvcmQ9XCIke3dvcmQud29yZH1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtZnJvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhcmQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1udW1iZXJcIj4ke3RoaXMuY3VycmVudFdvcmRJbmRleCArIDF9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtbWluaW1hbFwiPiR7dGhpcy5jdXJyZW50V29yZEluZGV4ICsgMX0vJHt0aGlzLnNlc3Npb25Xb3Jkcy5sZW5ndGh9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzPVwid29yZC1kaXNwbGF5XCI+JHt3b3JkLndvcmR9PC9oMj5cbiAgICAgICAgICAgICAgICAke3dvcmQucHJvbnVuY2lhdGlvbiA/IGA8ZGl2IGNsYXNzPVwiZnJvbnQtcHJvbnVuY2lhdGlvblwiPiR7d29yZC5wcm9udW5jaWF0aW9ufTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxpcC1oaW50XCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImhpbnQtaWNvblwiPvCfkYY8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImhpbnQtdGV4dFwiPkNsaWNrIHRvIHJldmVhbCBkZWZpbml0aW9uPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsYXNoY2FyZC1iYWNrXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzcz1cImZsYXNoY2FyZC13b3JkLXRpdGxlXCI+JHt3b3JkLndvcmR9PC9oMz5cbiAgICAgICAgICAgICAgICAgICR7d29yZC5wcm9udW5jaWF0aW9uID8gYDxkaXYgY2xhc3M9XCJmbGFzaGNhcmQtcHJvbnVuY2lhdGlvblwiPiR7d29yZC5wcm9udW5jaWF0aW9ufTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbnMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAke3dvcmQuZGVmaW5pdGlvbnMgJiYgd29yZC5kZWZpbml0aW9ucy5sZW5ndGggPiAwXG4/IHdvcmQuZGVmaW5pdGlvbnMubWFwKGRlZiA9PiBgXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkZWZpbml0aW9uLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhcnQtb2Ytc3BlZWNoXCI+JHtkZWYucGFydE9mU3BlZWNofTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGVmaW5pdGlvbi10ZXh0XCI+JHtkZWYubWVhbmluZ308L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAke2RlZi5leGFtcGxlcyAmJiBkZWYuZXhhbXBsZXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZXhhbXBsZXNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZWYuZXhhbXBsZXMuc2xpY2UoMCwgMikubWFwKGV4ID0+IGA8ZGl2IGNsYXNzPVwiZXhhbXBsZVwiPlwiJHtleH1cIjwvZGl2PmApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgYFxuOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICBgKS5qb2luKCcnKVxuOiAnPGRpdiBjbGFzcz1cIm5vLWRlZmluaXRpb25cIj5ObyBkZWZpbml0aW9uIGF2YWlsYWJsZTwvZGl2Pid9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgJHt3b3JkLnN5bm9ueW1zICYmIHdvcmQuc3lub255bXMubGVuZ3RoID4gMFxuPyBgXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1zeW5vbnltc1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPlN5bm9ueW1zOjwvc3Ryb25nPiAke3dvcmQuc3lub255bXMuc2xpY2UoMCwgMykuam9pbignLCAnKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIGBcbjogJyd9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJldmlldy1hY3Rpb25zICR7dGhpcy5pc0ZsaXBwZWQgPyAndmlzaWJsZScgOiAnaGlkZGVuJ31cIj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwia25vd24tYnRuXCIgY2xhc3M9XCJyZXZpZXctYnRuIGJ0bi1rbm93blwiIHRpdGxlPVwiSSBrbm93IHRoaXMgKDEpXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+4pyFPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPktub3c8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1rZXlcIj4xPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJ1bmtub3duLWJ0blwiIGNsYXNzPVwicmV2aWV3LWJ0biBidG4tdW5rbm93blwiIHRpdGxlPVwiSSBkb24ndCBrbm93IHRoaXMgKDIpXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi1pY29uXCI+4p2MPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPkxlYXJuaW5nPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4ta2V5XCI+Mjwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwic2tpcC1idG5cIiBjbGFzcz1cInJldmlldy1idG4gYnRuLXNraXBcIiB0aXRsZT1cIlNraXAgZm9yIG5vdyAoMylcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWljb25cIj7ij63vuI88L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJ0bi10ZXh0XCI+U2tpcDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWtleVwiPjM8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cIm1hc3RlcmVkLWJ0blwiIGNsYXNzPVwicmV2aWV3LWJ0biBidG4tbWFzdGVyZWRcIiB0aXRsZT1cIkkndmUgbWFzdGVyZWQgdGhpcyAoNClcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYnRuLWljb25cIj7wn46vPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4tdGV4dFwiPk1hc3RlcmVkPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJidG4ta2V5XCI+NDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgLy8gUmUtc2V0dXAgY29udHJvbHNcbiAgICB0aGlzLnNldHVwTGVhcm5Db250cm9scygpO1xuICB9LFxuXG4gIGZsaXBDYXJkKCkge1xuICAgIGlmICghdGhpcy5jdXJyZW50U2Vzc2lvbikgcmV0dXJuO1xuXG4gICAgY29uc3QgZmxhc2hjYXJkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZsYXNoY2FyZCcpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmV2aWV3LWFjdGlvbnMnKTtcblxuICAgIHRoaXMuaXNGbGlwcGVkID0gIXRoaXMuaXNGbGlwcGVkO1xuXG4gICAgaWYgKGZsYXNoY2FyZCkge1xuICAgICAgZmxhc2hjYXJkLmNsYXNzTGlzdC50b2dnbGUoJ2ZsaXBwZWQnLCB0aGlzLmlzRmxpcHBlZCk7XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbnMpIHtcbiAgICAgIGFjdGlvbnMuY2xhc3NMaXN0LnRvZ2dsZSgndmlzaWJsZScsIHRoaXMuaXNGbGlwcGVkKTtcbiAgICAgIGFjdGlvbnMuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZGVuJywgIXRoaXMuaXNGbGlwcGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgaGFuZGxlUmV2aWV3QWN0aW9uKGFjdGlvbikge1xuICAgIGlmICghdGhpcy5jdXJyZW50U2Vzc2lvbiB8fCB0aGlzLmN1cnJlbnRXb3JkSW5kZXggPj0gdGhpcy5zZXNzaW9uV29yZHMubGVuZ3RoKSByZXR1cm47XG5cbiAgICBjb25zdCB3b3JkID0gdGhpcy5zZXNzaW9uV29yZHNbdGhpcy5jdXJyZW50V29yZEluZGV4XTtcbiAgICBjb25zdCByZXZpZXdSZXN1bHQgPSB7XG4gICAgICB3b3JkOiB3b3JkLndvcmQsXG4gICAgICBhY3Rpb24sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICB9O1xuXG4gICAgLy8gVXBkYXRlIHNlc3Npb24gc3RhdHNcbiAgICB0aGlzLnNlc3Npb25TdGF0cy5jb21wbGV0ZWQrKztcbiAgICB0aGlzLnNlc3Npb25TdGF0c1thY3Rpb25dKys7XG4gICAgdGhpcy5jdXJyZW50U2Vzc2lvbi5yZXN1bHRzLnB1c2gocmV2aWV3UmVzdWx0KTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBTZW5kIHJldmlldyByZXN1bHQgdG8gYmFja2dyb3VuZFxuICAgICAgYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ3Byb2Nlc3NfcmV2aWV3JyxcbiAgICAgICAgd29yZDogd29yZC53b3JkLFxuICAgICAgICByZXN1bHQ6IGFjdGlvbixcbiAgICAgICAgbGlzdElkOiB3b3JkLmxpc3RJZCB8fCBudWxsXG4gICAgICB9KTtcblxuICAgICAgLy8gTW92ZSB0byBuZXh0IHdvcmRcbiAgICAgIHRoaXMuY3VycmVudFdvcmRJbmRleCsrO1xuICAgICAgdGhpcy5kaXNwbGF5Q3VycmVudFdvcmQoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignUHJvY2VzcyByZXZpZXcgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KCdGYWlsZWQgdG8gc2F2ZSByZXZpZXcgcmVzdWx0JywgJ2Vycm9yJyk7XG4gICAgfVxuICB9LFxuXG4gIGVuZFJldmlld1Nlc3Npb24oKSB7XG4gICAgaWYgKCF0aGlzLmN1cnJlbnRTZXNzaW9uKSByZXR1cm47XG5cbiAgICBjb25zdCBlbmRUaW1lID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkdXJhdGlvbiA9IE1hdGgucm91bmQoKGVuZFRpbWUgLSB0aGlzLmN1cnJlbnRTZXNzaW9uLnN0YXJ0VGltZSkgLyAxMDAwKTsgLy8gc2Vjb25kc1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWFybi1jb250YWluZXInKTtcblxuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2Vzc2lvbi1jb21wbGV0ZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29tcGxldGlvbi1pY29uXCI+8J+OiTwvZGl2PlxuICAgICAgICA8aDM+U2Vzc2lvbiBDb21wbGV0ZSE8L2gzPlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzcz1cInNlc3Npb24tc3VtbWFyeVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdW1tYXJ5LXN0YXRzXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1yb3dcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+V29yZHMgUmV2aWV3ZWQ6PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtdmFsdWVcIj4ke3RoaXMuc2Vzc2lvblN0YXRzLmNvbXBsZXRlZH08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXJvd1wiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtbGFiZWxcIj5Lbm93bjo8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC12YWx1ZSBrbm93blwiPiR7dGhpcy5zZXNzaW9uU3RhdHMua25vd259PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1yb3dcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+TGVhcm5pbmc6PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtdmFsdWUgdW5rbm93blwiPiR7dGhpcy5zZXNzaW9uU3RhdHMudW5rbm93bn08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXJvd1wiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtbGFiZWxcIj5NYXN0ZXJlZDo8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RhdC12YWx1ZSBtYXN0ZXJlZFwiPiR7dGhpcy5zZXNzaW9uU3RhdHMubWFzdGVyZWR9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1yb3dcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0LWxhYmVsXCI+RHVyYXRpb246PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXQtdmFsdWVcIj4ke01hdGguZmxvb3IoZHVyYXRpb24gLyA2MCl9bSAke2R1cmF0aW9uICUgNjB9czwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJzZXNzaW9uLWFjdGlvbnNcIj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwicmV2aWV3LW1vcmUtYnRuXCIgY2xhc3M9XCJidG4tcHJpbWFyeVwiPlJldmlldyBNb3JlPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImZpbmlzaC1zZXNzaW9uLWJ0blwiIGNsYXNzPVwiYnRuLXNlY29uZGFyeVwiPkZpbmlzaDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBTZXR1cCBjb21wbGV0aW9uIGFjdGlvbnNcbiAgICBjb25zdCByZXZpZXdNb3JlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlldy1tb3JlLWJ0bicpO1xuICAgIGNvbnN0IGZpbmlzaEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaW5pc2gtc2Vzc2lvbi1idG4nKTtcblxuICAgIGlmIChyZXZpZXdNb3JlQnRuKSB7XG4gICAgICByZXZpZXdNb3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5sb2FkUmV2aWV3UXVldWUoKSk7XG4gICAgfVxuICAgIGlmIChmaW5pc2hCdG4pIHtcbiAgICAgIGZpbmlzaEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubG9hZFJldmlld1F1ZXVlKCkpO1xuICAgIH1cblxuICAgIC8vIENsZWFyIHNlc3Npb25cbiAgICB0aGlzLmN1cnJlbnRTZXNzaW9uID0gbnVsbDtcbiAgICB0aGlzLnNlc3Npb25Xb3JkcyA9IFtdO1xuICAgIHRoaXMuY3VycmVudFdvcmRJbmRleCA9IDA7XG5cbiAgICAvLyBTaG93IGNvbXBsZXRpb24gbm90aWZpY2F0aW9uXG4gICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KFxuICAgICAgYFJldmlldyBzZXNzaW9uIGNvbXBsZXRlZCEgJHt0aGlzLnNlc3Npb25TdGF0cy5jb21wbGV0ZWR9IHdvcmRzIHJldmlld2VkLmAsXG4gICAgICAnc3VjY2VzcydcbiAgICApO1xuICB9XG59O1xuXG4vLyBTZXR0aW5ncyBUYWJcbmNvbnN0IFNldHRpbmdzVGFiID0ge1xuICBpbml0KCkge1xuICAgIHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5zZXR1cFNldHRpbmdzTGlzdGVuZXJzKCk7XG4gIH0sXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdnZXRfc2V0dGluZ3MnXG4gICAgfSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSByZXNwb25zZS5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGFcbiAgICAgIDoge1xuICAgICAgICAgIHRoZW1lOiAnZGFyaycsXG4gICAgICAgICAgYXV0b0FkZExvb2t1cHM6IHRydWUsXG4gICAgICAgICAgZGFpbHlSZXZpZXdMaW1pdDogMzAsXG4gICAgICAgICAgdGV4dFNlbGVjdGlvbk1vZGU6ICdpbmxpbmUnXG4gICAgICAgIH07XG5cbiAgICAvLyBVcGRhdGUgVUlcbiAgICBjb25zdCBhdXRvQWRkVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG8tYWRkLXRvZ2dsZScpO1xuICAgIGlmIChhdXRvQWRkVG9nZ2xlKSBhdXRvQWRkVG9nZ2xlLmNoZWNrZWQgPSBzZXR0aW5ncy5hdXRvQWRkTG9va3VwcztcblxuICAgIGNvbnN0IHJldmlld0xpbWl0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlldy1saW1pdCcpO1xuICAgIGlmIChyZXZpZXdMaW1pdCkgcmV2aWV3TGltaXQudmFsdWUgPSBzZXR0aW5ncy5kYWlseVJldmlld0xpbWl0O1xuXG4gICAgLy8gVGV4dCBzZWxlY3Rpb24gbW9kZSByYWRpbyBidXR0b25zXG4gICAgY29uc3QgdGV4dFNlbGVjdGlvbk1vZGUgPSBzZXR0aW5ncy50ZXh0U2VsZWN0aW9uTW9kZSB8fCAnaW5saW5lJztcbiAgICBjb25zdCBpbmxpbmVSYWRpbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXh0LXNlbGVjdGlvbi1pbmxpbmUnKTtcbiAgICBjb25zdCBwb3B1cFJhZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQtc2VsZWN0aW9uLXBvcHVwJyk7XG4gICAgaWYgKGlubGluZVJhZGlvICYmIHBvcHVwUmFkaW8pIHtcbiAgICAgIGlmICh0ZXh0U2VsZWN0aW9uTW9kZSA9PT0gJ3BvcHVwJykge1xuICAgICAgICBwb3B1cFJhZGlvLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5saW5lUmFkaW8uY2hlY2tlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHNldHVwU2V0dGluZ3NMaXN0ZW5lcnMoKSB7XG4gICAgLy8gQXV0by1hZGQgdG9nZ2xlXG4gICAgY29uc3QgYXV0b0FkZFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRvLWFkZC10b2dnbGUnKTtcbiAgICBpZiAoYXV0b0FkZFRvZ2dsZSkge1xuICAgICAgYXV0b0FkZFRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZVNldHRpbmcoJ2F1dG9BZGRMb29rdXBzJywgZS50YXJnZXQuY2hlY2tlZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXZpZXcgbGltaXRcbiAgICBjb25zdCByZXZpZXdMaW1pdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXctbGltaXQnKTtcbiAgICBpZiAocmV2aWV3TGltaXQpIHtcbiAgICAgIHJldmlld0xpbWl0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU2V0dGluZygnZGFpbHlSZXZpZXdMaW1pdCcsIHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUZXh0IHNlbGVjdGlvbiBtb2RlIHJhZGlvIGJ1dHRvbnNcbiAgICBjb25zdCBpbmxpbmVSYWRpbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXh0LXNlbGVjdGlvbi1pbmxpbmUnKTtcbiAgICBjb25zdCBwb3B1cFJhZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQtc2VsZWN0aW9uLXBvcHVwJyk7XG5cbiAgICBpZiAoaW5saW5lUmFkaW8pIHtcbiAgICAgIGlubGluZVJhZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIGlmIChlLnRhcmdldC5jaGVja2VkKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVTZXR0aW5nKCd0ZXh0U2VsZWN0aW9uTW9kZScsICdpbmxpbmUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHBvcHVwUmFkaW8pIHtcbiAgICAgIHBvcHVwUmFkaW8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgaWYgKGUudGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNldHRpbmcoJ3RleHRTZWxlY3Rpb25Nb2RlJywgJ3BvcHVwJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEV4cG9ydC9JbXBvcnQgYnV0dG9ucyB3b3VsZCBiZSBpbXBsZW1lbnRlZCBoZXJlXG4gIH0sXG5cbiAgYXN5bmMgdXBkYXRlU2V0dGluZyhrZXksIHZhbHVlKSB7XG4gICAgYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICd1cGRhdGVfc2V0dGluZ3MnLFxuICAgICAgc2V0dGluZ3M6IHsgW2tleV06IHZhbHVlIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLy8gTm90aWZpY2F0aW9uIE1hbmFnZXJcbmNvbnN0IE5vdGlmaWNhdGlvbk1hbmFnZXIgPSB7XG4gIHNob3cobWVzc2FnZSwgdHlwZSA9ICdpbmZvJykge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50b2FzdC1jb250YWluZXInKTtcblxuICAgIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdG9hc3QuY2xhc3NOYW1lID0gYHRvYXN0ICR7dHlwZX1gO1xuXG4gICAgY29uc3QgaWNvbnMgPSB7XG4gICAgICBpbmZvOiAn4oS577iPJyxcbiAgICAgIHN1Y2Nlc3M6ICfinIUnLFxuICAgICAgd2FybmluZzogJ+KaoO+4jycsXG4gICAgICBlcnJvcjogJ+KdjCdcbiAgICB9O1xuXG4gICAgdG9hc3QuaW5uZXJIVE1MID0gYFxuICAgICAgPHNwYW4gY2xhc3M9XCJ0b2FzdC1pY29uXCI+JHtpY29uc1t0eXBlXX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cInRvYXN0LW1lc3NhZ2VcIj4ke21lc3NhZ2V9PC9zcGFuPlxuICAgIGA7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpO1xuXG4gICAgLy8gQXV0by1yZW1vdmUgYWZ0ZXIgMyBzZWNvbmRzXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0b2FzdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0b2FzdC5yZW1vdmUoKSwgMzAwKTtcbiAgICB9LCAzMDAwKTtcbiAgfVxufTtcblxuLy8gSW5pdGlhbGl6ZSBwb3B1cCB3aGVuIERPTSBpcyByZWFkeSAtIG1vdmVkIHRvIHRvcCB3aXRoIGRlYnVnIGNvZGVcbiJdLCJuYW1lcyI6WyJicm93c2VyIiwiY2hyb21lIiwid2luZG93IiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiVGhlbWVNYW5hZ2VyIiwiaW5pdCIsIlRhYk1hbmFnZXIiLCJsb2FkVGhlbWUiLCJzZXR1cFRoZW1lTGlzdGVuZXJzIiwicnVudGltZSIsInNlbmRNZXNzYWdlIiwidHlwZSIsInRoZW4iLCJyZXNwb25zZSIsInN1Y2Nlc3MiLCJ0aGVtZSIsImRhdGEiLCJhcHBseVRoZW1lIiwidGhlbWVTZWxlY3QiLCJnZXRFbGVtZW50QnlJZCIsInZhbHVlIiwicm9vdCIsImRvY3VtZW50RWxlbWVudCIsInNldEF0dHJpYnV0ZSIsImUiLCJ0YXJnZXQiLCJzZXR0aW5ncyIsInNldHVwVGFiTGlzdGVuZXJzIiwic2hvd1RhYiIsInRhYkJ1dHRvbnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZm9yRWFjaCIsImJ1dHRvbiIsInRhYk5hbWUiLCJkYXRhc2V0IiwidGFiIiwiaXNBY3RpdmUiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJ0YWJQYW5lbHMiLCJwYW5lbCIsImlkIiwiU2VhcmNoVGFiIiwiTGlzdHNUYWIiLCJMZWFyblRhYiIsIlNldHRpbmdzVGFiIiwic2VhcmNoVGltZW91dCIsInJlY2VudFNlYXJjaGVzIiwic2V0dXBTZWFyY2hJbnB1dCIsImxvYWRSZWNlbnRTZWFyY2hlcyIsImNoZWNrUGVuZGluZ0NvbnRleHRTZWFyY2giLCJ3b3JkIiwic2VhcmNoSW5wdXQiLCJxdWVyeVNlbGVjdG9yIiwicGVyZm9ybVNlYXJjaCIsImVycm9yIiwiY29uc29sZSIsImNsZWFyVGltZW91dCIsInF1ZXJ5IiwidHJpbSIsImxlbmd0aCIsImNsZWFyU2VhcmNoUmVzdWx0cyIsInNldFRpbWVvdXQiLCJrZXkiLCJkaXNwbGF5U2VhcmNoUmVzdWx0IiwiZGlzcGxheU5vUmVzdWx0cyIsInN1Z2dlc3Rpb25zIiwiZGlzcGxheUVycm9yIiwid29yZERhdGEiLCJyZXN1bHRzQ29udGFpbmVyIiwic3R5bGUiLCJkaXNwbGF5IiwiYWRkIiwiaW5uZXJIVE1MIiwicHJvbnVuY2lhdGlvbiIsImRlZmluaXRpb25zIiwibWFwIiwiZGVmIiwicGFydE9mU3BlZWNoIiwibWVhbmluZyIsImV4YW1wbGVzIiwiZXgiLCJqb2luIiwic3lub255bXMiLCJhbnRvbnltcyIsImFkZEJ1dHRvbiIsImFkZFRvTGlzdCIsInMiLCJsaW5rIiwicHJldmVudERlZmF1bHQiLCJzdWdnZXN0aW9uIiwicmVtb3ZlIiwibGlzdHNSZXNwb25zZSIsImxpc3RzIiwiZGVmYXVsdExpc3QiLCJmaW5kIiwibCIsImlzRGVmYXVsdCIsIk5vdGlmaWNhdGlvbk1hbmFnZXIiLCJzaG93IiwiYWRkUmVzcG9uc2UiLCJsaXN0SWQiLCJuYW1lIiwiZGlzcGxheVJlY2VudFNlYXJjaGVzIiwiY29udGFpbmVyIiwic2xpY2UiLCJzZWFyY2giLCJpdGVtIiwiY3VycmVudExpc3RJZCIsImN1cnJlbnRMaXN0IiwiY3VycmVudFNvcnQiLCJjdXJyZW50RmlsdGVyIiwibG9hZExpc3RzIiwic2V0dXBMaXN0Q29udHJvbHMiLCJkaXNwbGF5TGlzdHMiLCJsaXN0IiwiT2JqZWN0Iiwia2V5cyIsIndvcmRzIiwiZm9ybWF0RGF0ZSIsInVwZGF0ZWQiLCJjcmVhdGVkIiwic2VsZWN0TGlzdCIsImxvYWRMaXN0V29yZHMiLCJkaXNwbGF5TGlzdFdvcmRzIiwicmVmcmVzaFdvcmRzTGlzdCIsInNvcnRCeSIsInNvcnRPcmRlciIsImZpbHRlckJ5IiwidXBkYXRlU3RhdHVzU2VjdGlvbiIsInJlbmRlcldvcmRJdGVtIiwid29yZENvdW50IiwibGlzdFN0YXR1cyIsInNvcnRJbmRpY2F0b3IiLCJmaWx0ZXJJbmRpY2F0b3IiLCJyZXN1bHRDb3VudCIsInNvcnRMYWJlbHMiLCJyZWNlbnQiLCJhbHBoYWJldGljYWwiLCJkYXRlQWRkZWQiLCJsYXN0UmV2aWV3ZWQiLCJkaWZmaWN1bHR5IiwibG9va3VwQ291bnQiLCJ0ZXh0Q29udGVudCIsImZpbHRlckxhYmVscyIsImVhc3kiLCJtZWRpdW0iLCJoYXJkIiwid29yZEl0ZW0iLCJjb3VudCIsImRpZmZpY3VsdHlNYXAiLCJuZXdMaXN0QnRuIiwic2hvd05ld0xpc3REaWFsb2ciLCJjYW5jZWxCdG4iLCJjb25maXJtQnRuIiwibmFtZUlucHV0IiwiaGlkZU5ld0xpc3REaWFsb2ciLCJjcmVhdGVOZXdMaXN0Iiwic29ydFNlbGVjdCIsImZpbHRlclNlbGVjdCIsImRpYWxvZyIsImZvY3VzIiwiZGF0ZVN0cmluZyIsImRhdGUiLCJEYXRlIiwibm93IiwiZGlmZlRpbWUiLCJNYXRoIiwiYWJzIiwiZGlmZkRheXMiLCJmbG9vciIsInRvTG9jYWxlRGF0ZVN0cmluZyIsImN1cnJlbnRTZXNzaW9uIiwiY3VycmVudFdvcmRJbmRleCIsInNlc3Npb25Xb3JkcyIsImlzRmxpcHBlZCIsInNlc3Npb25TdGF0cyIsInRvdGFsIiwiY29tcGxldGVkIiwia25vd24iLCJ1bmtub3duIiwic2tpcHBlZCIsIm1hc3RlcmVkIiwic2V0dXBMZWFybkNvbnRyb2xzIiwibG9hZFJldmlld1F1ZXVlIiwic3RhcnRCdG4iLCJzdGFydFJldmlld1Nlc3Npb24iLCJrbm93bkJ0biIsInVua25vd25CdG4iLCJza2lwQnRuIiwibWFzdGVyZWRCdG4iLCJoYW5kbGVSZXZpZXdBY3Rpb24iLCJmbGFzaGNhcmQiLCJmbGlwQ2FyZCIsImR1ZVdvcmRzQ291bnQiLCJ1cGRhdGVEdWVXb3Jkc0NvdW50IiwiZGlzcGxheVJldmlld1N0YXR1cyIsIl9jb3VudCIsInN0YXJ0VGltZSIsInJlc3VsdHMiLCJkaXNwbGF5Q3VycmVudFdvcmQiLCJlbmRSZXZpZXdTZXNzaW9uIiwiYWN0aW9ucyIsImFjdGlvbiIsInJldmlld1Jlc3VsdCIsInRpbWVzdGFtcCIsInB1c2giLCJyZXN1bHQiLCJlbmRUaW1lIiwiZHVyYXRpb24iLCJyb3VuZCIsInJldmlld01vcmVCdG4iLCJmaW5pc2hCdG4iLCJsb2FkU2V0dGluZ3MiLCJzZXR1cFNldHRpbmdzTGlzdGVuZXJzIiwiYXV0b0FkZExvb2t1cHMiLCJkYWlseVJldmlld0xpbWl0IiwidGV4dFNlbGVjdGlvbk1vZGUiLCJhdXRvQWRkVG9nZ2xlIiwiY2hlY2tlZCIsInJldmlld0xpbWl0IiwiaW5saW5lUmFkaW8iLCJwb3B1cFJhZGlvIiwidXBkYXRlU2V0dGluZyIsInBhcnNlSW50IiwibWVzc2FnZSIsInRvYXN0IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImljb25zIiwiaW5mbyIsIndhcm5pbmciLCJhcHBlbmRDaGlsZCIsIm9wYWNpdHkiXSwic291cmNlUm9vdCI6IiJ9