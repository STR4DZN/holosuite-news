import type { Article, Backup, NewsItem } from "./model";
import { isSafeClientUrl, stripHtml } from "../utils/format";
import { validateNewsMotion } from "./news-motion";

function fail(message: string): never {
  throw new Error(message);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Dados inválidos: objeto esperado.");
  return value as Record<string, unknown>;
}
function string(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.length > max)
    fail(`Campo inválido: ${field}.`);
  return value;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") fail("Opção inválida.");
  return value;
}
function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    fail(`${field} deve ser um número inteiro positivo ou zero.`);
  return Number(value);
}
export function validateArticle(value: unknown, publish = false): Article {
  const x = object(value),
    audience = object(x.audience);
  const mode = audience.mode;
  if (mode !== "all" && mode !== "gm" && mode !== "selected")
    fail("Visibilidade inválida.");
  if (
    !Array.isArray(audience.users) ||
    !audience.users.every((u) => typeof u === "string" && u.length < 100)
  )
    fail("Jogadores inválidos.");
  if (
    !Array.isArray(x.tags) ||
    x.tags.length > 30 ||
    !x.tags.every((t) => typeof t === "string" && t.length <= 80)
  )
    fail("Use até 30 tags de 80 caracteres.");
  const article: Article = {
    id: string(x.id, "id", 100),
    title: string(x.title, "título", 240),
    summary: string(x.summary, "resumo", 1200),
    body: string(x.body, "texto", 250_000),
    cover: string(x.cover, "imagem", 2000),
    coverAlt: string(x.coverAlt, "descrição da imagem", 500),
    category: string(x.category, "categoria", 80),
    author: string(x.author, "autor", 160),
    date: string(x.date, "data", 160),
    tags: [...new Set(x.tags as string[])],
    featured: bool(x.featured),
    urgent: bool(x.urgent),
    views: integer(x.views, "Visualizações"),
    audience: {
      mode,
      users:
        mode === "selected" ? [...new Set(audience.users as string[])] : [],
    },
    motion: validateNewsMotion(x.motion, x.urgent === true),
  };
  // The old urgent flag remains compatible with existing portal consumers.
  article.urgent = article.motion!.priority === "urgent";
  if (x.urgent === true) { article.urgent = true; article.motion!.priority = "urgent"; }
  if (!article.id) fail("Identificador ausente.");
  if (!isSafeClientUrl(article.cover, true))
    fail("O endereço da imagem não é seguro.");
  if (publish && (!article.title.trim() || !stripHtml(article.body).trim()))
    fail("Preencha o título e o texto antes de publicar.");
  if (publish && mode === "selected" && !article.audience.users.length)
    fail("Selecione pelo menos um jogador.");
  return article;
}
export function validateItem(value: unknown): NewsItem {
  const x = object(value);
  if (x.schemaVersion !== 2) fail("Versão dos dados não suportada.");
  const draft = validateArticle(x.draft),
    published =
      x.published === null ? null : validateArticle(x.published, true);
  if (x.id !== draft.id || (published && published.id !== draft.id))
    fail("Identificadores inconsistentes.");
  return {
    schemaVersion: 2,
    id: draft.id,
    revision: integer(x.revision, "Revisão"),
    draft,
    notes: string(x.notes, "notas privadas", 100_000),
    published,
    publishedAt:
      x.publishedAt === null
        ? null
        : integer(x.publishedAt, "Data de publicação"),
    updatedAt: integer(x.updatedAt, "Data de edição"),
    pending: bool(x.pending),
    ...(x.broadcast !== undefined ? (() => {const event=object(x.broadcast);return {broadcast:{id:string(event.id,'transmissão',100),sentAt:integer(event.sentAt,'Data de transmissão')}};})() : {}),
    ...(typeof x.sourceId === "string"
      ? { sourceId: string(x.sourceId, "origem", 160) }
      : {}),
  };
}
export function validateBackup(value: unknown): Backup {
  const x = object(value);
  if (
    x.format !== "holonews" ||
    x.schemaVersion !== 2 ||
    !Array.isArray(x.items) ||
    x.items.length > 5000
  )
    fail("Backup HoloNews v2 inválido (limite: 5.000 notícias).");
  const items = x.items.map(validateItem);
  if (new Set(items.map((i) => i.id)).size !== items.length)
    fail("Backup contém identificadores repetidos.");
  return {
    format: "holonews",
    schemaVersion: 2,
    exportedAt: integer(x.exportedAt, "Data do backup"),
    items,
  };
}
