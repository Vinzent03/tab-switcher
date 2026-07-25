import { Platform, Plugin, WorkspaceLeaf } from "obsidian";
import { GeneralModal } from "./modal";
import CTPSettingTab from "./settingsTab";
import { DEFAULT_SETTINGS, NEW_USER_SETTINGS, Settings } from "./types";

export default class TaskSwitcherPlugin extends Plugin {
    settings!: Settings;
    ctrlPressedTimestamp = 0;
    ctrlKeyCode: string | undefined;
    queuedFocusLeaf: WorkspaceLeaf | undefined;
    leafIndex = 0;
    modal: GeneralModal | undefined;
    leaves: WorkspaceLeaf[] | null = null;

    keyDownFunc = this.onKeyDown.bind(this);
    keyUpFunc = this.onKeyUp.bind(this);

    getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
        const leaves: WorkspaceLeaf[] = [];
        const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf) {
            return leaves;
        }

        this.app.workspace.iterateAllLeaves((leaf) => {
            if (this.settings.skipPinned && leaf.getViewState().pinned) return;

            const correctViewType =
                !this.settings.useViewTypes ||
                types.contains(leaf.view.getViewType());

            if (!correctViewType) return;

            const isMainWindow = leaf.view.containerEl.win == window;
            const sameWindow = leaf.view.containerEl.win == activeWindow;

            let correctPane = false;
            if (isMainWindow) {
                if (this.settings.stayInSplit) {
                    correctPane =
                        sameWindow && leaf.getRoot() == activeLeaf.getRoot();
                } else {
                    correctPane =
                        sameWindow &&
                        leaf.getRoot() == this.app.workspace.rootSplit;
                }
            } else {
                correctPane = sameWindow;
            }
            if (correctPane) {
                leaves.push(leaf);
            }
        });

        return leaves;
    }

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new CTPSettingTab(this, this.settings));

        this.addCommand({
            id: "cycle-through-panes",
            name: "Go to right tab",
            checkCallback: (checking: boolean) => {
                const active = this.app.workspace.activeLeaf;

                if (active) {
                    if (!checking) {
                        const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(
                            this.settings.viewTypes,
                        );
                        const index = leaves.indexOf(active);

                        const nextLeaf =
                            index === leaves.length - 1
                                ? leaves[0]
                                : leaves[index + 1];
                        if (nextLeaf) {
                            this.queueFocusLeaf(nextLeaf);
                        }
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "cycle-through-panes-reverse",
            name: "Go to left tab",
            checkCallback: (checking: boolean) => {
                const active = this.app.workspace.activeLeaf;
                if (active) {
                    if (!checking) {
                        const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(
                            this.settings.viewTypes,
                        );
                        const index = leaves.indexOf(active);

                        if (index !== -1) {
                            const previousLeaf =
                                index === 0
                                    ? leaves[leaves.length - 1]
                                    : leaves[index - 1];
                            if (previousLeaf) {
                                this.queueFocusLeaf(previousLeaf);
                            }
                        }
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "cycle-through-panes-add-view",
            name: "Enable this View Type",
            checkCallback: (checking: boolean) => {
                const active = this.app.workspace.activeLeaf;
                if (
                    active &&
                    !this.settings.viewTypes.contains(active.view.getViewType())
                ) {
                    if (!checking) {
                        this.settings.viewTypes.push(active.view.getViewType());
                        void this.saveSettings();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "cycle-through-panes-remove-view",
            name: "Disable this View Type",
            checkCallback: (checking: boolean) => {
                const active = this.app.workspace.activeLeaf;
                if (
                    active &&
                    this.settings.viewTypes.contains(active.view.getViewType())
                ) {
                    if (!checking) {
                        this.settings.viewTypes.remove(
                            active.view.getViewType(),
                        );
                        void this.saveSettings();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "focus-left-sidebar",
            name: "Focus on left sidebar",
            callback: () => {
                this.app.workspace.leftSplit.expand();
                let leaf: WorkspaceLeaf | undefined;
                this.app.workspace.iterateAllLeaves((workspaceLeaf) => {
                    if (
                        workspaceLeaf.getRoot() == this.app.workspace.leftSplit
                    ) {
                        if (
                            workspaceLeaf.activeTime > (leaf?.activeTime || 0)
                        ) {
                            leaf = workspaceLeaf;
                        }
                    }
                });
                if (leaf) {
                    this.queueFocusLeaf(leaf);
                }
            },
        });

        this.addCommand({
            id: "focus-right-sidebar",
            name: "Focus on right sidebar",
            callback: () => {
                this.app.workspace.rightSplit.expand();
                let leaf: WorkspaceLeaf | undefined;
                this.app.workspace.iterateAllLeaves((workspaceLeaf) => {
                    if (
                        workspaceLeaf.getRoot() == this.app.workspace.rightSplit
                    ) {
                        if (
                            workspaceLeaf.activeTime > (leaf?.activeTime || 0)
                        ) {
                            leaf = workspaceLeaf;
                        }
                    }
                });
                if (leaf) {
                    this.queueFocusLeaf(leaf);
                }
            },
        });

        this.addCommand({
            id: "focus-on-last-active-pane",
            name: "Go to previous tab",
            callback: async () => {
                this.setLeaves();
                const leaves = this.leaves;
                if (!leaves?.length) {
                    return;
                }

                this.leafIndex = (this.leafIndex + 1) % leaves.length;
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.queueFocusLeaf(leaf);
                }
            },
        });
        this.addCommand({
            id: "focus-on-last-active-pane-reverse",
            name: "Go to next tab",
            callback: async () => {
                this.setLeaves();
                const leaves = this.leaves;
                if (!leaves?.length) {
                    return;
                }

                this.leafIndex =
                    (this.leafIndex - 1 + leaves.length) % leaves.length;
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.queueFocusLeaf(leaf);
                }
            },
        });

        window.addEventListener("keydown", this.keyDownFunc);
        window.addEventListener("keyup", this.keyUpFunc);
    }

    queueFocusLeaf(leaf: WorkspaceLeaf) {
        if (this.settings.focusLeafOnKeyUp) {
            this.queuedFocusLeaf = leaf;
        } else {
            this.focusLeaf(leaf);
        }
    }

    focusLeaf(leaf: WorkspaceLeaf) {
        const root = leaf.getRoot();
        if (root != this.app.workspace.rootSplit && Platform.isMobile) {
            root.openLeaf(leaf);
            leaf.activeTime = Date.now();
        } else {
            this.app.workspace.setActiveLeaf(leaf, { focus: true });
        }
        if (leaf.getViewState().type == "search") {
            const search = leaf.view.containerEl.find(
                ".search-input-container input",
            );

            search?.focus();
        }
    }

    setLeaves() {
        if (!this.leaves) {
            const leaves = this.getLeavesOfTypes(this.settings.viewTypes);
            leaves.sort((a, b) => {
                return b.activeTime - a.activeTime;
            });
            this.leaves = leaves;
            const activeLeaf = this.app.workspace.activeLeaf;
            this.leafIndex = activeLeaf ? leaves.indexOf(activeLeaf) : -1;
        }
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key == "Control") {
            this.ctrlPressedTimestamp = e.timeStamp;
            this.ctrlKeyCode = e.code;

            // clean slate -- prevent ctrl keystroke from accidentally switching to another tab
            this.queuedFocusLeaf = undefined;
        }
    }

    onKeyUp(e: KeyboardEvent) {
        if (e.code == this.ctrlKeyCode && this.ctrlPressedTimestamp) {
            this.ctrlPressedTimestamp = 0;
            this.leaves = null;

            this.modal?.close();

            if (this.queuedFocusLeaf) {
                this.focusLeaf(this.queuedFocusLeaf);
            }

            this.modal = undefined;
        }

        if (
            e.code == "Tab" &&
            this.ctrlPressedTimestamp &&
            this.settings.showModal &&
            !this.modal &&
            this.leaves
        ) {
            this.modal = new GeneralModal(this.leaves, this);
            void this.modal.open();
        }
    }

    onunload() {
        window.removeEventListener("keydown", this.keyDownFunc);
        window.removeEventListener("keyup", this.keyUpFunc);
    }

    async loadSettings() {
        // returns null if .obsidian/plugins/cycle-through-panes/data.json does not exist
        const userSettings =
            (await this.loadData()) as Partial<Settings> | null;

        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            userSettings ? userSettings : NEW_USER_SETTINGS,
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
