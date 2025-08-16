// Content script for VocabDict Safari Extension

console.log('VocabDict content script loaded');

// iOS text selection handler
let lookupButton = null;
let selectionTimeout = null;

// Track if event listener is already added to prevent duplicates
if (!window.__vocabDictListenerAdded) {
  window.__vocabDictListenerAdded = true;

  // Debounced selection handler
  document.addEventListener('selectionchange', () => {
    clearTimeout(selectionTimeout);

    selectionTimeout = setTimeout(() => {
      handleSelection();
    }, 300);
  });
}

function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Clean up existing button
  if (lookupButton) {
    lookupButton.remove();
    lookupButton = null;
  }

  // Validate selection
  if (selectedText &&
      selectedText.length <= 50 &&
      selectedText.split(/\s+/).length <= 3) {
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Only show button if selection is visible
      if (rect.width > 0 && rect.height > 0) {
        createLookupButton(selectedText, rect);
      }
    } catch (e) {
      console.error('VocabDict: Error handling selection', e);
    }
  }
}

function createLookupButton(selectedText, rect) {
  // Create lookup button
  const button = document.createElement('button');
  button.className = 'vocabdict-lookup-button';
  button.textContent = '🔍';
  button.setAttribute('aria-label', `Look up "${selectedText}"`);

  // Position button near selection
  const buttonSize = 44; // minimum touch target size
  const padding = 8;

  // Calculate position - try to place above selection, but adjust if near screen edge
  let top = rect.top - buttonSize - padding;
  let left = rect.left + (rect.width / 2) - (buttonSize / 2);

  // Adjust if button would be off-screen
  if (top < padding) {
    top = rect.bottom + padding; // Place below instead
  }
  if (left < padding) {
    left = padding;
  }
  if (left + buttonSize > window.innerWidth - padding) {
    left = window.innerWidth - buttonSize - padding;
  }

  // Account for scroll position
  top += window.scrollY;
  left += window.scrollX;

  button.style.top = `${top}px`;
  button.style.left = `${left}px`;

  // Add click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove button
    button.remove();
    lookupButton = null;

    // Get user's text selection mode preference
    try {
      const settingsResponse = await browser.runtime.sendMessage({
        type: 'get_settings'
      });

      const textSelectionMode = settingsResponse.success && settingsResponse.data
        ? settingsResponse.data.textSelectionMode || 'inline'
        : 'inline';

      if (textSelectionMode === 'popup') {
        // Open popup with the selected word
        await browser.runtime.sendMessage({
          type: 'open_popup_with_word',
          word: selectedText
        });
      } else {
        // Default inline behavior - show overlay
        await showWordLookupOverlay(selectedText, rect);
      }
    } catch (error) {
      console.error('VocabDict: Error getting settings, falling back to inline mode', error);
      // Fallback to inline mode if settings can't be retrieved
      await showWordLookupOverlay(selectedText, rect);
    }
  });

  // Add button to page
  document.body.appendChild(button);
  lookupButton = button;
}

async function showWordLookupOverlay(word, rect) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'vocabdict-overlay loading';

  // Position overlay
  let top = rect.top - 200; // Try to place above selection
  let left = rect.left + (rect.width / 2) - 140; // Center horizontally

  // Adjust if overlay would be off-screen
  if (top < 20) {
    top = rect.bottom + 20; // Place below instead
  }
  if (left < 20) {
    left = 20;
  }
  if (left + 280 > window.innerWidth - 20) {
    left = window.innerWidth - 300;
  }

  // Account for scroll position
  top += window.scrollY;
  left += window.scrollX;

  overlay.style.top = `${top}px`;
  overlay.style.left = `${left}px`;

  // Show loading state
  overlay.innerHTML = `
    <div class="vocabdict-overlay-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">Looking up "${word}"...</div>
    </div>
  `;

  document.body.appendChild(overlay);

  try {
    // Look up word using background script
    const response = await browser.runtime.sendMessage({
      type: 'lookup_word',
      word
    });

    if (response.success) {
      if (response.data) {
        // Show word definition
        displayWordDefinition(overlay, response.data);
      } else if (response.suggestions && response.suggestions.length > 0) {
        // Show suggestions for misspelled word
        displaySuggestions(overlay, word, response.suggestions);
      } else {
        // No results found
        displayError(overlay, `No definition found for "${word}"`);
      }
    } else {
      displayError(overlay, response.error || 'Failed to look up word');
    }
  } catch (error) {
    console.error('VocabDict: Error looking up word', error);
    displayError(overlay, 'Failed to look up word');
  }

  // Set up overlay event handlers
  setupOverlayEventHandlers(overlay);
}

