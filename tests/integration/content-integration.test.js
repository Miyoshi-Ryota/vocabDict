/**
 * @jest-environment jsdom
 */

const { waitFor, waitForElement } = require('../helpers/wait-helpers');
const VocabularyList = require('../../src/services/vocabulary-list');
const DictionaryService = require('../../src/services/dictionary-service');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Content Script User Flow Integration Tests', () => {
  beforeEach(async () => {
    // Set up realistic webpage content
    document.body.innerHTML = `
      <article>
        <h1>Learning New Vocabulary</h1>
        <p>This article contains various words like <span>serendipity</span> and other terms.</p>
        <p>Reading helps improve <span>vocabulary</span> and language skills significantly.</p>
        <div class="content">
          <p>The word <strong>ephemeral</strong> means lasting for a very short time.</p>
        </div>
      </article>
    `;

    // Mock native message response for vocabulary lists
    const dictionary = new DictionaryService(dictionaryData);
    const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
    browser.runtime.sendNativeMessage.mockImplementation((message) => {
      if (message.action === 'fetchAllVocabularyLists') {
        const j = defaultList.toJSON();
        const { created, ...rest } = j;
        return Promise.resolve({ success: true, vocabularyLists: [{ ...rest, createdAt: created }] });
      }
      if (message.action === 'addWordToVocabularyList') {
        return Promise.resolve({ 
          success: true,
          data: {
            word: message.word,
            dateAdded: new Date().toISOString()
          }
        });
      }
      return Promise.resolve({ success: true });
    });

    // Mock runtime sendMessage for UI→background actions
    browser.runtime.sendMessage.mockImplementation((message) => {
      if (message.action === 'lookupWord') {
        const result = dictionary.getDictionaryData(message.word);
        return Promise.resolve(result ? { success: true, data: result } : { success: false, error: 'Word not found' });
      }
      if (message.action === 'fetchAllVocabularyLists') {
        const j = defaultList.toJSON();
        const { created, ...rest } = j;
        return Promise.resolve({ success: true, vocabularyLists: [{ ...rest, createdAt: created }] });
      }
      if (message.action === 'addWordToVocabularyList') {
        return browser.runtime.sendNativeMessage({
          action: 'addWordToVocabularyList',
          listId: message.listId,
          word: message.word,
          metadata: message.metadata || {}
        }).then(response => (response.error ? { success: false, error: response.error } : { success: true, data: response.data }));
      }
      if (message.action === 'fetchRecentSearches') {
        return Promise.resolve({ success: true, data: [] });
      }
      if (message.action === 'fetchSettings') {
        return Promise.resolve({ success: true, data: { textSelectionMode: 'inline' } });
      }
      if (message.action === 'openPopupWithWord') {
        return Promise.resolve({ success: true, data: { popupOpened: true } });
      }
      return Promise.resolve({ success: true });
    });

    // Load the content script
    require('../../src/content/content.js');
  });

  afterEach(() => {
    // Clean up any lookup buttons or overlays first
    document.querySelectorAll('.vocabdict-lookup-button, .vocabdict-overlay').forEach(el => el.remove());

    // Then clear the entire body
    document.body.innerHTML = '';

    // Clear any selections
    window.getSelection().removeAllRanges();
  });

  describe('User selects text and looks up word', () => {
    test('should show lookup button when user selects a word', async () => {
      // User selects the word "serendipity"
      const span = document.querySelector('span');
      const textNode = span.firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);

      // Mock getBoundingClientRect for realistic positioning
      range.getBoundingClientRect = () => ({
        width: 80,
        height: 20,
        top: 100,
        left: 200,
        right: 280,
        bottom: 120
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // User triggers selection change
      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);
      if (window.__vocabdictTest && window.__vocabdictTest.invokeSelection) {
        window.__vocabdictTest.invokeSelection('vocabulary', range.getBoundingClientRect());
      }

      // Wait for lookup button to appear
      const lookupButton = await waitForElement('.vocabdict-lookup-button');

      expect(lookupButton).toBeTruthy();
      expect(selection.toString().trim()).toBe('serendipity');
    });

    test('should trigger word lookup when user clicks lookup button', async () => {
      // User selects "vocabulary"
      const spans = document.querySelectorAll('span');
      const vocabSpan = Array.from(spans).find(span => span.textContent === 'vocabulary');
      const textNode = vocabSpan.firstChild;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 90,
        height: 20,
        top: 150,
        left: 100,
        right: 190,
        bottom: 170
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);
      if (window.__vocabdictTest && window.__vocabdictTest.invokeSelection) {
        window.__vocabdictTest.invokeSelection('ephemeral', range.getBoundingClientRect());
      }

      // Wait for lookup button to appear
      const lookupButton = await waitForElement('.vocabdict-lookup-button');

      // User clicks the lookup button
      lookupButton.click();

      // Wait for search results overlay to appear
      const overlay = await waitForElement('.vocabdict-overlay');

      expect(overlay).toBeTruthy();
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'lookupWord',
          word: 'vocabulary'
        })
      );
    });

    test('should display word definition in overlay after successful lookup', async () => {
      // User selects "hello"
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>hello</span>';
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 50,
        height: 20,
        top: 200,
        left: 150,
        right: 200,
        bottom: 220
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // Wait for lookup button and click it
      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      // Wait for overlay with word definition
      const overlay = await waitForElement('.vocabdict-overlay');

      // Wait for word title to appear in overlay
      const wordTitle = await waitForElement('.word-title', overlay);

      // Wait for content to load
      await waitFor(() => wordTitle.textContent === 'hello');
      expect(wordTitle.textContent).toBe('hello');

      // Check that pronunciation is displayed
      const pronunciation = await waitForElement('.word-pronunciation', overlay);
      expect(pronunciation.textContent).toContain('/həˈloʊ/');

      // Check that definition is displayed
      const definition = await waitForElement('.definition-text', overlay);
      expect(definition.textContent).toContain('挨拶');
    });

    test('should show "Add to List" button and allow adding word to vocabulary', async () => {
      // User selects "ephemeral"
      const strong = document.querySelector('strong');
      const textNode = strong.firstChild;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 70,
        height: 20,
        top: 250,
        left: 180,
        right: 250,
        bottom: 270
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // User clicks lookup button
      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      // Wait for overlay with word info
      const overlay = await waitForElement('.vocabdict-overlay');

      // User clicks "Add to List" button
      const addButton = await waitForElement('.add-to-list-button', overlay);
      addButton.click();

      // Wait for the add to list flow to complete
      await waitFor(() => {
        const calls = browser.runtime.sendMessage.mock.calls;
        return calls.some(call => call[0].action === 'addWordToVocabularyList');
      });

      // Verify that add to list message was sent
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'addWordToVocabularyList',
          word: 'ephemeral'
        })
      );
    });
  });

  describe('User selects invalid text', () => {
    test('should not show lookup button for empty selection', async () => {
      // User clears selection
      const selection = window.getSelection();
      selection.removeAllRanges();

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // Poll for a lookup button that shouldn't appear
      await expect(
        waitFor(() => document.querySelector('.vocabdict-lookup-button'), 500)
      ).rejects.toThrow(/Timeout/);

      const lookupButton = document.querySelector('.vocabdict-lookup-button');
      expect(lookupButton).toBeNull();
    });

    test('should not show lookup button for long text selection', async () => {
      // Add very long text
      const testDiv = document.createElement('div');
      const longText = 'a'.repeat(51);
      testDiv.innerHTML = `<span>${longText}</span>`;
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 400,
        height: 20,
        top: 300,
        left: 100,
        right: 500,
        bottom: 320
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);
      // Poll for a lookup button that shouldn't appear
      await expect(
        waitFor(() => document.querySelector('.vocabdict-lookup-button'), 500)
      ).rejects.toThrow(/Timeout/);

      const lookupButton = document.querySelector('.vocabdict-lookup-button');
      expect(lookupButton).toBeNull();
    });

    test('should not show lookup button for more than 3 words', async () => {
      // Add text with 4 words
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>one two three four</span>';
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 150,
        height: 20,
        top: 350,
        left: 100,
        right: 250,
        bottom: 370
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);
      // Poll for a lookup button that shouldn't appear
      await expect(
        waitFor(() => document.querySelector('.vocabdict-lookup-button'), 500)
      ).rejects.toThrow(/Timeout/);

      const lookupButton = document.querySelector('.vocabdict-lookup-button');
      expect(lookupButton).toBeNull();
    });
  });

  describe('User interaction with overlay', () => {
    test('should close overlay when user clicks outside', async () => {
      // User selects word and opens overlay
      const span = document.querySelector('span');
      const textNode = span.firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 80,
        height: 20,
        top: 100,
        left: 200,
        right: 280,
        bottom: 120
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      const overlay = await waitForElement('.vocabdict-overlay');

      // Wait for overlay content to load
      await waitForElement('.word-title', overlay);
      expect(overlay).toBeTruthy();

      // User clicks outside the overlay (no delay needed since stopPropagation prevents immediate closure)
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 50,
        clientY: 50
      });
      document.body.dispatchEvent(clickEvent);

      // Wait for overlay to disappear
      await waitFor(() => {
        return !document.querySelector('.vocabdict-overlay');
      });

      expect(document.querySelector('.vocabdict-overlay')).toBeNull();
    });

    test('should clear selection when overlay closes', async () => {
      // User selects word, opens overlay, then closes it
      const span = document.querySelector('span');
      const textNode = span.firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 80,
        height: 20,
        top: 100,
        left: 200,
        right: 280,
        bottom: 120
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      const overlay = await waitForElement('.vocabdict-overlay');

      // Wait for overlay content to load
      await waitForElement('.word-title', overlay);

      // User presses Escape to close overlay
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(escapeEvent);

      // Wait for overlay to close and selection to clear
      await waitFor(() => {
        return !document.querySelector('.vocabdict-overlay') &&
               window.getSelection().toString() === '';
      });

      expect(document.querySelector('.vocabdict-overlay')).toBeNull();
      expect(window.getSelection().toString()).toBe('');
    });
  });

  describe('Text selection mode settings', () => {
    test('should open popup window with selected word when user clicks lookup button in popup mode', async () => {
      // Mock get_settings to return popup mode
      const originalSendMessage = browser.runtime.sendMessage;
      browser.runtime.sendMessage = jest.fn((message) => {
        if (message.action === 'fetchSettings') {
          return Promise.resolve({ success: true, settings: { textSelectionMode: 'popup' } });
        }
        if (message.action === 'openPopupWithWord') {
          browser.action.openPopup.mockResolvedValue();
          // Simulate background actually opening the popup
          browser.action.openPopup();
          return Promise.resolve({ success: true, data: { popupOpened: true } });
        }
        return originalSendMessage(message);
      });

      // User selects "hello"
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>hello</span>';
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 50,
        height: 20,
        top: 200,
        left: 150,
        right: 200,
        bottom: 220
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // Wait for lookup button to appear and click it
      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      // Wait for popup to open via background action
      await waitFor(() => browser.action.openPopup.mock.calls.length > 0);

      // Verify message to open popup with selected word
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'openPopupWithWord',
          word: 'hello'
        })
      );

      // Verify no inline overlay was created
      const overlay = document.querySelector('.vocabdict-overlay');
      expect(overlay).toBeNull();
    });

    test('should show inline overlay with selected word definition when user clicks lookup button in inline mode', async () => {
      // Set text selection mode to inline
      await browser.runtime.sendMessage({
        action: 'updateSettings',
        settings: { textSelectionMode: 'inline' }
      });

      // User selects "hello"
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>hello</span>';
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 50,
        height: 20,
        top: 200,
        left: 150,
        right: 200,
        bottom: 220
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // Wait for lookup button to appear
      const lookupButton = await waitForElement('.vocabdict-lookup-button');

      // User clicks the lookup button
      lookupButton.click();

      // Wait for search results overlay to appear
      const overlay = await waitForElement('.vocabdict-overlay');

      // Verify that inline overlay is displayed with the selected word's definition
      expect(overlay).toBeTruthy();

      // Wait for the word definition to be displayed in overlay
      const wordTitle = await waitForElement('.word-title', overlay);
      await waitFor(() => wordTitle.textContent === 'hello');
      expect(wordTitle.textContent).toBe('hello');

      // Check that pronunciation is displayed in overlay
      const pronunciation = await waitForElement('.word-pronunciation', overlay);
      expect(pronunciation.textContent).toContain('/həˈloʊ/');

      // Check that definition is displayed in overlay
      const definition = await waitForElement('.definition-text', overlay);
      expect(definition.textContent).toContain('挨拶');

      // Verify that no popup window opened
      const popupElement = document.querySelector('.popup-container');
      expect(popupElement).toBeNull();
    });

    test('should default to inline mode and show word definition when no setting is configured', async () => {
      // Don't set any text selection mode (should default to inline)

      // User selects "hello"
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>hello</span>';
      document.body.appendChild(testDiv);

      const textNode = testDiv.querySelector('span').firstChild;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      range.getBoundingClientRect = () => ({
        width: 50,
        height: 20,
        top: 200,
        left: 150,
        right: 200,
        bottom: 220
      });

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const selectionEvent = new Event('selectionchange');
      document.dispatchEvent(selectionEvent);

      // Wait for lookup button and click it
      const lookupButton = await waitForElement('.vocabdict-lookup-button');
      lookupButton.click();

      // Wait for overlay to appear (default inline behavior)
      const overlay = await waitForElement('.vocabdict-overlay');

      // Verify that inline overlay is displayed with word definition (default behavior)
      expect(overlay).toBeTruthy();

      // Wait for the word definition to be displayed in overlay
      const wordTitle = await waitForElement('.word-title', overlay);
      await waitFor(() => wordTitle.textContent === 'hello');
      expect(wordTitle.textContent).toBe('hello');

      // Check that pronunciation is displayed in overlay
      const pronunciation = await waitForElement('.word-pronunciation', overlay);
      expect(pronunciation.textContent).toContain('/həˈloʊ/');

      // Check that definition is displayed in overlay
      const definition = await waitForElement('.definition-text', overlay);
      expect(definition.textContent).toContain('挨拶');

      // Verify that no popup window opened
      const popupElement = document.querySelector('.popup-container');
      expect(popupElement).toBeNull();
    });
  });
});
