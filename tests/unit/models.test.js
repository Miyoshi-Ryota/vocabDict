/**
 * Unit tests for VocabDict data models - Testing Real Implementations
 */

// Mock the browser global and constants before importing models
global.CONSTANTS = {
    DEFAULT_REMINDER_TIME: '09:00',
    DEFAULT_REVIEW_SESSION_SIZE: 20
};

// Import real models (Node.js style for testing)
const fs = require('fs');
const path = require('path');

// Read and evaluate the models file
const modelsPath = path.join(__dirname, '../../Shared (Extension)/Resources/models.js');
const modelsCode = fs.readFileSync(modelsPath, 'utf8');

// Create a function scope and evaluate the models code
const createModels = new Function('CONSTANTS', modelsCode + `
    return { VocabularyWord, VocabularyList, UserSettings, LearningStats };
`);

const { VocabularyWord, VocabularyList, UserSettings, LearningStats } = createModels(global.CONSTANTS);

describe('VocabularyWord Model - Real Implementation', () => {
    let word;

    beforeEach(() => {
        word = new VocabularyWord({
            word: 'test',
            definitions: [{
                partOfSpeech: 'noun',
                meaning: 'A procedure for critical evaluation',
                examples: ['The test was successful.']
            }]
        });
    });

    describe('Constructor', () => {
        test('should create word with provided values', () => {
            expect(word.word).toBe('test');
            expect(word.definitions).toHaveLength(1);
            expect(word.definitions[0].partOfSpeech).toBe('noun');
            expect(word.definitions[0].meaning).toBe('A procedure for critical evaluation');
            expect(word.lookupCount).toBe(1);
            expect(word.difficulty).toBe('medium');
            expect(word.dateAdded).toBeInstanceOf(Date);
            expect(word.id).toMatch(/^word_\d+_[a-z0-9]+$/);
        });

        test('should create word with default values', () => {
            const emptyWord = new VocabularyWord();
            
            expect(emptyWord.word).toBe('');
            expect(emptyWord.definitions).toEqual([]);
            expect(emptyWord.lookupCount).toBe(1);
            expect(emptyWord.difficulty).toBe('medium');
            expect(emptyWord.lastReviewed).toBeNull();
            expect(emptyWord.nextReview).toBeNull();
            expect(emptyWord.reviewHistory).toEqual([]);
        });

        test('should handle date parsing for existing data', () => {
            const dateAdded = new Date('2024-01-01');
            const lastReviewed = new Date('2024-01-05');
            const nextReview = new Date('2024-01-10');
            
            const existingWord = new VocabularyWord({
                dateAdded: dateAdded.toISOString(),
                lastReviewed: lastReviewed.toISOString(),
                nextReview: nextReview.toISOString()
            });
            
            expect(existingWord.dateAdded).toEqual(dateAdded);
            expect(existingWord.lastReviewed).toEqual(lastReviewed);
            expect(existingWord.nextReview).toEqual(nextReview);
        });
    });

    describe('ID Generation', () => {
        test('should generate unique IDs', () => {
            const word1 = new VocabularyWord();
            const word2 = new VocabularyWord();
            
            expect(word1.id).toMatch(/^word_\d+_[a-z0-9]+$/);
            expect(word2.id).toMatch(/^word_\d+_[a-z0-9]+$/);
            expect(word1.id).not.toBe(word2.id);
        });

        test('should use provided ID if available', () => {
            const customWord = new VocabularyWord({ id: 'custom_id_123' });
            expect(customWord.id).toBe('custom_id_123');
        });
    });

    describe('Spaced Repetition Algorithm', () => {
        test('should calculate next review for correct answer', () => {
            const beforeReview = new Date();
            const nextReviewDate = word.calculateNextReview(true);
            
            expect(word.lastReviewed).toBeInstanceOf(Date);
            expect(word.lastReviewed.getTime()).toBeGreaterThanOrEqual(beforeReview.getTime());
            expect(nextReviewDate).toBeInstanceOf(Date);
            
            // First review should be 1 day later
            const daysDiff = Math.round((nextReviewDate - word.lastReviewed) / (1000 * 60 * 60 * 24));
            expect(daysDiff).toBe(1);
            
            expect(word.reviewHistory).toHaveLength(1);
            expect(word.reviewHistory[0].correct).toBe(true);
            expect(word.reviewHistory[0].date).toEqual(word.lastReviewed);
        });

        test('should follow spaced repetition intervals', () => {
            const intervals = [1, 3, 7, 14, 30, 90];
            
            // Test progression through intervals
            for (let i = 0; i < intervals.length; i++) {
                word.calculateNextReview(true);
                const daysDiff = Math.round((word.nextReview - word.lastReviewed) / (1000 * 60 * 60 * 24));
                expect(daysDiff).toBe(intervals[Math.min(i, intervals.length - 1)]);
            }
            
            // Additional correct answers should stay at max interval
            word.calculateNextReview(true);
            const finalDaysDiff = Math.round((word.nextReview - word.lastReviewed) / (1000 * 60 * 60 * 24));
            expect(finalDaysDiff).toBe(90);
        });

        test('should reset to first interval on incorrect answer', () => {
            // Build up some progress
            word.calculateNextReview(true); // 1 day
            word.calculateNextReview(true); // 3 days
            word.calculateNextReview(true); // 7 days
            
            expect(word.reviewHistory.filter(r => r.correct).length).toBe(3);
            
            // Incorrect answer should reset to 1 day
            word.calculateNextReview(false);
            const daysDiff = Math.round((word.nextReview - word.lastReviewed) / (1000 * 60 * 60 * 24));
            expect(daysDiff).toBe(1);
            
            expect(word.reviewHistory).toHaveLength(4);
            expect(word.reviewHistory[3].correct).toBe(false);
        });
    });

    describe('JSON Serialization', () => {
        test('should serialize all properties correctly', () => {
            word.lastReviewed = new Date('2024-01-05');
            word.nextReview = new Date('2024-01-10');
            word.reviewHistory = [
                { date: new Date('2024-01-01'), correct: true },
                { date: new Date('2024-01-02'), correct: false }
            ];
            
            const json = word.toJSON();
            
            expect(json).toEqual({
                id: word.id,
                word: 'test',
                definitions: word.definitions,
                dateAdded: word.dateAdded.toISOString(),
                lookupCount: 1,
                difficulty: 'medium',
                lastReviewed: '2024-01-05T00:00:00.000Z',
                nextReview: '2024-01-10T00:00:00.000Z',
                reviewHistory: word.reviewHistory
            });
        });

        test('should handle null dates in JSON', () => {
            const newWord = new VocabularyWord({ word: 'example' });
            const json = newWord.toJSON();
            
            expect(json.lastReviewed).toBeNull();
            expect(json.nextReview).toBeNull();
        });
    });
});

