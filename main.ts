import { App, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';

export default class CycleThroughPanes extends Plugin {
    lastPanes: string[] = [];
    onload() {
        console.log('loading plugin: Cycle through panes');

        this.addCommand({
            id: 'cycle-through-panes',
            name: 'Cycle through panes',
            callback: () => {
                let active = this.app.workspace.activeLeaf;
                let leafs: WorkspaceLeaf[] = [];
                this.app.workspace.iterateAllLeaves((leaf) => {
                    if (leaf.getViewState().type == "markdown") {
                        if (leaf.getRoot() === this.app.workspace.rootSplit)
                            leafs.push(leaf);
                    }
                });
                let index = leafs.indexOf(active);
                if (index == leafs.length - 1) {
                    setActiveLeaf(leafs[0], this.app);
                }
                else {
                    setActiveLeaf(leafs[index + 1], this.app);
                }

            }, hotkeys: [
                {
                    modifiers: ["Ctrl"],
                    key: "Tab"
                }
            ]

        });
        function setActiveLeaf(newLeaf: WorkspaceLeaf, app: App) {
            app.workspace.setActiveLeaf(newLeaf);
            fixCursor(newLeaf);
        }

        function fixCursor(newLeaf: WorkspaceLeaf) {
            let view = newLeaf.view as MarkdownView;
            let editor = view.sourceMode.cmEditor;
            editor.focus();
        }

        this.addCommand({
            id: 'cycle-through-panes-reverse',
            name: 'Cycle through panes (Reverse)',
            callback: () => {
                let active = this.app.workspace.activeLeaf;
                let leafs: WorkspaceLeaf[] = [];
                this.app.workspace.iterateAllLeaves((leaf) => {
                    if (leaf.getViewState().type == "markdown")
                        if (leaf.getRoot() === this.app.workspace.rootSplit)
                            leafs.push(leaf);
                });
                let index = leafs.indexOf(active);
                if (index == 0) {
                    setActiveLeaf(leafs[leafs.length - 1], this.app);
                }
                else {
                    setActiveLeaf(leafs[index - 1], this.app);
                }

            }, hotkeys: [
                {
                    modifiers: ["Ctrl", "Shift"],
                    key: "Tab"
                }
            ]

        });
        //fires when a new file is opened or the focus switches to another pane
        this.app.workspace.on("file-open", () => {
            //use just markdown panes
            if (this.app.workspace.activeLeaf.getViewState().type != "markdown") {
                return;
            }
            //if a file gets opened in current pane
            if (this.lastPanes?.last() == this.app.workspace.activeLeaf.id) {
                return;
            }
            //keep a history of 10 panes
            if (this.lastPanes.length > 10) {
                this.lastPanes.splice(0, 1);
            }
            //add current pane to history
            this.lastPanes.push(this.app.workspace.activeLeaf.id);
        });

        this.addCommand({
            id: 'focus-on-last-active-pane',
            name: 'Focus on last active pane',
            callback: () => {
                let leaf;
                //Cycle thorough the history until a pane is still there and not the current pane
                for (var i = 2; i <= this.lastPanes.length; i++) {
                    if (this.lastPanes[this.lastPanes.length - i] == this.lastPanes.last())
                        continue;
                    leaf = this.app.workspace.getLeafById(this.lastPanes[this.lastPanes.length - i]);
                    if (leaf) break;
                }
                if (leaf) {
                    setActiveLeaf(leaf, this.app);
                }
            }
        });

    }

    onunload() {
        console.log('unloading plugin: Cycle through panes');
    }
}