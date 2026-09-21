import type { ReaderIdentity } from "../domain/model";

export interface ReadSignal {
  articleId: string;
  nonce: string;
  at: number;
}

export interface ReadSignalDependencies {
  isPrimaryGM(): boolean;
  isPublishedFor(articleId: string, userId: string): boolean | Promise<boolean>;
  record(articleId: string, userId: string, at: number): void | Promise<void>;
  clear(userId: string): void | Promise<void>;
  claimNonce?(userId: string, nonce: string): boolean | Promise<boolean>;
  now?(): number;
}

export async function processUserReadSignal(user: ReaderIdentity, value: unknown, deps: ReadSignalDependencies): Promise<boolean> {
  if (!deps.isPrimaryGM()) return false;
  if (!value || typeof value !== "object") { await deps.clear(user.id); return false; }
  const signal = value as Partial<ReadSignal>;
  if (user.isGM || typeof signal.articleId !== "string" || !signal.articleId || typeof signal.nonce !== "string" || !signal.nonce || !Number.isFinite(signal.at)) {
    await deps.clear(user.id);
    return false;
  }
  if (!await deps.isPublishedFor(signal.articleId, user.id)) {
    await deps.clear(user.id);
    return false;
  }
  if (deps.claimNonce && !await deps.claimNonce(user.id, signal.nonce)) {
    await deps.clear(user.id);
    return false;
  }
  await deps.record(signal.articleId, user.id, deps.now?.() ?? Date.now());
  await deps.clear(user.id);
  return true;
}