describe('VocabularyList Model - Real Implementation', () => {
    let list;

    beforeEach(() => {
        list = new VocabularyList({
            name: 'Test List',
            description: 'A list for testing'
        });
    });

    describe('Constructor', () => {
        test('should create list with provided values', () => {
            expect(list.name).toBe('Test List');
            expect(list.description).toBe('A list for testing');
            expect(list.wordIds).toEqual([]);
            expect(list.isDefault).toBe(false);
            expect(list.sortOrder).toBe(0);
            expect(list.createdDate).toBeInstanceOf(Date);
            expect(list.modifiedDate).toBeInstanceOf(Date);
            expect(list.id).toMatch(/^list_\d+_[a-z0-9]+$/);
        });

        test('should create list with default values', () => {
            const emptyList = new VocabularyList();
            
            expect(emptyList.name).toBe('Untitled List');
            expect(emptyList.description).toBe('');
            expect(emptyList.wordIds).toEqual([]);
            expect(emptyList.isDefault).toBe(false);
        });

        test('should handle date parsing', () => {
            const createdDate = new Date('2024-01-01');
            const modifiedDate = new Date('2024-01-05');
            
            const existingList = new VocabularyList({
                createdDate: createdDate.toISOString(),
                modifiedDate: modifiedDate.toISOString()
            });
            
            expect(existingList.createdDate).toEqual(createdDate);
            expect(existingList.modifiedDate).toEqual(modifiedDate);
        });
    });

    describe('Word Management', () => {
        test('should add word to list', () => {
            const originalModified = list.modifiedDate;
            
            // Wait a bit to ensure date changes
            setTimeout(() => {
                list.addWord('word_123');
                
                expect(list.wordIds).toContain('word_123');
                expect(list.wordIds).toHaveLength(1);
                expect(list.modifiedDate.getTime()).toBeGreaterThan(originalModified.getTime());
            }, 10);
        });

        test('should not add duplicate words', () => {
            list.addWord('word_123');
            const modifiedAfterFirst = list.modifiedDate;
            
            setTimeout(() => {
                list.addWord('word_123'); // Try to add same word
                
                expect(list.wordIds).toHaveLength(1);
                expect(list.wordIds.filter(id => id === 'word_123')).toHaveLength(1);
                expect(list.modifiedDate).toEqual(modifiedAfterFirst); // Date shouldn't change
            }, 10);
        });

        test('should remove word from list', () => {
            list.wordIds = ['word_1', 'word_2', 'word_3'];
            const originalModified = list.modifiedDate;
            
            setTimeout(() => {
                list.removeWord('word_2');
                
                expect(list.wordIds).toEqual(['word_1', 'word_3']);
                expect(list.wordIds).not.toContain('word_2');
                expect(list.modifiedDate.getTime()).toBeGreaterThan(originalModified.getTime());
            }, 10);
        });

        test('should handle removing non-existent word', () => {
            list.wordIds = ['word_1'];
            const originalModified = list.modifiedDate;
            
            setTimeout(() => {
                list.removeWord('word_999');
                
                expect(list.wordIds).toEqual(['word_1']);
                expect(list.modifiedDate).toEqual(originalModified); // Date shouldn't change
            }, 10);
        });
    });

    describe('JSON Serialization', () => {
        test('should serialize all properties correctly', () => {
            list.wordIds = ['word_1', 'word_2'];
            list.isDefault = true;
            list.sortOrder = 5;
            
            const json = list.toJSON();
            
            expect(json).toEqual({
                id: list.id,
                name: 'Test List',
                description: 'A list for testing',
                wordIds: ['word_1', 'word_2'],
                createdDate: list.createdDate.toISOString(),
                modifiedDate: list.modifiedDate.toISOString(),
                isDefault: true,
                sortOrder: 5
            });
        });
    });
});

