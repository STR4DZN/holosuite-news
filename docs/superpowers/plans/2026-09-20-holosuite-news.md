# HoloNews implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a release-ready Foundry VTT v13 newspaper module with a secure Reader, a GM Editorial Manager, and native HoloSuite registration.

**Architecture:** A deep `Newsroom` module owns editorial behavior behind one interface. Foundry JournalEntry adapters persist GM-only Master data and sanitized Published projections. Reader and Editorial applications consume different interfaces and templates.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, ApplicationV2, Handlebars, and plain CSS.

**Spec:** The 2026-09-20 pasted Master planning document and `docs/requirements-matrix.md`.

## Global Constraints

- Use module ID `holosuite-news`, API `game.holosuiteNews`, CSS prefix `hsn-`, and flag scope `holosuite-news`.
- Require HoloSuite Core 1.0.12 or newer. Do not modify its DOM or source.
- Target Foundry VTT v13 and avoid high-cost v12 or v14 incompatibilities.
- Never deliver drafts, GM notes, future content, audit logs, visibility rules, or Table reads to a player.
- Keep Narrative views GM-authored and player-visible. Keep Table reads private.
- Use separate Reader and Editorial applications and templates.
- Require explicit publication and destructive-action confirmation.

---

### Task 1: Project contract and build

**Files:** `module.json`, `package.json`, `tsconfig.json`, `vite.config.ts`, `CONTEXT.md`, `PRODUCT.md`, `DESIGN.md`

**Interfaces:** Produces the module manifest, build commands, canonical language, and visual contract used by every later task.

- [ ] Write manifest validation tests for ID, compatibility, dependency, socket, module entry, and stylesheet entry.
- [ ] Run the test and confirm that missing build output fails.
- [ ] Configure Vite to emit `dist/main.js`, `dist/style.css`, source maps, and font assets.
- [ ] Copy templates and languages after the build.
- [ ] Run `npm run build` and inspect the artifact tree.

### Task 2: Domain model and validation

**Files:** `src/domain/model.ts`, `src/domain/factories.ts`, `src/domain/validation.ts`, `tests/unit/validation.test.ts`

**Interfaces:** Produces `MasterState`, `Publication`, `Issue`, `Page`, `Article`, `Visibility`, `validateMasterState()`, and entity factories.

- [ ] Write failing tests for IDs, statuses, Narrative views, visibility, references, import data, and schema version 1.
- [ ] Run the focused test and confirm failure.
- [ ] Implement normalized factories and validation with categorized `HoloNewsError` codes.
- [ ] Run the focused test and confirm pass.

### Task 3: Authority and projection

**Files:** `src/permissions/authority.ts`, `src/domain/projection.ts`, `tests/unit/projection.test.ts`, `tests/unit/security.test.ts`

**Interfaces:** Consumes `MasterState`. Produces `PublishedProjection`, `canUserSee()`, `assertGM()`, and `buildPublishedProjection(state, user)`.

- [ ] Write failing tests for drafts, GM-only data, specific users, exclusions, orphaned blocks, and safe public fields.
- [ ] Confirm that the tests fail before projection code exists.
- [ ] Implement defense-in-depth guards and a projection allowlist.
- [ ] Confirm that player projections contain no forbidden keys.

### Task 4: Storage adapters

**Files:** `src/storage/contracts.ts`, `src/storage/memory-store.ts`, `src/storage/foundry-master-store.ts`, `src/storage/foundry-published-store.ts`

**Interfaces:** Produces `MasterStore.load/save`, `PublishedStore.rebuild/remove/read`, and optimistic revision errors.

- [ ] Write failing adapter contract tests with the memory adapters.
- [ ] Implement revision checks and no-op behavior.
- [ ] Implement the GM-only Master JournalEntry and sanitized user projection JournalEntries.
- [ ] Make projection replacement logical-atomic: stage, validate, activate, then notify.

### Task 5: Editorial behavior

**Files:** `src/core/newsroom.ts`, `tests/unit/newsroom.test.ts`

**Interfaces:** Produces the `Newsroom` interface used by the public API and all applications.

