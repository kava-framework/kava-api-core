import { db } from '@skalfa/skalfa-orm'
import { registry } from '@utils/registry'
import { AUTH_CACHE } from './auth'
import { getUserPermissions } from './helpers'

export async function revalidateUserPermissions(userId: number) {
  const permissions = await getUserPermissions(userId)

  const tokenIds = await db("user_access_tokens").where("user_id", userId).pluck("id")

  if (tokenIds.length === 0) return

  await db("user_access_tokens").whereIn("id", tokenIds).update({
    permissions  :  JSON.stringify(permissions),
    updated_at   :  new Date(),
  })

  if (AUTH_CACHE) {
    const redis = registry.get('redis')
    if (redis) {
      await Promise.all(
        tokenIds.map((id: any) => redis.del(`auth:token:${id}`))
      )
    }
  }
}
