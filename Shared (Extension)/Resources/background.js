// VocabDict Background Script - All-in-one bundle for Safari compatibility

// Message Types
const MessageTypes = {
    // Dictionary operations
    LOOKUP_WORD: 'lookup_word',
    CACHE_DICTIONARY_ENTRY: 'cache_dictionary_entry',
    GET_CACHED_ENTRY: 'get_cached_entry',
    
    // Vocabulary word operations
    ADD_WORD: 'add_word',
    GET_WORD: 'get_word',
    GET_ALL_WORDS: 'get_all_words',
    UPDATE_WORD: 'update_word',
    DELETE_WORD: 'delete_word',
    GET_WORDS_DUE_FOR_REVIEW: 'get_words_due_for_review',
    
    // Vocabulary list operations
    ADD_LIST: 'add_list',
    GET_LIST: 'get_list',
    GET_ALL_LISTS: 'get_all_lists',
    UPDATE_LIST: 'update_list',
    DELETE_LIST: 'delete_list',
    GET_DEFAULT_LIST: 'get_default_list',
    ADD_WORD_TO_LIST: 'add_word_to_list',
    REMOVE_WORD_FROM_LIST: 'remove_word_from_list',
    
    // Settings operations
    GET_SETTINGS: 'get_settings',
    UPDATE_SETTINGS: 'update_settings',
    
    // Stats operations
    GET_STATS: 'get_stats',
    UPDATE_STATS: 'update_stats',
    UPDATE_REVIEW_STATS: 'update_review_stats',
    
    // Learning operations
    GET_REVIEW_SESSION: 'get_review_session',
    SUBMIT_REVIEW_RESULT: 'submit_review_result',
    
    // UI operations
    SHOW_NOTIFICATION: 'show_notification',
    OPEN_POPUP: 'open_popup',
    CONTEXT_MENU_CLICKED: 'context_menu_clicked',
    
    // Content script operations
    SELECTION_LOOKUP: 'selection_lookup',
    SHOW_FLOATING_WIDGET: 'show_floating_widget',
    HIDE_FLOATING_WIDGET: 'hide_floating_widget'
};

const MessageStatus = {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending'
};

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
        this.listIds = data.listIds || [];
    }

    generateId() {
        return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            reviewHistory: this.reviewHistory,
            listIds: this.listIds
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
        this.reminderTime = data.reminderTime || '09:00';
        this.reviewSessionSize = data.reviewSessionSize || 20;
        this.keyboardShortcuts = data.keyboardShortcuts || {
            lookup: 'Command+Shift+L',
            addToList: 'Command+Shift+A'
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


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.greeting === "hello")
        return Promise.resolve({ farewell: "goodbye" });
});
