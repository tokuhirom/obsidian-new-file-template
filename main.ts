import {
  App,
  MarkdownView,
  moment,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

interface NewFileTemplatePluginSettings {
  template: string;
}

const DEFAULT_TEMPLATE = `---
date: {{date:YYYY-MM-DD}}
aliases: []
---



`;

const DEFAULT_SETTINGS: NewFileTemplatePluginSettings = {
  template: DEFAULT_TEMPLATE,
};

export default class NewFileTemplatePlugin extends Plugin {
  settings: NewFileTemplatePluginSettings;

  async onload(): Promise<void> {
    console.log("loading new-file-template plugin");

    await this.loadSettings();

    this.addSettingTab(new NewFileTemplatePluginSettingTab(this.app, this));

    this.app.workspace.on("file-open", this.onFileOpen.bind(this));
  }

  private async onFileOpen(file: TFile): Promise<void> {
    if (file == null) {
      return;
    }

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView == null) {
      return;
    }

    if (file.stat.size == 0 && markdownView.getMode() == "source") {
      const content = this.renderTemplate(this.settings.template);
      await markdownView.sourceMode.set(content, false);

      await markdownView.editor.focus();
      await markdownView.editor.setCursor({
        line: content.split(/\n/).length,
        ch: 1,
      });
      // same as `workspace:edit-file-title`
      await this.app.workspace
        .getActiveViewOfType(MarkdownView)
        ?.setEphemeralState({ rename: "all" });
    }
  }

  private renderTemplate(v: string): string {
    return v.replace(/{{\s*date\s*:\s*(.*?)}}/gi, (_, fmt) => {
      return moment().format(fmt);
    });
  }

  onunload(): void {
    console.log("unloading new-file-templatte plugin");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class NewFileTemplatePluginSettingTab extends PluginSettingTab {
  plugin: NewFileTemplatePlugin;

  constructor(app: App, plugin: NewFileTemplatePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Template")
      .setDesc(
        "Template string\n" + "Date formats are supported {{date:YYYYMMDDHHmm}}"
      )
      .addTextArea((text) => {
        text
          .setPlaceholder(DEFAULT_TEMPLATE)
          .setValue(this.plugin.settings.template)
          .onChange(async (value) => {
            console.log("Template string: " + value);
            this.plugin.settings.template = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 10;
      });
  }
}
