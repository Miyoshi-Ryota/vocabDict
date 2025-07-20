// VocabDict Extension Initialization

// Global variables
let db = null;
let isInitializing = false;
let initializationPromise = null;
const messageHandlers = new Map();

// Initialize extension
/**
 * Initialize the extension - prevents double initialization
 * @returns {Promise<void>}
 */
async function initialize() {
    // Prevent double initialization
    if (isInitializing) {
        return initializationPromise;
    }
    
    if (db && db.db) {
        console.log('VocabDict: Already initialized');
        return;
    }
    
    isInitializing = true;
    
    initializationPromise = doInitialize();
    
    try {
        await initializationPromise;
    } finally {
        isInitializing = false;
    }
    
    return initializationPromise;
}

/**
 * Perform the actual initialization steps
 * @returns {Promise<void>}
 */
async function doInitialize() {
    console.log('VocabDict: Starting initialization...');
    
    try {
        // Step 1: Register message handlers
        await initializeMessageHandlers();
        
        // Step 2: Check environment
        checkEnvironment();
        
        // Step 3: Initialize database
        await initializeDatabase();
        
        // Step 4: Create context menu
        await createContextMenu();
        
        console.log('VocabDict: Extension initialized successfully');
    } catch (error) {
        console.error('VocabDict: Failed to initialize extension:', error);
        console.error('VocabDict: Error stack:', error.stack);
        throw error;
    }
}

/**
 * Initialize message handlers
 * @returns {Promise<void>}
 */
async function initializeMessageHandlers() {
    console.log('VocabDict: Registering message handlers...');
    registerMessageHandlers();
    console.log('VocabDict: Registered handlers:', messageHandlers.size, 'handlers');
}

/**
 * Check if required APIs are available
 * @throws {Error} If required APIs are missing
 */
function checkEnvironment() {
    if (!('indexedDB' in self)) {
        console.error('VocabDict: IndexedDB is not available!');
        throw new Error('IndexedDB is not available');
    }
}

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
    console.log('VocabDict: Creating database instance...');
    db = new VocabDictDatabase();
    
    try {
        await db.initialize();
        
        // Double-check database is ready
        if (!db.db) {
            console.error('VocabDict: Database not ready after initialize!');
            throw new Error('Database initialization did not complete properly');
        }
        
        console.log('VocabDict: Database initialized successfully');
    } catch (dbError) {
        console.error('VocabDict: Database initialization failed:', dbError);
        db = null;
        throw dbError;
    }
}

/**
 * Create context menu items
 * @returns {Promise<void>}
 */
async function createContextMenu() {
    try {
        // Remove any existing menu items first
        await browser.contextMenus.removeAll();
        
        // Create the lookup menu item
        await browser.contextMenus.create({
            id: 'vocabdict-lookup',
            title: 'Look up "%s" in VocabDict',
            contexts: ['selection']
        });
        
        console.log('VocabDict: Context menu created');
    } catch (menuError) {
        console.error('VocabDict: Context menu error:', menuError);
        // Continue anyway - context menu is not critical
    }
}

// Register all message handlers
function registerMessageHandlers() {
    // Dictionary operations
    messageHandlers.set(MessageTypes.LOOKUP_WORD, createHandler(handleLookupWord));
    
    // Vocabulary word operations
    messageHandlers.set(MessageTypes.ADD_WORD, createHandler(handleAddWord));
    messageHandlers.set(MessageTypes.GET_WORD, createHandler(handleGetWord));
    messageHandlers.set(MessageTypes.GET_ALL_WORDS, createHandler(handleGetAllWords));
    messageHandlers.set(MessageTypes.UPDATE_WORD, createHandler(handleUpdateWord));
    messageHandlers.set(MessageTypes.DELETE_WORD, createHandler(handleDeleteWord));
    messageHandlers.set(MessageTypes.GET_WORDS_DUE_FOR_REVIEW, createHandler(handleGetWordsDueForReview));
    
    // Vocabulary list operations
    messageHandlers.set(MessageTypes.ADD_LIST, createHandler(handleAddList));
    messageHandlers.set(MessageTypes.GET_LIST, createHandler(handleGetList));
    messageHandlers.set(MessageTypes.GET_ALL_LISTS, createHandler(handleGetAllLists));
    messageHandlers.set(MessageTypes.UPDATE_LIST, createHandler(handleUpdateList));
    messageHandlers.set(MessageTypes.DELETE_LIST, createHandler(handleDeleteList));
    messageHandlers.set(MessageTypes.GET_DEFAULT_LIST, createHandler(handleGetDefaultList));
    messageHandlers.set(MessageTypes.ADD_WORD_TO_LIST, createHandler(handleAddWordToList));
    messageHandlers.set(MessageTypes.REMOVE_WORD_FROM_LIST, createHandler(handleRemoveWordFromList));
    
    // Settings operations
    messageHandlers.set(MessageTypes.GET_SETTINGS, createHandler(handleGetSettings));
    messageHandlers.set(MessageTypes.UPDATE_SETTINGS, createHandler(handleUpdateSettings));
    
    // Stats operations
    messageHandlers.set(MessageTypes.GET_STATS, createHandler(handleGetStats));
    messageHandlers.set(MessageTypes.UPDATE_STATS, createHandler(handleUpdateStats));
}

// Add test handlers for debugging
messageHandlers.set('ping', async (payload) => {
    return { message: 'pong', timestamp: Date.now() };
});

messageHandlers.set('check_status', async () => {
    return {
        dbInitialized: db !== null,
        handlersRegistered: messageHandlers.size,
        handlers: Array.from(messageHandlers.keys()),
        dbError: db === null ? 'Database not initialized' : 'Database OK'
    };
});

// Message handling
async function handleMessage(request, sender) {
    console.log('VocabDict: Received message:', request.type);
    
    // Ensure initialization
    await initialize();
    
    const handler = messageHandlers.get(request.type);
    if (!handler) {
        console.warn('VocabDict: No handler for message type:', request.type);
        throw new Error(`Unknown message type: ${request.type}`);
    }
    
    try {
        const result = await handler(request.payload, sender);
        return {
            status: MessageStatus.SUCCESS,
            data: result
        };
    } catch (error) {
        console.error('VocabDict: Handler error:', error);
        return {
            status: MessageStatus.ERROR,
            error: error.message
        };
    }
}

// Message listener
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender)
        .then(response => {
            sendResponse(response);
        })
        .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({
                status: MessageStatus.ERROR,
                error: error.message
            });
        });
    
    return true; // Indicates async response
});

// Context menu click handler
browser.contextMenus.onClicked.addListener(handleContextMenuClick);

// Initialize on install/update
browser.runtime.onInstalled.addListener(async (details) => {
    console.log('VocabDict: Extension installed/updated:', details.reason);
    await initialize();
});

// Initialize when service worker starts
initialize().catch(error => {
    console.error('VocabDict: Initial initialization failed:', error);
});