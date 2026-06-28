import { db } from '@skalfa/skalfa-orm'
import { registry } from '@utils/registry'

export async function revalidateUserPermissionsByRole(roleId: number) {
  const userIds = await db("user_roles").where("role_id", roleId).pluck("user_id")

  const queue = registry.get('queue')
  if (queue) {
    for (const userId of userIds) {
      await queue.add("auth:revalidate-permission", { userId })
    }
  }
}
