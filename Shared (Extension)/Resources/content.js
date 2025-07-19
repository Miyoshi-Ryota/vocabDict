// VocabDict Content Script

// Message listener for commands from background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    
    if (request.type === 'SHOW_FLOATING_WIDGET') {
        // Will implement floating widget in Phase 2
        console.log("Would show floating widget for word:", request.payload.word);
    } else if (request.type === 'SELECTION_LOOKUP') {
        // Get selected text and send for lookup
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            console.log("Selected text:", selectedText);
            // Will implement lookup in Phase 2
        }
    }
    
    sendResponse({ received: true });
    return true;
});
