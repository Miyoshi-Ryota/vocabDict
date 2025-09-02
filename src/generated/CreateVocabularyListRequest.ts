/**
 * Request to create a new vocabulary list.
 */
export interface CreateVocabularyListRequest {
    /**
     * The action to be performed. Must be 'createVocabularyList'.
     */
    action: Action;
    /**
     * Whether this list should be the default list.
     */
    isDefault?: boolean;
    /**
     * The name of the new vocabulary list.
     */
    name: string;
    [property: string]: any;
}

export enum Action {
    CreateVocabularyList = "createVocabularyList",
}
