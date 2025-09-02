/**
 * Response from adding a word to recent searches.
 */
export interface AddRecentSearchResponse {
    /**
     * Error message if the operation failed.
     */
    error?: string;
    /**
     * Whether the word was successfully added to recent searches.
     */
    success: boolean;
    [property: string]: any;
}
