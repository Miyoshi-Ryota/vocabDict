/**
 * Test fixtures for VocabDict tests
 * Contains sample data for testing various scenarios
 */

const SAMPLE_DICTIONARY_ENTRIES = {
  hello: {
    pronunciations: [
      { type: "US", phonetic: "/həˈloʊ/" },
      { type: "UK", phonetic: "/həˈləʊ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A greeting or expression of goodwill",
        examples: ["She gave him a warm hello."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To greet with 'hello'",
        examples: ["I helloed him from across the street."]
      }
    ],
    synonyms: ["hi", "greetings", "salutations"],
    antonyms: ["goodbye", "farewell"],
    examples: [
      "Hello! How are you today?",
      "She said hello to everyone in the room."
    ]
  },
  
  world: {
    pronunciations: [
      { type: "US", phonetic: "/wɜːrld/" },
      { type: "UK", phonetic: "/wɜːld/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The earth and all the people and things on it",
        examples: ["The world is a beautiful place."]
      }
    ],
    synonyms: ["earth", "globe", "planet"],
    antonyms: [],
    examples: [
      "Welcome to the world!",
      "The world is your oyster."
    ]
  },

  test: {
    pronunciations: [
      { type: "US", phonetic: "/tɛst/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A procedure intended to establish the quality, performance, or reliability of something",
        examples: ["The test results were positive."]
      },
      {
        partOfSpeech: "verb",
        meaning: "Take measures to check the quality, performance, or reliability of something",
        examples: ["We need to test the new software."]
      }
    ],
    synonyms: ["examination", "trial", "check"],
    antonyms: [],
    examples: [
      "She passed the driving test.",
      "Let's test this hypothesis."
    ]
  }
};

const SAMPLE_VOCABULARY_WORDS = [
  {
    id: "word_test_001",
    word: "hello",
    definitions: SAMPLE_DICTIONARY_ENTRIES.hello.definitions,
    difficulty: 1,
    reviewCount: 3,
    correctCount: 2,
    lastReviewed: new Date('2023-07-15T10:30:00Z'),
    nextReview: new Date('2023-07-20T10:30:00Z'),
    interval: 5,
    easeFactor: 2.5,
    createdAt: new Date('2023-07-10T10:30:00Z'),
    updatedAt: new Date('2023-07-15T10:30:00Z')
  },
  {
    id: "word_test_002",
    word: "world",
    definitions: SAMPLE_DICTIONARY_ENTRIES.world.definitions,
    difficulty: 2,
    reviewCount: 1,
    correctCount: 1,
    lastReviewed: new Date('2023-07-18T14:20:00Z'),
    nextReview: new Date('2023-07-21T14:20:00Z'),
    interval: 3,
    easeFactor: 2.6,
    createdAt: new Date('2023-07-17T14:20:00Z'),
    updatedAt: new Date('2023-07-18T14:20:00Z')
  },
  {
    id: "word_test_003",
    word: "test",
    definitions: SAMPLE_DICTIONARY_ENTRIES.test.definitions,
    difficulty: 1,
    reviewCount: 0,
    correctCount: 0,
    lastReviewed: null,
    nextReview: new Date(),
    interval: 1,
    easeFactor: 2.5,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const SAMPLE_VOCABULARY_LISTS = [
  {
    id: "list_test_default",
    name: "My Vocabulary",
    wordIds: ["word_test_001", "word_test_002"],
    isDefault: true,
    createdAt: new Date('2023-07-10T09:00:00Z'),
    updatedAt: new Date('2023-07-18T14:20:00Z')
  },
  {
    id: "list_test_002",
    name: "Business English",
    wordIds: ["word_test_003"],
    isDefault: false,
    createdAt: new Date('2023-07-15T16:45:00Z'),
    updatedAt: new Date('2023-07-15T16:45:00Z')
  },
  {
    id: "list_test_empty",
    name: "Empty List",
    wordIds: [],
    isDefault: false,
    createdAt: new Date('2023-07-19T11:30:00Z'),
    updatedAt: new Date('2023-07-19T11:30:00Z')
  }
];

const SAMPLE_USER_SETTINGS = {
  theme: "light",
  autoAdd: true,
  defaultListId: "list_test_default",
  reviewReminders: true,
  sessionSize: 20
};

const SAMPLE_LEARNING_STATS = {
  totalWords: 3,
  wordsReviewed: 4,
  correctAnswers: 3,
  currentStreak: 2,
  longestStreak: 5,
  averageEaseFactor: 2.53,
  timeStudied: 1800, // 30 minutes in seconds
  lastStudyDate: new Date('2023-07-18T14:20:00Z')
};

const MESSAGE_TYPES = {
  // Dictionary operations
  LOOKUP_WORD: 'lookup_word',
  
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
  
  // Content script operations
  SELECTION_LOOKUP: 'selection_lookup'
};

const SAMPLE_ERROR_SCENARIOS = {
  NETWORK_ERROR: {
    name: 'NetworkError',
    message: 'Failed to fetch data'
  },
  DATABASE_ERROR: {
    name: 'DatabaseError',
    message: 'Database operation failed'
  },
  VALIDATION_ERROR: {
    name: 'ValidationError',
    message: 'Invalid input data'
  },
  NOT_FOUND_ERROR: {
    name: 'NotFoundError',
    message: 'Resource not found'
  }
};

const TEST_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  FEEDBACK_DURATION: 2000,
  CACHE_EXPIRY_HOURS: 24,
  MIN_WORD_LENGTH: 2,
  MAX_WORD_LENGTH: 50,
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.0
};

// Test helper functions
const TestHelpers = {
  // Create a deep copy of test data
  clone: (obj) => JSON.parse(JSON.stringify(obj)),
  
  // Generate random test data
  generateRandomWord: () => {
    const words = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    return words[Math.floor(Math.random() * words.length)];
  },
  
  generateRandomId: (prefix = 'test') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Create test word with random data
  createTestWord: (overrides = {}) => ({
    id: TestHelpers.generateRandomId('word'),
    word: TestHelpers.generateRandomWord(),
    definitions: [{
      partOfSpeech: 'noun',
      meaning: 'A test definition',
      examples: ['This is a test example.']
    }],
    difficulty: 1,
    reviewCount: 0,
    correctCount: 0,
    lastReviewed: null,
    nextReview: new Date(),
    interval: 1,
    easeFactor: 2.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // Create test list with random data
  createTestList: (overrides = {}) => ({
    id: TestHelpers.generateRandomId('list'),
    name: `Test List ${Math.floor(Math.random() * 1000)}`,
    wordIds: [],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // Mock successful API response
  createSuccessResponse: (data) => ({
    status: 'success',
    data
  }),
  
  // Mock error API response
  createErrorResponse: (error) => ({
    status: 'error',
    error: error.message || error
  }),
  
  // Validate data structures
  isValidWord: (word) => {
    return word &&
      typeof word.id === 'string' &&
      typeof word.word === 'string' &&
      Array.isArray(word.definitions) &&
      word.definitions.length > 0;
  },
  
  isValidList: (list) => {
    return list &&
      typeof list.id === 'string' &&
      typeof list.name === 'string' &&
      Array.isArray(list.wordIds);
  },
  
  isValidSettings: (settings) => {
    return settings &&
      typeof settings.theme === 'string' &&
      typeof settings.autoAdd === 'boolean';
  }
};

module.exports = {
  SAMPLE_DICTIONARY_ENTRIES,
  SAMPLE_VOCABULARY_WORDS,
  SAMPLE_VOCABULARY_LISTS,
  SAMPLE_USER_SETTINGS,
  SAMPLE_LEARNING_STATS,
  MESSAGE_TYPES,
  SAMPLE_ERROR_SCENARIOS,
  TEST_CONSTANTS,
  TestHelpers
};