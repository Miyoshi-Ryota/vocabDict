/**
 * Request to fetch words from a specific vocabulary list.
 */
export interface FetchVocabularyListWordsRequest {
    /**
     * The action to be performed. Must be 'fetchVocabularyListWords'.
     */
    action: Action;
    /**
     * Filter words by difficulty level.
     */
    filterBy?: FilterBy;
    /**
     * The ID of the vocabulary list to fetch words from.
     */
    listId: string;
    /**
     * Sort words by specified criteria.
     */
    sortBy?: SortBy;
    /**
     * Sort order (ascending or descending).
     */
    sortOrder?: SortOrder;
    [property: string]: any;
}

export enum Action {
    FetchVocabularyListWords = "fetchVocabularyListWords",
}

/**
 * Filter words by difficulty level.
 */
export enum FilterBy {
    All = "all",
    Easy = "easy",
    Hard = "hard",
    Medium = "medium",
}

/**
 * Sort words by specified criteria.
 */
export enum SortBy {
    Alphabetical = "alphabetical",
    Date = "date",
    Difficulty = "difficulty",
    Frequency = "frequency",
}

/**
 * Sort order (ascending or descending).
 */
export enum SortOrder {
    Asc = "asc",
    Desc = "desc",
}
