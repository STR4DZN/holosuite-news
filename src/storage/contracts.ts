import type { MasterState, PublishedProjection, ReaderIdentity } from "../domain/model";

export interface MasterStore {
  load(): Promise<MasterState>;
  save(next: MasterState, expectedRevision: number): Promise<MasterState>;
}

export interface PublishedStore {
  rebuild(state: MasterState, readers: ReaderIdentity[]): Promise<void>;
  read(userId: string): Promise<PublishedProjection | null>;
  removeAll(): Promise<void>;
}
