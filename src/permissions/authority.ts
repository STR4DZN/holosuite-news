import { HoloNewsError } from "../domain/errors";
import type { ReaderIdentity, Visibility } from "../domain/model";

export interface Authority {
  currentUser(): ReaderIdentity;
  assertGM(): void;
}

export class StaticAuthority implements Authority {
  constructor(private readonly user: ReaderIdentity) {}
  currentUser(): ReaderIdentity { return this.user; }
  assertGM(): void {
    if (!this.user.isGM) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "Only a GM can change editorial data.");
  }
}

export class FoundryAuthority implements Authority {
  currentUser(): ReaderIdentity {
    return { id: String(game.user?.id ?? ""), name: String(game.user?.name ?? ""), isGM: game.user?.isGM === true };
  }
  assertGM(): void {
    if (game.user?.isGM !== true) throw new HoloNewsError("NEWSPAPER_PERMISSION_DENIED", "Only a GM can change editorial data.");
  }
}

export function canUserSee(visibility: Visibility, user: ReaderIdentity): boolean {
  if (user.isGM) return true;
  if (visibility.mode === "all") return true;
  if (visibility.mode === "gm-only") return false;
  if (visibility.mode === "specific-users") return visibility.users.includes(user.id);
  return !visibility.users.includes(user.id);
}
