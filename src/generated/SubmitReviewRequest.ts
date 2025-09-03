/**
 * Request to submit a review result for a word.
 */
export interface SubmitReviewRequest {
    /**
     * The action to be performed. Must be 'submitReview'.
     */
    action: Action;
    /**
     * The ID of the vocabulary list containing the word.
     */
    listId: string;
    /**
     * The review result indicating how well the user knew the word.
     */
    reviewResult: ReviewResult;
    /**
     * Time spent on the review in seconds.
     */
    timeSpent?: number;
    /**
     * The word being reviewed.
     */
    word: string;
    [property: string]: any;
}

export enum Action {
    SubmitReview = "submitReview",
}

/**
 * The review result indicating how well the user knew the word.
 */
export enum ReviewResult {
    Known = "known",
    Unknown = "unknown",
    Mastered = "mastered",
    Skipped = "skipped",
}
