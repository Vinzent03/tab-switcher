export interface Settings {
    viewTypes: string[];
    showModal: boolean;
    skipPinned: boolean;
    stayInSplit: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    viewTypes: ["markdown", "canvas"],
    showModal: true,
    skipPinned: false,
    stayInSplit: true,
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

    interface Modal {
        chooser: {
            moveDown: any;
            moveUp: any;
            selectedItem: number;
            setSelectedItem: (index: number) => void;
        };
        dimBackground: boolean;
    }
}
