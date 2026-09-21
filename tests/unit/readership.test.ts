import { describe, expect, it, vi } from "vitest";
import { processUserReadSignal } from "../../src/services/readership";

describe("Table-read authority", () => {
  it("derives reader identity from the updated User document", async () => {
    const record = vi.fn();
    await processUserReadSignal({ id: "player-a", isGM: false }, { articleId: "article-1", nonce: "n-1", at: 999_999, claimedUserId: "player-b" } as never, { isPrimaryGM: () => true, isPublishedFor: () => true, record, clear: vi.fn(), now: () => 10 });
    expect(record).toHaveBeenCalledWith("article-1", "player-a", 10);
    expect(record).not.toHaveBeenCalledWith("article-1", "player-b", 10);
  });

  it("ignores untrusted, unauthorized, or secondary-GM signals", async () => {
    const record = vi.fn();
    await processUserReadSignal({ id: "player", isGM: false }, { articleId: "draft", nonce: "n", at: 10 }, { isPrimaryGM: () => true, isPublishedFor: () => false, record, clear: vi.fn() });
    await processUserReadSignal({ id: "player", isGM: false }, { articleId: "article", nonce: "n", at: 10 }, { isPrimaryGM: () => false, isPublishedFor: () => true, record, clear: vi.fn() });
    expect(record).not.toHaveBeenCalled();
  });

  it("records a nonce only once when delivery is repeated", async () => {
    const record = vi.fn();
    const claimed = new Set<string>();
    const dependencies = {
      isPrimaryGM: () => true,
      isPublishedFor: () => true,
      record,
      clear: vi.fn(),
      claimNonce: (_userId: string, nonce: string) => claimed.has(nonce) ? false : (claimed.add(nonce), true),
      now: () => 10
    };
    const signal = { articleId: "article", nonce: "n-once", at: 10 };
    await processUserReadSignal({ id: "player", isGM: false }, signal, dependencies);
    await processUserReadSignal({ id: "player", isGM: false }, signal, dependencies);
    expect(record).toHaveBeenCalledTimes(1);
  });
});
