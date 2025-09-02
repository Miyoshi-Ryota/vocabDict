/**
 * Request to fetch user settings.
 */
export interface FetchSettingsRequest {
    /**
     * The action to be performed. Must be 'fetchSettings'.
     */
    action: Action;
    [property: string]: any;
}

export enum Action {
    FetchSettings = "fetchSettings",
}
