import { Plugin, WorkspaceLeaf } from 'obsidian';
import CTPSettingTab from './settingsTab';
import { DEFAULT_SETTINGS, Settings } from './types';

export default class CycleThroughPanes extends Plugin {
	lastPanes: string[] = [];
	settings: Settings;

	getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
		const leaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (
				types.contains(leaf.view.getViewType())
				&& (!this.settings.onlyRootLeaves
					|| leaf.getRoot() == this.app.workspace.rootSplit)
			) {
				leaves.push(leaf);
			}
		});
		return leaves;
	}

	async onload() {
		console.log('loading plugin: Cycle through panes');

		await this.loadSettings();

		this.addSettingTab(new CTPSettingTab(this, this.settings));

		this.addCommand({
			id: 'cycle-through-panes',
			name: 'Cycle through Panes',
			checkCallback: (checking: boolean) => {
				const active = this.app.workspace.activeLeaf;
				if (active) {
					if (!checking) {
						const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(this.settings.viewTypes);
						const index = leaves.indexOf(active);

						if (index === leaves.length - 1) {
							this.app.workspace.setActiveLeaf(leaves[0], true, true);
						} else {
							this.app.workspace.setActiveLeaf(leaves[index + 1], true, true);
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
				const active = this.app.workspace.activeLeaf;
				if (active) {
					if (!checking) {
						const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(this.settings.viewTypes);
						const index = leaves.indexOf(active);

						if (index !== undefined) {
							if (index === 0) {
								this.app.workspace.setActiveLeaf(leaves[leaves.length - 1], true, true);
							} else {
								this.app.workspace.setActiveLeaf(leaves[index - 1], true, true);
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

		this.addCommand({
			id: 'cycle-through-panes-add-view',
			name: 'Enable this View Type',
			checkCallback: (checking: boolean) => {
				const active = this.app.workspace.activeLeaf;
				if (active && !this.settings.viewTypes.contains(active.view.getViewType())) {
					if (!checking) {
						this.settings.viewTypes.push(active.view.getViewType());
						this.saveSettings();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'cycle-through-panes-remove-view',
			name: 'Disable this View Type',
			checkCallback: (checking: boolean) => {
				const active = this.app.workspace.activeLeaf;
				if (active && this.settings.viewTypes.contains(active.view.getViewType())) {
					if (!checking) {
						this.settings.viewTypes.remove(active.view.getViewType());
						this.saveSettings();
					}
					return true;
				}
				return false;
			}
		});

		//fires when a new file is opened or the focus switches to another pane
		this.app.workspace.on("file-open", () => {
			const active = this.app.workspace.activeLeaf;
			//use just markdown panes
			if (!active || !this.settings.viewTypes.contains(active.view.getViewType())) {
				return;
			}
			//if a file gets opened in current pane
			if (this.lastPanes?.last() == (active as any).id) {
				return;
			}
			//keep a history of 10 panes
			if (this.lastPanes.length > 10) {
				this.lastPanes.splice(0, 1);
			}
			//add current pane to history
			this.lastPanes.push((active as any).id);
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
