import { PluginSettingTab, Setting } from "obsidian";
import CycleThroughPanes from "./main";
import { Settings } from "./types";

export default class TabSwitcherSettingTab extends PluginSettingTab {
    settings: Settings;
    plugin: CycleThroughPanes;

    constructor(plugin: CycleThroughPanes, settings: Settings) {
        super(plugin.app, plugin);
        this.settings = settings;
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Only cycle through tabs with specific view types")
            .addToggle((cb) => {
                cb.setValue(this.settings.useViewTypes);
                cb.onChange(async (value) => {
                    this.settings.useViewTypes = value;
                    await this.plugin.saveSettings();
                });
            });

        const descEl = createFragment();
        descEl.append(
            createEl("p", {
                text: "If the option above is enabled: These are the view types this plugin will cycle through using any of the available commands.",
            }),
            createEl("p", {
                text: 'To add a new view type to this list, simply run the command: "Tab Switcher: Enable this view type". More advanced users can edit and delete the types in the text field (one per line).',
            }),
        );

        new Setting(containerEl)
            .setName("Enabled view types")
            .setDesc(descEl)
            .addTextArea((cb) => {
                let value = "";
                this.settings.viewTypes.forEach(
                    (type) => (value += type + "\n"),
                );
                cb.setValue(value);
                cb.setPlaceholder("Markdown");
                cb.onChange(async (newValue) => {
                    //                                                    No empty lines
                    this.settings.viewTypes = newValue
                        .split("\n")
                        .filter((pre) => !!pre);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Show modal when switching tabs")
            .addToggle((cb) => {
                cb.setValue(this.settings.showModal);
                cb.onChange(async (value) => {
                    this.settings.showModal = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Focus tab on release")
            .setDesc(
                "If enabled, defer switching tabs until the ctrl key is released, similar to VS Code and firefox",
            )
            .addToggle((cb) => {
                cb.setValue(this.settings.focusLeafOnKeyUp);
                cb.onChange(async (value) => {
                    this.settings.focusLeafOnKeyUp = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl).setName("Skip pinned tabs").addToggle((cb) => {
            cb.setValue(this.settings.skipPinned);
            cb.onChange(async (value) => {
                this.settings.skipPinned = value;
                await this.plugin.saveSettings();
            });
        });

        new Setting(containerEl)
            .setName("Stay in current split")
            .setDesc(
                "If enabled and the current active file is in the sidebar, you cycle within that sidebar and can't switch to the main tabs.",
            )
            .addToggle((cb) => {
                cb.setValue(this.settings.stayInSplit);
                cb.onChange(async (value) => {
                    this.settings.stayInSplit = value;
                    await this.plugin.saveSettings();
                });
            });
    }
}
