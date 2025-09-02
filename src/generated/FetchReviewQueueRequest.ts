/**
 * Request to fetch words due for review.
 */
export interface FetchReviewQueueRequest {
    /**
     * The action to be performed. Must be 'fetchReviewQueue'.
     */
    action: Action;
    /**
     * Maximum number of words to return in the review queue.
     */
    maxWords?: number;
    [property: string]: any;
}

export enum Action {
    FetchReviewQueue = "fetchReviewQueue",
}
