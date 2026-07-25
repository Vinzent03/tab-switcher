import { Hotkey, SuggestModal, WorkspaceLeaf } from "obsidian";
import TaskSwitcherPlugin from "./main";

export class GeneralModal extends SuggestModal<WorkspaceLeaf> {
    constructor(
        private leaves: WorkspaceLeaf[],
        private readonly plugin: TaskSwitcherPlugin,
        private readonly forwardHotkeys: Hotkey[],
        private readonly reverseHotkeys: Hotkey[],
    ) {
        super(plugin.app);
    }

    open(): void {
        this.dimBackground = false;
        super.open();

        const initialIndex =
            this.plugin.leafIndex >= 0 ? this.plugin.leafIndex : 0;
        this.chooser.setSelectedItem(initialIndex);
        this.focusTab();

        this.containerEl
            .getElementsByClassName("prompt-input-container")
            .item(0)
            ?.detach();

        this.registerHotkeys(this.forwardHotkeys, 1);
        this.registerHotkeys(this.reverseHotkeys, -1);
    }

    getSuggestions(_: string): WorkspaceLeaf[] {
        return this.leaves;
    }

    renderSuggestion(leaf: WorkspaceLeaf, el: HTMLElement): void {
        el.setText(leaf.view.getDisplayText());
        el.addEventListener("mouseenter", () => {
            const index = this.leaves.indexOf(leaf);
            if (index >= 0) {
                this.chooser.setSelectedItem(index);
                this.focusTab();
            }
        });
    }

    onChooseSuggestion(leaf: WorkspaceLeaf, _: MouseEvent | KeyboardEvent) {
        const index = this.leaves.indexOf(leaf);
        if (index >= 0) {
            this.chooser.setSelectedItem(index);
            this.plugin.leafIndex = index;
        }

        this.plugin.focusLeaf(leaf);
        this.plugin.queuedFocusLeaf = leaf;
    }

    focusTab(): void {
        this.plugin.leafIndex = this.chooser.selectedItem;
        const leaf = this.leaves[this.chooser.selectedItem];
        if (leaf) {
            this.plugin.queueFocusLeaf(leaf);
        }
    }

    private registerHotkeys(hotkeys: Hotkey[], direction: 1 | -1): void {
        hotkeys.forEach((hotkey) => {
            this.scope.register(hotkey.modifiers, hotkey.key, (_) => {
                this.chooser.setSelectedItem(
                    this.chooser.selectedItem + direction,
                );
                this.focusTab();
            });
        });
    }
}
