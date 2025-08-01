describe('Test Setup', () => {
  test('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  test('Browser API mocks are available', () => {
    expect(browser).toBeDefined();
    expect(browser.storage).toBeDefined();
    expect(browser.storage.local).toBeDefined();
  });

  test('Browser storage mocks work correctly', async () => {
    browser.storage.local.set.mockResolvedValue(undefined);
    browser.storage.local.get.mockResolvedValue({ test: 'value' });

    await browser.storage.local.set({ test: 'value' });
    const result = await browser.storage.local.get('test');

    expect(browser.storage.local.set).toHaveBeenCalledWith({ test: 'value' });
    expect(result).toEqual({ test: 'value' });
  });
});
