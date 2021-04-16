import {App, moment, Plugin, PluginSettingTab, Setting} from 'obsidian';

interface MyPluginSettings {
	template: string;
}

const DEFAULT_TEMPLATE = (
		"---\n" +
		"date: {{date:YYYY-MM-DD}}\n" +
		"aliases: []\n" +
		"---\n"
);

const DEFAULT_SETTINGS: MyPluginSettings = {
	template: DEFAULT_TEMPLATE
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading new-file-template plugin');

		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.addCommand({
			id: 'new-file-with-template',
			name: 'Create new file with template',
			callback: this.createNewFile.bind(this)
		});

		// this.registerEvent(this.app.vault.on("create", this.onFileCreated.bind(this)));
	}

	async createNewFile() : Promise<boolean> {
			console.log("Create new file with template!!")
			const data = this.renderTemplate(this.settings.template);
			for (let i=0; i<1000; i++) {
				const path = i==0 ? "Untitled.md" : "Untitled " + i + ".md";
				try {
					await this.app.vault.create(path, data);
				} catch (e) {
					console.log(path);
					console.log(e);
					continue;
				}
				await this.app.workspace.openLinkText(path, '', false);
				console.log("All done!");
				return true;
			}
			return false;
	}

	renderTemplate(v: string) {
		return v.replace(/{{\s*date\s*:\s*(.*?)}}/gi, (_, fmt) => {
			return moment().format(fmt);
		});
	}

	onunload() {
		console.log('unloading new-file-templatte plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for new-file-template.'});

		new Setting(containerEl)
			.setName('Template')
			.setDesc('Template string\n' + 'Date formats are supported {{date:YYYYMMDDHHmm}}')
			.addTextArea(text => {
						text.setPlaceholder(DEFAULT_TEMPLATE)
								.setValue(this.plugin.settings.template)
								.onChange(async (value) => {
									console.log('Template string: ' + value);
									this.plugin.settings.template = value;
									await this.plugin.saveSettings();
								});
						text.inputEl.rows = 10;
					}
			);
	}
}
