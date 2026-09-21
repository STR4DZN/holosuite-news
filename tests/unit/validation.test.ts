import { describe, expect, it } from "vitest";
import { createEmptyState } from "../../src/domain/factories";
import { createIssue, createPage, createPublication } from "../../src/domain/factories";
import { validateImport } from "../../src/domain/validation";

describe("import validation", () => {
  it("accepts a complete schema version 1 backup", () => {
    expect(validateImport(createEmptyState()).schemaVersion).toBe(1);
  });

  it("rejects unknown schemas and invalid Narrative views", () => {
    expect(() => validateImport({ schemaVersion: 2 })).toThrowError(/NEWSPAPER_INVALID_DATA/);
    const state = createEmptyState();
    state.articles.push({ publicViews: -1 } as never);
    expect(() => validateImport(state)).toThrowError(/NEWSPAPER_INVALID_DATA/);
  });

  it("rejects executable image schemes and inconsistent Issue/Page graphs", () => {
    const unsafe = createEmptyState();
    unsafe.publications.push(createPublication({ logo: "javascript:alert(1)" }));
    expect(() => validateImport(unsafe)).toThrowError(/image reference/i);

    const inconsistent = createEmptyState();
    const publication = createPublication({ id: "publication" });
    const issue = createIssue({ id: "issue", publicationId: publication.id, pageIds: ["page"], coverPageId: "page" });
    const page = createPage({ id: "page", issueId: "another-issue" });
    inconsistent.publications.push(publication);
    inconsistent.issues.push(issue);
    inconsistent.pages.push(page);
    expect(() => validateImport(inconsistent)).toThrowError(/Issue\/Page|missing Issue/i);
  });

  it("rejects backups whose collections exceed defensive limits", () => {
    const state = createEmptyState();
    state.publications = Array.from({ length: 101 }, (_, index) => createPublication({ id: `publication-${index}` }));
    expect(() => validateImport(state)).toThrowError(/limit of 100/i);
  });

  it("rejects unknown settings instead of projecting unreviewed fields", () => {
    const state = createEmptyState();
    (state.settings as typeof state.settings & { gmSecret: string }).gmSecret = "private";
    expect(() => validateImport(state)).toThrowError(/unknown fields/i);
  });
});
