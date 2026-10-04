import "../styles/index.css";
import { MODULE_ID, TEMPLATE_ROOT } from "./constants";
import { Newsroom } from "./core/newsroom";
import { FoundryNewsStore } from "./storage/foundry-store";
import { assertWriter, primaryGM } from "./permissions/authority";
import { ManagerApp } from "./apps/editorial-app";
import { PortalApp } from "./apps/reader-app";
import { registerSettings, registerHelpers } from "./settings";
import { installSessionDice } from "./integration/session-dice";
import {
  registerWithHoloSuite,
  type HoloSuiteAdapter,
} from "./integration/holosuite";

let portal: PortalApp | undefined, manager: ManagerApp | undefined;
let templatesReady: Promise<unknown>;
function refresh(): void {
  if (portal?.rendered) void portal.render({ force: false });
  manager?.refresh();
}
const store = new FoundryNewsStore();
const newsroom = new Newsroom(
  store,
  assertWriter,
  () => foundry.utils.randomID(),
  () => Hooks.callAll(`${MODULE_ID}.changed`),
);
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
  version: "2.2.2",
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
  templatesReady = loadTemplates([`${TEMPLATE_ROOT}/reader/article.hbs`]);
  game.modules.get(MODULE_ID).api = api;
  (globalThis as any).HoloNews = api;
});
Hooks.once("ready", async () => {
  installSessionDice({
    prototype:
      (globalThis as any).CONFIG?.Dice?.terms?.d?.prototype ??
      foundry.dice?.terms?.Die?.prototype,
    getUser: () => game.user,
  });
  await templatesReady;
  registerTile();
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
    if (doc.pack === "world.holonews-workspace" && userId !== game.user.id)
      store.invalidate();
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
  if (user.id === game.user.id && "role" in changes && !game.user.isGM) {
    const previous = manager;
    manager = undefined;
    void previous?.revokeAccess().catch(report);
    store.invalidate();
  }
  if ("active" in changes && game.user.isGM && primaryGM()?.id === game.user.id)
    void newsroom.recover().catch(report);
  if (user.id === game.user.id && ("role" in changes || "active" in changes))
    refresh();
});
