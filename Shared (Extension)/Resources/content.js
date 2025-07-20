// VocabDict Content Script
// Handles text selection, context menu, and floating widget display

(function() {
    'use strict';
    
    // State management
    let selectedText = '';
    let selectionPosition = null;
    let floatingWidget = null;
    let isVocabDictWidget = false;
    
    // Configuration
    const WIDGET_ID = 'vocabdict-floating-widget';
    const MIN_WORD_LENGTH = 2;
    const MAX_WORD_LENGTH = 50;
    
    // Initialize content script
    function initialize() {
        console.log('VocabDict: Content script initialized');
        
        // Listen for text selection events
        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('keyup', handleKeyboardSelection);
        
        // Listen for clicks to hide widget
        document.addEventListener('click', handleDocumentClick);
        
        // Listen for messages from background script
        browser.runtime.onMessage.addListener(handleMessage);
        
        // Prevent widget from interfering with page
        preventWidgetEventBubbling();
    }
    
    // Handle text selection with mouse
    function handleTextSelection(event) {
        // Don't process clicks on our own widget
        if (isVocabDictWidget) {
            return;
        }
        
        setTimeout(() => {
            const selection = window.getSelection();
            processSelection(selection, { x: event.clientX, y: event.clientY });
        }, 10); // Small delay to ensure selection is finalized
    }
    
    // Handle text selection with keyboard
    function handleKeyboardSelection(event) {
        // Only process certain keys that might change selection
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'].includes(event.key)) {
            setTimeout(() => {
                const selection = window.getSelection();
                const rect = selection.rangeCount > 0 ? selection.getRangeAt(0).getBoundingClientRect() : null;
                const position = rect ? { x: rect.left + rect.width / 2, y: rect.top } : null;
                processSelection(selection, position);
            }, 10);
        }
    }
    
    // Process text selection
    function processSelection(selection, position) {
        if (!selection || selection.isCollapsed) {
            hideFloatingWidget();
            selectedText = '';
            selectionPosition = null;
            return;
        }
        
        const text = selection.toString().trim();
        
        // Validate selection
        if (!isValidWordSelection(text)) {
            hideFloatingWidget();
            return;
        }
        
        selectedText = text;
        selectionPosition = position;
        
        // Don't show widget immediately - wait for context menu or explicit lookup
        console.log('VocabDict: Text selected:', selectedText);
    }
    
    // Validate if selection is a valid word for lookup
    function isValidWordSelection(text) {
        if (!text || text.length < MIN_WORD_LENGTH || text.length > MAX_WORD_LENGTH) {
            return false;
        }
        
        // Check if it's mostly alphabetic (allow some punctuation)
        const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
        if (alphaRatio < 0.7) {
            return false;
        }
        
        // Don't lookup common punctuation or numbers only
        if (/^[\d\s\.,;:!?\-'"()]+$/.test(text)) {
            return false;
        }
        
        return true;
    }
    
    // Handle document clicks
    function handleDocumentClick(event) {
        // Hide widget if clicking outside of it
        if (floatingWidget && !floatingWidget.contains(event.target)) {
            hideFloatingWidget();
        }
    }
    
    // Handle messages from background script
    function handleMessage(request, sender, sendResponse) {
        const { type, payload } = request;
        
        switch (type) {
            case 'show_floating_widget':
                if (payload.word) {
                    showFloatingWidgetForWord(payload.word, payload.position);
                }
                break;
                
            case 'hide_floating_widget':
                hideFloatingWidget();
                break;
                
            case 'selection_lookup':
                // Triggered by keyboard shortcut
                if (selectedText) {
                    lookupSelectedText();
                }
                break;
                
            default:
                console.log('VocabDict: Unknown message type:', type);
        }
        
        return true; // Indicate async response
    }
    
    // Show floating widget for a specific word
    function showFloatingWidgetForWord(word, position) {
        console.log('VocabDict: Showing widget for word:', word);
        
        // Use provided position or selection position
        const widgetPosition = position || selectionPosition || { x: 100, y: 100 };
        
        // Look up the word
        lookupWord(word, widgetPosition);
    }
    
    // Lookup selected text
    function lookupSelectedText() {
        if (!selectedText || !selectionPosition) {
            console.log('VocabDict: No text selected for lookup');
            return;
        }
        
        lookupWord(selectedText, selectionPosition);
    }
    
    // Lookup word and show widget
    async function lookupWord(word, position) {
        try {
            // Show loading widget first
            showLoadingWidget(position);
            
            // Send lookup request to background script
            const response = await browser.runtime.sendMessage({
                type: 'lookup_word',
                payload: { word: word }
            });
            
            if (response.status === 'success') {
                showDefinitionWidget(response.data, position);
            } else {
                showErrorWidget(response.error || 'Lookup failed', position);
            }
            
        } catch (error) {
            console.error('VocabDict: Lookup error:', error);
            showErrorWidget('Unable to lookup word', position);
        }
    }
    
    // Show loading widget
    function showLoadingWidget(position) {
        hideFloatingWidget();
        
        floatingWidget = createWidget();
        floatingWidget.innerHTML = `
            <div class="vocabdict-widget-content">
                <div class="vocabdict-loading">
                    <div class="vocabdict-spinner"></div>
                    <span>Looking up...</span>
                </div>
            </div>
        `;
        
        positionWidget(floatingWidget, position);
        document.body.appendChild(floatingWidget);
    }
    
    // Show definition widget
    function showDefinitionWidget(definition, position) {
        hideFloatingWidget();
        
        floatingWidget = createWidget();
        floatingWidget.innerHTML = createDefinitionHTML(definition);
        
        positionWidget(floatingWidget, position);
        document.body.appendChild(floatingWidget);
        
        // Add event listeners for widget buttons
        addWidgetEventListeners(definition);
    }
    
    // Show error widget
    function showErrorWidget(error, position) {
        hideFloatingWidget();
        
        floatingWidget = createWidget();
        floatingWidget.innerHTML = `
            <div class="vocabdict-widget-content">
                <div class="vocabdict-error">
                    <span>❌ ${error}</span>
                </div>
            </div>
        `;
        
        positionWidget(floatingWidget, position);
        document.body.appendChild(floatingWidget);
    }
    
    // Create base widget element
    function createWidget() {
        const widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'vocabdict-floating-widget';
        return widget;
    }
    
    // Create definition HTML
    function createDefinitionHTML(definition) {
        const { word, pronunciations, definitions, synonyms, examples } = definition;
        
        let html = `
            <div class="vocabdict-widget-content">
                <div class="vocabdict-widget-header">
                    <h3 class="vocabdict-word">${escapeHtml(word)}</h3>
                    <button class="vocabdict-close-btn" title="Close">×</button>
                </div>
        `;
        
        // Pronunciations
        if (pronunciations && pronunciations.length > 0) {
            html += `<div class="vocabdict-pronunciations">`;
            pronunciations.forEach(p => {
                html += `<span class="vocabdict-pronunciation">${p.type}: ${escapeHtml(p.phonetic)}</span>`;
            });
            html += `</div>`;
        }
        
        // Definitions
        if (definitions && definitions.length > 0) {
            html += `<div class="vocabdict-definitions">`;
            definitions.slice(0, 2).forEach(def => { // Show max 2 definitions
                html += `
                    <div class="vocabdict-definition">
                        <span class="vocabdict-pos">${def.partOfSpeech}</span>
                        <span class="vocabdict-meaning">${escapeHtml(def.meaning)}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        // Action buttons
        html += `
            <div class="vocabdict-actions">
                <button class="vocabdict-add-btn" title="Add to vocabulary list">+ Add</button>
                <button class="vocabdict-more-btn" title="View full definition">More</button>
            </div>
        `;
        
        html += `</div>`;
        return html;
    }
    
    // Position widget near selection
    function positionWidget(widget, position) {
        const { x, y } = position;
        const margin = 10;
        
        // Initial positioning
        widget.style.position = 'fixed';
        widget.style.left = `${x}px`;
        widget.style.top = `${y + margin}px`;
        widget.style.zIndex = '10000';
        
        // Adjust if widget goes off screen
        setTimeout(() => {
            const rect = widget.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let newX = x;
            let newY = y + margin;
            
            // Adjust horizontal position
            if (rect.right > viewportWidth) {
                newX = viewportWidth - rect.width - margin;
            }
            if (newX < margin) {
                newX = margin;
            }
            
            // Adjust vertical position
            if (rect.bottom > viewportHeight) {
                newY = y - rect.height - margin; // Show above selection
            }
            if (newY < margin) {
                newY = margin;
            }
            
            widget.style.left = `${newX}px`;
            widget.style.top = `${newY}px`;
        }, 0);
    }
    
    // Add event listeners to widget buttons
    function addWidgetEventListeners(definition) {
        const closeBtn = floatingWidget.querySelector('.vocabdict-close-btn');
        const addBtn = floatingWidget.querySelector('.vocabdict-add-btn');
        const moreBtn = floatingWidget.querySelector('.vocabdict-more-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideFloatingWidget();
            });
        }
        
        if (addBtn) {
            addBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await addToVocabularyList(definition);
            });
        }
        
        if (moreBtn) {
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openFullDefinition(definition);
            });
        }
        
    }
    
    // Add word to vocabulary list
    async function addToVocabularyList(definition) {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'add_word_to_list',
                payload: {
                    wordData: {
                        word: definition.word,
                        definitions: definition.definitions
                    }
                }
            });
            
            if (response.status === 'success') {
                showAddSuccessMessage();
            } else {
                console.error('Failed to add word:', response.error);
            }
        } catch (error) {
            console.error('Error adding word:', error);
        }
    }
    
    // Show success message when word added
    function showAddSuccessMessage() {
        if (!floatingWidget) {
            return;
        }
        
        const addBtn = floatingWidget.querySelector('.vocabdict-add-btn');
        if (addBtn) {
            const originalText = addBtn.textContent;
            addBtn.textContent = '✓ Added';
            addBtn.disabled = true;
            addBtn.style.background = '#34C759';
            
            setTimeout(() => {
                if (addBtn && floatingWidget) {
                    addBtn.textContent = originalText;
                    addBtn.disabled = false;
                    addBtn.style.background = '';
                }
            }, 2000);
        }
    }
    
    // Open full definition in popup
    function openFullDefinition(definition) {
        browser.runtime.sendMessage({
            type: 'open_popup',
            payload: { word: definition.word }
        });
        hideFloatingWidget();
    }
    
    // Hide floating widget
    function hideFloatingWidget() {
        if (floatingWidget) {
            floatingWidget.remove();
            floatingWidget = null;
        }
    }
    
    // Prevent widget events from bubbling to page
    function preventWidgetEventBubbling() {
        document.addEventListener('click', (e) => {
            if (e.target.closest(`#${WIDGET_ID}`)) {
                isVocabDictWidget = true;
                setTimeout(() => { isVocabDictWidget = false; }, 0);
            }
        });
    }
    
    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Cleanup function to prevent memory leaks
    function cleanup() {
        // Remove all event listeners
        document.removeEventListener('mouseup', handleTextSelection);
        document.removeEventListener('touchend', handleTextSelection);
        document.removeEventListener('selectionchange', handleSelectionChange);
        
        // Remove floating widget if exists
        hideFloatingWidget();
        
        // Clear any pending timeouts
        if (selectionTimeout) {
            clearTimeout(selectionTimeout);
            selectionTimeout = null;
        }
    }
    
    // Listen for page navigation to cleanup
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Also cleanup when the extension context is invalidated
    if (browser.runtime?.id) {
        // Check periodically if extension context is still valid
        const contextCheckInterval = setInterval(() => {
            if (!browser.runtime?.id) {
                cleanup();
                clearInterval(contextCheckInterval);
            }
        }, 5000);
    }
    
})();