import { MASTER_FLAG, MODULE_ID, MODULE_TITLE } from "../constants";
import { HoloNewsError } from "../domain/errors";
import { createEmptyState } from "../domain/factories";
import type { MasterState } from "../domain/model";
import { validateMasterState } from "../domain/validation";
import type { MasterStore } from "./contracts";
import { migrateMasterState } from "./migrations";
import { sameMasterStateIgnoringRevision } from "./state-equality";

export class FoundryMasterStore implements MasterStore {
  private assertGM(): void {
    if (!game.user?.isGM) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "The Master store is GM-only.");
  }

  private findDocument(): any | null {
    return game.journal?.find?.((entry: any) => entry.getFlag?.(MODULE_ID, "kind") === MASTER_FLAG) ?? null;
  }

  private async getOrCreateDocument(): Promise<any> {
    let document = this.findDocument();
    if (document) return document;
    document = await JournalEntry.create({
      name: `[${MODULE_TITLE}] Master Data`,
      ownership: { default: 0 },
      flags: { [MODULE_ID]: { kind: MASTER_FLAG, schemaVersion: 1, state: createEmptyState() } }
    }, { renderSheet: false });
    if (!document) throw new HoloNewsError("NEWSPAPER_STORAGE_ERROR", "Foundry did not create the Master JournalEntry.");
    return document;
  }

  async load(): Promise<MasterState> {
    this.assertGM();
    const document = await this.getOrCreateDocument();
    const migration = migrateMasterState(document.getFlag(MODULE_ID, "state"));
    if (migration.changed) {
      await document.update({
        [`flags.${MODULE_ID}.schemaVersion`]: migration.state.schemaVersion,
        [`flags.${MODULE_ID}.state`]: migration.state
      });
    }
    return validateMasterState(structuredClone(migration.state));
  }

  async save(next: MasterState, expectedRevision: number): Promise<MasterState> {
    this.assertGM();
    const document = await this.getOrCreateDocument();
    const current = document.getFlag(MODULE_ID, "state") ?? createEmptyState();
    if (current.revision !== expectedRevision) throw new HoloNewsError("NEWSPAPER_REVISION_CONFLICT", `Expected revision ${expectedRevision}, found ${String(current.revision)}.`);
    const candidate = validateMasterState(structuredClone({ ...next, revision: expectedRevision }));
    if (sameMasterStateIgnoringRevision(current, candidate)) return structuredClone(current);
    const saved = validateMasterState(structuredClone({ ...next, revision: expectedRevision + 1 }));
    try {
      await document.update({ [`flags.${MODULE_ID}.schemaVersion`]: saved.schemaVersion, [`flags.${MODULE_ID}.state`]: saved });
    } catch (error) {
      throw new HoloNewsError("NEWSPAPER_STORAGE_ERROR", "Could not save Master data.", { cause: String(error) });
    }
    return structuredClone(saved);
  }
}
