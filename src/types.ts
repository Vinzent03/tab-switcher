export interface Settings {
    viewTypes: string[];
    showModal: boolean;
    skipPinned: boolean;
    stayInSplit: boolean;
    focusLeafOnKeyUp: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    viewTypes: ["markdown", "canvas"],
    showModal: true,
    skipPinned: false,
    stayInSplit: true,
    focusLeafOnKeyUp: false, // opt-in for existing users
};

export const NEW_USER_SETTINGS: Partial<Settings> = {
    focusLeafOnKeyUp: true, // default for new users
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

    interface WorkspaceItem {
        openLeaf(leaf: WorkspaceLeaf): void;
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
