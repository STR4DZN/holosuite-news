import type { MasterState } from "../domain/model";

export function sameMasterStateIgnoringRevision(left: MasterState, right: MasterState): boolean {
  return stableStringify({ ...left, revision: 0 }) === stableStringify({ ...right, revision: 0 });
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalize(child)]));
  }
  return value;
}
