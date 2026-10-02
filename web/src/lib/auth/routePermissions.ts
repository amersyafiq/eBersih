export const routePermissions: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/cleaners(\/|$)/, roles: ["Contractor"] },
  { pattern: /^\/schedule(\/|$)/, roles: ["Contractor", "Facility Admin"] }, // both can view
  { pattern: /^\/availability(\/|$)/, roles: ["Contractor"] },

  { pattern: /^\/facilities(\/|$)/, roles: ["Facility Admin"] },
  { pattern: /^\/contractors(\/|$)/, roles: ["Facility Admin"] },
  { pattern: /^\/zones(\/|$)/, roles: ["Facility Admin"] },
  { pattern: /^\/reports(\/|$)/, roles: ["Contractor", "Facility Admin"] }, // both can view
];

export function getAllowedRoles(pathname: string): string[] | null {
  const match = routePermissions.find((r) => r.pattern.test(pathname));
  return match ? match.roles : null; // null = shared, no restriction
}