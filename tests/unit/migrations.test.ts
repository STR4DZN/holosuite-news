import { describe, expect, it } from "vitest";
import { migrateMasterState } from "../../src/storage/migrations";

describe("Master-state migrations", () => {
  it("creates the current schema for an empty installation", () => {
    const result = migrateMasterState(null);
    expect(result).toMatchObject({ changed: true, fromVersion: null, toVersion: 1 });
    expect(result.state).toMatchObject({ schemaVersion: 1, revision: 0, publications: [], issues: [], articles: [] });
  });

  it("normalizes a legacy schema-zero state without discarding content", () => {
    const result = migrateMasterState({
      schemaVersion: 0,
      revision: 7,
      publications: [{ id: "publication-1", name: "Gazeta da Orla" }],
      issues: [], pages: [], articles: [], authors: [], categories: [], templates: []
    });
    expect(result.changed).toBe(true);
    expect(result.state.revision).toBe(8);
    expect(result.state.publications[0]).toMatchObject({ id: "publication-1", name: "Gazeta da Orla", themeId: "classic" });
  });

  it("refuses a state written by an unknown future version", () => {
    expect(() => migrateMasterState({ schemaVersion: 99 })).toThrowError(/newer than this module/i);
  });
});
