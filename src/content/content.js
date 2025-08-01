// Content script for VocabDict Safari Extension

console.log('VocabDict content script loaded');

// iOS text selection handler
let lookupButton = null;
let selectionTimeout = null;

// Debounced selection handler
document.addEventListener('selectionchange', () => {
  clearTimeout(selectionTimeout);

  selectionTimeout = setTimeout(() => {
    handleSelection();
  }, 300);
});

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

function createLookupButton(selectedText, _rect) {
  // TODO: Implement lookup button creation
  console.log('Would create lookup button for:', selectedText);
}

// Clean up on page unload
window.addEventListener('pagehide', () => {
  if (lookupButton) {
    lookupButton.remove();
  }
});
