/**
 * Staff-role helpers. The mobile admin section (orders management) is only
 * available to full-admin roles; server-side every admin endpoint re-checks
 * the role + 'orders' permission, so this is a UI gate only.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
