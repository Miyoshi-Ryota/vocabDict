/**
 * Request to update user settings.
 */
export interface UpdateSettingsRequest {
    /**
     * The action to be performed. Must be 'updateSettings'.
     */
    action: Action;
    /**
     * Settings to update.
     */
    settings: Settings;
    [property: string]: any;
}

export enum Action {
    UpdateSettings = "updateSettings",
}

/**
 * Settings to update.
 */
export interface Settings {
    autoPlayPronunciation?: boolean;
    showExampleSentences?:  boolean;
    textSelectionMode?:     TextSelectionMode;
    theme?:                 Theme;
    [property: string]: any;
}

export enum TextSelectionMode {
    Inline = "inline",
    Popup = "popup",
}

export enum Theme {
    Auto = "auto",
    Dark = "dark",
    Light = "light",
}
