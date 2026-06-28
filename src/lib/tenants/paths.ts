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
