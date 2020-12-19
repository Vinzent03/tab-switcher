import { App, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';

export default class CycleThroughPanes extends Plugin {
    onload() {
        console.log('loading plugin: Cycle through panes');

        this.addCommand({
            id: 'cycle-through-panes',
            name: 'Cycle through panes',
            callback: () => {
                let active = this.app.workspace.activeLeaf;
                let leafs: WorkspaceLeaf[] = []
                this.app.workspace.iterateAllLeaves((leaf) => {
                    if (leaf.getViewState().type == "markdown") {
                        if (leaf.getRoot() === this.app.workspace.rootSplit)
                            leafs.push(leaf);
                    }
                })
                let index = leafs.indexOf(active);
                if (index == leafs.length - 1) {
                    setActiveLeaf(leafs[0], this.app)
                }
                else {
                    setActiveLeaf(leafs[index + 1], this.app)
                }

            }, hotkeys: [
                {
                    modifiers: ["Mod"],
                    key: "Tab"
                }
            ]

        });
        function setActiveLeaf(newLeaf: WorkspaceLeaf, app: App) {
            app.workspace.setActiveLeaf(newLeaf)
            fixCursor(newLeaf)
        }

        function fixCursor(newLeaf: WorkspaceLeaf) {
            let view = newLeaf.view as MarkdownView;
            let editor = view.sourceMode.cmEditor;
            editor.focus()
        }

        this.addCommand({
            id: 'cycle-through-panes-reverse',
            name: 'Cycle through panes (Reverse)',
            callback: () => {
                let active = this.app.workspace.activeLeaf;
                let leafs: WorkspaceLeaf[] = []
                this.app.workspace.iterateAllLeaves((leaf) => {
                    if (leaf.getViewState().type == "markdown")
                        if (leaf.getRoot() === this.app.workspace.rootSplit)
                            leafs.push(leaf);
                })
                let index = leafs.indexOf(active);
                if (index == 0) {
                    setActiveLeaf(leafs[leafs.length - 1], this.app)
                }
                else {
                    setActiveLeaf(leafs[index - 1], this.app)
                }

            }, hotkeys: [
                {
                    modifiers: ["Mod", "Shift"],
                    key: "Tab"
                }
            ]

        });

    }

    onunload() {
        console.log('unloading plugin: Cycle through panes');
    }
}