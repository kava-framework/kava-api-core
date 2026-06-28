import { db } from '@skalfa/skalfa-orm'

export async function listUserSessions(userId: number, currentTokenId?: number) {
  const rows = await db("user_access_tokens").select(["id", "agent", "created_at", "last_used_at", "last_used_ip","expired_at"]).where("user_id", userId).orderBy("last_used_at", "desc")

  return rows.map((r: any) => ({
    ...r,
    is_active  : r.revoked_at  ===  null,
    is_current : r.id          ===  currentTokenId,
  }))
}
