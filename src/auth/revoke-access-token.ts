import { db } from '@skalfa/skalfa-orm'

export async function revokeAccessToken(id: number) {
  return db.table('user_access_tokens').where("id", id).delete()
}
