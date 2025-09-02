const { handleContextMenuClick, services } = require('../../src/background/background');
const { handleMessage, MessageTypes } = require('../../src/background/message-handler');

describe('Context Menu Messaging Flow', () => {
  let originalBrowserAction;
  let originalSendMessage;
  let messageHandler;

  beforeEach(() => {
    // Mock browser.action.openPopup
    originalBrowserAction = global.browser.action;
    global.browser.action = {
      openPopup: jest.fn().mockResolvedValue()
    };

    // Store original sendMessage
    originalSendMessage = global.browser.runtime.sendMessage;
    
    // Clear any pending searches
    services.popupWordState.clear();

    // Setup message handler spy
    messageHandler = jest.fn();
    
    // Mock sendMessage to simulate the full message flow
    global.browser.runtime.sendMessage = jest.fn().mockImplementation(async (message) => {
      console.log('sendMessage called with:', message);
      
      // Simulate the onMessage listener receiving the message
      const response = await handleMessage(message, services);
      console.log('handleMessage response:', response);
      
      return response;
    });
  });

  afterEach(() => {
    global.browser.action = originalBrowserAction;
    global.browser.runtime.sendMessage = originalSendMessage;
    jest.clearAllMocks();
  });

  test('should handle message directly when context menu is clicked', async () => {
    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: 'hello'
    };
    const tab = {};

    await handleContextMenuClick(info, tab);

    // Now we directly handle the message, so check the result
    expect(services.popupWordState.pendingSearch).toBe('hello');
    expect(browser.action.openPopup).toHaveBeenCalled();
  });

  test('should handle the full message flow and open popup', async () => {
    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: 'hello'
    };
    const tab = {};

    // Execute the context menu click
    await handleContextMenuClick(info, tab);

    // Verify the full flow (now directly handled):
    // 1. Word was stored in popupWordState
    expect(services.popupWordState.pendingSearch).toBe('hello');

    // 2. Popup was opened
    expect(browser.action.openPopup).toHaveBeenCalled();
  });

  test('should handle OPEN_POPUP_WITH_WORD message directly', async () => {
    // Test handleMessage directly
    const result = await handleMessage({
      action: MessageTypes.OPEN_POPUP_WITH_WORD,
      word: 'test-word'
    }, services);

    // Verify success
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ popupOpened: true });

    // Verify word was stored
    expect(services.popupWordState.pendingSearch).toBe('test-word');

    // Verify popup was opened
    expect(browser.action.openPopup).toHaveBeenCalled();
  });

  test('should handle error when browser.action.openPopup fails', async () => {
    // Make openPopup fail
    browser.action.openPopup.mockRejectedValue(new Error('Cannot open popup'));

    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: 'hello'
    };
    const tab = {};

    await handleContextMenuClick(info, tab);

    // Word should still be stored (for manual popup open)
    expect(services.popupWordState.pendingSearch).toBe('hello');
    
    // Popup should have been attempted
    expect(browser.action.openPopup).toHaveBeenCalled();
  });

  test('should not process if no text is selected', async () => {
    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: ''
    };
    const tab = {};

    await handleContextMenuClick(info, tab);

    // Word should not be stored
    expect(services.popupWordState.pendingSearch).toBeNull();

    // Popup should not be opened
    expect(browser.action.openPopup).not.toHaveBeenCalled();
  });

  test('should require word parameter in message', async () => {
    const result = await handleMessage({
      action: MessageTypes.OPEN_POPUP_WITH_WORD
      // Missing word parameter
    }, services);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Word parameter is required');
  });

  test('should handle missing popupWordState', async () => {
    const result = await handleMessage({
      action: MessageTypes.OPEN_POPUP_WITH_WORD,
      word: 'test'
    }, { dictionary: services.dictionary }); // Missing popupWordState

    expect(result.success).toBe(false);
    expect(result.error).toBe('Popup word state not available');
  });
});