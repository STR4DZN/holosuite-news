import { HoloNewsError } from "../domain/errors";
import { createEmptyState } from "../domain/factories";
import type { MasterState, PublishedProjection, ReaderIdentity } from "../domain/model";
import { buildPublishedProjection } from "../domain/projection";
import type { MasterStore, PublishedStore } from "./contracts";
import { sameMasterStateIgnoringRevision } from "./state-equality";

export class MemoryMasterStore implements MasterStore {
  private state: MasterState;
  constructor(initial: MasterState = createEmptyState()) { this.state = structuredClone(initial); }
  async load(): Promise<MasterState> { return structuredClone(this.state); }
  async save(next: MasterState, expectedRevision: number): Promise<MasterState> {
    if (this.state.revision !== expectedRevision) throw new HoloNewsError("NEWSPAPER_REVISION_CONFLICT", `Expected revision ${expectedRevision}, found ${this.state.revision}.`);
    if (sameMasterStateIgnoringRevision(this.state, next)) return structuredClone(this.state);
    this.state = structuredClone({ ...next, revision: expectedRevision + 1 });
    return structuredClone(this.state);
  }
}

export class MemoryPublishedStore implements PublishedStore {
  private projections = new Map<string, PublishedProjection>();
  async rebuild(state: MasterState, readers: ReaderIdentity[]): Promise<void> {
    const staged = new Map<string, PublishedProjection>();
    for (const reader of readers) staged.set(reader.id, buildPublishedProjection(state, reader));
    this.projections = staged;
  }
  async read(userId: string): Promise<PublishedProjection | null> { return structuredClone(this.projections.get(userId) ?? null); }
  async removeAll(): Promise<void> { this.projections.clear(); }
}
