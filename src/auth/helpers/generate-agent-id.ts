import crypto from 'crypto'

export function generateAgentId(req: Request) {
  const ua   =  req.headers.get("user-agent")  ??  ""
  const acc  =  req.headers.get("accept")      ??  ""

  return crypto.createHash("sha256").update(ua + acc).digest("hex")
}
