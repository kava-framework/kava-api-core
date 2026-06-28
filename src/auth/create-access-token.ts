import crypto from 'crypto'
import bcrypt from "bcrypt";
import { db } from '@skalfa/skalfa-orm'
import { TOKEN_PLAIN_LENGTH, AUTH_PERMISSION } from './auth'
import { getUserPermissions, generateAgentId } from './helpers'

export async function createAccessToken(userId: number, req: Request, permission: boolean = true) {
  const plain  =  crypto.randomBytes(TOKEN_PLAIN_LENGTH).toString("hex")
  const hash   =  await bcrypt.hash(plain, 10)
  const agent  =  generateAgentId(req)

  let permissions: string[] = []
  if (AUTH_PERMISSION && permission) {
    permissions = await getUserPermissions(userId)
  }

  const [row] = await db("user_access_tokens").insert({
    user_id      :  userId,
    token        :  hash,
    agent        :  agent,
    permissions  :  JSON.stringify(permissions),
    created_at   :  new Date(),
  }).returning(["id"])

  return {
    token    :  `${row.id}|${plain}`,
    tokenId  :  row.id,
  }
}
