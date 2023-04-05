import { SuggestModal, WorkspaceLeaf } from "obsidian";

export class GeneralModal extends SuggestModal<string> {
    resolve: (value: number) => void;

    constructor(private leaves: WorkspaceLeaf[]) {
        super(app);
    }

    open(): Promise<number> {
        this.dimBackground = false;
        super.open();

        this.chooser.setSelectedItem(1);
        this.focusTab();

        this.containerEl
            .getElementsByClassName("prompt-input-container")
            .item(0)
            .detach();

        // hotkey = this.app.hotkeyManager.bakedIds.find((e)=>e == "")

        this.scope.register(["Ctrl"], "Tab", (e) => {
            this.chooser.setSelectedItem(this.chooser.selectedItem + 1);
            this.focusTab();
        });

        this.scope.register(["Ctrl", "Shift"], "Tab", (e) => {
            this.chooser.setSelectedItem(this.chooser.selectedItem - 1);
            this.focusTab();
        });

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    onClose() {
        if (this.resolve) this.resolve(this.chooser.selectedItem);
    }

    getSuggestions(query: string): string[] {
        return this.leaves.map((leaf) => leaf.view.getDisplayText());
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {}

    focusTab(): void {
        this.app.workspace.setActiveLeaf(
            this.leaves[this.chooser.selectedItem],
            { focus: true }
        );
    }
}
