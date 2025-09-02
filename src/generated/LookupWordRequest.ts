/**
 * Request to lookup a word in the dictionary.
 */
export interface LookupWordRequest {
    /**
     * The action to be performed. Must be 'lookupWord'.
     */
    action: Action;
    /**
     * The word to lookup in the dictionary.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    LookupWord = "lookupWord",
}
