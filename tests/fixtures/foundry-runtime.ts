// Adapter contract fixture, not a replacement for the licensed Foundry runtime.
import Handlebars from "handlebars";
import "../../styles/index.css";
import managerTemplate from "../../templates/gm/manager.hbs?raw";
import creatorTemplate from "../../templates/gm/editor.hbs?raw";
import articleTemplate from "../../templates/reader/article.hbs?raw";
import portalTemplate from "../../templates/reader/portal.hbs?raw";
import { registerHelpers } from "../../src/settings";
import { Newsroom } from "../../src/core/newsroom";
import { MemoryNewsStore } from "../../src/storage/memory-store";
import { EditorSession } from "../../src/ui/editor";
import { newItem } from "../../src/domain/model";

const globals = globalThis as any;
const errors: string[] = [];
let active = "";
const configs: any[] = [];
const renders: Array<{ id: string; force?: boolean }> = [];
registerHelpers(Handlebars);
Handlebars.registerPartial("modules/holosuite-news/dist/templates/reader/article.hbs", articleTemplate);
const templates = {manager: Handlebars.compile(managerTemplate), creator: Handlebars.compile(creatorTemplate), article: Handlebars.compile(articleTemplate), portal: Handlebars.compile(portalTemplate)};

class ApplicationContract {
  element?: HTMLElement;
  rendered = false;
  options: any;
  constructor(options: any = {}) {
    this.options = {...(this.constructor as any).DEFAULT_OPTIONS, ...options};
  }
  async _onRender(): Promise<void> {}
  async render(options: any = {}): Promise<this> {
    renders.push({id: this.options.id, force: options.force});
    if (!this.rendered && !options.force) return this;
    const context = await (this as any)._prepareContext();
    const root = this.element ?? document.createElement("section");
    root.className = "hsn-window hn-no-motion";
    root.id = this.options.id;
    root.style.cssText = "width:1050px;height:760px;position:relative;margin:12px";
    root.innerHTML = '<div class="window-content" style="height:100%">'+(this.options.id.startsWith("holonews-creator") ? templates.creator(context) : this.options.id === "holonews-portal" ? templates.portal(context) : templates.manager(context))+'</div>';
    if (!root.isConnected) document.body.append(root);
    this.element = root;
    this.rendered = true;
    active = root.id; // Foundry raises a window when it is rendered.
    await (this as any)._onRender(context, options);
    return this;
  }
  bringToFront(): void { active = this.options.id; }
  async close(): Promise<void> {
    // Native rich editor teardown can emit a final change from the old DOM.
    this.element?.querySelector("form[data-editor]")?.dispatchEvent(new Event("change", {bubbles: true}));
    this.element?.remove();
    this.rendered = false;
  }
}
class RichTextContract extends HTMLElement {
  initial = "";
  get value(): string { return this.querySelector(".editor-content")?.innerHTML ?? this.initial; }
  set value(value: string) { this.initial = value; }
  static create(config: any): RichTextContract {
    configs.push(config);
    const rich = document.createElement("prose-mirror") as RichTextContract;
    rich.className = "prosemirror";
    rich.setAttribute("name", config.name);
    rich.value = config.value;
    if (config.height) rich.style.height = `${config.height}px`;
    return rich;
  }
  connectedCallback(): void {
    this.innerHTML = '<div class="editor-menu"><button type="button" data-heading>Título</button><button type="button" data-native-save>Salvar texto</button></div><div class="editor-container"><div class="editor-content ProseMirror" contenteditable="true" role="textbox" aria-label="Texto da notícia"></div></div>';
    const content = this.querySelector<HTMLElement>(".editor-content")!;
    content.innerHTML = this.initial;
    this.querySelector("[data-heading]")!.addEventListener("mousedown", (event) => {
      event.preventDefault(); content.focus(); document.execCommand("formatBlock", false, "h2");
      this.dispatchEvent(new Event("input", {bubbles: true}));
    });
    this.querySelector("[data-native-save]")!.addEventListener("click", () => this.dispatchEvent(new Event("save")));
  }
}
customElements.define("prose-mirror", RichTextContract);
const style = document.createElement("style");
// Native editor descendants rely on their outer flex layout for usable height.
style.textContent = '.prosemirror .editor-container {position:relative;flex:1;min-height:0}.prosemirror .editor-content {position:absolute;inset:0;min-height:0;color:#eee}';
document.head.prepend(style);
globals.foundry = {applications: {api: {ApplicationV2: ApplicationContract, HandlebarsApplicationMixin: (base: any) => base}, elements: {HTMLProseMirrorElement: RichTextContract}}};
const settings: Record<string, unknown> = {reduceMotion:true,fontScale:1,portalName:"HoloNews",portalTagline:"O seu mundo. Em transmissão.",portalLocation:"Rede de teste"};
globals.game = {user: {id:"gm",isGM:true,active:true}, users:[{id:"gm",isGM:true,active:true}], settings:{get: (_module: string,key: string) => settings[key]},journal:[]};
globals.ui = {notifications:{error:(message: string) => errors.push(message)}};
globals.TextEditor = {enrichHTML: async (value: string) => value};
globals.renderTemplate = async (_path: string, context: any) => templates.article(context);
const {ManagerApp} = await import("../../src/apps/editorial-app");
const {PortalApp} = await import("../../src/apps/reader-app");
const store = new MemoryNewsStore();
let manager: InstanceType<typeof ManagerApp>;
const room = new Newsroom(store, () => {}, () => "new", () => manager?.refresh());
const item = newItem("fixture");
item.draft.title = "Notícia do teste";
item.draft.body = "<p>Texto inicial visível</p>";
await store.save(item, 0);
manager = new ManagerApp(room, () => {});
await manager.render({force:true});
await manager.edit(item.id);
globals.fixture = {
  errors, configs, renders, manager, room, settings,
  openReader: async () => {const portal = new PortalApp(room); await portal.render({force:true}); return portal;},
  active: () => active,
  creator: () => (manager as any).creators.get(item.id),
  saved: () => room.get(item.id),
  // Independent session used to test delayed promises and detached form events.
  makeSession(root: HTMLElement, preview: () => Promise<string>) {
    return new EditorSession(newItem("session"), room, {preview, confirm:async () => true,error:(error) => errors.push(String(error)),changed:() => {},pickImage:async () => null});
  },
};
