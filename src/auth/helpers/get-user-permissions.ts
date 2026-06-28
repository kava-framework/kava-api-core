import { db } from '@skalfa/skalfa-orm'

export async function getUserPermissions(userId: number): Promise<string[]> {
  const roleIds = await db("user_roles").where("user_id", userId).pluck("role_id")

  if (roleIds.length === 0) return []

  const rows = await db("permissions").whereIn("role_id", roleIds).pluck("permissions")

  return Array.from(
    new Set(
      rows.flatMap((p: any) => p ?? [])
    )
  )
}
