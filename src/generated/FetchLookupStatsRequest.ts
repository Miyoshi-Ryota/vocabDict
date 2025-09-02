/**
 * Request to fetch lookup statistics.
 */
export interface FetchLookupStatsRequest {
    /**
     * The action to be performed. Must be 'fetchLookupStats'.
     */
    action: Action;
    [property: string]: any;
}

export enum Action {
    FetchLookupStats = "fetchLookupStats",
}
