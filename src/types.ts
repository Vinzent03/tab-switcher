export interface Settings {
    viewTypes: string[];
    onlyRootLeaves: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    viewTypes: ['markdown'],
    onlyRootLeaves: true,
}