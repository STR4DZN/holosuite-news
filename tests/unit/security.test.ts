import { afterEach, describe, expect, it, vi } from "vitest";
import { createPublicApi } from "../../src/api/public-api";
import { assertEditorialAccess } from "../../src/apps/base";
import { createArticle, createEmptyState, createIssue, createPublication } from "../../src/domain/factories";
import { buildPublishedProjection } from "../../src/domain/projection";
import { parseSocketMessage } from "../../src/socket/protocol";
import { enrichSafeHtml, isSafeClientUrl, safeCssColor } from "../../src/utils/format";

afterEach(() => vi.unstubAllGlobals());

describe("security boundaries", () => {
  it("fails before an Editorial application can render for a player", () => {
    vi.stubGlobal("game", { user: { id: "player", isGM: false } });
    expect(() => assertEditorialAccess()).toThrowError(/NEWSPAPER_PERMISSION_DENIED/);
  });

  it("does not leak an unauthorized related Article ID", () => {
    const state = createEmptyState();
    state.publications.push(createPublication({ id: "publication" }));
    state.issues.push(createIssue({ id: "issue", publicationId: "publication", status: "published" }));
    state.articles.push(
      createArticle({ id: "public", publicationId: "publication", issueId: "issue", status: "published", relatedArticleIds: ["secret"] }),
      createArticle({ id: "secret", publicationId: "publication", issueId: "issue", status: "published", visibility: { mode: "specific-users", users: ["other"] } })
    );
    expect(buildPublishedProjection(state, { id: "player", isGM: false }).articles[0]?.relatedArticleIds).toEqual([]);
  });

  it("forces a player API read to the signed-in user's projection", async () => {
    vi.stubGlobal("game", { user: { id: "signed-in", isGM: false } });
    const read = vi.fn(async () => null);
    const api = createPublicApi({} as never, { read, rebuild: vi.fn(), removeAll: vi.fn() }, { openReader: vi.fn(), openManager: vi.fn() });
    await api.getProjection("victim");
    expect(read).toHaveBeenCalledWith("signed-in");
  });

  it("rejects socket smuggling and CSS declaration injection", () => {
    expect(() => parseSocketMessage({ type: "ARTICLE_OPENED", articleId: "a", userId: "victim" })).toThrowError(/forbidden fields/i);
    expect(safeCssColor("red;background:url(https://evil.invalid)", "#000000")).toBe("#000000");
    expect(isSafeClientUrl(" java\nscript:alert(1)")).toBe(false);
    expect(isSafeClientUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeClientUrl("data:image/png;base64,AAAA", true)).toBe(true);
    expect(isSafeClientUrl("data:image/svg+xml,<svg onload=alert(1)>", true)).toBe(false);
  });

  it("never returns executable rich text when Foundry sanitizers are unavailable", async () => {
    const output = await enrichSafeHtml('<img src=x onerror="alert(1)"><script>alert(2)</script>');
    expect(output).not.toContain("<script");
    expect(output).not.toContain("<img");
  });
});
