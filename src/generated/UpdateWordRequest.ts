/**
 * Request to update a word in a vocabulary list.
 */
export interface UpdateWordRequest {
    /**
     * The action to be performed. Must be 'updateWord'.
     */
    action: Action;
    /**
     * The ID of the vocabulary list containing the word.
     */
    listId: string;
    /**
     * The updates to apply to the word.
     */
    updates: Updates;
    /**
     * The word to update.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    UpdateWord = "updateWord",
}

/**
 * The updates to apply to the word.
 */
export interface Updates {
    difficulty?: Difficulty;
    metadata?:   { [key: string]: any };
    notes?:      string;
    [property: string]: any;
}

export enum Difficulty {
    Easy = "easy",
    Hard = "hard",
    Medium = "medium",
}
