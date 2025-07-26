/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
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
      sendResponse({
        success: true,
        message: 'Word lookup not yet implemented'
      });
      break;
    default:
      sendResponse({
        success: false,
        message: 'Unknown message type'
      });
  }
  return true; // Indicates async response
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBRUE7QUFDQUEsT0FBTyxDQUFDQyxPQUFPLENBQUNDLFdBQVcsQ0FBQ0MsV0FBVyxDQUFDLE1BQU07RUFDNUNDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLCtCQUErQixDQUFDOztFQUU1QztFQUNBTCxPQUFPLENBQUNNLFlBQVksQ0FBQ0MsTUFBTSxDQUFDO0lBQzFCQyxFQUFFLEVBQUUsa0JBQWtCO0lBQ3RCQyxLQUFLLEVBQUUsc0JBQXNCO0lBQzdCQyxRQUFRLEVBQUUsQ0FBQyxXQUFXO0VBQ3hCLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQzs7QUFFRjtBQUNBVixPQUFPLENBQUNNLFlBQVksQ0FBQ0ssU0FBUyxDQUFDUixXQUFXLENBQUMsQ0FBQ1MsSUFBSSxFQUFFQyxHQUFHLEtBQUs7RUFDeEQsSUFBSUQsSUFBSSxDQUFDRSxVQUFVLEtBQUssa0JBQWtCLElBQUlGLElBQUksQ0FBQ0csYUFBYSxFQUFFO0lBQ2hFWCxPQUFPLENBQUNDLEdBQUcsQ0FBQyxhQUFhLEVBQUVPLElBQUksQ0FBQ0csYUFBYSxDQUFDO0lBQzlDO0VBQ0Y7QUFDRixDQUFDLENBQUM7O0FBRUY7QUFDQWYsT0FBTyxDQUFDQyxPQUFPLENBQUNlLFNBQVMsQ0FBQ2IsV0FBVyxDQUFDLENBQUNjLE9BQU8sRUFBRUMsTUFBTSxFQUFFQyxZQUFZLEtBQUs7RUFDdkVmLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLDhCQUE4QixFQUFFWSxPQUFPLENBQUM7RUFFcEQsUUFBUUEsT0FBTyxDQUFDRyxJQUFJO0lBQ2xCLEtBQUssYUFBYTtNQUNoQjtNQUNBRCxZQUFZLENBQUM7UUFBRUUsT0FBTyxFQUFFLElBQUk7UUFBRUMsT0FBTyxFQUFFO01BQWtDLENBQUMsQ0FBQztNQUMzRTtJQUVGO01BQ0VILFlBQVksQ0FBQztRQUFFRSxPQUFPLEVBQUUsS0FBSztRQUFFQyxPQUFPLEVBQUU7TUFBdUIsQ0FBQyxDQUFDO0VBQ3JFO0VBRUEsT0FBTyxJQUFJLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdm9jYWJkaWN0Ly4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBCYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyIGZvciBWb2NhYkRpY3QgU2FmYXJpIEV4dGVuc2lvblxuXG4vLyBJbml0aWFsaXplIGV4dGVuc2lvbiBvbiBpbnN0YWxsXG5icm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBjb25zb2xlLmxvZygnVm9jYWJEaWN0IGV4dGVuc2lvbiBpbnN0YWxsZWQnKTtcbiAgXG4gIC8vIENyZWF0ZSBjb250ZXh0IG1lbnUgZm9yIHdvcmQgbG9va3VwXG4gIGJyb3dzZXIuY29udGV4dE1lbnVzLmNyZWF0ZSh7XG4gICAgaWQ6ICdsb29rdXAtdm9jYWJkaWN0JyxcbiAgICB0aXRsZTogJ0xvb2sgdXAgaW4gVm9jYWJEaWN0JyxcbiAgICBjb250ZXh0czogWydzZWxlY3Rpb24nXVxuICB9KTtcbn0pO1xuXG4vLyBIYW5kbGUgY29udGV4dCBtZW51IGNsaWNrc1xuYnJvd3Nlci5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpbmZvLCB0YWIpID0+IHtcbiAgaWYgKGluZm8ubWVudUl0ZW1JZCA9PT0gJ2xvb2t1cC12b2NhYmRpY3QnICYmIGluZm8uc2VsZWN0aW9uVGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdMb29raW5nIHVwOicsIGluZm8uc2VsZWN0aW9uVGV4dCk7XG4gICAgLy8gVE9ETzogSW1wbGVtZW50IHdvcmQgbG9va3VwXG4gIH1cbn0pO1xuXG4vLyBIYW5kbGUgbWVzc2FnZXMgZnJvbSBjb250ZW50IHNjcmlwdHMgYW5kIHBvcHVwXG5icm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICBjb25zb2xlLmxvZygnQmFja2dyb3VuZCByZWNlaXZlZCBtZXNzYWdlOicsIHJlcXVlc3QpO1xuICBcbiAgc3dpdGNoIChyZXF1ZXN0LnR5cGUpIHtcbiAgICBjYXNlICdMT09LVVBfV09SRCc6XG4gICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgd29yZCBsb29rdXBcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdXb3JkIGxvb2t1cCBub3QgeWV0IGltcGxlbWVudGVkJyB9KTtcbiAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgZGVmYXVsdDpcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnVW5rbm93biBtZXNzYWdlIHR5cGUnIH0pO1xuICB9XG4gIFxuICByZXR1cm4gdHJ1ZTsgLy8gSW5kaWNhdGVzIGFzeW5jIHJlc3BvbnNlXG59KTsiXSwibmFtZXMiOlsiYnJvd3NlciIsInJ1bnRpbWUiLCJvbkluc3RhbGxlZCIsImFkZExpc3RlbmVyIiwiY29uc29sZSIsImxvZyIsImNvbnRleHRNZW51cyIsImNyZWF0ZSIsImlkIiwidGl0bGUiLCJjb250ZXh0cyIsIm9uQ2xpY2tlZCIsImluZm8iLCJ0YWIiLCJtZW51SXRlbUlkIiwic2VsZWN0aW9uVGV4dCIsIm9uTWVzc2FnZSIsInJlcXVlc3QiLCJzZW5kZXIiLCJzZW5kUmVzcG9uc2UiLCJ0eXBlIiwic3VjY2VzcyIsIm1lc3NhZ2UiXSwic291cmNlUm9vdCI6IiJ9