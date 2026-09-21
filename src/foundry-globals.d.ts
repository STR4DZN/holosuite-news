declare const game: any;
declare const ui: any;
declare const Hooks: any;
declare const foundry: any;
declare const JournalEntry: any;
declare const FilePicker: any;
declare const TextEditor: any;
declare const Handlebars: any;
declare const Dialog: any;
declare const saveDataToFile: any;
declare function renderTemplate(path: string, data: object): Promise<string>;
declare function loadTemplates(paths: string[]): Promise<unknown>;

interface Window {
  HoloNews?: unknown;
}
