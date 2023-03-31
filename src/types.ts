export interface Settings {
    viewTypes: string[];
}

export const DEFAULT_SETTINGS: Settings = {
    viewTypes: ["markdown", "canvas"],
};

declare module "obsidian" {
    interface App {
        hotkeyManager: {
            bakedIds: string[];
            bakedHotkeys: { modifiers: string; key: string }[];
        };
    }

    interface WorkspaceLeaf {
        activeTime: number;
    }
}
