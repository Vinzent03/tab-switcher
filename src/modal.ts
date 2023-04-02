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
        this.containerEl
            .getElementsByClassName("prompt-input-container")
            .item(0)
            .detach();
        this.scope.register(["Ctrl"], "Tab", this.chooser.moveDown);
        this.scope.register(["Ctrl", "Shift"], "Tab", this.chooser.moveUp);

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
}
