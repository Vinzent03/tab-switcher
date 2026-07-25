import { SuggestModal, WorkspaceLeaf } from "obsidian";
import TaskSwitcherPlugin from "./main";

export class GeneralModal extends SuggestModal<string> {
    constructor(
        private leaves: WorkspaceLeaf[],
        private readonly plugin: TaskSwitcherPlugin,
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

        // hotkey = this.app.hotkeyManager.bakedIds.find((e)=>e == "")

        this.scope.register(["Ctrl"], "Tab", (_) => {
            this.chooser.setSelectedItem(this.chooser.selectedItem + 1);
            this.focusTab();
        });

        this.scope.register(["Ctrl", "Shift"], "Tab", (_) => {
            this.chooser.setSelectedItem(this.chooser.selectedItem - 1);
            this.focusTab();
        });
    }

    getSuggestions(_: string): string[] {
        return this.leaves.map((leaf) => leaf.view.getDisplayText());
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    onChooseSuggestion(_: string, __: MouseEvent | KeyboardEvent) {}

    focusTab(): void {
        this.plugin.leafIndex = this.chooser.selectedItem;
        const leaf = this.leaves[this.chooser.selectedItem];
        if (leaf) {
            this.plugin.queueFocusLeaf(leaf);
        }
    }
}
