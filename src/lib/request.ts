const UNKNOWN_CLIENT_IP = "unknown";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  if (firstForwarded) {
    return firstForwarded;
  }

  return request.headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT_IP;
}
