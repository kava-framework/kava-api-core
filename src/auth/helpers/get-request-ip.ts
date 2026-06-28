export function getRequestIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown")
}
