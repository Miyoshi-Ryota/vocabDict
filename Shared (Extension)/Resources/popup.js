/******/ (() => { // webpackBootstrap
/*!****************************!*\
  !*** ./src/popup/popup.js ***!
  \****************************/
// Popup script for VocabDict Safari Extension

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
      const theme = settings.theme || 'auto';
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
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  },
  setupThemeListeners() {
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      browser.storage.local.get('settings').then(result => {
        const settings = result.settings || {};
        if (settings.theme === 'auto') {
          this.applyTheme('auto');
        }
      });
    });

    // Listen for theme selector changes
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', async e => {
        const theme = e.target.value;
        this.applyTheme(theme);

        // Save preference
        const result = await browser.storage.local.get('settings');
        const settings = result.settings || {};
        settings.theme = theme;
        await browser.storage.local.set({
          settings
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
    document.querySelectorAll('.tab-button').forEach(button => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
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
    container.innerHTML = this.recentSearches.slice(0, 5).map(search => `<li data-search="${search}">${search}</li>`).join('');

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
      await browser.storage.local.set({
        recentSearches: this.recentSearches
      });
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
              ${word.lastReviewed ? `Last reviewed: ${this.formatDate(word.lastReviewed)}` : 'Not reviewed yet'}
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
      newListBtn.addEventListener('click', () => this.createNewList());
    }

    // Sort and filter controls would be implemented here
  },
  async createNewList() {
    const name = prompt('Enter list name:');
    if (!name) return;
    try {
      const response = await browser.runtime.sendMessage({
        type: 'create_list',
        name: name
      });
      if (response.success) {
        NotificationManager.show(`Created list "${name}"`, 'success');
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
      theme: 'auto',
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

    // Export/Import buttons would be implemented here
  },
  async updateSetting(key, value) {
    const result = await browser.storage.local.get('settings');
    const settings = result.settings || {};
    settings[key] = value;
    await browser.storage.local.set({
      settings
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

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('VocabDict popup initializing...');

  // Initialize managers
  ThemeManager.init();
  TabManager.init();
  console.log('VocabDict popup ready');
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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U0FBUyxHQUFHN0YsUUFBUSxDQUFDc0MsYUFBYSxDQUFDLGtCQUFrQixDQUFDO0lBRTVELE1BQU1zRyxLQUFLLEdBQUc1SSxRQUFRLENBQUM2SSxhQUFhLENBQUMsS0FBSyxDQUFDO0lBQzNDRCxLQUFLLENBQUNFLFNBQVMsR0FBRyxTQUFTNUYsSUFBSSxFQUFFO0lBRWpDLE1BQU02RixLQUFLLEdBQUc7TUFDWkMsSUFBSSxFQUFFLElBQUk7TUFDVjVGLE9BQU8sRUFBRSxHQUFHO01BQ1o2RixPQUFPLEVBQUUsSUFBSTtNQUNidEYsS0FBSyxFQUFFO0lBQ1QsQ0FBQztJQUVEaUYsS0FBSyxDQUFDN0UsU0FBUyxHQUFHO0FBQ3RCLGlDQUFpQ2dGLEtBQUssQ0FBQzdGLElBQUksQ0FBQztBQUM1QyxvQ0FBb0N5RixPQUFPO0FBQzNDLEtBQUs7SUFFRDlDLFNBQVMsQ0FBQ3FELFdBQVcsQ0FBQ04sS0FBSyxDQUFDOztJQUU1QjtJQUNBaEcsVUFBVSxDQUFDLE1BQU07TUFDZmdHLEtBQUssQ0FBQ08sS0FBSyxDQUFDQyxPQUFPLEdBQUcsR0FBRztNQUN6QnhHLFVBQVUsQ0FBQyxNQUFNZ0csS0FBSyxDQUFDUyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztJQUN2QyxDQUFDLEVBQUUsSUFBSSxDQUFDO0VBQ1Y7QUFDRixDQUFDOztBQUVEO0FBQ0FySixRQUFRLENBQUNVLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLE1BQU07RUFDbERrRCxPQUFPLENBQUNxRSxHQUFHLENBQUMsaUNBQWlDLENBQUM7O0VBRTlDO0VBQ0EvSSxZQUFZLENBQUNDLElBQUksQ0FBQyxDQUFDO0VBQ25CMkIsVUFBVSxDQUFDM0IsSUFBSSxDQUFDLENBQUM7RUFFakJ5RSxPQUFPLENBQUNxRSxHQUFHLENBQUMsdUJBQXVCLENBQUM7QUFDdEMsQ0FBQyxDQUFDLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92b2NhYmRpY3QvLi9zcmMvcG9wdXAvcG9wdXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9wdXAgc2NyaXB0IGZvciBWb2NhYkRpY3QgU2FmYXJpIEV4dGVuc2lvblxuXG4vLyBUaGVtZSBNYW5hZ2VtZW50XG5jb25zdCBUaGVtZU1hbmFnZXIgPSB7XG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkVGhlbWUoKTtcbiAgICB0aGlzLnNldHVwVGhlbWVMaXN0ZW5lcnMoKTtcbiAgfSxcblxuICBsb2FkVGhlbWUoKSB7XG4gICAgLy8gQ2hlY2sgZm9yIHNhdmVkIHRoZW1lIHByZWZlcmVuY2VcbiAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KCdzZXR0aW5ncycpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IHNldHRpbmdzID0gcmVzdWx0LnNldHRpbmdzIHx8IHt9O1xuICAgICAgY29uc3QgdGhlbWUgPSBzZXR0aW5ncy50aGVtZSB8fCAnYXV0byc7XG4gICAgICB0aGlzLmFwcGx5VGhlbWUodGhlbWUpO1xuICAgICAgXG4gICAgICAvLyBVcGRhdGUgdGhlbWUgc2VsZWN0b3IgaWYgaXQgZXhpc3RzXG4gICAgICBjb25zdCB0aGVtZVNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZS1zZWxlY3QnKTtcbiAgICAgIGlmICh0aGVtZVNlbGVjdCkge1xuICAgICAgICB0aGVtZVNlbGVjdC52YWx1ZSA9IHRoZW1lO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGFwcGx5VGhlbWUodGhlbWUpIHtcbiAgICBjb25zdCByb290ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIFxuICAgIGlmICh0aGVtZSA9PT0gJ2F1dG8nKSB7XG4gICAgICAvLyBDaGVjayBzeXN0ZW0gcHJlZmVyZW5jZVxuICAgICAgY29uc3QgcHJlZmVyc0RhcmsgPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKScpLm1hdGNoZXM7XG4gICAgICByb290LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsIHByZWZlcnNEYXJrID8gJ2RhcmsnIDogJ2xpZ2h0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3Quc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgdGhlbWUpO1xuICAgIH1cbiAgfSxcblxuICBzZXR1cFRoZW1lTGlzdGVuZXJzKCkge1xuICAgIC8vIExpc3RlbiBmb3Igc3lzdGVtIHRoZW1lIGNoYW5nZXNcbiAgICB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KCdzZXR0aW5ncycpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSByZXN1bHQuc2V0dGluZ3MgfHwge307XG4gICAgICAgIGlmIChzZXR0aW5ncy50aGVtZSA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgdGhpcy5hcHBseVRoZW1lKCdhdXRvJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gTGlzdGVuIGZvciB0aGVtZSBzZWxlY3RvciBjaGFuZ2VzXG4gICAgY29uc3QgdGhlbWVTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbWUtc2VsZWN0Jyk7XG4gICAgaWYgKHRoZW1lU2VsZWN0KSB7XG4gICAgICB0aGVtZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBjb25zdCB0aGVtZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmFwcGx5VGhlbWUodGhlbWUpO1xuICAgICAgICBcbiAgICAgICAgLy8gU2F2ZSBwcmVmZXJlbmNlXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoJ3NldHRpbmdzJyk7XG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gcmVzdWx0LnNldHRpbmdzIHx8IHt9O1xuICAgICAgICBzZXR0aW5ncy50aGVtZSA9IHRoZW1lO1xuICAgICAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHsgc2V0dGluZ3MgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFRhYiBOYXZpZ2F0aW9uXG5jb25zdCBUYWJNYW5hZ2VyID0ge1xuICBpbml0KCkge1xuICAgIHRoaXMuc2V0dXBUYWJMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnNob3dUYWIoJ3NlYXJjaCcpOyAvLyBEZWZhdWx0IHRhYlxuICB9LFxuXG4gIHNldHVwVGFiTGlzdGVuZXJzKCkge1xuICAgIGNvbnN0IHRhYkJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWJ1dHRvbicpO1xuICAgIHRhYkJ1dHRvbnMuZm9yRWFjaChidXR0b24gPT4ge1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBjb25zdCB0YWJOYW1lID0gYnV0dG9uLmRhdGFzZXQudGFiO1xuICAgICAgICB0aGlzLnNob3dUYWIodGFiTmFtZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBzaG93VGFiKHRhYk5hbWUpIHtcbiAgICAvLyBVcGRhdGUgYnV0dG9uc1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItYnV0dG9uJykuZm9yRWFjaChidXR0b24gPT4ge1xuICAgICAgY29uc3QgaXNBY3RpdmUgPSBidXR0b24uZGF0YXNldC50YWIgPT09IHRhYk5hbWU7XG4gICAgICBidXR0b24uY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJywgaXNBY3RpdmUpO1xuICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1zZWxlY3RlZCcsIGlzQWN0aXZlKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSBwYW5lbHNcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLXBhbmVsJykuZm9yRWFjaChwYW5lbCA9PiB7XG4gICAgICBjb25zdCBpc0FjdGl2ZSA9IHBhbmVsLmlkID09PSBgJHt0YWJOYW1lfS10YWJgO1xuICAgICAgcGFuZWwuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJywgaXNBY3RpdmUpO1xuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0YWItc3BlY2lmaWMgY29udGVudFxuICAgIHN3aXRjaCAodGFiTmFtZSkge1xuICAgICAgY2FzZSAnc2VhcmNoJzpcbiAgICAgICAgU2VhcmNoVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsaXN0cyc6XG4gICAgICAgIExpc3RzVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsZWFybic6XG4gICAgICAgIExlYXJuVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzZXR0aW5ncyc6XG4gICAgICAgIFNldHRpbmdzVGFiLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG4vLyBTZWFyY2ggVGFiXG5jb25zdCBTZWFyY2hUYWIgPSB7XG4gIHNlYXJjaFRpbWVvdXQ6IG51bGwsXG4gIHJlY2VudFNlYXJjaGVzOiBbXSxcblxuICBpbml0KCkge1xuICAgIHRoaXMuc2V0dXBTZWFyY2hJbnB1dCgpO1xuICAgIHRoaXMubG9hZFJlY2VudFNlYXJjaGVzKCk7XG4gIH0sXG5cbiAgc2V0dXBTZWFyY2hJbnB1dCgpIHtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtaW5wdXQnKTtcbiAgICBpZiAoIXNlYXJjaElucHV0KSByZXR1cm47XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lb3V0KTtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gZS50YXJnZXQudmFsdWUudHJpbSgpO1xuICAgICAgXG4gICAgICBpZiAocXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuY2xlYXJTZWFyY2hSZXN1bHRzKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRGVib3VuY2Ugc2VhcmNoXG4gICAgICB0aGlzLnNlYXJjaFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHF1ZXJ5KTtcbiAgICAgIH0sIDMwMCk7XG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lb3V0KTtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBlLnRhcmdldC52YWx1ZS50cmltKCk7XG4gICAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaChxdWVyeSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBhc3luYyBwZXJmb3JtU2VhcmNoKHF1ZXJ5KSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFNlbmQgc2VhcmNoIHJlcXVlc3QgdG8gYmFja2dyb3VuZFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnbG9va3VwX3dvcmQnLFxuICAgICAgICB3b3JkOiBxdWVyeVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5U2VhcmNoUmVzdWx0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIHRoaXMuYWRkVG9SZWNlbnRTZWFyY2hlcyhxdWVyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5Tm9SZXN1bHRzKHF1ZXJ5LCByZXNwb25zZS5zdWdnZXN0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGlzcGxheUVycm9yKHJlc3BvbnNlLmVycm9yKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignU2VhcmNoIGVycm9yOicsIGVycm9yKTtcbiAgICAgIHRoaXMuZGlzcGxheUVycm9yKCdGYWlsZWQgdG8gc2VhcmNoLiBQbGVhc2UgdHJ5IGFnYWluLicpO1xuICAgIH1cbiAgfSxcblxuICBkaXNwbGF5U2VhcmNoUmVzdWx0KHdvcmREYXRhKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIHJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIndvcmQtY2FyZFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1oZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ3b3JkLXRpdGxlXCI+JHt3b3JkRGF0YS53b3JkfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwid29yZC1wcm9udW5jaWF0aW9uXCI+JHt3b3JkRGF0YS5wcm9udW5jaWF0aW9ufTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYWRkLXRvLWxpc3QtYnRuXCIgdGl0bGU9XCJBZGQgdG8gbGlzdFwiPvCfk5o8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICR7d29yZERhdGEuZGVmaW5pdGlvbnMubWFwKGRlZiA9PiBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImRlZmluaXRpb24tc2VjdGlvblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtcGFydC1vZi1zcGVlY2hcIj4ke2RlZi5wYXJ0T2ZTcGVlY2h9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1kZWZpbml0aW9uXCI+JHtkZWYubWVhbmluZ308L2Rpdj5cbiAgICAgICAgICAgICR7ZGVmLmV4YW1wbGVzLmxlbmd0aCA+IDAgPyBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWV4YW1wbGVzXCI+XG4gICAgICAgICAgICAgICAgPGg0PkV4YW1wbGVzOjwvaDQ+XG4gICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgJHtkZWYuZXhhbXBsZXMubWFwKGV4ID0+IGA8bGk+JHtleH08L2xpPmApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgJHt3b3JkRGF0YS5zeW5vbnltcy5sZW5ndGggPiAwID8gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLXN5bm9ueW1zXCI+XG4gICAgICAgICAgICA8c3Ryb25nPlN5bm9ueW1zOjwvc3Ryb25nPiAke3dvcmREYXRhLnN5bm9ueW1zLmpvaW4oJywgJyl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAgOiAnJ31cbiAgICAgICAgJHt3b3JkRGF0YS5hbnRvbnltcy5sZW5ndGggPiAwID8gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLXN5bm9ueW1zXCI+XG4gICAgICAgICAgICA8c3Ryb25nPkFudG9ueW1zOjwvc3Ryb25nPiAke3dvcmREYXRhLmFudG9ueW1zLmpvaW4oJywgJyl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAgOiAnJ31cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIFwiQWRkIHRvIExpc3RcIiBidXR0b25cbiAgICBjb25zdCBhZGRCdXR0b24gPSByZXN1bHRzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5hZGQtdG8tbGlzdC1idG4nKTtcbiAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmFkZFRvTGlzdCh3b3JkRGF0YSkpO1xuICB9LFxuXG4gIGRpc3BsYXlOb1Jlc3VsdHMocXVlcnksIHN1Z2dlc3Rpb25zID0gW10pIHtcbiAgICBjb25zdCByZXN1bHRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaC1yZXN1bHRzJyk7XG4gICAgcmVzdWx0c0NvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm8tcmVzdWx0c1wiPlxuICAgICAgICA8cD5ObyByZXN1bHRzIGZvdW5kIGZvciBcIjxzdHJvbmc+JHtxdWVyeX08L3N0cm9uZz5cIjwvcD5cbiAgICAgICAgJHtzdWdnZXN0aW9ucy5sZW5ndGggPiAwID8gYFxuICAgICAgICAgIDxwIGNsYXNzPVwic21hbGwtdGV4dFwiPkRpZCB5b3UgbWVhbjo8L3A+XG4gICAgICAgICAgPHVsIGNsYXNzPVwic3VnZ2VzdGlvbnMtbGlzdFwiPlxuICAgICAgICAgICAgJHtzdWdnZXN0aW9ucy5tYXAocyA9PiBgXG4gICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGRhdGEtc3VnZ2VzdGlvbj1cIiR7c31cIj4ke3N9PC9hPjwvbGk+XG4gICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgICBgIDogJyd9XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgLy8gQWRkIGNsaWNrIGhhbmRsZXJzIGZvciBzdWdnZXN0aW9uc1xuICAgIHJlc3VsdHNDb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtc3VnZ2VzdGlvbl0nKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IGUudGFyZ2V0LmRhdGFzZXQuc3VnZ2VzdGlvbjtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNlYXJjaC1pbnB1dCcpLnZhbHVlID0gc3VnZ2VzdGlvbjtcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHN1Z2dlc3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZGlzcGxheUVycm9yKGVycm9yKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIHJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cImVycm9yLW1lc3NhZ2VcIj5cbiAgICAgICAgPHA+RXJyb3I6ICR7ZXJyb3J9PC9wPlxuICAgICAgPC9kaXY+XG4gICAgYDtcbiAgfSxcblxuICBjbGVhclNlYXJjaFJlc3VsdHMoKSB7XG4gICAgY29uc3QgcmVzdWx0c0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtcmVzdWx0cycpO1xuICAgIHJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gIH0sXG5cbiAgYXN5bmMgYWRkVG9MaXN0KHdvcmREYXRhKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCBkZWZhdWx0IGxpc3RcbiAgICAgIGNvbnN0IGxpc3RzUmVzdWx0ID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCgndm9jYWJfbGlzdHMnKTtcbiAgICAgIGNvbnN0IGxpc3RzID0gbGlzdHNSZXN1bHQudm9jYWJfbGlzdHMgfHwgW107XG4gICAgICBjb25zdCBkZWZhdWx0TGlzdCA9IGxpc3RzLmZpbmQobCA9PiBsLmlzRGVmYXVsdCkgfHwgbGlzdHNbMF07XG5cbiAgICAgIGlmICghZGVmYXVsdExpc3QpIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KCdObyB2b2NhYnVsYXJ5IGxpc3RzIGZvdW5kJywgJ2Vycm9yJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gU2VuZCBhZGQgdG8gbGlzdCByZXF1ZXN0XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdhZGRfdG9fbGlzdCcsXG4gICAgICAgIHdvcmQ6IHdvcmREYXRhLndvcmQsXG4gICAgICAgIGxpc3RJZDogZGVmYXVsdExpc3QuaWRcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBOb3RpZmljYXRpb25NYW5hZ2VyLnNob3coYEFkZGVkIFwiJHt3b3JkRGF0YS53b3JkfVwiIHRvICR7ZGVmYXVsdExpc3QubmFtZX1gLCAnc3VjY2VzcycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KHJlc3BvbnNlLmVycm9yIHx8ICdGYWlsZWQgdG8gYWRkIHdvcmQnLCAnZXJyb3InKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQWRkIHRvIGxpc3QgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgTm90aWZpY2F0aW9uTWFuYWdlci5zaG93KCdGYWlsZWQgdG8gYWRkIHdvcmQgdG8gbGlzdCcsICdlcnJvcicpO1xuICAgIH1cbiAgfSxcblxuICBhc3luYyBsb2FkUmVjZW50U2VhcmNoZXMoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCgncmVjZW50U2VhcmNoZXMnKTtcbiAgICB0aGlzLnJlY2VudFNlYXJjaGVzID0gcmVzdWx0LnJlY2VudFNlYXJjaGVzIHx8IFtdO1xuICAgIHRoaXMuZGlzcGxheVJlY2VudFNlYXJjaGVzKCk7XG4gIH0sXG5cbiAgZGlzcGxheVJlY2VudFNlYXJjaGVzKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZWNlbnQtc2VhcmNoZXMtbGlzdCcpO1xuICAgIGlmICghY29udGFpbmVyIHx8IHRoaXMucmVjZW50U2VhcmNoZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5yZWNlbnRTZWFyY2hlc1xuICAgICAgLnNsaWNlKDAsIDUpXG4gICAgICAubWFwKHNlYXJjaCA9PiBgPGxpIGRhdGEtc2VhcmNoPVwiJHtzZWFyY2h9XCI+JHtzZWFyY2h9PC9saT5gKVxuICAgICAgLmpvaW4oJycpO1xuXG4gICAgLy8gQWRkIGNsaWNrIGhhbmRsZXJzXG4gICAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlYXJjaCA9IGl0ZW0uZGF0YXNldC5zZWFyY2g7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zZWFyY2gtaW5wdXQnKS52YWx1ZSA9IHNlYXJjaDtcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHNlYXJjaCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBhc3luYyBhZGRUb1JlY2VudFNlYXJjaGVzKHF1ZXJ5KSB7XG4gICAgaWYgKCF0aGlzLnJlY2VudFNlYXJjaGVzLmluY2x1ZGVzKHF1ZXJ5KSkge1xuICAgICAgdGhpcy5yZWNlbnRTZWFyY2hlcy51bnNoaWZ0KHF1ZXJ5KTtcbiAgICAgIHRoaXMucmVjZW50U2VhcmNoZXMgPSB0aGlzLnJlY2VudFNlYXJjaGVzLnNsaWNlKDAsIDEwKTtcbiAgICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyByZWNlbnRTZWFyY2hlczogdGhpcy5yZWNlbnRTZWFyY2hlcyB9KTtcbiAgICAgIHRoaXMuZGlzcGxheVJlY2VudFNlYXJjaGVzKCk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBMaXN0cyBUYWJcbmNvbnN0IExpc3RzVGFiID0ge1xuICBjdXJyZW50TGlzdElkOiBudWxsLFxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkTGlzdHMoKTtcbiAgICB0aGlzLnNldHVwTGlzdENvbnRyb2xzKCk7XG4gIH0sXG5cbiAgYXN5bmMgbG9hZExpc3RzKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdnZXRfbGlzdHMnXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5TGlzdHMocmVzcG9uc2UuZGF0YSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0xvYWQgbGlzdHMgZXJyb3I6JywgZXJyb3IpO1xuICAgIH1cbiAgfSxcblxuICBkaXNwbGF5TGlzdHMobGlzdHMpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGlzdHMtY29udGFpbmVyJyk7XG4gICAgaWYgKGxpc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8cCBjbGFzcz1cInRleHQtY2VudGVyXCI+Tm8gdm9jYWJ1bGFyeSBsaXN0cyB5ZXQ8L3A+JztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gbGlzdHMubWFwKGxpc3QgPT4gYFxuICAgICAgPGRpdiBjbGFzcz1cImxpc3QtaXRlbVwiIGRhdGEtbGlzdC1pZD1cIiR7bGlzdC5pZH1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtaXRlbS1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImxpc3QtaWNvblwiPvCfk4E8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXN0LW5hbWVcIj4ke2xpc3QubmFtZX08L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXN0LWNvdW50XCI+JHtPYmplY3Qua2V5cyhsaXN0LndvcmRzKS5sZW5ndGh9IHdvcmRzPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtdXBkYXRlZFwiPkxhc3QgdXBkYXRlZDogJHt0aGlzLmZvcm1hdERhdGUobGlzdC51cGRhdGVkIHx8IGxpc3QuY3JlYXRlZCl9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgKS5qb2luKCcnKTtcblxuICAgIC8vIEFkZCBjbGljayBoYW5kbGVyc1xuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtJykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpc3RJZCA9IGl0ZW0uZGF0YXNldC5saXN0SWQ7XG4gICAgICAgIHRoaXMuc2VsZWN0TGlzdChsaXN0SWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc2VsZWN0TGlzdChsaXN0SWQpIHtcbiAgICAvLyBVcGRhdGUgVUlcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtJykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnLCBpdGVtLmRhdGFzZXQubGlzdElkID09PSBsaXN0SWQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jdXJyZW50TGlzdElkID0gbGlzdElkO1xuICAgIHRoaXMubG9hZExpc3RXb3JkcyhsaXN0SWQpO1xuICB9LFxuXG4gIGFzeW5jIGxvYWRMaXN0V29yZHMobGlzdElkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ2dldF9saXN0cydcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBjb25zdCBsaXN0ID0gcmVzcG9uc2UuZGF0YS5maW5kKGwgPT4gbC5pZCA9PT0gbGlzdElkKTtcbiAgICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgICB0aGlzLmRpc3BsYXlMaXN0V29yZHMobGlzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignTG9hZCBsaXN0IHdvcmRzIGVycm9yOicsIGVycm9yKTtcbiAgICB9XG4gIH0sXG5cbiAgZGlzcGxheUxpc3RXb3JkcyhsaXN0KSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLndvcmRzLWluLWxpc3QnKTtcbiAgICBjb25zdCB3b3JkcyA9IE9iamVjdC52YWx1ZXMobGlzdC53b3Jkcyk7XG5cbiAgICBpZiAod29yZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwidGV4dC1jZW50ZXJcIj5ObyB3b3JkcyBpbiB0aGlzIGxpc3Q8L3A+JztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGgzIGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPldvcmRzIGluIFwiJHtsaXN0Lm5hbWV9XCI8L2gzPlxuICAgICAgJHt3b3Jkcy5tYXAod29yZCA9PiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWxpc3QtaXRlbVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJkaWZmaWN1bHR5LWluZGljYXRvciBkaWZmaWN1bHR5LSR7d29yZC5kaWZmaWN1bHR5IHx8ICdtZWRpdW0nfVwiPjwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JkLWxpc3QtdGV4dFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtbGlzdC13b3JkXCI+JHt3b3JkLndvcmR9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid29yZC1saXN0LXN0YXR1c1wiPlxuICAgICAgICAgICAgICAke3dvcmQubGFzdFJldmlld2VkID8gXG4gICAgICAgICAgICAgICAgYExhc3QgcmV2aWV3ZWQ6ICR7dGhpcy5mb3JtYXREYXRlKHdvcmQubGFzdFJldmlld2VkKX1gIDogXG4gICAgICAgICAgICAgICAgJ05vdCByZXZpZXdlZCB5ZXQnfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIndvcmQtYWN0aW9uc1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIndvcmQtYWN0aW9uLWJ0blwiIHRpdGxlPVwiRWRpdCBub3Rlc1wiPvCfk508L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgKS5qb2luKCcnKX1cbiAgICBgO1xuICB9LFxuXG4gIHNldHVwTGlzdENvbnRyb2xzKCkge1xuICAgIC8vIE5ldyBsaXN0IGJ1dHRvblxuICAgIGNvbnN0IG5ld0xpc3RCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3LWxpc3QtYnV0dG9uJyk7XG4gICAgaWYgKG5ld0xpc3RCdG4pIHtcbiAgICAgIG5ld0xpc3RCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNyZWF0ZU5ld0xpc3QoKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBhbmQgZmlsdGVyIGNvbnRyb2xzIHdvdWxkIGJlIGltcGxlbWVudGVkIGhlcmVcbiAgfSxcblxuICBhc3luYyBjcmVhdGVOZXdMaXN0KCkge1xuICAgIGNvbnN0IG5hbWUgPSBwcm9tcHQoJ0VudGVyIGxpc3QgbmFtZTonKTtcbiAgICBpZiAoIW5hbWUpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdjcmVhdGVfbGlzdCcsXG4gICAgICAgIG5hbWU6IG5hbWVcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICBOb3RpZmljYXRpb25NYW5hZ2VyLnNob3coYENyZWF0ZWQgbGlzdCBcIiR7bmFtZX1cImAsICdzdWNjZXNzJyk7XG4gICAgICAgIHRoaXMubG9hZExpc3RzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBOb3RpZmljYXRpb25NYW5hZ2VyLnNob3cocmVzcG9uc2UuZXJyb3IgfHwgJ0ZhaWxlZCB0byBjcmVhdGUgbGlzdCcsICdlcnJvcicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgbGlzdCBlcnJvcjonLCBlcnJvcik7XG4gICAgICBOb3RpZmljYXRpb25NYW5hZ2VyLnNob3coJ0ZhaWxlZCB0byBjcmVhdGUgbGlzdCcsICdlcnJvcicpO1xuICAgIH1cbiAgfSxcblxuICBmb3JtYXREYXRlKGRhdGVTdHJpbmcpIHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoZGF0ZVN0cmluZyk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkaWZmVGltZSA9IE1hdGguYWJzKG5vdyAtIGRhdGUpO1xuICAgIGNvbnN0IGRpZmZEYXlzID0gTWF0aC5mbG9vcihkaWZmVGltZSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7XG5cbiAgICBpZiAoZGlmZkRheXMgPT09IDApIHJldHVybiAndG9kYXknO1xuICAgIGlmIChkaWZmRGF5cyA9PT0gMSkgcmV0dXJuICd5ZXN0ZXJkYXknO1xuICAgIGlmIChkaWZmRGF5cyA8IDcpIHJldHVybiBgJHtkaWZmRGF5c30gZGF5cyBhZ29gO1xuICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9XG59O1xuXG4vLyBMZWFybiBUYWIgKHBsYWNlaG9sZGVyKVxuY29uc3QgTGVhcm5UYWIgPSB7XG4gIGluaXQoKSB7XG4gICAgLy8gVE9ETzogSW1wbGVtZW50IGxlYXJuaW5nIG1vZGVcbiAgICBjb25zb2xlLmxvZygnTGVhcm4gdGFiIGluaXRpYWxpemVkJyk7XG4gIH1cbn07XG5cbi8vIFNldHRpbmdzIFRhYlxuY29uc3QgU2V0dGluZ3NUYWIgPSB7XG4gIGluaXQoKSB7XG4gICAgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLnNldHVwU2V0dGluZ3NMaXN0ZW5lcnMoKTtcbiAgfSxcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCgnc2V0dGluZ3MnKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHJlc3VsdC5zZXR0aW5ncyB8fCB7XG4gICAgICB0aGVtZTogJ2F1dG8nLFxuICAgICAgYXV0b0FkZExvb2t1cHM6IHRydWUsXG4gICAgICBkYWlseVJldmlld0xpbWl0OiAzMFxuICAgIH07XG5cbiAgICAvLyBVcGRhdGUgVUlcbiAgICBjb25zdCBhdXRvQWRkVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG8tYWRkLXRvZ2dsZScpO1xuICAgIGlmIChhdXRvQWRkVG9nZ2xlKSBhdXRvQWRkVG9nZ2xlLmNoZWNrZWQgPSBzZXR0aW5ncy5hdXRvQWRkTG9va3VwcztcblxuICAgIGNvbnN0IHJldmlld0xpbWl0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlldy1saW1pdCcpO1xuICAgIGlmIChyZXZpZXdMaW1pdCkgcmV2aWV3TGltaXQudmFsdWUgPSBzZXR0aW5ncy5kYWlseVJldmlld0xpbWl0O1xuICB9LFxuXG4gIHNldHVwU2V0dGluZ3NMaXN0ZW5lcnMoKSB7XG4gICAgLy8gQXV0by1hZGQgdG9nZ2xlXG4gICAgY29uc3QgYXV0b0FkZFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRvLWFkZC10b2dnbGUnKTtcbiAgICBpZiAoYXV0b0FkZFRvZ2dsZSkge1xuICAgICAgYXV0b0FkZFRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZVNldHRpbmcoJ2F1dG9BZGRMb29rdXBzJywgZS50YXJnZXQuY2hlY2tlZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXZpZXcgbGltaXRcbiAgICBjb25zdCByZXZpZXdMaW1pdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXctbGltaXQnKTtcbiAgICBpZiAocmV2aWV3TGltaXQpIHtcbiAgICAgIHJldmlld0xpbWl0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU2V0dGluZygnZGFpbHlSZXZpZXdMaW1pdCcsIHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBFeHBvcnQvSW1wb3J0IGJ1dHRvbnMgd291bGQgYmUgaW1wbGVtZW50ZWQgaGVyZVxuICB9LFxuXG4gIGFzeW5jIHVwZGF0ZVNldHRpbmcoa2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQoJ3NldHRpbmdzJyk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSByZXN1bHQuc2V0dGluZ3MgfHwge307XG4gICAgc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBzZXR0aW5ncyB9KTtcbiAgfVxufTtcblxuLy8gTm90aWZpY2F0aW9uIE1hbmFnZXJcbmNvbnN0IE5vdGlmaWNhdGlvbk1hbmFnZXIgPSB7XG4gIHNob3cobWVzc2FnZSwgdHlwZSA9ICdpbmZvJykge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50b2FzdC1jb250YWluZXInKTtcbiAgICBcbiAgICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRvYXN0LmNsYXNzTmFtZSA9IGB0b2FzdCAke3R5cGV9YDtcbiAgICBcbiAgICBjb25zdCBpY29ucyA9IHtcbiAgICAgIGluZm86ICfihLnvuI8nLFxuICAgICAgc3VjY2VzczogJ+KchScsXG4gICAgICB3YXJuaW5nOiAn4pqg77iPJyxcbiAgICAgIGVycm9yOiAn4p2MJ1xuICAgIH07XG4gICAgXG4gICAgdG9hc3QuaW5uZXJIVE1MID0gYFxuICAgICAgPHNwYW4gY2xhc3M9XCJ0b2FzdC1pY29uXCI+JHtpY29uc1t0eXBlXX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cInRvYXN0LW1lc3NhZ2VcIj4ke21lc3NhZ2V9PC9zcGFuPlxuICAgIGA7XG4gICAgXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRvYXN0KTtcbiAgICBcbiAgICAvLyBBdXRvLXJlbW92ZSBhZnRlciAzIHNlY29uZHNcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRvYXN0LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHRvYXN0LnJlbW92ZSgpLCAzMDApO1xuICAgIH0sIDMwMDApO1xuICB9XG59O1xuXG4vLyBJbml0aWFsaXplIHBvcHVwIHdoZW4gRE9NIGlzIHJlYWR5XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnVm9jYWJEaWN0IHBvcHVwIGluaXRpYWxpemluZy4uLicpO1xuICBcbiAgLy8gSW5pdGlhbGl6ZSBtYW5hZ2Vyc1xuICBUaGVtZU1hbmFnZXIuaW5pdCgpO1xuICBUYWJNYW5hZ2VyLmluaXQoKTtcbiAgXG4gIGNvbnNvbGUubG9nKCdWb2NhYkRpY3QgcG9wdXAgcmVhZHknKTtcbn0pOyJdLCJuYW1lcyI6WyJUaGVtZU1hbmFnZXIiLCJpbml0IiwibG9hZFRoZW1lIiwic2V0dXBUaGVtZUxpc3RlbmVycyIsImJyb3dzZXIiLCJzdG9yYWdlIiwibG9jYWwiLCJnZXQiLCJ0aGVuIiwicmVzdWx0Iiwic2V0dGluZ3MiLCJ0aGVtZSIsImFwcGx5VGhlbWUiLCJ0aGVtZVNlbGVjdCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJ2YWx1ZSIsInJvb3QiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmVmZXJzRGFyayIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwic2V0QXR0cmlidXRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJ0YXJnZXQiLCJzZXQiLCJUYWJNYW5hZ2VyIiwic2V0dXBUYWJMaXN0ZW5lcnMiLCJzaG93VGFiIiwidGFiQnV0dG9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJmb3JFYWNoIiwiYnV0dG9uIiwidGFiTmFtZSIsImRhdGFzZXQiLCJ0YWIiLCJpc0FjdGl2ZSIsImNsYXNzTGlzdCIsInRvZ2dsZSIsInBhbmVsIiwiaWQiLCJTZWFyY2hUYWIiLCJMaXN0c1RhYiIsIkxlYXJuVGFiIiwiU2V0dGluZ3NUYWIiLCJzZWFyY2hUaW1lb3V0IiwicmVjZW50U2VhcmNoZXMiLCJzZXR1cFNlYXJjaElucHV0IiwibG9hZFJlY2VudFNlYXJjaGVzIiwic2VhcmNoSW5wdXQiLCJxdWVyeVNlbGVjdG9yIiwiY2xlYXJUaW1lb3V0IiwicXVlcnkiLCJ0cmltIiwibGVuZ3RoIiwiY2xlYXJTZWFyY2hSZXN1bHRzIiwic2V0VGltZW91dCIsInBlcmZvcm1TZWFyY2giLCJrZXkiLCJyZXNwb25zZSIsInJ1bnRpbWUiLCJzZW5kTWVzc2FnZSIsInR5cGUiLCJ3b3JkIiwic3VjY2VzcyIsImRhdGEiLCJkaXNwbGF5U2VhcmNoUmVzdWx0IiwiYWRkVG9SZWNlbnRTZWFyY2hlcyIsImRpc3BsYXlOb1Jlc3VsdHMiLCJzdWdnZXN0aW9ucyIsImRpc3BsYXlFcnJvciIsImVycm9yIiwiY29uc29sZSIsIndvcmREYXRhIiwicmVzdWx0c0NvbnRhaW5lciIsImlubmVySFRNTCIsInByb251bmNpYXRpb24iLCJkZWZpbml0aW9ucyIsIm1hcCIsImRlZiIsInBhcnRPZlNwZWVjaCIsIm1lYW5pbmciLCJleGFtcGxlcyIsImV4Iiwiam9pbiIsInN5bm9ueW1zIiwiYW50b255bXMiLCJhZGRCdXR0b24iLCJhZGRUb0xpc3QiLCJzIiwibGluayIsInByZXZlbnREZWZhdWx0Iiwic3VnZ2VzdGlvbiIsImxpc3RzUmVzdWx0IiwibGlzdHMiLCJ2b2NhYl9saXN0cyIsImRlZmF1bHRMaXN0IiwiZmluZCIsImwiLCJpc0RlZmF1bHQiLCJOb3RpZmljYXRpb25NYW5hZ2VyIiwic2hvdyIsImxpc3RJZCIsIm5hbWUiLCJkaXNwbGF5UmVjZW50U2VhcmNoZXMiLCJjb250YWluZXIiLCJzbGljZSIsInNlYXJjaCIsIml0ZW0iLCJpbmNsdWRlcyIsInVuc2hpZnQiLCJjdXJyZW50TGlzdElkIiwibG9hZExpc3RzIiwic2V0dXBMaXN0Q29udHJvbHMiLCJkaXNwbGF5TGlzdHMiLCJsaXN0IiwiT2JqZWN0Iiwia2V5cyIsIndvcmRzIiwiZm9ybWF0RGF0ZSIsInVwZGF0ZWQiLCJjcmVhdGVkIiwic2VsZWN0TGlzdCIsImxvYWRMaXN0V29yZHMiLCJkaXNwbGF5TGlzdFdvcmRzIiwidmFsdWVzIiwiZGlmZmljdWx0eSIsImxhc3RSZXZpZXdlZCIsIm5ld0xpc3RCdG4iLCJjcmVhdGVOZXdMaXN0IiwicHJvbXB0IiwiZGF0ZVN0cmluZyIsImRhdGUiLCJEYXRlIiwibm93IiwiZGlmZlRpbWUiLCJNYXRoIiwiYWJzIiwiZGlmZkRheXMiLCJmbG9vciIsInRvTG9jYWxlRGF0ZVN0cmluZyIsImxvZyIsImxvYWRTZXR0aW5ncyIsInNldHVwU2V0dGluZ3NMaXN0ZW5lcnMiLCJhdXRvQWRkTG9va3VwcyIsImRhaWx5UmV2aWV3TGltaXQiLCJhdXRvQWRkVG9nZ2xlIiwiY2hlY2tlZCIsInJldmlld0xpbWl0IiwidXBkYXRlU2V0dGluZyIsInBhcnNlSW50IiwibWVzc2FnZSIsInRvYXN0IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImljb25zIiwiaW5mbyIsIndhcm5pbmciLCJhcHBlbmRDaGlsZCIsInN0eWxlIiwib3BhY2l0eSIsInJlbW92ZSJdLCJzb3VyY2VSb290IjoiIn0=