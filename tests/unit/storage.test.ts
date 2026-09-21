import { describe, expect, it } from "vitest";
import { createEmptyState } from "../../src/domain/factories";
import { MemoryMasterStore } from "../../src/storage/memory-store";

describe("MasterStore optimistic revision contract", () => {
  it("does not advance the revision for a logical no-op", async () => {
    const store = new MemoryMasterStore(createEmptyState());
    const current = await store.load();
    const saved = await store.save(structuredClone(current), current.revision);
    expect(saved.revision).toBe(current.revision);
  });
});
