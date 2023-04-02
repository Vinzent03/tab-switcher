import { Plugin, WorkspaceLeaf } from "obsidian";
import { GeneralModal } from "./modal";
import CTPSettingTab from "./settingsTab";
import { DEFAULT_SETTINGS, Settings } from "./types";

export default class CycleThroughPanes extends Plugin {
    settings: Settings;
    ctrlPressedTimestamp = 0;
    ctrlKeyCode: string | undefined;
    leafIndex = 0;
    modal: GeneralModal | undefined;
    leaves: WorkspaceLeaf[];

    keyDownFunc = this.onKeyDown.bind(this);
    keyUpFunc = this.onKeyUp.bind(this);

    getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
        const leaves: WorkspaceLeaf[] = [];

        this.app.workspace.iterateAllLeaves((leaf) => {
            const isMainWindow = leaf.view.containerEl.win == window;

            const correctViewType = types.contains(leaf.view.getViewType());
            const sameWindow = leaf.view.containerEl.win == activeWindow;

            //Ignore sidebar panes in the main window, because non-main window don't have a sidebar
            const correctPane = isMainWindow
                ? sameWindow && leaf.getRoot() == this.app.workspace.rootSplit
                : sameWindow;
            if (correctViewType && correctPane) {
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
                            this.app.workspace.setActiveLeaf(
                                leaves[0],
                                true,
                                true
                            );
                        } else {
                            this.app.workspace.setActiveLeaf(
                                leaves[index + 1],
                                true,
                                true
                            );
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
                                this.app.workspace.setActiveLeaf(
                                    leaves[leaves.length - 1],
                                    true,
                                    true
                                );
                            } else {
                                this.app.workspace.setActiveLeaf(
                                    leaves[index - 1],
                                    true,
                                    true
                                );
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
            id: "focus-on-last-active-pane",
            name: "Go to previous tab",
            callback: async () => {
                this.setLeaves();
                const leaves = this.leaves;
                if (this.settings.showModal) {
                    this.modal = new GeneralModal(leaves);
                    this.leafIndex = await this.modal.open();
                } else {
                    this.leafIndex = this.leafIndex + 1;
                    if (this.leafIndex >= this.leaves.length)
                        this.leafIndex = 0;
                }
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.app.workspace.setActiveLeaf(leaf, { focus: true });
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
                    this.modal = new GeneralModal(leaves);
                    this.leafIndex = await this.modal.open();
                } else {
                    this.leafIndex = this.leafIndex - 1;
                    if (this.leafIndex < 0) this.leafIndex = leaves.length - 1;
                }
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.app.workspace.setActiveLeaf(leaf, { focus: true });
                }
            },
        });

        window.addEventListener("keydown", this.keyDownFunc);
        window.addEventListener("keyup", this.keyUpFunc);
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
