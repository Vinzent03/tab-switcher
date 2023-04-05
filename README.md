# Cycle through Panes ![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/phibr0/cycle-through-panes) ![](https://tokei.rs/b1/github/phibr0/cycle-through-panes) ![GitHub all releases](https://img.shields.io/github/downloads/phibr0/cycle-through-panes/total)

__This Plugin uses Code from [Vinzent](https://github.com/Vinzent03)__

_In Combination with Mr. Jackphils Jump to Link plugin and Vim Keybindings, this plugin allows you to control Obsidian entirely without a Mouse!_

## How to use

There are two different groups of commands:
- Navigate in the order of the tabs from left to right. In contrast to the native Obsidian commands, they ignore panes/tab groups and work per window.
  - "Go to right tab" Typically set to <kbd>Ctrl</kbd> + <kbd>Tab</kbd>
  - "Go to left tab" Typically set to <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd>
- Navigate in the order they were last used. These support holding the <kbd>Ctrl</kbd> key like in a browser.
  - "Go to previous tab" Typically set to <kbd>Ctrl</kbd> + <kbd>Tab</kbd>
  - "Go to next tab" Typically set to <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd>


Note that this plugin does not set any default hotkeys, so that you can choose the behavior you prefer.

## Showcase of the second mode

![Showcase](https://raw.githubusercontent.com/phibr0/cycle-through-panes/master/showcase.gif)

### Important

To prevent navigating to unwanted view types, there is a list in the settings, where you can specify which view types should be cycled through. There are additional commands to automatically add the current view type to the list or to remove it from the list.


---
### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/cycle-through-panes/`.

### API Documentation

See https://github.com/obsidianmd/obsidian-api
