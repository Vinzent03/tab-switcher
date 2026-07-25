import { SuggestModal, WorkspaceLeaf } from "obsidian";
import CycleThroughPanes from "./main";

export class GeneralModal extends SuggestModal<string> {
    constructor(
        private leaves: WorkspaceLeaf[],
        private readonly plugin: CycleThroughPanes,
    ) {
        super(plugin.app);
    }

    open(): void {
        this.dimBackground = false;
        super.open();

        this.chooser.setSelectedItem(1);
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
        const leaf = this.leaves[this.chooser.selectedItem];
        if (leaf) {
            this.plugin.queueFocusLeaf(leaf);
        }
    }
}
