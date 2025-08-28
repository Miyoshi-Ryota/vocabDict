const { handleContextMenuClick, services } = require('../../src/background/background');

describe('Context Menu Integration', () => {
  let originalBrowserAction;

  beforeEach(() => {
    // Mock browser.action.openPopup
    originalBrowserAction = global.browser.action;
    global.browser.action = {
      openPopup: jest.fn().mockResolvedValue()
    };

    // Clear any pending searches
    services.popupWordState.clear();
  });

  afterEach(() => {
    global.browser.action = originalBrowserAction;
  });

  test('should store selected word and open popup when context menu is clicked', async () => {
    // ユーザーが"hello"という単語を選択して右クリック
    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: 'hello'
    };
    const tab = {};

    // ユーザーが「Look up in VocabDict」をクリック
    await handleContextMenuClick(info, tab);

    // 選択した単語が保存される（直接handleMessageを呼ぶため）
    expect(services.popupWordState.pendingSearch).toBe('hello');

    // ポップアップが開く
    expect(browser.action.openPopup).toHaveBeenCalled();
  });

  test('should not process if menu item id does not match', async () => {
    const info = {
      menuItemId: 'different-menu-item',
      selectionText: 'hello'
    };
    const tab = {};

    await handleContextMenuClick(info, tab);

    // 単語は保存されない
    expect(services.popupWordState.pendingSearch).toBeNull();

    // ポップアップも開かない
    expect(browser.action.openPopup).not.toHaveBeenCalled();
  });

  test('should not process if no text is selected', async () => {
    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: ''
    };
    const tab = {};

    await handleContextMenuClick(info, tab);

    // 単語は保存されない
    expect(services.popupWordState.pendingSearch).toBeNull();

    // ポップアップも開かない
    expect(browser.action.openPopup).not.toHaveBeenCalled();
  });

  test('should handle popup open failure gracefully', async () => {
    // ポップアップが開けない場合をシミュレート
    browser.action.openPopup.mockRejectedValue(new Error('Cannot open popup'));

    const info = {
      menuItemId: 'lookup-vocabdict',
      selectionText: 'hello'
    };
    const tab = {};

    // エラーがスローされないことを確認
    await expect(handleContextMenuClick(info, tab)).resolves.not.toThrow();

    // 単語は保存される（ユーザーが手動でポップアップを開いた時に使える）
    expect(services.popupWordState.pendingSearch).toBe('hello');
  });
});