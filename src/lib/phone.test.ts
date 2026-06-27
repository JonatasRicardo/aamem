import { describe, expect, it } from "vitest";

import { isValidWhatsapp, normalizePhoneDigits } from "./phone";

describe("phone helpers", () => {
  it("normalizes phone numbers to digits", () => {
    expect(normalizePhoneDigits("+55 (11) 99999-9999")).toBe("5511999999999");
  });

  it("validates whatsapp numbers by digit count", () => {
    expect(isValidWhatsapp("(11) 99999-9999")).toBe(true);
    expect(isValidWhatsapp("+55 11 99999-9999")).toBe(true);
    expect(isValidWhatsapp("123")).toBe(false);
  });
});
