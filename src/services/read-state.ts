import { MODULE_ID } from "../constants";

export interface LocalReadState {
  articles: Record<string, { firstReadAt: number; lastReadAt: number }>;
  issues: Record<string, number>;
}

const EMPTY_STATE: LocalReadState = { articles: {}, issues: {} };

export function getLocalReadState(): LocalReadState {
  try { return structuredClone(game.settings.get(MODULE_ID, "readState") ?? EMPTY_STATE); }
  catch { return structuredClone(EMPTY_STATE); }
}

export async function markArticleRead(articleId: string, issueId: string, at = Date.now()): Promise<LocalReadState> {
  const state = getLocalReadState();
  const current = state.articles[articleId];
  state.articles[articleId] = { firstReadAt: current?.firstReadAt ?? at, lastReadAt: at };
  state.issues[issueId] = at;
  await game.settings.set(MODULE_ID, "readState", state);
  return state;
}

export async function markIssueRead(issueId: string, at = Date.now()): Promise<LocalReadState> {
  const state = getLocalReadState();
  state.issues[issueId] = at;
  await game.settings.set(MODULE_ID, "readState", state);
  return state;
}

export function isArticleRead(articleId: string, state = getLocalReadState()): boolean { return Boolean(state.articles[articleId]); }

export function countUnread(articleIds: string[], state = getLocalReadState()): number {
  return articleIds.reduce((count, id) => count + (state.articles[id] ? 0 : 1), 0);
}
