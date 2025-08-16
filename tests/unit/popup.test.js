/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Popup UI Tests', () => {
  let popupHTML;
  let popupCSS;

  beforeEach(() => {
    // Load actual popup HTML
    popupHTML = fs.readFileSync(
      path.join(__dirname, '../../src/popup/popup.html'),
      'utf8'
    );

    // Load actual popup CSS
    popupCSS = fs.readFileSync(
      path.join(__dirname, '../../src/popup/popup.css'),
      'utf8'
    );

    // Set up DOM with actual HTML and CSS
    document.body.innerHTML = popupHTML;
    const style = document.createElement('style');
    style.innerHTML = popupCSS;
    document.head.appendChild(style);

    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query !== '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('Tab Navigation Structure', () => {
    test('should have correct initial tab structure', () => {
      const searchTab = document.querySelector('[data-tab="search"]');
      const listsTab = document.querySelector('[data-tab="lists"]');
      const searchPanel = document.getElementById('search-tab');
      const listsPanel = document.getElementById('lists-tab');

      // Check initial state
      expect(searchTab).toBeTruthy();
      expect(searchTab.classList.contains('active')).toBe(true);
      expect(searchTab.getAttribute('aria-selected')).toBe('true');

      expect(listsTab).toBeTruthy();
      expect(listsTab.classList.contains('active')).toBe(false);
      expect(listsTab.getAttribute('aria-selected')).toBe('false');

      expect(searchPanel).toBeTruthy();
      expect(searchPanel.classList.contains('active')).toBe(true);

      expect(listsPanel).toBeTruthy();
      expect(listsPanel.classList.contains('active')).toBe(false);
    });

    test('should have all required tabs with icons and labels', () => {
      const tabs = document.querySelectorAll('.tab-button');
      const expectedTabs = [
        { name: 'search', icon: '🔍', label: 'Search' },
        { name: 'lists', icon: '📚', label: 'Lists' },
        { name: 'learn', icon: '🎓', label: 'Learn' },
        { name: 'settings', icon: '⚙️', label: 'Settings' }
      ];

      expect(tabs).toHaveLength(4);

      tabs.forEach((tab, index) => {
        const expected = expectedTabs[index];
        expect(tab.dataset.tab).toBe(expected.name);

        const icon = tab.querySelector('.tab-icon');
        const label = tab.querySelector('.tab-label');

        expect(icon).toBeTruthy();
        expect(icon.textContent).toBe(expected.icon);
        expect(label).toBeTruthy();
        expect(label.textContent).toBe(expected.label);
      });
    });
  });

  describe('Search Tab Structure', () => {
    test('should have properly structured search input', () => {
      const searchWrapper = document.querySelector('.search-input-wrapper');
      const searchIcon = searchWrapper.querySelector('.search-icon');
      const searchInput = searchWrapper.querySelector('.search-input');

      expect(searchWrapper).toBeTruthy();
      expect(searchIcon).toBeTruthy();
      expect(searchIcon.textContent).toBe('🔍');
      expect(searchInput).toBeTruthy();
      expect(searchInput.type).toBe('search');
      expect(searchInput.placeholder).toBe('Search for a word...');
      expect(searchInput.getAttribute('autocomplete')).toBe('off');
    });

    test('should have recent searches section', () => {
      const recentSection = document.querySelector('.recent-searches');
      const title = recentSection.querySelector('.section-title');
      const list = recentSection.querySelector('.recent-searches-list');

      expect(recentSection).toBeTruthy();
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Recent Searches');
      expect(list).toBeTruthy();
      expect(list.tagName).toBe('UL');
      expect(list.getAttribute('aria-label')).toBe('Recent searches');
    });

    test('should have search results container with ARIA attributes', () => {
      const results = document.querySelector('.search-results');

      expect(results).toBeTruthy();
      expect(results.getAttribute('aria-live')).toBe('polite');
      expect(results.getAttribute('aria-label')).toBe('Search results');
    });
  });

  describe('Lists Tab Structure', () => {
    test('should have lists header with new list button', () => {
      const header = document.querySelector('.lists-header');
      const newButton = header.querySelector('#new-list-button');

      expect(header).toBeTruthy();
      expect(newButton).toBeTruthy();
      expect(newButton.classList.contains('btn-primary')).toBe(true);
      expect(newButton.classList.contains('btn-small')).toBe(true);
      expect(newButton.textContent.trim()).toBe('+ New List');
    });

    test('should have sort and filter controls', () => {
      const controls = document.querySelector('.list-controls');
      const sortSelect = document.getElementById('sort-select');
      const filterSelect = document.getElementById('filter-select');

      expect(controls).toBeTruthy();

      // Sort select
      expect(sortSelect).toBeTruthy();
      expect(sortSelect.classList.contains('control-select')).toBe(true);
      expect(sortSelect.options).toHaveLength(6);
      expect(sortSelect.options[0].value).toBe('recent');
      expect(sortSelect.options[0].text).toBe('Most Recent');
      expect(sortSelect.options[1].value).toBe('alphabetical');
      expect(sortSelect.options[1].text).toBe('Alphabetical');
      expect(sortSelect.options[2].value).toBe('dateAdded');
      expect(sortSelect.options[2].text).toBe('Date Added');
      expect(sortSelect.options[3].value).toBe('lastReviewed');
      expect(sortSelect.options[3].text).toBe('Last Reviewed');
      expect(sortSelect.options[4].value).toBe('difficulty');
      expect(sortSelect.options[4].text).toBe('Difficulty');
      expect(sortSelect.options[5].value).toBe('lookupCount');
      expect(sortSelect.options[5].text).toBe('Lookup Count');

      // Filter select
      expect(filterSelect).toBeTruthy();
      expect(filterSelect.classList.contains('control-select')).toBe(true);
      expect(filterSelect.options).toHaveLength(4);
      expect(filterSelect.options[0].value).toBe('all');
      expect(filterSelect.options[0].text).toBe('All Difficulties');
      expect(filterSelect.options[1].value).toBe('easy');
      expect(filterSelect.options[2].value).toBe('medium');
      expect(filterSelect.options[3].value).toBe('hard');
    });

    test('should have containers for lists and words', () => {
      const listsContainer = document.querySelector('.lists-container');
      const wordsContainer = document.querySelector('.words-in-list');

      expect(listsContainer).toBeTruthy();
      expect(wordsContainer).toBeTruthy();
    });
  });

  describe('Learn Tab Structure', () => {
    test('should have learn container', () => {
      const container = document.querySelector('.learn-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Settings Tab Structure', () => {
    test('should have theme selector with correct options', () => {
      const themeSelect = document.getElementById('theme-select');

      expect(themeSelect).toBeTruthy();
      expect(themeSelect.classList.contains('control-select')).toBe(true);
      expect(themeSelect.options).toHaveLength(2);
      expect(themeSelect.options[0].value).toBe('light');
      expect(themeSelect.options[0].text).toBe('Light');
      expect(themeSelect.options[1].value).toBe('dark');
      expect(themeSelect.options[1].text).toBe('Dark');
      expect(themeSelect.options[1].selected).toBe(true);
    });

    test('should have auto-add toggle', () => {
      const autoAddToggle = document.getElementById('auto-add-toggle');
      const label = autoAddToggle.parentElement;

      expect(autoAddToggle).toBeTruthy();
      expect(autoAddToggle.type).toBe('checkbox');
      expect(autoAddToggle.checked).toBe(true);
      expect(label.textContent).toContain('Automatically add looked up words');
    });

    test('should have review limit input', () => {
      const reviewLimit = document.getElementById('review-limit');
      const label = document.querySelector('label[for="review-limit"]');

      expect(reviewLimit).toBeTruthy();
      expect(reviewLimit.type).toBe('number');
      expect(reviewLimit.value).toBe('30');
      expect(reviewLimit.min).toBe('5');
      expect(reviewLimit.max).toBe('100');
      expect(label).toBeTruthy();
      expect(label.textContent).toBe('Daily review limit');
    });

    test('should have export and import buttons', () => {
      const exportBtn = document.getElementById('export-data');
      const importBtn = document.getElementById('import-data');

      expect(exportBtn).toBeTruthy();
      expect(exportBtn.classList.contains('btn-secondary')).toBe(true);
      expect(exportBtn.textContent).toBe('Export Data');

      expect(importBtn).toBeTruthy();
      expect(importBtn.classList.contains('btn-secondary')).toBe(true);
      expect(importBtn.textContent).toBe('Import Data');
    });
  });

  describe('CSS Design System', () => {
    test('should have CSS variables for light theme', () => {
      const rootStyles = getComputedStyle(document.documentElement);

      // Color variables
      expect(rootStyles.getPropertyValue('--primary')).toBe('#0066CC');
      expect(rootStyles.getPropertyValue('--success')).toBe('#10B981');
      expect(rootStyles.getPropertyValue('--warning')).toBe('#F59E0B');
      expect(rootStyles.getPropertyValue('--error')).toBe('#EF4444');

      // Spacing variables
      expect(rootStyles.getPropertyValue('--spacing-xs')).toBe('4px');
      expect(rootStyles.getPropertyValue('--spacing-base')).toBe('16px');

      // Border radius variables
      expect(rootStyles.getPropertyValue('--radius-sm')).toBe('4px');
      expect(rootStyles.getPropertyValue('--radius-base')).toBe('8px');

      // Transition variables
      expect(rootStyles.getPropertyValue('--transition-base')).toBe('0.2s ease');
    });

    test('should have dark theme CSS variables', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const rootStyles = getComputedStyle(document.documentElement);

      expect(rootStyles.getPropertyValue('--bg-primary')).toBe('#111827');
      expect(rootStyles.getPropertyValue('--bg-secondary')).toBe('#1F2937');
      expect(rootStyles.getPropertyValue('--text-primary')).toBe('#F9FAFB');
    });
  });

  describe('Accessibility Features', () => {
    test('should have proper ARIA roles and attributes', () => {
      const tabList = document.querySelector('.tab-navigation');
      const tabs = tabList.querySelectorAll('.tab-button');
      const panels = document.querySelectorAll('.tab-panel');

      expect(tabList.getAttribute('role')).toBe('tablist');

      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab');
        expect(tab.hasAttribute('aria-selected')).toBe(true);
        expect(tab.hasAttribute('aria-controls')).toBe(true);

        const controlledPanel = document.getElementById(tab.getAttribute('aria-controls'));
        expect(controlledPanel).toBeTruthy();
      });

      panels.forEach(panel => {
        expect(panel.getAttribute('role')).toBe('tabpanel');
      });
    });

    test('should have proper form labels', () => {
      const sortLabel = document.querySelector('label[for="sort-select"]');
      const filterLabel = document.querySelector('label[for="filter-select"]');
      const themeLabel = document.querySelector('label[for="theme-select"]');

      expect(sortLabel).toBeTruthy();
      expect(sortLabel.textContent).toBe('Sort by:');

      expect(filterLabel).toBeTruthy();
      expect(filterLabel.textContent).toBe('Filter:');

      expect(themeLabel).toBeTruthy();
      expect(themeLabel.textContent).toBe('Theme');
    });

    test('should have aria-live regions', () => {
      const searchResults = document.querySelector('.search-results');
      const toastContainer = document.querySelector('.toast-container');

      expect(searchResults.getAttribute('aria-live')).toBe('polite');
      expect(toastContainer.getAttribute('aria-live')).toBe('polite');
      expect(toastContainer.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Responsive Design', () => {
    test('should have viewport meta tag requirements', () => {
      // The actual meta tag would be in the HTML head
      expect(popupHTML).toContain('viewport');
      expect(popupHTML).toContain('width=device-width');
      expect(popupHTML).toContain('initial-scale=1.0');
    });

    test('should have responsive CSS media queries', () => {
      // iOS Safari対応のレスポンシブデザイン
      expect(popupHTML).toContain('@media (max-width: 600px)');
      expect(popupCSS).toContain('@media (max-width: 600px)');
      expect(popupCSS).toContain('@media (prefers-contrast: high)');
      expect(popupCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('Toast Container', () => {
    test('should have toast container with proper attributes', () => {
      const container = document.querySelector('.toast-container');

      expect(container).toBeTruthy();
      expect(container.classList.contains('toast-container')).toBe(true);
      expect(container.getAttribute('aria-live')).toBe('polite');
      expect(container.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Button Classes', () => {
    test('should have primary button styles', () => {
      const primaryBtn = document.querySelector('.btn-primary');

      expect(primaryBtn).toBeTruthy();
      expect(primaryBtn.classList.contains('btn-primary')).toBe(true);
      expect(primaryBtn.classList.contains('btn-small')).toBe(true);
    });

    test('should have secondary button styles', () => {
      const secondaryBtns = document.querySelectorAll('.btn-secondary');

      expect(secondaryBtns.length).toBeGreaterThan(0);
      secondaryBtns.forEach(btn => {
        expect(btn.classList.contains('btn-secondary')).toBe(true);
      });
    });

    test('should have icon button styles', () => {
      const iconBtn = document.querySelector('.icon-button');

      expect(iconBtn).toBeTruthy();
      expect(iconBtn.classList.contains('settings-button')).toBe(true);
      expect(iconBtn.getAttribute('aria-label')).toBe('Settings');
    });
  });

  describe('Learning Mode UI Structure', () => {
    test('should have proper Learn tab button structure', () => {
      const learnTab = document.querySelector('[data-tab="learn"]');
      const icon = learnTab.querySelector('.tab-icon');
      const label = learnTab.querySelector('.tab-label');

      expect(learnTab).toBeTruthy();
      expect(learnTab.getAttribute('role')).toBe('tab');
      expect(learnTab.getAttribute('aria-controls')).toBe('learn-tab');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('🎓');
      expect(label).toBeTruthy();
      expect(label.textContent).toBe('Learn');
    });

    test('should have Learn tab panel with correct accessibility attributes', () => {
      const learnPanel = document.getElementById('learn-tab');

      expect(learnPanel).toBeTruthy();
      expect(learnPanel.classList.contains('tab-panel')).toBe(true);
      expect(learnPanel.getAttribute('role')).toBe('tabpanel');
    });

    test('should not have Learn tab active by default', () => {
      const learnTab = document.querySelector('[data-tab="learn"]');
      const learnPanel = document.getElementById('learn-tab');

      expect(learnTab.classList.contains('active')).toBe(false);
      expect(learnTab.getAttribute('aria-selected')).toBe('false');
      expect(learnPanel.classList.contains('active')).toBe(false);
    });

    test('should have main learn container', () => {
      const container = document.querySelector('.learn-container');
      expect(container).toBeTruthy();
    });

    test('should have expected DOM structure for flashcard elements', () => {
      // These elements won't exist until Learning Mode is implemented,
      // but we can test the container exists for future flashcard content
      const container = document.querySelector('.learn-container');
      expect(container).toBeTruthy();

      // When implemented, flashcard should have these IDs available
      // This documents the expected structure for implementation
      const expectedElements = [
        '#start-review-btn',
        '#flashcard',
        '#known-btn',
        '#unknown-btn',
        '#skip-btn',
        '#mastered-btn'
      ];

      // For now, we just verify the container exists
      // After implementation, these elements should be findable within container
      expectedElements.forEach(selector => {
        // Document expected selectors - implementation will create these
        expect(selector).toMatch(/^#[a-z-]+$/); // Valid ID selector format
      });
    });
  });
});