describe('UserSettings Model - Real Implementation', () => {
    let settings;

    beforeEach(() => {
        settings = new UserSettings();
    });

    describe('Constructor', () => {
        test('should create settings with default values', () => {
            expect(settings.theme).toBe('auto');
            expect(settings.autoAddToList).toBe(true);
            expect(settings.defaultListId).toBeNull();
            expect(settings.dailyReviewReminder).toBe(false);
            expect(settings.reminderTime).toBe('09:00');
            expect(settings.reviewSessionSize).toBe(20);
            expect(settings.keyboardShortcuts).toEqual({
                lookup: 'Cmd+Shift+L',
                addToList: 'Cmd+Shift+A'
            });
        });

        test('should create settings with provided values', () => {
            const customSettings = new UserSettings({
                theme: 'dark',
                autoAddToList: false,
                defaultListId: 'list_123',
                dailyReviewReminder: true,
                reminderTime: '18:00',
                reviewSessionSize: 10
            });
            
            expect(customSettings.theme).toBe('dark');
            expect(customSettings.autoAddToList).toBe(false);
            expect(customSettings.defaultListId).toBe('list_123');
            expect(customSettings.dailyReviewReminder).toBe(true);
            expect(customSettings.reminderTime).toBe('18:00');
            expect(customSettings.reviewSessionSize).toBe(10);
        });

        test('should handle partial settings', () => {
            const partialSettings = new UserSettings({
                theme: 'light',
                reviewSessionSize: 15
            });
            
            expect(partialSettings.theme).toBe('light');
            expect(partialSettings.autoAddToList).toBe(true); // Default
            expect(partialSettings.reviewSessionSize).toBe(15);
        });
    });

    describe('JSON Serialization', () => {
        test('should serialize all properties correctly', () => {
            settings.theme = 'dark';
            settings.defaultListId = 'list_456';
            settings.keyboardShortcuts.lookup = 'Ctrl+L';
            
            const json = settings.toJSON();
            
            expect(json).toEqual({
                theme: 'dark',
                autoAddToList: true,
                defaultListId: 'list_456',
                dailyReviewReminder: false,
                reminderTime: '09:00',
                reviewSessionSize: 20,
                keyboardShortcuts: {
                    lookup: 'Ctrl+L',
                    addToList: 'Cmd+Shift+A'
                }
            });
        });
    });
});

