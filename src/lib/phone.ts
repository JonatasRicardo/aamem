export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidWhatsapp(value: string) {
  const digits = normalizePhoneDigits(value);
  return digits.length >= 10 && digits.length <= 15;
}
