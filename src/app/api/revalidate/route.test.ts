import { describe, expect, it } from "vitest";

import { validateRevalidatePayload } from "./route";

describe("revalidate payload validation", () => {
  it("accepts a tenant with public paths", () => {
    expect(
      validateRevalidatePayload({
        tenant: "igreja-da-graca",
        paths: ["/", "/sobre"],
      })
    ).toEqual({
      tenant: "igreja-da-graca",
      paths: ["/", "/sobre"],
    });
  });

  it("rejects invalid tenants and empty paths", () => {
    expect(validateRevalidatePayload(null)).toBeNull();
    expect(
      validateRevalidatePayload({ tenant: "admin", paths: ["/"] })
    ).toBeNull();
    expect(
      validateRevalidatePayload({ tenant: "igreja-da-graca", paths: [] })
    ).toBeNull();
  });

  it("filters paths that do not start with slash", () => {
    expect(
      validateRevalidatePayload({
        tenant: "igreja-da-graca",
        paths: ["/", "sobre"],
      })
    ).toEqual({
      tenant: "igreja-da-graca",
      paths: ["/"],
    });
  });
});
