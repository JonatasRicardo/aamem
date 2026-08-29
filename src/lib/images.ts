export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export type LogoImageType = "png" | "jpeg" | "webp";

const LOGO_EXTENSIONS: Record<LogoImageType, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

const LOGO_CONTENT_TYPES: Record<LogoImageType, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }

  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Identifies the image by its magic bytes instead of trusting the
 * client-provided content type.
 */
export function detectLogoImageType(bytes: Uint8Array): LogoImageType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return "png";
  }

  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return "jpeg";
  }

  if (startsWith(bytes, RIFF_SIGNATURE) && startsWith(bytes, WEBP_SIGNATURE, 8)) {
    return "webp";
  }

  return null;
}

export function logoExtension(type: LogoImageType) {
  return LOGO_EXTENSIONS[type];
}

export function logoContentType(type: LogoImageType) {
  return LOGO_CONTENT_TYPES[type];
}
