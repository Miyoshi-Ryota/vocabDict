/**
 * Request to increment the lookup count for a word.
 */
export interface IncrementLookupCountRequest {
    /**
     * The action to be performed. Must be 'incrementLookupCount'.
     */
    action: Action;
    /**
     * The word whose lookup count should be incremented.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    IncrementLookupCount = "incrementLookupCount",
}
