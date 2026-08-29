import { describe, expect, it } from "vitest";

import { getClientIp } from "./request";

function requestWithHeaders(headers: Record<string, string>) {
  return new Request("https://aamem.app/api/test", { headers });
}

describe("getClientIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    expect(
      getClientIp(
        requestWithHeaders({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" })
      )
    ).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(requestWithHeaders({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4"
    );
  });

  it("returns a stable placeholder when no header is present", () => {
    expect(getClientIp(requestWithHeaders({}))).toBe("unknown");
    expect(getClientIp(requestWithHeaders({ "x-forwarded-for": "  " }))).toBe(
      "unknown"
    );
  });
});
