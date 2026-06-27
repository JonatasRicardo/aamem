export const RESERVED_TENANT_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "dashboard",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedTenantSlug(slug: string) {
  return RESERVED_TENANT_SLUGS.has(slug.toLowerCase());
}
