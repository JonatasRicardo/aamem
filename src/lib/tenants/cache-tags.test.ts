import { describe, expect, it } from "vitest";

import { tenantPathTag, tenantTag } from "./cache-tags";

describe("tenant cache tags", () => {
  it("builds stable tenant tags", () => {
    expect(tenantTag("igreja-da-graca")).toBe("tenant:igreja-da-graca");
    expect(tenantPathTag("igreja-da-graca", "/sobre")).toBe(
      "tenant:igreja-da-graca:path:/sobre"
    );
  });
});
