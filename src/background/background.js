// Background service worker for VocabDict Safari Extension

// Initialize extension on install
browser.runtime.onInstalled.addListener(() => {
  console.log('VocabDict extension installed');
  
  // Create context menu for word lookup
  browser.contextMenus.create({
    id: 'lookup-vocabdict',
    title: 'Look up in VocabDict',
    contexts: ['selection']
  });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lookup-vocabdict' && info.selectionText) {
    console.log('Looking up:', info.selectionText);
    // TODO: Implement word lookup
  }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.type) {
    case 'LOOKUP_WORD':
      // TODO: Implement word lookup
      sendResponse({ success: true, message: 'Word lookup not yet implemented' });
      break;
      
    default:
      sendResponse({ success: false, message: 'Unknown message type' });
  }
  
  return true; // Indicates async response
});