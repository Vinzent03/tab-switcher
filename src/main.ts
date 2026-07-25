import { Hotkey, ItemView, Platform, Plugin, WorkspaceLeaf } from "obsidian";
import { GeneralModal } from "./modal";
import CTPSettingTab from "./settingsTab";
import {
    DEFAULT_SETTINGS,
    ModifierKey,
    NEW_USER_SETTINGS,
    Settings,
} from "./types";

const RIGHT_TAB_COMMAND_ID = "cycle-through-panes";
const LEFT_TAB_COMMAND_ID = "cycle-through-panes-reverse";
const PREVIOUS_TAB_COMMAND_ID = "focus-on-last-active-pane";
const NEXT_TAB_COMMAND_ID = "focus-on-last-active-pane-reverse";
type CycleMode = "tab-order" | "mru";

export default class TaskSwitcherPlugin extends Plugin {
    settings!: Settings;
    activeHoldModifier: ModifierKey | null = null;
    activeCycleMode: CycleMode | null = null;
    activeForwardCommandId: string | null = null;
    activeReverseCommandId: string | null = null;
    pressedModifiers = new Set<ModifierKey>();
    queuedFocusLeaf: WorkspaceLeaf | undefined;
    leafIndex = 0;
    modal: GeneralModal | undefined;
    leaves: WorkspaceLeaf[] | null = null;
    keyDownFunc = this.onKeyDown.bind(this);
    keyUpFunc = this.onKeyUp.bind(this);

    getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
        const leaves: WorkspaceLeaf[] = [];
        const activeLeaf =
            this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
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
            id: RIGHT_TAB_COMMAND_ID,
            name: "Go to right tab",
            checkCallback: (checking: boolean) => {
                const active = this.app.workspace.getActiveViewOfType(ItemView);

                if (active) {
                    if (!checking) {
                        this.prepareHeldNavigation(
                            "tab-order",
                            RIGHT_TAB_COMMAND_ID,
                            LEFT_TAB_COMMAND_ID,
                        );
                        this.setLeaves("tab-order");
                        const leaves = this.leaves;
                        if (!leaves?.length) {
                            return false;
                        }

                        this.leafIndex = (this.leafIndex + 1) % leaves.length;
                        const leaf = leaves[this.leafIndex];
                        if (leaf) {
                            this.queueFocusLeaf(leaf);
                            this.openModalIfNeeded();
                        }

                        if (!this.activeHoldModifier) {
                            this.resetCycleState();
                        }
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: LEFT_TAB_COMMAND_ID,
            name: "Go to left tab",
            checkCallback: (checking: boolean) => {
                const active =
                    this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
                if (active) {
                    if (!checking) {
                        this.prepareHeldNavigation(
                            "tab-order",
                            RIGHT_TAB_COMMAND_ID,
                            LEFT_TAB_COMMAND_ID,
                        );
                        this.setLeaves("tab-order");
                        const leaves = this.leaves;
                        if (!leaves?.length) {
                            return false;
                        }

                        this.leafIndex =
                            (this.leafIndex - 1 + leaves.length) %
                            leaves.length;
                        const leaf = leaves[this.leafIndex];
                        if (leaf) {
                            this.queueFocusLeaf(leaf);
                            this.openModalIfNeeded();
                        }

                        if (!this.activeHoldModifier) {
                            this.resetCycleState();
                        }
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "cycle-through-panes-add-view",
            name: "Enable this view type",
            checkCallback: (checking: boolean) => {
                const active =
                    this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
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
            name: "Disable this view type",
            checkCallback: (checking: boolean) => {
                const active =
                    this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
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
            id: PREVIOUS_TAB_COMMAND_ID,
            name: "Go to previous tab",
            callback: async () => {
                this.prepareHeldNavigation(
                    "mru",
                    PREVIOUS_TAB_COMMAND_ID,
                    NEXT_TAB_COMMAND_ID,
                );
                this.setLeaves("mru");
                const leaves = this.leaves;
                if (!leaves?.length) {
                    return;
                }

                this.leafIndex = (this.leafIndex + 1) % leaves.length;
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.queueFocusLeaf(leaf);
                    this.openModalIfNeeded();
                }

                if (!this.activeHoldModifier) {
                    this.resetCycleState();
                }
            },
        });
        this.addCommand({
            id: NEXT_TAB_COMMAND_ID,
            name: "Go to next tab",
            callback: async () => {
                this.prepareHeldNavigation(
                    "mru",
                    PREVIOUS_TAB_COMMAND_ID,
                    NEXT_TAB_COMMAND_ID,
                );
                this.setLeaves("mru");
                const leaves = this.leaves;
                if (!leaves?.length) {
                    return;
                }

                this.leafIndex =
                    (this.leafIndex - 1 + leaves.length) % leaves.length;
                const leaf = leaves[this.leafIndex];

                if (leaf) {
                    this.queueFocusLeaf(leaf);
                    this.openModalIfNeeded();
                }

                if (!this.activeHoldModifier) {
                    this.resetCycleState();
                }
            },
        });

        window.addEventListener("keydown", this.keyDownFunc);
        window.addEventListener("keyup", this.keyUpFunc);
    }

    queueFocusLeaf(leaf: WorkspaceLeaf) {
        if (this.settings.focusLeafOnKeyUp && this.activeHoldModifier) {
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

    setLeaves(mode: CycleMode) {
        if (!this.leaves) {
            const leaves = this.getLeavesOfTypes(this.settings.viewTypes);
            if (mode === "mru") {
                leaves.sort((a, b) => {
                    return b.activeTime - a.activeTime;
                });
            }
            this.leaves = leaves;
            const activeLeaf =
                this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
            this.leafIndex = activeLeaf ? leaves.indexOf(activeLeaf) : -1;
        }
    }

    onKeyDown(e: KeyboardEvent) {
        const modifier = this.getModifierFromKey(e.key);
        if (!modifier) {
            return;
        }

        this.pressedModifiers.add(modifier);
    }

    onKeyUp(e: KeyboardEvent) {
        const releasedModifier = this.getModifierFromKey(e.key);
        if (releasedModifier) {
            this.pressedModifiers.delete(releasedModifier);
        }

        if (!this.isHeldModifierRelease(e)) {
            return;
        }

        this.activeHoldModifier = null;
        this.modal?.close();

        if (this.queuedFocusLeaf) {
            this.focusLeaf(this.queuedFocusLeaf);
        }

        this.resetCycleState();
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

    private prepareHeldNavigation(
        mode: CycleMode,
        forwardCommandId: string,
        reverseCommandId: string,
    ): void {
        this.activeHoldModifier = this.getHeldModifier();
        const cycleChanged =
            this.activeCycleMode !== mode ||
            this.activeForwardCommandId !== forwardCommandId ||
            this.activeReverseCommandId !== reverseCommandId;

        if (cycleChanged) {
            this.leaves = null;
            this.modal?.close();
            this.modal = undefined;
        }

        this.activeCycleMode = mode;
        this.activeForwardCommandId = forwardCommandId;
        this.activeReverseCommandId = reverseCommandId;

        if (this.activeHoldModifier) {
            // Prevent a stale queued leaf from being focused when a new hold-cycle starts.
            this.queuedFocusLeaf = undefined;
        } else {
            this.resetCycleState();
        }
    }

    private isHeldModifierRelease(event: KeyboardEvent): boolean {
        if (!this.activeHoldModifier) {
            return false;
        }

        return event.key === this.activeHoldModifier;
    }

    private getHeldModifier(): ModifierKey | null {
        if (this.pressedModifiers.has("Meta")) {
            return "Meta";
        }
        if (this.pressedModifiers.has("Control")) {
            return "Control";
        }
        if (this.pressedModifiers.has("Alt")) {
            return "Alt";
        }
        if (this.pressedModifiers.has("Shift")) {
            return "Shift";
        }

        return null;
    }

    private getModifierFromKey(key: string): ModifierKey | null {
        switch (key) {
            case "Control":
            case "Meta":
            case "Alt":
            case "Shift":
                return key;
            default:
                return null;
        }
    }

    private getHotkeysForCommand(commandId: string): Hotkey[] {
        const scopedCommandId = this.getScopedCommandId(commandId);
        const customHotkeys =
            this.app.hotkeyManager.customKeys[scopedCommandId];
        if (customHotkeys?.length) {
            return customHotkeys;
        }

        return this.app.commands.commands[scopedCommandId]?.hotkeys ?? [];
    }

    private openModalIfNeeded(): void {
        if (
            !this.activeHoldModifier ||
            !this.settings.showModal ||
            this.modal ||
            !this.leaves ||
            !this.activeForwardCommandId ||
            !this.activeReverseCommandId
        ) {
            return;
        }

        this.modal = new GeneralModal(
            this.leaves,
            this,
            this.getHotkeysForCommand(this.activeForwardCommandId),
            this.getHotkeysForCommand(this.activeReverseCommandId),
        );
        void this.modal.open();
    }

    private resetCycleState(): void {
        this.leaves = null;
        this.modal = undefined;
        this.activeCycleMode = null;
        this.activeForwardCommandId = null;
        this.activeReverseCommandId = null;
    }

    private getScopedCommandId(commandId: string): string {
        return `${this.manifest.id}:${commandId}`;
    }
}
