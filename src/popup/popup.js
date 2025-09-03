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
      action: 'fetchSettings'
    }).then(response => {
      const theme = (response && response.success && response.settings && response.settings.theme) ? response.settings.theme : 'dark';
      this.applyTheme(theme);

      // Update theme selector if it exists
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) {
        themeSelect.value = theme;
      }
    }).catch(() => {
      this.applyTheme('dark');
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
      themeSelect.addEventListener('change', async (e) => {
        const theme = e.target.value;
        this.applyTheme(theme);

        // Save preference
        await browser.runtime.sendMessage({
          action: 'updateSettings',
          settings: { theme }
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

    searchInput.addEventListener('input', (e) => {
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

    searchInput.addEventListener('keydown', (e) => {
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
            ${def.examples.length > 0
? `
              <div class="word-examples">
                <h4>Examples:</h4>
                <ul>
                  ${def.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
              </div>
            `
: ''}
          </div>
        `).join('')}
        ${wordData.synonyms.length > 0
? `
          <div class="word-synonyms">
            <strong>Synonyms:</strong> ${wordData.synonyms.join(', ')}
          </div>
        `
: ''}
        ${wordData.antonyms.length > 0
? `
          <div class="word-synonyms">
            <strong>Antonyms:</strong> ${wordData.antonyms.join(', ')}
          </div>
        `
: ''}
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
        ${suggestions.length > 0
? `
          <p class="small-text">Did you mean:</p>
          <ul class="suggestions-list">
            ${suggestions.map(s => `
              <li><a href="#" data-suggestion="${s}">${s}</a></li>
            `).join('')}
          </ul>
        `
: ''}
      </div>
    `;

    // Add click handlers for suggestions
    resultsContainer.querySelectorAll('[data-suggestion]').forEach(link => {
      link.addEventListener('click', (e) => {
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
        action: 'fetchAllVocabularyLists'
      });
      const lists = listsResponse && listsResponse.success ? (listsResponse.vocabularyLists || []) : [];
      const defaultList = lists.find(l => l.isDefault) || lists[0];

      if (!defaultList) {
        NotificationManager.show('No vocabulary lists found', 'error');
        return;
      }

      // Send add to list request
      const addResponse = await browser.runtime.sendMessage({
        action: 'addWordToVocabularyList',
        word: wordData.word,
        listId: defaultList.id,
        metadata: { difficulty: 5000 }
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
        action: 'fetchRecentSearches'
      });
    if (response.success) {
      this.recentSearches = response.recentSearches || [];
      this.displayRecentSearches();
    }
  },

  displayRecentSearches() {
    const container = document.querySelector('.recent-searches-list');
    if (!container || !this.recentSearches || this.recentSearches.length === 0) return;

    container.innerHTML = this.recentSearches
      .slice(0, 5)
      .map(search => `<li data-search="${search}">${search}</li>`)
      .join('');

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
        action: 'fetchAllVocabularyLists'
      });

      if (response.success) {
        this.displayLists(response.vocabularyLists || []);
      }
    } catch (error) {
      console.error('Load lists error:', error);
    }
  },

  displayLists(lists) {
    const container = document.querySelector('.lists-container');
    lists = Array.isArray(lists) ? lists : [];
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
        <div class="list-updated">Last updated: ${this.formatDate(list.createdAt || list.created)}</div>
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
        action: 'fetchAllVocabularyLists'
      });

      if (response.success) {
        const list = (response.vocabularyLists || []).find(l => l.id === listId);
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
        action: 'fetchVocabularyListWords',
        listId: list.id,
        sortBy,
        sortOrder,
        filterBy: this.currentFilter
      });

      if (!response.success) {
        container.innerHTML = '<p class="text-center">Error loading words</p>';
        return;
      }

      const { words = [], lookupStats = {} } = response.data || {};
      // Keep current lookup stats for rendering (e.g., when sortBy is lookupCount)
      this.currentLookupStats = lookupStats;

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
      difficulty: 'Difficulty (low to high)',
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
        <div class="difficulty-indicator"></div>
        <div class="word-list-text">
          <div class="word-list-word">${word.word}</div>
          <div class="word-list-status">
    `;

    // Add sort-specific information
    if (sortBy === 'lookupCount') {
      const count = (this.currentLookupStats && this.currentLookupStats[word.word] && this.currentLookupStats[word.word].count) || 0;
      wordItem += `
        <span class="lookup-count">${count} lookup${count !== 1 ? 's' : ''}</span>
      `;
    } else if (sortBy === 'dateAdded') {
      wordItem += `
        <span class="date-added">Added: ${this.formatDate(word.dateAdded)}</span>
      `;
    } else if (sortBy === 'difficulty') {
      const diffVal = (typeof word.difficulty === 'number') ? word.difficulty : '';
      wordItem += `
        <span class="difficulty-badge">${diffVal}</span>
      `;
    } else {
      // Default status
      wordItem += word.lastReviewed
        ? `Last reviewed: ${this.formatDate(word.lastReviewed)}`
        : 'Not reviewed yet';
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
      nameInput.addEventListener('keydown', (e) => {
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
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.refreshWordsList();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
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
        action: 'createVocabularyList',
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
    document.addEventListener('keydown', (e) => {
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
        action: 'fetchReviewQueue'
      });

      if (response && response.success) {
        const dueWordsCount = Array.isArray(response.data) ? response.data.length : 0;
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
        action: 'fetchReviewQueue'
      });

      if (!response || !response.success || !Array.isArray(response.data) || response.data.length === 0) {
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
                  ${word.definitions && word.definitions.length > 0
? word.definitions.map(def => `
                    <div class="definition-item">
                      <span class="part-of-speech">${def.partOfSpeech}</span>
                      <div class="definition-text">${def.meaning}</div>
                      ${def.examples && def.examples.length > 0
? `
                        <div class="examples">
                          ${def.examples.slice(0, 2).map(ex => `<div class="example">"${ex}"</div>`).join('')}
                        </div>
                      `
: ''}
                    </div>
                  `).join('')
: '<div class="no-definition">No definition available</div>'}
                </div>
                
                ${word.synonyms && word.synonyms.length > 0
? `
                  <div class="word-synonyms">
                    <strong>Synonyms:</strong> ${word.synonyms.slice(0, 3).join(', ')}
                  </div>
                `
: ''}
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
        action: 'submitReview',
        word: word.word,
        reviewResult: action,
        listId: word.listId || null,
        timeSpent: 0.0
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
    NotificationManager.show(
      `Review session completed! ${this.sessionStats.completed} words reviewed.`,
      'success'
    );
  }
};

// Settings Tab
const SettingsTab = {
  init() {
    this.loadSettings();
    this.setupSettingsListeners();
  },

  async loadSettings() {
    let response = null;
    try {
      response = await browser.runtime.sendMessage({ action: 'fetchSettings' });
    } catch (_) { /* ignore */ }
    const settings = (response && response.success && response.settings) ? response.settings : {
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
      autoAddToggle.addEventListener('change', (e) => {
        this.updateSetting('autoAddLookups', e.target.checked);
      });
    }

    // Review limit
    const reviewLimit = document.getElementById('review-limit');
    if (reviewLimit) {
      reviewLimit.addEventListener('change', (e) => {
        this.updateSetting('dailyReviewLimit', parseInt(e.target.value));
      });
    }

    // Text selection mode radio buttons
    const inlineRadio = document.getElementById('text-selection-inline');
    const popupRadio = document.getElementById('text-selection-popup');

    if (inlineRadio) {
      inlineRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.updateSetting('textSelectionMode', 'inline');
        }
      });
    }

    if (popupRadio) {
      popupRadio.addEventListener('change', (e) => {
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
      settings: { [key]: value }
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
