import { describe, expect, it } from "vitest";

import {
  isValidTenantSlug,
  normalizeTenantSlug,
  pathToSlugSegments,
  slugSegmentsToPath,
} from "./paths";
import { isReservedTenantSlug } from "./reserved-slugs";

describe("tenant paths", () => {
  it("normalizes tenant slugs", () => {
    expect(normalizeTenantSlug(" Igreja da Graça! ")).toBe("igreja-da-graca");
    expect(normalizeTenantSlug("AAMEM___Central")).toBe("aamem-central");
  });

  it("rejects invalid and reserved tenant slugs", () => {
    expect(isValidTenantSlug("ig")).toBe(false);
    expect(isValidTenantSlug("admin")).toBe(false);
    expect(isReservedTenantSlug("api")).toBe(true);
  });

  it("converts optional catch-all segments to public paths", () => {
    expect(slugSegmentsToPath()).toBe("/");
    expect(slugSegmentsToPath([])).toBe("/");
    expect(slugSegmentsToPath(["sobre"])).toBe("/sobre");
    expect(slugSegmentsToPath(["eventos", "retiro"])).toBe("/eventos/retiro");
  });

  it("converts public paths to optional catch-all segments", () => {
    expect(pathToSlugSegments("/")).toEqual([]);
    expect(pathToSlugSegments("/sobre")).toEqual(["sobre"]);
    expect(pathToSlugSegments("/eventos/retiro")).toEqual([
      "eventos",
      "retiro",
    ]);
  });
});
