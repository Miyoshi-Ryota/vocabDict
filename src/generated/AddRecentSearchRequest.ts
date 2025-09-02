/**
 * Request to add a word to recent searches.
 */
export interface AddRecentSearchRequest {
    /**
     * The action to be performed. Must be 'addRecentSearch'.
     */
    action: Action;
    /**
     * The word to add to recent searches.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    AddRecentSearch = "addRecentSearch",
}
