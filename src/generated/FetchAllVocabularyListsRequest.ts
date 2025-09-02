/**
 * Request to fetch all vocabulary lists.
 */
export interface FetchAllVocabularyListsRequest {
    /**
     * The action to be performed. Must be 'fetchAllVocabularyLists'.
     */
    action: Action;
    [property: string]: any;
}

export enum Action {
    FetchAllVocabularyLists = "fetchAllVocabularyLists",
}
