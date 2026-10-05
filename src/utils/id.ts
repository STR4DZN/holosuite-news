/** getRandomValues also works on HTTP Foundry origins; randomUUID requires HTTPS. */
export function randomId(): string {
  const bytes=new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
