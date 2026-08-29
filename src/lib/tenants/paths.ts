import { isReservedTenantSlug } from "./reserved-slugs";

export function normalizeTenantSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function normalizeTenantSlugInput(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .slice(0, 64);
}

export function isValidTenantSlug(value: string) {
  return (
    value.length >= 3 &&
    value.length <= 64 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value) &&
    !isReservedTenantSlug(value)
  );
}

export function slugSegmentsToPath(slug?: string[]) {
  if (!slug?.length) {
    return "/";
  }

  return `/${slug.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

export function pathToSlugSegments(path: string) {
  if (path === "/") {
    return [];
  }

  return path.replace(/^\/+/, "").split("/").filter(Boolean);
}

export function tenantLogoUrl(
  tenant: string,
  updatedAt?: Date | string | number
) {
  // The version param makes the URL change whenever the tenant is updated,
  // which is what allows the logo route to serve long-lived CDN caching.
  // updatedAt may arrive as a string: unstable_cache serializes cached
  // values to JSON, so Date fields come back as ISO strings on cache hits.
  const time = updatedAt ? new Date(updatedAt).getTime() : 0;

  return `/api/minisites/${tenant}/logo?v=${Number.isFinite(time) ? time : 0}`;
}
