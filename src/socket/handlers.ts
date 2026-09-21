import { MODULE_ID, READ_SIGNAL_FLAG, SOCKET_NAME } from "../constants";
import type { Newsroom } from "../core/newsroom";
import type { ReaderIdentity } from "../domain/model";
import type { HoloNewsApps } from "../apps/controller";
import { processUserReadSignal } from "../services/readership";
import { parseSocketMessage } from "./protocol";

export interface ActiveUserLike {
  id: string;
  name?: string;
  isGM: boolean;
  active: boolean;
  getFlag?(scope: string, key: string): unknown;
  unsetFlag?(scope: string, key: string): Promise<unknown>;
}

export function isPrimaryActiveGM(users: Iterable<ActiveUserLike>, currentUserId: string): boolean {
  const primary = [...users]
    .filter((user) => user.isGM && user.active)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))[0];
  return primary?.id === currentUserId;
}

export interface SocketHandlerDependencies {
  newsroom: Newsroom;
  apps: HoloNewsApps;
  users: () => Iterable<ActiveUserLike>;
  currentUserId: () => string;
  now?: () => number;
}

export function installSocketHandlers(deps: SocketHandlerDependencies): { scanPendingReadSignals(): Promise<void> } {
  const now = deps.now ?? (() => Date.now());
  const processedNonces = new Map<string, number>();
  let lastRecoveryRebuild = 0;
  let scanInFlight = false;

  const primary = () => isPrimaryActiveGM(deps.users(), deps.currentUserId());
  const claimNonce = (userId: string, nonce: string): boolean => {
    const key = `${userId}:${nonce}`;
    if (processedNonces.has(key)) return false;
    processedNonces.set(key, now());
    if (processedNonces.size > 2_000) {
      const expiry = now() - 86_400_000;
      for (const [candidate, at] of processedNonces) if (at < expiry) processedNonces.delete(candidate);
    }
    return true;
  };

  const processUser = async (user: ActiveUserLike): Promise<void> => {
    const value = user.getFlag?.(MODULE_ID, READ_SIGNAL_FLAG);
    if (value == null) return;
    const identity: ReaderIdentity = { id: String(user.id), name: user.name, isGM: user.isGM };
    await processUserReadSignal(identity, value, {
      isPrimaryGM: primary,
      isPublishedFor: (articleId, userId) => deps.newsroom.isPublishedFor(articleId, userId),
      record: async (articleId, userId, at) => { await deps.newsroom.recordRead(articleId, userId, at); },
      clear: async (userId) => { const target = [...deps.users()].find((candidate) => candidate.id === userId); await target?.unsetFlag?.(MODULE_ID, READ_SIGNAL_FLAG); },
      claimNonce,
      now
    });
    deps.apps.refreshManager();
  };

  const scanPendingReadSignals = async (): Promise<void> => {
    if (!primary() || scanInFlight) return;
    scanInFlight = true;
    try { for (const user of deps.users()) if (!user.isGM) await processUser(user); }
    finally { scanInFlight = false; }
  };

  game.socket?.on?.(SOCKET_NAME, (payload: unknown) => {
    void (async () => {
      try {
        const message = parseSocketMessage(payload);
        if (message.type === "ARTICLE_OPENED") await scanPendingReadSignals();
        if (message.type === "REQUEST_PUBLIC_STATE" && primary() && now() - lastRecoveryRebuild >= 30_000) {
          lastRecoveryRebuild = now();
          await deps.newsroom.rebuildProjections();
        }
        if (["PUBLIC_STATE_UPDATED", "ISSUE_PUBLISHED", "ISSUE_UNPUBLISHED"].includes(message.type)) {
          deps.apps.refreshReader();
          deps.apps.refreshManager();
        }
      } catch (error) {
        console.warn(`${MODULE_ID} | Ignored invalid socket message.`, error);
      }
    })();
  });

  Hooks.on("updateUser", (user: ActiveUserLike, changes: Record<string, unknown>) => {
    if (!primary() || !containsReadSignalChange(changes)) return;
    void processUser(user).catch((error) => console.error(`${MODULE_ID} | Could not process Table-read signal.`, error));
  });

  return { scanPendingReadSignals };
}

function containsReadSignalChange(changes: Record<string, unknown>): boolean {
  const path = `flags.${MODULE_ID}.${READ_SIGNAL_FLAG}`;
  const hasProperty = (globalThis as any).foundry?.utils?.hasProperty;
  if (typeof hasProperty === "function") return hasProperty(changes, path);
  if (Object.prototype.hasOwnProperty.call(changes, path)) return true;
  const flags = changes.flags;
  if (!flags || typeof flags !== "object") return false;
  const moduleFlags = (flags as Record<string, unknown>)[MODULE_ID];
  return Boolean(moduleFlags && typeof moduleFlags === "object" && Object.prototype.hasOwnProperty.call(moduleFlags, READ_SIGNAL_FLAG));
}
