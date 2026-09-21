import { HoloNewsError } from "../domain/errors";
import { createArticle, createAuthor, createCategory, createEmptyState, createId, createIssue, createIssueTemplate, createPage, createPublication } from "../domain/factories";
import { SCHEMA_VERSION, type Article, type Author, type Category, type Issue, type IssueTemplate, type MasterState, type Page, type Publication } from "../domain/model";
import { MAX_AUDIT_RECORDS, validateMasterState } from "../domain/validation";

export interface MigrationResult {
  state: MasterState;
  changed: boolean;
  fromVersion: number | null;
  toVersion: number;
}

export function migrateMasterState(value: unknown): MigrationResult {
  if (value == null) return { state: createEmptyState(), changed: true, fromVersion: null, toVersion: SCHEMA_VERSION };
  if (!isRecord(value)) throw new HoloNewsError("NEWSPAPER_MIGRATION_ERROR", "Stored Master data is not an object.");

  const sourceVersion = value.schemaVersion === undefined ? 0 : Number(value.schemaVersion);
  if (!Number.isSafeInteger(sourceVersion) || sourceVersion < 0) throw new HoloNewsError("NEWSPAPER_MIGRATION_ERROR", "Stored Master data has an invalid schema version.");
  if (sourceVersion > SCHEMA_VERSION) {
    throw new HoloNewsError("NEWSPAPER_MIGRATION_ERROR", `Stored data version ${sourceVersion} is newer than this module supports (${SCHEMA_VERSION}).`);
  }
  if (sourceVersion === SCHEMA_VERSION) {
    return { state: validateMasterState(structuredClone(value) as unknown as MasterState), changed: false, fromVersion: sourceVersion, toVersion: SCHEMA_VERSION };
  }

  const base = createEmptyState();
  const revision = nonNegativeInteger(value.revision, 0);
  const migrated: MasterState = {
    ...base,
    schemaVersion: SCHEMA_VERSION,
    revision: revision + 1,
    projectionVersion: nonNegativeInteger(value.projectionVersion, 0) + 1,
    publications: records(value.publications).map((item) => createPublication(item as Partial<Publication>)),
    issues: records(value.issues).map((item) => createIssue({ ...(item as Partial<Issue>), publicationId: stringValue(item.publicationId) })),
    pages: records(value.pages).map((item) => createPage({ ...(item as Partial<Page>), issueId: stringValue(item.issueId) })),
    articles: records(value.articles).map((item) => createArticle({ ...(item as Partial<Article>), publicationId: stringValue(item.publicationId), issueId: stringValue(item.issueId) })),
    authors: records(value.authors).map((item) => createAuthor(item as Partial<Author>)),
    categories: records(value.categories).map((item) => createCategory(item as Partial<Category>)),
    templates: records(value.templates).map((item) => createIssueTemplate(item as Partial<IssueTemplate>)),
    readership: isRecord(value.readership) ? structuredClone(value.readership) as MasterState["readership"] : {},
    auditLog: Array.isArray(value.auditLog) ? structuredClone(value.auditLog.slice(-MAX_AUDIT_RECORDS + 1)) as MasterState["auditLog"] : [],
    settings: { ...base.settings, ...(isRecord(value.settings) ? value.settings : {}) }
  };
  migrated.auditLog.push({ id: createId("audit"), action: `MIGRATE_SCHEMA_${sourceVersion}_TO_${SCHEMA_VERSION}`, entityType: "system", entityId: "master", userId: "system", at: Date.now() });
  return { state: validateMasterState(migrated), changed: true, fromVersion: sourceVersion, toVersion: SCHEMA_VERSION };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : fallback;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