- [ ] Test the vertical flow: create Publication, Issue, Page, and Article; set 18,432 Narrative views; publish; read the projection.
- [ ] Implement CRUD, lifecycle, sort, duplication, templates, authors, categories, import, export, and audit records.
- [ ] Test unpublish, archive, delete confirmation contract, revision conflicts, and rollback-safe projection rebuilds.

### Task 6: Secure Table reads and Reader state

**Files:** `src/services/readership.ts`, `src/services/read-state.ts`, `src/socket/protocol.ts`, `tests/unit/readership.test.ts`

**Interfaces:** Produces `signalArticleOpened`, `processUserReadSignal`, unread counts, and socket invalidation messages.

- [ ] Test that identity comes from the updated User document and not the payload.
- [ ] Test duplicate read idempotency, timestamps, read count, and primary-GM handling.
- [ ] Implement local Reader state and document-backed GM telemetry.

### Task 7: HoloSuite adapter and public API

**Files:** `src/integration/holosuite.ts`, `src/api/public-api.ts`, `tests/unit/holosuite.test.ts`

**Interfaces:** Produces idempotent `registerWithHoloSuite()` and `game.holosuiteNews`.

- [ ] Test the exact registration object, GM route, player route, missing Core, repeat registration, and delayed `apiReady`.
- [ ] Implement read methods and internally guarded administrative methods.
- [ ] Expose the same object on `game.modules.get("holosuite-news").api` and `game.holosuiteNews`.

### Task 8: Reader application

**Files:** `src/apps/reader-app.ts`, `templates/reader/reader.hbs`, `styles/reader.css`

**Interfaces:** Consumes only `ReaderApi`. Produces home, issue, article, archive, category, and search routes with history.

- [ ] Build an empty state, current cover, article reading view, archive filters, search, page navigation, related stories, and unread labels.
- [ ] Enrich and sanitize rich text before template rendering.
- [ ] Add keyboard navigation, alt text, focus restoration, reduced motion, high contrast, and font scale.

### Task 9: Editorial Manager and editors

**Files:** `src/apps/editorial-app.ts`, `src/apps/editors.ts`, `templates/gm/*.hbs`, `styles/editorial.css`

**Interfaces:** Consumes only `EditorialApi`. Produces guarded dashboard, lists, editors, statistics, settings, backup, and preview.

- [ ] Fail before render when the current user is not a GM.
- [ ] Build Publication, Issue, Article, Page, Author, Category, Template, and settings flows.
- [ ] Add Narrative-view presets, page block reorder and duplication, autosave drafts, explicit publication, and destructive confirmations.

### Task 10: Lifecycle, settings, sockets, and migrations

**Files:** `src/main.ts`, `src/settings.ts`, `src/storage/migrations.ts`, `src/socket/handlers.ts`

**Interfaces:** Wires `init`, `ready`, `hotReload`, `holosuite-core.apiReady`, User updates, and module sockets.

- [ ] Register world and client settings, Handlebars helpers, templates, API, and socket handlers.
- [ ] Run schema migrations before opening applications.
- [ ] Rebuild projections when users or visibility change and invalidate Reader caches by revision.

### Task 11: Themes, responsive behavior, and preview

**Files:** `styles/*.css`, `preview/index.html`, `preview/preview.ts`, `tests/e2e/preview.spec.ts`

**Interfaces:** Produces seven themes (the union of both theme lists in the planning document) and a deterministic preview for visual, responsive, and accessibility checks.

- [ ] Test 320×568, 360×800, 390×844, 430×932, 1366×768, and 1920×1080.
- [ ] Test long titles, long stories, horizontal and vertical images, no image, 1 view, and 1,000,000 views.
- [ ] Test keyboard focus, landmarks, accessible names, overflow, and console errors.

### Task 12: Security review, documentation, and release

**Files:** `README.md`, `docs/security-review.md`, `docs/requirements-matrix.md`, `scripts/*.mjs`

**Interfaces:** Produces validated runtime and source ZIPs with external SHA-256 files.

- [ ] Run permission attacks against the API, projection, editor guard, import, rich text, and socket protocol.
- [ ] Run typecheck, Oxlint, unit tests, Playwright tests, build, package validation, and dependency audit.
- [ ] Verify the requirements matrix against the Master planning document.
- [ ] Package the installable runtime separately from the full source and record SHA-256 outside each ZIP.
