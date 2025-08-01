const StorageManager = require('../../src/services/storage');

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset storage mock
    browser.storage.local.get.mockResolvedValue({});
    browser.storage.local.set.mockResolvedValue(undefined);
    browser.storage.local.remove.mockResolvedValue(undefined);
    browser.storage.local.clear.mockResolvedValue(undefined);
  });

  describe('get', () => {
    test('should retrieve data for a given key', async () => {
      const mockData = { test: 'value' };
      browser.storage.local.get.mockResolvedValue(mockData);

      const result = await StorageManager.get('test');

      expect(browser.storage.local.get).toHaveBeenCalledWith('test');
      expect(result).toBe('value');
    });

    test('should return undefined for non-existent key', async () => {
      browser.storage.local.get.mockResolvedValue({});

      const result = await StorageManager.get('nonexistent');

      expect(result).toBeUndefined();
    });

    test('should handle storage errors gracefully', async () => {
      browser.storage.local.get.mockRejectedValue(new Error('Storage error'));

      await expect(StorageManager.get('test')).rejects.toThrow('Storage error');
    });
  });

  describe('set', () => {
    test('should store data with a given key', async () => {
      await StorageManager.set('test', 'value');

      expect(browser.storage.local.set).toHaveBeenCalledWith({ test: 'value' });
    });

    test('should handle complex data types', async () => {
      const complexData = {
        array: [1, 2, 3],
        object: { nested: true },
        date: new Date().toISOString()
      };

      await StorageManager.set('complex', complexData);

      expect(browser.storage.local.set).toHaveBeenCalledWith({ complex: complexData });
    });

    test('should handle storage errors', async () => {
      browser.storage.local.set.mockRejectedValue(new Error('Quota exceeded'));

      await expect(StorageManager.set('test', 'value')).rejects.toThrow('Quota exceeded');
    });
  });

  describe('update', () => {
    test('should update existing data', async () => {
      browser.storage.local.get.mockResolvedValue({ counter: 5 });

      const result = await StorageManager.update('counter', (value) => value + 1);

      expect(browser.storage.local.get).toHaveBeenCalledWith('counter');
      expect(browser.storage.local.set).toHaveBeenCalledWith({ counter: 6 });
      expect(result).toBe(6);
    });

    test('should handle missing key in update', async () => {
      browser.storage.local.get.mockResolvedValue({});

      const result = await StorageManager.update('missing', (value = 0) => value + 1);

      expect(browser.storage.local.set).toHaveBeenCalledWith({ missing: 1 });
      expect(result).toBe(1);
    });
  });

  describe('remove', () => {
    test('should remove data for a given key', async () => {
      await StorageManager.remove('test');

      expect(browser.storage.local.remove).toHaveBeenCalledWith('test');
    });

    test('should handle remove errors', async () => {
      browser.storage.local.remove.mockRejectedValue(new Error('Remove failed'));

      await expect(StorageManager.remove('test')).rejects.toThrow('Remove failed');
    });
  });

  describe('clear', () => {
    test('should clear all storage', async () => {
      await StorageManager.clear();

      expect(browser.storage.local.clear).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    test('should retrieve all stored data', async () => {
      const allData = {
        key1: 'value1',
        key2: 'value2',
        key3: { nested: true }
      };
      browser.storage.local.get.mockResolvedValue(allData);

      const result = await StorageManager.getAll();

      expect(browser.storage.local.get).toHaveBeenCalledWith(null);
      expect(result).toEqual(allData);
    });
  });
});
