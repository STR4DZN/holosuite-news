import { newItem, type NewsItem } from "../domain/model";
import { validateItem } from "../domain/validation";
import { MODULE_ID, PRIVATE_PACK } from "../constants";
import { assertWriter } from "../permissions/authority";
import type { Newsroom } from "../core/newsroom";

export function convertLegacy(value: unknown, id: () => string): NewsItem[] {
  if (!value || typeof value !== "object")
    throw new Error("Dados antigos inválidos.");
  const state = value as Record<string, any>;
  if (state.schemaVersion !== 1 || !Array.isArray(state.articles))
    throw new Error("Esperado um backup HoloNews v1.");
  return state.articles.map((old: any) => {
    const item = newItem(id());
    const updates = (old.updates ?? [])
      .map(
        (u: any) =>
          `<h2>${escape(u.title ?? "Atualização")} · ${escape(u.time ?? "")}</h2>${u.body ?? ""}`,
      )
      .join("");
    const allowed = [...(old.visibility?.users ?? [])];
    const visibility = old.visibility?.mode;
    item.draft = {
      ...item.draft,
      title: old.title ?? "",
      summary: old.subtitle ?? "",
      body: (old.body ?? "") + updates,
      cover: old.heroImage || old.thumbnail || "",
      coverAlt: old.heroImageAlt ?? "",
      category:
        old.category ||
        state.categories?.find((c: any) => c.id === old.categoryId)?.name ||
        "Geral",
      author:
        old.author ||
        state.authors?.find((a: any) => a.id === old.authorId)?.name ||
        "",
      date: [old.inWorldDate, old.inWorldTime].filter(Boolean).join(" · "),
      tags: old.tags ?? [],
      featured: old.featured === true,
      urgent: old.breaking === true,
      views: old.publicViews ?? 0,
      // Complex legacy exclusions/hierarchies become GM-only drafts for review.
      audience: {
        mode:
          visibility === "specific-users"
            ? "selected"
            : visibility === "all"
              ? "all"
              : "gm",
        users: visibility === "specific-users" ? allowed : [],
      },
    };
    item.notes = old.gmNotes ?? "";
    item.sourceId = `v1:${old.id}`;
    return validateItem(item);
  });
}
function escape(value: string): string {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}
export function legacyState(): unknown {
  return game.journal
    ?.find((doc: any) => doc.getFlag(MODULE_ID, "kind") === "master")
    ?.getFlag(MODULE_ID, "state");
}
let activeMigration: Promise<number> | undefined;
export function migrateLegacy(newsroom: Newsroom): Promise<number> {
  activeMigration ??= runMigration(newsroom).finally(() => {
    activeMigration = undefined;
  });
  return activeMigration;
}
async function runMigration(newsroom: Newsroom): Promise<number> {
  assertWriter();
  const state = legacyState();
  if (!state) return 0;
  const candidates = convertLegacy(state, () => foundry.utils.randomID());
  const current = await newsroom.list();
  const pack = game.packs.get(PRIVATE_PACK);
  await pack.getIndex();
  if (
    !pack.index.find(
      (entry: any) => entry.name === "HoloNews v1 · Backup original",
    )
  ) {
    await JournalEntry.create(
      {
        name: "HoloNews v1 · Backup original",
        flags: { [MODULE_ID]: { kind: "legacy-backup", state } },
      },
      { pack: PRIVATE_PACK, renderSheet: false },
    );
  }
  const sources = new Set(current.map((item) => item.sourceId));
  let count = 0;
  for (const item of candidates)
    if (!sources.has(item.sourceId)) {
      await newsroom.store.save(item, 0);
      sources.add(item.sourceId);
      count++;
    }
  // Original journals and their edition/page layouts remain intact.
  return count;
}
