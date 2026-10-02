import { afterEach, describe, expect, it, vi } from "vitest";
import { ManagerApp, CreatorApp } from "../../src/apps/editorial-app";
import { Newsroom } from "../../src/core/newsroom";
import { MemoryNewsStore } from "../../src/storage/memory-store";
import { assertWriter } from "../../src/permissions/authority";
import { newItem } from "../../src/domain/model";
import { registerWithHoloSuite } from "../../src/integration/holosuite";
function setup(gm = false) {
  const user = { id: "gm", name: "Mestre", isGM: gm, active: true };
  vi.stubGlobal("game", { user, users: [user], journal: [] });
  const store = new MemoryNewsStore();
  const room = new Newsroom(store, assertWriter);
  return { user, store, room };
}
afterEach(() => vi.unstubAllGlobals());
describe("Separação mestre/jogador", () => {
  it("recusa criar janelas administrativas antes de montar qualquer formulário", () => {
    const { room } = setup();
    expect(() => new ManagerApp(room, () => {})).toThrow("exclusivo");
    expect(() => new CreatorApp(newItem("a"), room, () => {})).toThrow(
      "exclusivo",
    );
  });
  it("revalida permissão ao preparar e ligar a tela depois de perder papel de mestre", async () => {
    const { room, user } = setup(true);
    const manager = new ManagerApp(room, () => {});
    const creator = new CreatorApp(newItem("a"), room, () => {});
    user.isGM = false;
    await expect((manager as any)._prepareContext()).rejects.toThrow(
      "exclusivo",
    );
    await expect((creator as any)._prepareContext()).rejects.toThrow(
      "exclusivo",
    );
    expect(() => (manager as any).bind({})).toThrow("exclusivo");
    expect(() => (creator as any).bind({})).toThrow("exclusivo");
  });
  it("nega todas as operações de administração mesmo se chamadas fora da interface", async () => {
    const { room, store } = setup();
    const item = await store.save(newItem("a"), 0);
    const calls = [
      () => room.create(),
      () => room.list(),
      () => room.get("a"),
      () => room.save("a", item.draft, "segredo", item.revision),
      () => room.publish("a", item.revision),
      () => room.unpublish("a", item.revision),
      () => room.duplicate("a"),
      () => room.remove("a", item.revision),
      () => room.backup(),
      () => room.retry("a"),
      () =>
        room.importBackup({
          format: "holonews",
          schemaVersion: 2,
          exportedAt: 0,
          items: [],
        }),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow("exclusivo");
    expect(await store.get("a")).toEqual(item);
    expect(store.syncCount).toBe(0);
    expect(await room.articles({ id: "player", isGM: false })).toEqual([]);
  });
  it("tile do jogador abre somente o portal", () => {
    const api = { registerApp: vi.fn() },
      openReader = vi.fn(),
      openManager = vi.fn();
    registerWithHoloSuite({
      getApi: () => api,
      currentUserIsGM: () => false,
      openReader,
      openManager,
    });
    api.registerApp.mock.calls[0]![0].open();
    expect(openReader).toHaveBeenCalledOnce();
    expect(openManager).not.toHaveBeenCalled();
  });
});
