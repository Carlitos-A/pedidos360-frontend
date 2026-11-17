/** Decodificación para la UI. La firma y autorización las valida el API Manager. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) =>
      c.charCodeAt(0),
    );
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
export type AppRole = 'Admin' | 'Cliente';
export function tokenRoles(claims: Record<string, unknown>): AppRole[] {
  return Array.isArray(claims['roles'])
    ? claims['roles'].filter((role): role is AppRole => role === 'Admin' || role === 'Cliente')
    : [];
}
