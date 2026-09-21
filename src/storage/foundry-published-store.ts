import { MODULE_ID, MODULE_TITLE, PROJECTION_FLAG } from "../constants";
import { HoloNewsError } from "../domain/errors";
import type { MasterState, PublishedProjection, ReaderIdentity } from "../domain/model";
import { buildPublishedProjection } from "../domain/projection";
import type { PublishedStore } from "./contracts";

export class FoundryPublishedStore implements PublishedStore {
  constructor(private readonly onRebuilt: (revision: number) => void | Promise<void> = () => undefined) {}

  private projectionDocuments(): any[] {
    return game.journal?.filter?.((entry: any) => entry.getFlag?.(MODULE_ID, "kind") === PROJECTION_FLAG) ?? [];
  }

  async rebuild(state: MasterState, readers: ReaderIdentity[]): Promise<void> {
    if (!game.user?.isGM) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "Only a GM can rebuild Published projections.");
    const staged = readers.map((reader) => ({ reader, projection: buildPublishedProjection(state, reader) }));
    for (const { projection } of staged) assertProjectionSafe(projection);
    const existing = new Map(this.projectionDocuments().map((document: any) => [String(document.getFlag(MODULE_ID, "userId")), document]));
    try {
      for (const { reader, projection } of staged) {
        const document = existing.get(reader.id);
        const data = {
          name: `[${MODULE_TITLE}] Projection ${reader.id}`,
          ownership: { default: 0, [reader.id]: 2 },
          flags: { [MODULE_ID]: { kind: PROJECTION_FLAG, userId: reader.id, revision: projection.revision, projection } }
        };
        if (document) await document.update(data);
        else await JournalEntry.create(data, { renderSheet: false });
        existing.delete(reader.id);
      }
      for (const stale of existing.values()) await (stale as any).delete();
      await this.onRebuilt(state.projectionVersion);
    } catch (error) {
      throw new HoloNewsError("NEWSPAPER_STORAGE_ERROR", "Could not rebuild Published projections.", { cause: String(error) });
    }
  }

  async read(userId: string): Promise<PublishedProjection | null> {
    const document = this.projectionDocuments().find((entry: any) => entry.getFlag(MODULE_ID, "userId") === userId);
    const projection = document?.getFlag?.(MODULE_ID, "projection") ?? null;
    if (!projection) return null;
    assertProjectionSafe(projection);
    return structuredClone(projection);
  }

  async removeAll(): Promise<void> {
    if (!game.user?.isGM) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "Only a GM can remove Published projections.");
    for (const document of this.projectionDocuments()) await document.delete();
  }
}

function assertProjectionSafe(projection: PublishedProjection): void {
  const serialized = JSON.stringify(projection);
  for (const forbidden of ["gmNotes", "readership", "auditLog", "scheduledAt", "visibility"]) {
    if (serialized.includes(`"${forbidden}"`)) throw new HoloNewsError("NEWSPAPER_STORAGE_ERROR", `Published projection contains forbidden field ${forbidden}.`);
  }
}
