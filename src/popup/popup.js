// Popup script for VocabDict Safari Extension

// Browser API compatibility - MUST be first
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    window.browser = chrome;
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
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
    browser.storage.local.get('settings').then(result => {
      const settings = result.settings || {};
      const theme = settings.theme || 'dark';
      this.applyTheme(theme);
      
      // Update theme selector if it exists
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) {
        themeSelect.value = theme;
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
      themeSelect.addEventListener('change', async (e) => {
        const theme = e.target.value;
        this.applyTheme(theme);
        
        // Save preference
        const result = await browser.storage.local.get('settings');
        const settings = result.settings || {};
        settings.theme = theme;
        await browser.storage.local.set({ settings });
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
        type: 'lookup_word',
        word: query
      });

      if (response.success) {
        if (response.data) {
          this.displaySearchResult(response.data);
          this.addToRecentSearches(query);
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
    resultsContainer.innerHTML = `
      <div class="word-card">
        <div class="word-header">
          <div>
            <span class="word-title">${wordData.word}</span>
            <span class="word-pronunciation">${wordData.pronunciation}</span>
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
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>Error: ${error}</p>
      </div>
    `;
  },

  clearSearchResults() {
    const resultsContainer = document.querySelector('.search-results');
    resultsContainer.innerHTML = '';
  },

  async addToList(wordData) {
    try {
      // Get default list
      const listsResult = await browser.storage.local.get('vocab_lists');
      const lists = listsResult.vocab_lists || [];
      const defaultList = lists.find(l => l.isDefault) || lists[0];

      if (!defaultList) {
        NotificationManager.show('No vocabulary lists found', 'error');
        return;
      }

      // Send add to list request
      const response = await browser.runtime.sendMessage({
        type: 'add_to_list',
        word: wordData.word,
        listId: defaultList.id
      });

      if (response.success) {
        NotificationManager.show(`Added "${wordData.word}" to ${defaultList.name}`, 'success');
      } else {
        NotificationManager.show(response.error || 'Failed to add word', 'error');
      }
    } catch (error) {
      console.error('Add to list error:', error);
      NotificationManager.show('Failed to add word to list', 'error');
    }
  },

  async loadRecentSearches() {
    const result = await browser.storage.local.get('recentSearches');
    this.recentSearches = result.recentSearches || [];
    this.displayRecentSearches();
  },

  displayRecentSearches() {
    const container = document.querySelector('.recent-searches-list');
    if (!container || this.recentSearches.length === 0) return;

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
  },

  async addToRecentSearches(query) {
    if (!this.recentSearches.includes(query)) {
      this.recentSearches.unshift(query);
      this.recentSearches = this.recentSearches.slice(0, 10);
      await browser.storage.local.set({ recentSearches: this.recentSearches });
      this.displayRecentSearches();
    }
  }
};

// Lists Tab
const ListsTab = {
  currentListId: null,

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
          this.displayListWords(list);
        }
      }
    } catch (error) {
      console.error('Load list words error:', error);
    }
  },

  displayListWords(list) {
    const container = document.querySelector('.words-in-list');
    const words = Object.values(list.words);

    if (words.length === 0) {
      container.innerHTML = '<p class="text-center">No words in this list</p>';
      return;
    }

    container.innerHTML = `
      <h3 class="section-title">Words in "${list.name}"</h3>
      ${words.map(word => `
        <div class="word-list-item">
          <div class="difficulty-indicator difficulty-${word.difficulty || 'medium'}"></div>
          <div class="word-list-text">
            <div class="word-list-word">${word.word}</div>
            <div class="word-list-status">
              ${word.lastReviewed ? 
                `Last reviewed: ${this.formatDate(word.lastReviewed)}` : 
                'Not reviewed yet'}
            </div>
          </div>
          <div class="word-actions">
            <button class="word-action-btn" title="Edit notes">📝</button>
          </div>
        </div>
      `).join('')}
    `;
  },

  setupListControls() {
    // New list button
    const newListBtn = document.getElementById('new-list-button');
    if (newListBtn) {
      newListBtn.addEventListener('click', () => this.showNewListDialog());
    }

    // Dialog controls
    const dialog = document.getElementById('new-list-dialog');
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

    // Sort and filter controls would be implemented here
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
        name: name
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

// Learn Tab (placeholder)
const LearnTab = {
  init() {
    // TODO: Implement learning mode
    console.log('Learn tab initialized');
  }
};

// Settings Tab
const SettingsTab = {
  init() {
    this.loadSettings();
    this.setupSettingsListeners();
  },

  async loadSettings() {
    const result = await browser.storage.local.get('settings');
    const settings = result.settings || {
      theme: 'dark',
      autoAddLookups: true,
      dailyReviewLimit: 30
    };

    // Update UI
    const autoAddToggle = document.getElementById('auto-add-toggle');
    if (autoAddToggle) autoAddToggle.checked = settings.autoAddLookups;

    const reviewLimit = document.getElementById('review-limit');
    if (reviewLimit) reviewLimit.value = settings.dailyReviewLimit;
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

    // Export/Import buttons would be implemented here
  },

  async updateSetting(key, value) {
    const result = await browser.storage.local.get('settings');
    const settings = result.settings || {};
    settings[key] = value;
    await browser.storage.local.set({ settings });
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