export function assertGM(): void {
  if (!game.user?.isGM)
    throw new Error("O criador de notícias é exclusivo do mestre.");
}
export function primaryGM(users: Iterable<any> = game.users ?? []): any | undefined {
  return [...users]
    .filter((user: any) => user.isGM && user.active)
    .sort((a: any, b: any) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}
export function assertWriter(): void { assertGM(); }
export function assertPrimaryWriter(): void {
  assertGM();
  const primary = primaryGM();
  if (primary && primary.id !== game.user.id)
    throw new Error(
      `Para evitar edições simultâneas, o mestre responsável agora é ${primary.name}.`,
    );
}
