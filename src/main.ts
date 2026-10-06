import "../styles/index.css";
import { MODULE_ID, TEMPLATE_ROOT } from "./constants";
import { Newsroom } from "./core/newsroom";
import { FoundryNewsStore } from "./storage/foundry-store";
import { assertWriter, primaryGM } from "./permissions/authority";
import { ManagerApp } from "./apps/editorial-app";
import { PortalApp } from "./apps/reader-app";
import { registerSettings, registerHelpers } from "./settings";
import { PreferencesApp } from "./apps/preferences-app";
import { GMWriteCoordinator } from "./permissions/gm-coordinator";
import { runNewsroomCommand } from "./core/commands";
import { PublicationAlerts } from "./ui/alerts";
import {
  registerWithHoloSuite,
  type HoloSuiteAdapter,
} from "./integration/holosuite";

let portal: PortalApp | undefined, manager: ManagerApp | undefined;
let preferences: PreferencesApp | undefined, publicationAlerts: PublicationAlerts | undefined;
let templatesReady: Promise<unknown>;
function refresh(): void {
  if (portal?.rendered) void portal.render({ force: false });
  manager?.refresh();
}
const store = new FoundryNewsStore();
let writer: GMWriteCoordinator;
const newsroom = new Newsroom(
  store,
  assertWriter,
  () => foundry.utils.randomID(),
  () => Hooks.callAll(`${MODULE_ID}.changed`),
  (command,args,local)=>writer.run(command,args,local),
);
writer=new GMWriteCoordinator((command,args)=>runNewsroomCommand(newsroom,command,args),()=>store.workspace());
async function openPortal(): Promise<PortalApp> {
  portal ??= new PortalApp(newsroom);
  await portal.render({ force: true });
  return portal;
}
async function openManager(): Promise<ManagerApp> {
  assertWriter();
  manager ??= new ManagerApp(newsroom, () => {
    void openPortal();
  });
  await manager.render({ force: true });
  return manager;
}
const api = Object.freeze({
  version: "2.7.3",
  openSettings: async () => { preferences ??= new PreferencesApp(); await preferences.render({ force: true }); return preferences; },
  openReader: openPortal,
  openManager,
  openArticle: async (id: string) => {
    const app = await openPortal();
    await app.openArticle(id);
    return app;
  },
  getArticles: () => newsroom.articles(game.user),
  createArticle: async () => {
    const app = await openManager(),
      item = await newsroom.create();
    await app.edit(item.id);
    return item.id;
  },
  exportBackup: () => newsroom.backup(),
});
const adapter: HoloSuiteAdapter = {
  getApi: () => game.modules.get("holosuite-core")?.api,
  currentUserIsGM: () => game.user.isGM,
  openManager: () => void openManager().catch(report),
  openReader: () => void openPortal().catch(report),
};
function registerTile(): void {
  try {
    registerWithHoloSuite(adapter);
  } catch (error) {
    report(error);
  }
}
function report(error: unknown): void {
  console.error("HoloNews", error);
  ui.notifications.error(
    error instanceof Error ? error.message : String(error),
  );
}
Hooks.once("init", () => {
  registerSettings();
  registerHelpers();
  templatesReady = loadTemplates([`${TEMPLATE_ROOT}/reader/article.hbs`, `${TEMPLATE_ROOT}/gm/motion-fields.hbs`]);
  game.modules.get(MODULE_ID).api = api;
  (globalThis as any).HoloNews = api;
});
Hooks.once("ready", async () => {
  await templatesReady;
  registerTile();
  writer.listen();
  publicationAlerts = new PublicationAlerts(api.openArticle);
  publicationAlerts.prime(game.journal ?? []);
  if (game.user.isGM && primaryGM()?.id === game.user.id) {
    try {
      await newsroom.recover();
    } catch (error) {
      report(error);
    }
  }
  Hooks.callAll(`${MODULE_ID}.ready`, api);
});
Hooks.on("holosuite-core.apiReady", registerTile);
Hooks.on(`${MODULE_ID}.changed`, () => manager?.refresh());
Hooks.on(`${MODULE_ID}.brandChanged`, refresh);
Hooks.on(`${MODULE_ID}.openPreferences`, () => void api.openSettings().catch(report));
Hooks.on(`${MODULE_ID}.appearanceChanged`, () => publicationAlerts?.appearanceChanged());
Hooks.on(`${MODULE_ID}.motionChanged`, (reduced: boolean) => {
  portal?.updateMotionPreference(reduced);
  manager?.updateMotionPreference(reduced);
});
for (const event of [
  "createJournalEntry",
  "updateJournalEntry",
  "deleteJournalEntry",
])
  Hooks.on(event, (doc: any, ...args: any[]) => {
    const userId = args.at(-1);
    if (!doc.pack) {
      if (event === "deleteJournalEntry") publicationAlerts?.remove(doc);
      else publicationAlerts?.observe(doc,userId);
    }
    if (doc.pack === "world.holonews-workspace" && doc.getFlag(MODULE_ID,"kind")==="workspace" && userId !== game.user.id) {
      store.invalidate(); manager?.refresh();
    }
    if (
      !doc.pack &&
      doc.getFlag(MODULE_ID, "kind") === "article" &&
      portal?.rendered
    )
      void portal.render({ force: false });
  });
Hooks.on("updateSetting", (setting: any) => {
  if (setting.key === "core.compendiumConfiguration") store.invalidate();
});
Hooks.on("updateUser", (user: any, changes: any) => {
  if("active" in changes || "role" in changes) writer.leadershipChanged();
  publicationAlerts?.permissionsChanged();
  if (user.id === game.user.id && "role" in changes && !game.user.isGM) {
    const previous = manager;
    manager = undefined;
    void previous?.revokeAccess().catch(report);
    store.invalidate();
    writer.dispose();
  }
  if(user.id===game.user.id && "role" in changes && game.user.isGM) writer.listen();
  if ("active" in changes && game.user.isGM && primaryGM()?.id === game.user.id)
    void newsroom.recover().catch(report);
  if (user.id === game.user.id && ("role" in changes || "active" in changes))
    refresh();
});

Hooks.on(`${MODULE_ID}.replayMotion`, () => void openPortal().then(app => { app.bringToFront?.(); app.replayMotion(); }).catch(report));

Hooks.on("updateCompendium", (pack:any,_documents:any[],_options:any,userId:string)=>{if(pack.collection==="world.holonews-workspace" && userId!==game.user.id){store.invalidate();manager?.refresh();}});
