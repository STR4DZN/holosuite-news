import { describe, expect, it } from "vitest";
import { isPrimaryActiveGM } from "../../src/socket/handlers";

describe("Foundry socket authority", () => {
  it("elects one deterministic active GM", () => {
    const users = [
      { id: "gm-z", isGM: true, active: true },
      { id: "player", isGM: false, active: true },
      { id: "gm-a", isGM: true, active: true }
    ];
    expect(isPrimaryActiveGM(users, "gm-a")).toBe(true);
    expect(isPrimaryActiveGM(users, "gm-z")).toBe(false);
  });

  it("ignores inactive GMs", () => {
    expect(isPrimaryActiveGM([{ id: "gm-a", isGM: true, active: false }, { id: "gm-b", isGM: true, active: true }], "gm-b")).toBe(true);
  });
});
