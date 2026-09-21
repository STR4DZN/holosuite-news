import "../styles/index.css";

import { createPublicApi, exposePublicApi } from "./api/public-api";
import { HoloNewsApps } from "./apps/controller";
import { MODULE_ID, SOCKET_NAME } from "./constants";
import { Newsroom } from "./core/newsroom";
import type { ReaderIdentity } from "./domain/model";
import { registerWithHoloSuite, type HoloSuiteAdapter } from "./integration/holosuite";
import { FoundryAuthority } from "./permissions/authority";
import { registerHandlebarsHelpers, registerSettings } from "./settings";
import { installSocketHandlers, isPrimaryActiveGM } from "./socket/handlers";
import { FoundryMasterStore } from "./storage/foundry-master-store";
import { FoundryPublishedStore } from "./storage/foundry-published-store";

const master = new FoundryMasterStore();
const published = new FoundryPublishedStore((revision) => {
  game.socket?.emit?.(SOCKET_NAME, { type: "PUBLIC_STATE_UPDATED", revision });
  Hooks.callAll?.(`${MODULE_ID}.projectionUpdated`, revision);
});
const authority = new FoundryAuthority();
const listReaders = (): ReaderIdentity[] => [...(game.users ?? [])].map((user: any) => ({ id: String(user.id), name: String(user.name ?? ""), isGM: user.isGM === true }));
const newsroom = new Newsroom({
  master,
  published,
  authority,
  listReaders,
  onEvent: (action, result) => {
    const hook = ({ CREATE_ISSUE: "newspaperIssueCreated", PUBLISH_ISSUE: "newspaperIssuePublished", ARCHIVE_ISSUE: "newspaperIssueArchived", CREATE_ARTICLE: "newspaperArticleCreated", ARTICLE_OPENED: "newspaperArticleRead" } as Record<string, string>)[action];
    if (hook) Hooks.callAll?.(hook, result);
    Hooks.callAll?.(`${MODULE_ID}.changed`, action, result);
    const id = result && typeof result === "object" && "id" in result ? String((result as { id: unknown }).id) : undefined;
    if (action === "PUBLISH_ISSUE") game.socket?.emit?.(SOCKET_NAME, { type: "ISSUE_PUBLISHED", issueId: id });
    if (action === "UNPUBLISH_ISSUE") game.socket?.emit?.(SOCKET_NAME, { type: "ISSUE_UNPUBLISHED", issueId: id });
  }
});
const apps = new HoloNewsApps(newsroom);
const api = createPublicApi(newsroom, published, apps);
apps.configureApi(api);

const holoSuiteAdapter: HoloSuiteAdapter = {
  getApi: () => game.modules?.get?.("holosuite-core")?.api,
  currentUserIsGM: () => game.user?.isGM === true,
  openManager: () => apps.openManager(),
  openReader: () => apps.openReader({ view: "home" })
};

function registerCoreTile(): boolean {
  try { return registerWithHoloSuite(holoSuiteAdapter); }
  catch (error) { console.error(`${MODULE_ID} | HoloSuite registration failed.`, error); return false; }
}

Hooks.on("holosuite-core.apiReady", registerCoreTile);

Hooks.once("init", () => {
  registerSettings();
  registerHandlebarsHelpers();
  exposePublicApi(api);
  console.info(`${MODULE_ID} | Initialized.`);
});

Hooks.once("ready", async () => {
  const socket = installSocketHandlers({
    newsroom,
    apps,
    users: () => game.users ?? [],
    currentUserId: () => String(game.user?.id ?? "")
  });

  try {
    if (game.user?.isGM) {
      await newsroom.getMasterState();
      await newsroom.publishDueIssues();
      await newsroom.rebuildProjections();
      await socket.scanPendingReadSignals();
    } else {
      game.socket?.emit?.(SOCKET_NAME, { type: "REQUEST_PUBLIC_STATE" });
    }
  } catch (error) {
    console.error(`${MODULE_ID} | Ready sequence failed.`, error);
    ui.notifications?.error?.("HoloNews não conseguiu preparar os dados. Consulte o console do Foundry.");
  }

  registerCoreTile();
  startScheduler();
  Hooks.callAll?.(`${MODULE_ID}.ready`, api);
  Hooks.callAll?.("newspaperReady", api);
});

Hooks.on("createUser", () => { if (game.user?.isGM) void newsroom.rebuildProjections().catch(reportLifecycleError); });
Hooks.on("deleteUser", () => { if (game.user?.isGM) void newsroom.rebuildProjections().catch(reportLifecycleError); });
Hooks.on("hotReload", (data: Record<string, unknown>) => {
  const packageData = data?.package && typeof data.package === "object" ? data.package as Record<string, unknown> : null;
  const packageId = String(data?.packageId ?? packageData?.id ?? "");
  if (!packageId || packageId === MODULE_ID || packageId === "holosuite-core") {
    registerCoreTile();
    apps.refreshReader();
    apps.refreshManager();
  }
});

function reportLifecycleError(error: unknown): void {
  console.error(`${MODULE_ID} | Could not rebuild player projections.`, error);
  ui.notifications?.error?.("HoloNews não conseguiu atualizar as projeções dos jogadores.");
}

function startScheduler(): void {
  const module = game.modules?.get?.(MODULE_ID) as any;
  if (!module) return;
  if (module._holonewsScheduleTimer) clearInterval(module._holonewsScheduleTimer);
  module._holonewsScheduleTimer = setInterval(() => {
    if (!isPrimaryActiveGM(game.users ?? [], String(game.user?.id ?? ""))) return;
    void newsroom.publishDueIssues().catch(reportLifecycleError);
  }, 60_000);
}