describe('LearningStats Model - Real Implementation', () => {
    let stats;

    beforeEach(() => {
        stats = new LearningStats();
    });

    describe('Constructor', () => {
        test('should create stats with default values', () => {
            expect(stats.totalWords).toBe(0);
            expect(stats.wordsLearned).toBe(0);
            expect(stats.currentStreak).toBe(0);
            expect(stats.longestStreak).toBe(0);
            expect(stats.lastReviewDate).toBeNull();
            expect(stats.totalReviews).toBe(0);
            expect(stats.accuracyRate).toBe(0);
        });

        test('should create stats with provided values', () => {
            const lastReview = new Date('2024-01-05');
            const customStats = new LearningStats({
                totalWords: 50,
                wordsLearned: 30,
                currentStreak: 5,
                longestStreak: 10,
                lastReviewDate: lastReview.toISOString(),
                totalReviews: 100,
                accuracyRate: 85
            });
            
            expect(customStats.totalWords).toBe(50);
            expect(customStats.wordsLearned).toBe(30);
            expect(customStats.currentStreak).toBe(5);
            expect(customStats.longestStreak).toBe(10);
            expect(customStats.lastReviewDate).toEqual(lastReview);
            expect(customStats.totalReviews).toBe(100);
            expect(customStats.accuracyRate).toBe(85);
        });
    });

    describe('Review Statistics', () => {
        test('should update stats for correct answer on first review', () => {
            stats.updateReviewStats(true);
            
            expect(stats.totalReviews).toBe(1);
            expect(stats.accuracyRate).toBe(100);
            expect(stats.currentStreak).toBe(1);
            expect(stats.longestStreak).toBe(1);
            expect(stats.lastReviewDate).toBeInstanceOf(Date);
        });

        test('should calculate accuracy rate correctly', () => {
            stats.updateReviewStats(true);  // 100%
            stats.updateReviewStats(true);  // 100%
            stats.updateReviewStats(false); // 66.67%
            stats.updateReviewStats(true);  // 75%
            
            expect(stats.totalReviews).toBe(4);
            expect(stats.accuracyRate).toBe(75);
        });

        test('should handle streak for consecutive days', () => {
            // First review
            stats.updateReviewStats(true);
            expect(stats.currentStreak).toBe(1);
            
            // Same day review shouldn't increase streak
            stats.updateReviewStats(true);
            expect(stats.currentStreak).toBe(1);
            
            // Simulate next day review
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            stats.lastReviewDate = yesterday;
            stats.currentStreak = 1;
            
            stats.updateReviewStats(true);
            expect(stats.currentStreak).toBe(2);
            expect(stats.longestStreak).toBe(2);
        });

        test('should break streak after missing days', () => {
            // Set up a streak
            stats.currentStreak = 5;
            stats.longestStreak = 5;
            stats.lastReviewDate = new Date('2024-01-01');
            
            // Review after missing days
            stats.updateReviewStats(true);
            
            expect(stats.currentStreak).toBe(1); // Reset to 1
            expect(stats.longestStreak).toBe(5); // Longest remains
        });
    });

    describe('JSON Serialization', () => {
        test('should serialize all properties correctly', () => {
            const reviewDate = new Date('2024-01-10');
            stats.totalWords = 25;
            stats.wordsLearned = 15;
            stats.currentStreak = 3;
            stats.longestStreak = 7;
            stats.lastReviewDate = reviewDate;
            stats.totalReviews = 50;
            stats.accuracyRate = 80;
            
            const json = stats.toJSON();
            
            expect(json).toEqual({
                totalWords: 25,
                wordsLearned: 15,
                currentStreak: 3,
                longestStreak: 7,
                lastReviewDate: reviewDate.toISOString(),
                totalReviews: 50,
                accuracyRate: 80
            });
        });

        test('should handle null lastReviewDate', () => {
            const json = stats.toJSON();
            expect(json.lastReviewDate).toBeNull();
        });
    });
});

describe('Model Interactions', () => {
    test('VocabularyWord and VocabularyList should work together', () => {
        const word1 = new VocabularyWord({ word: 'apple' });
        const word2 = new VocabularyWord({ word: 'banana' });
        const list = new VocabularyList({ name: 'Fruits' });
        
        list.addWord(word1.id);
        list.addWord(word2.id);
        
        expect(list.wordIds).toContain(word1.id);
        expect(list.wordIds).toContain(word2.id);
        expect(list.wordIds).toHaveLength(2);
    });

    test('UserSettings should reference VocabularyList', () => {
        const list = new VocabularyList({ name: 'Default List', isDefault: true });
        const settings = new UserSettings({ defaultListId: list.id });
        
        expect(settings.defaultListId).toBe(list.id);
    });

    test('LearningStats should track VocabularyWord progress', () => {
        const words = [
            new VocabularyWord({ word: 'test1' }),
            new VocabularyWord({ word: 'test2' }),
            new VocabularyWord({ word: 'test3' })
        ];
        
        const stats = new LearningStats({ totalWords: words.length });
        
        // Simulate reviews
        words.forEach(word => {
            word.calculateNextReview(true);
            stats.updateReviewStats(true);
        });
        
        expect(stats.totalWords).toBe(3);
        expect(stats.totalReviews).toBe(3);
        expect(stats.accuracyRate).toBe(100);
    });
});