function displayWordDefinition(overlay, wordData) {
  overlay.className = 'vocabdict-overlay';

  const definitions = Array.isArray(wordData.definitions)
    ? wordData.definitions
    : [{ partOfSpeech: '', meaning: wordData.definition }];

  const definitionsHTML = definitions.map(def => `
    <div class="definition-item">
      ${def.partOfSpeech ? `<div class="part-of-speech">${def.partOfSpeech}</div>` : ''}
      <div class="definition-text">${def.meaning || def.definition}</div>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="vocabdict-overlay-content">
      <div class="word-title">${wordData.word}</div>
      ${wordData.pronunciation ? `<div class="word-pronunciation">${wordData.pronunciation}</div>` : ''}
      <div class="word-definitions">
        ${definitionsHTML}
      </div>
    </div>
    <div class="overlay-actions">
      <button class="add-to-list-button">Add to List</button>
      <button class="close-button">×</button>
    </div>
  `;

  // Set up add to list functionality
  const addButton = overlay.querySelector('.add-to-list-button');
  addButton.addEventListener('click', async () => {
    await addWordToList(wordData.word);
  });
}

function displaySuggestions(overlay, originalWord, suggestions) {
  overlay.className = 'vocabdict-overlay';

  const suggestionsHTML = suggestions.map(suggestion => `
    <span class="suggestion-item" data-word="${suggestion}">${suggestion}</span>
  `).join('');

  overlay.innerHTML = `
    <div class="vocabdict-overlay-content">
      <div class="error-message">No definition found for "${originalWord}"</div>
      <div class="suggestions">
        <div class="suggestions-title">Did you mean?</div>
        ${suggestionsHTML}
      </div>
    </div>
    <div class="overlay-actions">
      <button class="close-button">Close</button>
    </div>
  `;

  // Handle suggestion clicks
  overlay.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', async () => {
      const suggestedWord = item.getAttribute('data-word');
      overlay.remove();

      // Look up the suggested word
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      await showWordLookupOverlay(suggestedWord, rect);
    });
  });
}

function displayError(overlay, errorMessage) {
  overlay.className = 'vocabdict-overlay';
  overlay.innerHTML = `
    <div class="vocabdict-overlay-content">
      <div class="error-message">${errorMessage}</div>
    </div>
    <div class="overlay-actions">
      <button class="close-button">Close</button>
    </div>
  `;
}

async function addWordToList(word) {
  try {
    // Get available lists
    const listsResponse = await browser.runtime.sendMessage({
      type: 'get_lists'
    });

    if (listsResponse.success && listsResponse.data.length > 0) {
      // Use the first available list (default list)
      const listId = listsResponse.data[0].id;

      const addResponse = await browser.runtime.sendMessage({
        type: 'add_to_list',
        word,
        listId,
        metadata: {
          difficulty: 'medium',
          context: 'Added from webpage'
        }
      });

      if (addResponse.success) {
        // Show success feedback
        showNotification(`Added "${word}" to vocabulary list`);
      } else {
        showNotification(`Failed to add "${word}": ${addResponse.error}`);
      }
    } else {
      showNotification('No vocabulary lists available');
    }
  } catch (error) {
    console.error('VocabDict: Error adding word to list', error);
    showNotification('Failed to add word to list');
  }
}

function showNotification(message) {
  // Simple notification - could be enhanced
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #34C759;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function setupOverlayEventHandlers(overlay) {
  // Close button handler
  const closeButton = overlay.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeOverlay(overlay);
    });
  }

  // Click outside to close
  const handleClickOutside = (e) => {
    if (!overlay.contains(e.target)) {
      closeOverlay(overlay);
      document.removeEventListener('click', handleClickOutside);
    }
  };

  // Add listener immediately since button click already has stopPropagation()
  document.addEventListener('click', handleClickOutside);

  // Escape key to close
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeOverlay(overlay);
      document.removeEventListener('keydown', handleEscape);
    }
  };

  document.addEventListener('keydown', handleEscape);
}

function closeOverlay(overlay) {
  overlay.classList.add('closing');

  setTimeout(() => {
    overlay.remove();

    // Clear text selection
    const selection = window.getSelection();
    selection.removeAllRanges();
  }, 150); // Match CSS animation duration
}

// Clean up on page unload
window.addEventListener('pagehide', () => {
  if (lookupButton) {
    lookupButton.remove();
  }
});
