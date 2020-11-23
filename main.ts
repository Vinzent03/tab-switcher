import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';

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
                    if (leaf.getViewState().type == "markdown")
                        leafs.push(leaf);
                })
                let index = leafs.indexOf(active);
				if (index == leafs.length - 1)
                    this.app.workspace.setActiveLeaf(leafs[0])
                else
                    this.app.workspace.setActiveLeaf(leafs[index + 1])

            }, hotkeys: [
                {
                    modifiers: ["Mod"],
                    key: "Tab"
                }
            ]

        });

        this.addCommand({
            id: 'cycle-through-panes-reverse',
            name: 'Cycle through panes (Reverse)',
            callback: () => {
                let active = this.app.workspace.activeLeaf;
                let leafs: WorkspaceLeaf[] = []
                this.app.workspace.iterateAllLeaves((leaf) => {
                    if (leaf.getViewState().type == "markdown")
                        leafs.push(leaf);
                })
                let index = leafs.indexOf(active);
				if (index == 0)
                    this.app.workspace.setActiveLeaf(leafs[leafs.length-1])
                else
                    this.app.workspace.setActiveLeaf(leafs[index - 1])

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