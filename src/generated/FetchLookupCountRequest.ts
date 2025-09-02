/**
 * Request to fetch the lookup count for a specific word.
 */
export interface FetchLookupCountRequest {
    /**
     * The action to be performed. Must be 'fetchLookupCount'.
     */
    action: Action;
    /**
     * The word to get the lookup count for.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    FetchLookupCount = "fetchLookupCount",
}
