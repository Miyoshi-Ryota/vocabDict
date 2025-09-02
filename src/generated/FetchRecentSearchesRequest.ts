/**
 * Request to fetch recent searches.
 */
export interface FetchRecentSearchesRequest {
    /**
     * The action to be performed. Must be 'fetchRecentSearches'.
     */
    action: Action;
    /**
     * Maximum number of recent searches to return.
     */
    limit?: number;
    [property: string]: any;
}

export enum Action {
    FetchRecentSearches = "fetchRecentSearches",
}
