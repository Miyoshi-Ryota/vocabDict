// Toy Dictionary - 50 Common English Words for VocabDict
// This will be replaced with a real dictionary API in production

const TOY_DICTIONARY = {
  "hello": {
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

  "world": {
    pronunciations: [
      { type: "US", phonetic: "/wɜːrld/" },
      { type: "UK", phonetic: "/wɜːld/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The earth and all the people and things on it",
        examples: ["The world is a beautiful place."]
      },
      {
        partOfSpeech: "noun",
        meaning: "A particular area of activity or experience",
        examples: ["The world of technology is constantly changing."]
      }
    ],
    synonyms: ["earth", "globe", "planet"],
    antonyms: [],
    examples: [
      "Welcome to the world!",
      "The world is your oyster."
    ]
  },

  "good": {
    pronunciations: [
      { type: "US", phonetic: "/ɡʊd/" },
      { type: "UK", phonetic: "/ɡʊd/" }
    ],
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "Of high quality; satisfactory",
        examples: ["This is a good book."]
      },
      {
        partOfSpeech: "noun",
        meaning: "Something that is beneficial or advantageous",
        examples: ["Exercise is good for your health."]
      }
    ],
    synonyms: ["excellent", "fine", "great"],
    antonyms: ["bad", "poor", "terrible"],
    examples: [
      "Have a good day!",
      "That's a good idea."
    ]
  },

  "time": {
    pronunciations: [
      { type: "US", phonetic: "/taɪm/" },
      { type: "UK", phonetic: "/taɪm/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The indefinite continued progress of existence",
        examples: ["Time flies when you're having fun."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To plan or schedule",
        examples: ["I need to time this correctly."]
      }
    ],
    synonyms: ["duration", "period", "moment"],
    antonyms: [],
    examples: [
      "What time is it?",
      "Time is money."
    ]
  },

  "person": {
    pronunciations: [
      { type: "US", phonetic: "/ˈpɜːrsən/" },
      { type: "UK", phonetic: "/ˈpɜːsən/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A human being regarded as an individual",
        examples: ["She's a nice person."]
      }
    ],
    synonyms: ["individual", "human", "being"],
    antonyms: [],
    examples: [
      "Every person is unique.",
      "He's the right person for the job."
    ]
  },

  "year": {
    pronunciations: [
      { type: "US", phonetic: "/jɪr/" },
      { type: "UK", phonetic: "/jɪə/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A period of 365 or 366 days",
        examples: ["This year has been challenging."]
      }
    ],
    synonyms: ["annum", "twelve months"],
    antonyms: [],
    examples: [
      "Happy New Year!",
      "I've been studying for a year."
    ]
  },

  "way": {
    pronunciations: [
      { type: "US", phonetic: "/weɪ/" },
      { type: "UK", phonetic: "/weɪ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A method or manner of doing something",
        examples: ["There's more than one way to solve this."]
      },
      {
        partOfSpeech: "noun",
        meaning: "A road or path",
        examples: ["Which way should we go?"]
      }
    ],
    synonyms: ["method", "path", "route"],
    antonyms: [],
    examples: [
      "This is the way to do it.",
      "Where there's a will, there's a way."
    ]
  },

  "day": {
    pronunciations: [
      { type: "US", phonetic: "/deɪ/" },
      { type: "UK", phonetic: "/deɪ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A 24-hour period",
        examples: ["What a beautiful day!"]
      },
      {
        partOfSpeech: "noun",
        meaning: "The time between sunrise and sunset",
        examples: ["I work during the day."]
      }
    ],
    synonyms: ["daylight", "daytime"],
    antonyms: ["night"],
    examples: [
      "Day by day, things get better.",
      "Seize the day!"
    ]
  },

  "thing": {
    pronunciations: [
      { type: "US", phonetic: "/θɪŋ/" },
      { type: "UK", phonetic: "/θɪŋ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "An object or entity not precisely designated",
        examples: ["What is that thing?"]
      },
      {
        partOfSpeech: "noun",
        meaning: "A matter or situation",
        examples: ["The thing is, we need more time."]
      }
    ],
    synonyms: ["object", "item", "matter"],
    antonyms: [],
    examples: [
      "First things first.",
      "The best thing about this is..."
    ]
  },

  "man": {
    pronunciations: [
      { type: "US", phonetic: "/mæn/" },
      { type: "UK", phonetic: "/mæn/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "An adult male human being",
        examples: ["He's a kind man."]
      },
      {
        partOfSpeech: "noun",
        meaning: "Humans in general",
        examples: ["Man has walked on the moon."]
      }
    ],
    synonyms: ["male", "gentleman", "guy"],
    antonyms: ["woman"],
    examples: [
      "Every man for himself.",
      "Man's best friend is a dog."
    ]
  },

  "work": {
    pronunciations: [
      { type: "US", phonetic: "/wɜːrk/" },
      { type: "UK", phonetic: "/wɜːk/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "Activity involving mental or physical effort",
        examples: ["I have a lot of work to do."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To engage in physical or mental activity",
        examples: ["I work from home."]
      }
    ],
    synonyms: ["job", "labor", "employment"],
    antonyms: ["rest", "leisure", "play"],
    examples: [
      "All work and no play makes Jack a dull boy.",
      "Work hard, play hard."
    ]
  },

  "life": {
    pronunciations: [
      { type: "US", phonetic: "/laɪf/" },
      { type: "UK", phonetic: "/laɪf/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The existence of an individual human being",
        examples: ["Life is precious."]
      },
      {
        partOfSpeech: "noun",
        meaning: "Living things and their activity",
        examples: ["There's life on this planet."]
      }
    ],
    synonyms: ["existence", "being", "living"],
    antonyms: ["death"],
    examples: [
      "Life is what happens when you're busy making other plans.",
      "The meaning of life."
    ]
  },

  "child": {
    pronunciations: [
      { type: "US", phonetic: "/tʃaɪld/" },
      { type: "UK", phonetic: "/tʃaɪld/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A young human being below the age of puberty",
        examples: ["The child is playing in the park."]
      }
    ],
    synonyms: ["kid", "youngster", "minor"],
    antonyms: ["adult"],
    examples: [
      "Every child deserves a good education.",
      "Child's play."
    ]
  },

  "eye": {
    pronunciations: [
      { type: "US", phonetic: "/aɪ/" },
      { type: "UK", phonetic: "/aɪ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The organ of sight",
        examples: ["She has beautiful blue eyes."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To look at closely",
        examples: ["He eyed the cake hungrily."]
      }
    ],
    synonyms: ["vision", "sight"],
    antonyms: [],
    examples: [
      "The eye of the storm.",
      "Beauty is in the eye of the beholder."
    ]
  },

  "hand": {
    pronunciations: [
      { type: "US", phonetic: "/hænd/" },
      { type: "UK", phonetic: "/hænd/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The end part of the arm beyond the wrist",
        examples: ["She waved her hand goodbye."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To give or pass with the hand",
        examples: ["Please hand me that book."]
      }
    ],
    synonyms: ["palm", "fist"],
    antonyms: [],
    examples: [
      "A bird in the hand is worth two in the bush.",
      "Give me a hand."
    ]
  },

  // Continue with more words...
  "place": {
    pronunciations: [
      { type: "US", phonetic: "/pleɪs/" },
      { type: "UK", phonetic: "/pleɪs/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A particular position or location",
        examples: ["This is a nice place to live."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To put in a particular position",
        examples: ["Place the book on the table."]
      }
    ],
    synonyms: ["location", "spot", "area"],
    antonyms: [],
    examples: [
      "There's no place like home.",
      "Everything in its place."
    ]
  },

  "school": {
    pronunciations: [
      { type: "US", phonetic: "/skuːl/" },
      { type: "UK", phonetic: "/skuːl/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "An institution for educating children",
        examples: ["She goes to school every day."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To educate or train",
        examples: ["He was schooled in classical music."]
      }
    ],
    synonyms: ["academy", "institution", "college"],
    antonyms: [],
    examples: [
      "School of thought.",
      "Old school."
    ]
  },

  "house": {
    pronunciations: [
      { type: "US", phonetic: "/haʊs/" },
      { type: "UK", phonetic: "/haʊs/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A building for human habitation",
        examples: ["They bought a new house."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To provide with shelter",
        examples: ["This building houses our offices."]
      }
    ],
    synonyms: ["home", "dwelling", "residence"],
    antonyms: [],
    examples: [
      "House and home.",
      "A house divided cannot stand."
    ]
  },

  "water": {
    pronunciations: [
      { type: "US", phonetic: "/ˈwɔːtər/" },
      { type: "UK", phonetic: "/ˈwɔːtə/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A colorless, transparent liquid",
        examples: ["I need a glass of water."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To pour water on",
        examples: ["Please water the plants."]
      }
    ],
    synonyms: ["H2O", "liquid"],
    antonyms: [],
    examples: [
      "Water under the bridge.",
      "Still waters run deep."
    ]
  },

  "food": {
    pronunciations: [
      { type: "US", phonetic: "/fuːd/" },
      { type: "UK", phonetic: "/fuːd/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "Any nutritious substance that people eat",
        examples: ["This restaurant serves delicious food."]
      }
    ],
    synonyms: ["nourishment", "sustenance", "meal"],
    antonyms: [],
    examples: [
      "Food for thought.",
      "Fast food."
    ]
  }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOY_DICTIONARY;
}