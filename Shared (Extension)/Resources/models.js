// VocabDict Data Models

// Data Models
class VocabularyWord {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.word = data.word || '';
        this.definitions = data.definitions || [];
        this.dateAdded = data.dateAdded ? new Date(data.dateAdded) : new Date();
        this.lookupCount = data.lookupCount || 1;
        this.difficulty = data.difficulty || 'medium';
        this.lastReviewed = data.lastReviewed ? new Date(data.lastReviewed) : null;
        this.nextReview = data.nextReview ? new Date(data.nextReview) : null;
        this.reviewHistory = data.reviewHistory || [];
    }
    
    generateId() {
        return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    calculateNextReview(correct) {
        // Simple spaced repetition algorithm
        const intervals = [1, 3, 7, 14, 30, 90]; // days
        const currentLevel = this.reviewHistory.filter(r => r.correct).length;
        const nextLevel = correct ? Math.min(currentLevel + 1, intervals.length - 1) : 0;
        
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervals[nextLevel]);
        
        this.lastReviewed = new Date();
        this.nextReview = nextDate;
        this.reviewHistory.push({
            date: this.lastReviewed,
            correct: correct
        });
        
        return this.nextReview;
    }
    
    toJSON() {
        return {
            id: this.id,
            word: this.word,
            definitions: this.definitions,
            dateAdded: this.dateAdded.toISOString(),
            lookupCount: this.lookupCount,
            difficulty: this.difficulty,
            lastReviewed: this.lastReviewed ? this.lastReviewed.toISOString() : null,
            nextReview: this.nextReview ? this.nextReview.toISOString() : null,
            reviewHistory: this.reviewHistory
        };
    }
}

class VocabularyList {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || 'Untitled List';
        this.description = data.description || '';
        this.wordIds = data.wordIds || [];
        this.createdDate = data.createdDate ? new Date(data.createdDate) : new Date();
        this.modifiedDate = data.modifiedDate ? new Date(data.modifiedDate) : new Date();
        this.isDefault = data.isDefault || false;
        this.sortOrder = data.sortOrder || 0;
    }
    
    generateId() {
        return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    addWord(wordId) {
        if (!this.wordIds.includes(wordId)) {
            this.wordIds.push(wordId);
            this.modifiedDate = new Date();
        }
    }
    
    removeWord(wordId) {
        const index = this.wordIds.indexOf(wordId);
        if (index > -1) {
            this.wordIds.splice(index, 1);
            this.modifiedDate = new Date();
        }
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            wordIds: this.wordIds,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            isDefault: this.isDefault,
            sortOrder: this.sortOrder
        };
    }
}

class UserSettings {
    constructor(data = {}) {
        this.theme = data.theme || 'auto';
        this.autoAddToList = data.autoAddToList !== undefined ? data.autoAddToList : true;
        this.defaultListId = data.defaultListId || null;
        this.dailyReviewReminder = data.dailyReviewReminder || false;
        this.reminderTime = data.reminderTime || CONSTANTS.DEFAULT_REMINDER_TIME;
        this.reviewSessionSize = data.reviewSessionSize || CONSTANTS.DEFAULT_REVIEW_SESSION_SIZE;
        this.keyboardShortcuts = data.keyboardShortcuts || {
            lookup: 'Cmd+Shift+L',
            addToList: 'Cmd+Shift+A'
        };
    }
    
    toJSON() {
        return {
            theme: this.theme,
            autoAddToList: this.autoAddToList,
            defaultListId: this.defaultListId,
            dailyReviewReminder: this.dailyReviewReminder,
            reminderTime: this.reminderTime,
            reviewSessionSize: this.reviewSessionSize,
            keyboardShortcuts: this.keyboardShortcuts
        };
    }
}

class LearningStats {
    constructor(data = {}) {
        this.totalWords = data.totalWords || 0;
        this.wordsLearned = data.wordsLearned || 0;
        this.currentStreak = data.currentStreak || 0;
        this.longestStreak = data.longestStreak || 0;
        this.lastReviewDate = data.lastReviewDate ? new Date(data.lastReviewDate) : null;
        this.totalReviews = data.totalReviews || 0;
        this.accuracyRate = data.accuracyRate || 0;
    }
    
    updateReviewStats(correct) {
        this.totalReviews++;
        const newAccuracy = ((this.accuracyRate * (this.totalReviews - 1)) + (correct ? 100 : 0)) / this.totalReviews;
        this.accuracyRate = Math.round(newAccuracy);
        
        const today = new Date().toDateString();
        const lastReview = this.lastReviewDate ? new Date(this.lastReviewDate).toDateString() : null;
        
        if (lastReview !== today) {
            // New day
            if (lastReview === new Date(Date.now() - 86400000).toDateString()) {
                // Consecutive day
                this.currentStreak++;
                this.longestStreak = Math.max(this.currentStreak, this.longestStreak);
            } else {
                // Streak broken
                this.currentStreak = 1;
            }
        }
        
        this.lastReviewDate = new Date();
    }
    
    toJSON() {
        return {
            totalWords: this.totalWords,
            wordsLearned: this.wordsLearned,
            currentStreak: this.currentStreak,
            longestStreak: this.longestStreak,
            lastReviewDate: this.lastReviewDate ? this.lastReviewDate.toISOString() : null,
            totalReviews: this.totalReviews,
            accuracyRate: this.accuracyRate
        };
    }
}