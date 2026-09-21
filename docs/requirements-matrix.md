# Requirements matrix

This matrix groups the Master plan without weakening individual requirements. Each range points to a concrete implementation and verification seam.

| Plan requirements | Implementation | Verification |
|---|---|---|
| H1-H12 | HoloSuite adapter, one tile, role route, separate apps | `holosuite.test.ts`, source audit |
| H13-H16, H40-H42, H49-H50 | Master store, allowlisted Published projection, atomic rebuild | `projection.test.ts`, `newsroom.test.ts`, security review |
| H17-H21 | Narrative views, Table reads, local Reader state | `readership.test.ts`, `newsroom.test.ts` |
| H22-H24, H56 | Internal unread count only; no Core DOM badge patch | HoloSuite source audit, detector scan |
| H25-H30 | IDs, public API, lifecycle hooks, idempotency, app singletons | manifest validation, API tests |
| H31-H39 | HoloSuite patterns, module socket protocol, GM availability fallback | integration tests, protocol tests |
| H43-H48 | Internal Reader router, history, HoloSuite shell, publication themes | Playwright routes and theme matrix |
| H51-H60 | Complete technical proof, gates, attack tests, current Core contract | release checklist and Foundry smoke guide |
| 1-13 | Publications, issues, pages, blocks, articles, two metrics | model and newsroom tests |
| 14-17 | Cover, article, read state, new-issue state | Reader UI tests |
| 18-23 | Dashboard, issue/page/article editors, rich text | Editorial UI tests and sanitization tests |
| 24-27 | User visibility, secret stories, drafts, player preview | projection and permission tests |
| 28-30 | Archive, search, Foundry links | Reader route tests |
| 31-37 | HoloSuite adapter, public hooks, future integration seams | API and adapter tests |
| 38-44 | Journal storage, flags, secure write authority, command validation | adapter and security tests |
| 45-51 | Editorial visual direction, responsive layouts, statistics, locale numbers | Playwright and unit format tests |
| 52-59 | Badges, categories, authors, ads, classifieds, breaking news, updates, history | model, editors, and Reader fixtures |
| 60-65 | Confirmation, autosave, publish, unpublish, archive, delete | newsroom and application tests |
| 66-69 | Foundry file picker, lazy Reader views, cache invalidation, accessibility | app tests and Playwright |
| 70-76 | CSS, TypeScript, Handlebars, tokens, seven themes covering both planning lists, world and client settings | build inspection and theme tests |
| 77-84 | Player exclusions, audit log, migrations, backup/import, error codes, empty state | projection, import, migration tests |
| 85-95 | Mobile-first, motion, pages, list mode, relations, cover roles, sort, duplicate, templates | Playwright and newsroom tests |
| 96-104 | Permission, role, resolution, content, state, read, publish, views, specific-user tests | unit and e2e suites |
| 105-109 | MVP through stable 1.0 capabilities | release checklist |
| 110-117 | phase ordering, final architecture, product principles, end-to-end proof | implementation plan and real Foundry smoke guide |

## Evidence boundary

Unit tests, a browser preview, a build, and ZIP validation do not prove real Foundry behavior. `docs/foundry-smoke-test.md` is the required host and multiplayer acceptance procedure. A release report must keep that result separate.
