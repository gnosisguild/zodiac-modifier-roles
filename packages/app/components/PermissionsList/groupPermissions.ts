import { PermissionCoerced } from "zodiac-roles-sdk"

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
    .sort(compareKeys)
    .map(([targetAddress, permissions]) => [
      targetAddress,
      permissions.sort(compareSelectors),
    ])
}

const compareKeys = (a: [`0x${string}`, any], b: [`0x${string}`, any]) =>
  BigInt(a[0]) > BigInt(b[0]) ? 1 : -1

const compareSelectors = (a: PermissionCoerced, b: PermissionCoerced) =>
  ("selector" in a ? BigInt(a.selector) : 0) >
  ("selector" in b ? BigInt(b.selector) : 0)
    ? 1
    : -1
