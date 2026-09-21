import { HoloNewsError } from "../domain/errors";

export const SOCKET_TYPES = ["ARTICLE_OPENED", "ISSUE_OPENED", "REQUEST_PUBLIC_STATE", "PUBLIC_STATE_UPDATED", "ISSUE_PUBLISHED", "ISSUE_UNPUBLISHED"] as const;
export type SocketType = typeof SOCKET_TYPES[number];

export interface SocketMessage {
  type: SocketType;
  articleId?: string;
  issueId?: string;
  nonce?: string;
  revision?: number;
}

export function parseSocketMessage(value: unknown): SocketMessage {
  if (!value || typeof value !== "object") throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Socket message must be an object.");
  const message = value as Record<string, unknown>;
  if (typeof message.type !== "string" || !SOCKET_TYPES.includes(message.type as SocketType)) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Socket message type is not allowed.");
  const allowed = new Set(["type", "articleId", "issueId", "nonce", "revision"]);
  if (Object.keys(message).some((key) => !allowed.has(key))) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Socket message contains forbidden fields.");
  for (const key of ["articleId", "issueId", "nonce"] as const) if (message[key] !== undefined && (typeof message[key] !== "string" || message[key].length > 200)) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", `Socket field ${key} is invalid.`);
  if (message.revision !== undefined && (!Number.isSafeInteger(message.revision) || Number(message.revision) < 0)) throw new HoloNewsError("NEWSPAPER_INVALID_DATA", "Socket revision is invalid.");
  return message as unknown as SocketMessage;
}
