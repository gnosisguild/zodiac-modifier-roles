import { PermissionCoerced } from "zodiac-roles-sdk"

/** Group permissions by targetAddress */
export const groupPermissions = (permissions: PermissionCoerced[]) => {
  return Object.entries(
    permissions.reduce((groups, permission) => {
      if (!groups[permission.targetAddress]) {
        groups[permission.targetAddress] = []
      }
      groups[permission.targetAddress].push(permission)
      return groups
    }, {} as Record<string, PermissionCoerced[]>)
  )
}
