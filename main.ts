import { Plugin } from 'obsidian';

export default class CycleThroughPanes extends Plugin {
	lastPanes: string[] = [];

	onload() {
		console.log('loading plugin: Cycle through panes');

		this.addCommand({
			id: 'cycle-through-panes',
			name: 'Cycle through Panes',
			checkCallback: (checking: boolean) => {
				let active = this.app.workspace.activeLeaf;
				if (active) {
					if (!checking) {
						let leafs = this.app.workspace.getLeavesOfType("markdown");
						let index = leafs.indexOf(active);
						if (index === leafs.length - 1) {
							this.app.workspace.setActiveLeaf(leafs[0], true, true);
						} else {
							this.app.workspace.setActiveLeaf(leafs[index + 1], true, true);
						}
					}
					return true;
				}
				return false;
			}, hotkeys: [
                {
                    modifiers: ["Ctrl"],
                    key: "Tab"
                }
			]
		});

		this.addCommand({
			id: 'cycle-through-panes-reverse',
			name: 'Cycle through panes (Reverse)',
			checkCallback: (checking: boolean) => {
				let active = this.app.workspace.activeLeaf;
				if (active) {
					if (!checking) {
						let leafs = this.app.workspace.getLeavesOfType("markdown");
						let index = leafs.indexOf(active);
						if (index !== undefined) {
							if (index === 0) {
								this.app.workspace.setActiveLeaf(leafs[leafs.length - 1], true, true);
							} else {
								this.app.workspace.setActiveLeaf(leafs[index - 1], true, true);
							}
						}
					}
					return true;
				}
				return false;
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
			if (this.lastPanes?.last() == (this.app.workspace.activeLeaf as any).id) {
				return;
			}
			//keep a history of 10 panes
			if (this.lastPanes.length > 10) {
				this.lastPanes.splice(0, 1);
			}
			//add current pane to history
			this.lastPanes.push((this.app.workspace.activeLeaf as any).id);
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
					this.app.workspace.setActiveLeaf(leaf, true, true);
				}
			}
		});

	}

	onunload() {
		console.log('unloading plugin: Cycle through panes');
	}
}
