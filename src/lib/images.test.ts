import { describe, expect, it } from "vitest";

import {
  detectLogoImageType,
  logoContentType,
  logoExtension,
  LOGO_MAX_BYTES,
} from "./images";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("logo image detection", () => {
  it("detects the supported formats by magic bytes", () => {
    expect(detectLogoImageType(PNG)).toBe("png");
    expect(detectLogoImageType(JPEG)).toBe("jpeg");
    expect(detectLogoImageType(WEBP)).toBe("webp");
  });

  it("rejects content that is not an image", () => {
    expect(detectLogoImageType(Uint8Array.from([0x3c, 0x3f, 0x70, 0x68]))).toBeNull();
    expect(detectLogoImageType(new Uint8Array())).toBeNull();
  });

  it("rejects a RIFF container that is not WebP", () => {
    const wav = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);

    expect(detectLogoImageType(wav)).toBeNull();
  });

  it("rejects a truncated signature", () => {
    expect(detectLogoImageType(PNG.subarray(0, 4))).toBeNull();
  });

  it("maps each format to its extension and content type", () => {
    expect(logoExtension("jpeg")).toBe("jpg");
    expect(logoExtension("png")).toBe("png");
    expect(logoExtension("webp")).toBe("webp");
    expect(logoContentType("jpeg")).toBe("image/jpeg");
    expect(LOGO_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});
