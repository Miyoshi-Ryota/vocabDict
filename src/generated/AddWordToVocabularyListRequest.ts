/**
 * Request to add a word to a vocabulary list. It's used for all of
 * UI->(background)->(SwiftWebExtensionHandler)->SwiftData
 */
export interface AddWordToVocabularyListRequest {
    /**
     * The action to be performed. Must be 'addWordToVocabularyList'.
     */
    action: Action;
    /**
     * The ID of the vocabulary list to which the word will be added.
     */
    listId:    string;
    metadata?: Metadata;
    /**
     * The word to be added to the vocabulary list.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    AddWordToVocabularyList = "addWordToVocabularyList",
}

export interface Metadata {
    /**
     * Word frequency value (1 to ~330000)
     */
    difficulty?: number;
    [property: string]: any;
}
