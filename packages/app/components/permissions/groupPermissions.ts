import { PermissionCoerced, permissionId } from "zodiac-roles-sdk"
import { Preset } from "./types"

/** Group permissions by targetAddress and sort everything in ascending order */
export const groupPermissions = (permissions: PermissionCoerced[]) => {
  const entries = Object.entries(
    permissions.reduce((groups, permission) => {
      if (!groups[permission.targetAddress]) {
        groups[permission.targetAddress] = []
      }
      groups[permission.targetAddress].push(permission)
      return groups
    }, {} as Record<`0x${string}`, PermissionCoerced[]>)
  ) as [`0x${string}`, PermissionCoerced[]][]

  return entries
    .sort(compareKeys) // sort groups ascending by target address
    .map(
      ([targetAddress, permissions]) =>
        [targetAddress, permissions.sort(comparePermissionIds)] as const // sort permissions ascending by ID
    )
}

const compareKeys = (a: [`0x${string}`, any], b: [`0x${string}`, any]) =>
  BigInt(a[0]) > BigInt(b[0]) ? 1 : -1

export const comparePermissionIds = (
  a: PermissionCoerced,
  b: PermissionCoerced
) => (permissionId(a) > permissionId(b) ? 1 : -1)
