import { Platform, Plugin, WorkspaceLeaf } from "obsidian";
import { GeneralModal } from "./modal";
import CTPSettingTab from "./settingsTab";
import { DEFAULT_SETTINGS, Settings } from "./types";

export default class CycleThroughPanes extends Plugin {
    settings: Settings;
    ctrlPressedTimestamp = 0;
    ctrlKeyCode: string | undefined;
    // TODO move to settings
    focusLeafOnKeyUp = true // set to false to restore original behavior
    queuedFocusLeaf: WorkspaceLeaf
    leafIndex = 0;
    modal: GeneralModal | undefined;
    leaves: WorkspaceLeaf[];

    keyDownFunc = this.onKeyDown.bind(this);
    keyUpFunc = this.onKeyUp.bind(this);

    getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
        const leaves: WorkspaceLeaf[] = [];
        const activeLeaf = this.app.workspace.activeLeaf;
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (this.settings.skipPinned && leaf.getViewState().pinned) return;

            const correctViewType = types.contains(leaf.view.getViewType());

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
        console.log("loading plugin: Cycle through panes");

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
                            this.settings.viewTypes
                        );
                        const index = leaves.indexOf(active);

                        if (index === leaves.length - 1) {
                            this.queueFocusLeaf(leaves[0]);
                        } else {
                            this.queueFocusLeaf(leaves[index + 1]);
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
                            this.settings.viewTypes
                        );
                        const index = leaves.indexOf(active);

                        if (index !== undefined) {
                            if (index === 0) {
                                this.queueFocusLeaf(leaves[leaves.length - 1]);
                            } else {
                                this.queueFocusLeaf(leaves[index - 1]);
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
                        this.saveSettings();
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
                            active.view.getViewType()
                        );
                        this.saveSettings();
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
                app.workspace.leftSplit.expand();
                let leaf: WorkspaceLeaf;
                app.workspace.iterateAllLeaves((e) => {
                    if (e.getRoot() == app.workspace.leftSplit) {
                        if (e.activeTime > (leaf?.activeTime || 0)) {
                            leaf = e;
                        }
                    }
                });
                this.queueFocusLeaf(leaf);
            },
        });

        this.addCommand({
            id: "focus-right-sidebar",
            name: "Focus on right sidebar",
            callback: () => {
                app.workspace.rightSplit.expand();
                let leaf: WorkspaceLeaf;
                app.workspace.iterateAllLeaves((e) => {
                    if (e.getRoot() == app.workspace.rightSplit) {
                        if (e.activeTime > (leaf?.activeTime || 0)) {
                            leaf = e;
                        }
                    }
                });
                this.queueFocusLeaf(leaf);
            },
        });

        this.addCommand({
            id: "focus-on-last-active-pane",
            name: "Go to previous tab",
            callback: async () => {
                this.setLeaves();
                const leaves = this.leaves;
                if (this.settings.showModal) {
                    this.modal = new GeneralModal(leaves, this);
                    this.leafIndex = await this.modal.open();
                } else {
                    this.leafIndex = this.leafIndex + 1;
                    if (this.leafIndex >= this.leaves.length)
                        this.leafIndex = 0;
                }
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
                if (this.settings.showModal) {
                    this.modal = new GeneralModal(leaves, this);
                    this.leafIndex = await this.modal.open();
                } else {
                    this.leafIndex = this.leafIndex - 1;
                    if (this.leafIndex < 0) this.leafIndex = leaves.length - 1;
                }
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
        if (this.focusLeafOnKeyUp) {
            this.queuedFocusLeaf = leaf
        } else {
            this.focusLeaf(leaf)
        }
    }

    focusLeaf(leaf: WorkspaceLeaf) {
        if (leaf) {
            const root = leaf.getRoot();
            if (root != this.app.workspace.rootSplit && Platform.isMobile) {
                root.openLeaf(leaf);
                leaf.activeTime = Date.now();
            } else {
                this.app.workspace.setActiveLeaf(leaf, { focus: true });
            }
            if (leaf.getViewState().type == "search") {
                const search = leaf.view.containerEl.find(
                    ".search-input-container input"
                );

                search.focus();
            }
        }
    }

    setLeaves() {
        if (!this.leaves) {
            const leaves = this.getLeavesOfTypes(this.settings.viewTypes);
            leaves.sort((a, b) => {
                return b.activeTime - a.activeTime;
            });
            this.leaves = leaves;
            this.leafIndex = leaves.indexOf(this.app.workspace.activeLeaf);
        }
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key == "Control") {
            this.ctrlPressedTimestamp = e.timeStamp;
            this.ctrlKeyCode = e.code;
        }
    }

    onKeyUp(e: KeyboardEvent) {
        if (e.code == this.ctrlKeyCode && this.ctrlPressedTimestamp) {
            this.ctrlPressedTimestamp = 0;
            this.leaves = null;

            this.modal?.close();

            if (this.queueFocusLeaf) {
                this.focusLeaf(this.queuedFocusLeaf)
            }

            this.modal = undefined;
        }
    }

    onunload() {
        console.log("unloading plugin: Cycle through panes");
        window.removeEventListener("keydown", this.keyDownFunc);
        window.removeEventListener("keyup", this.keyUpFunc);
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
