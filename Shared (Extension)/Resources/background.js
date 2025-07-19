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


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.greeting === "hello")
        return Promise.resolve({ farewell: "goodbye" });
});
