import { Permission } from "./types"

/** Group permissions by targetAddress */
export const groupPermissions = (permissions: Permission[]) => {
  return Object.entries(
    permissions.reduce((groups, permission) => {
      if (!groups[permission.targetAddress]) {
        groups[permission.targetAddress] = []
      }
      groups[permission.targetAddress].push(permission)
      return groups
    }, {} as Record<string, Permission[]>)
  )
}
