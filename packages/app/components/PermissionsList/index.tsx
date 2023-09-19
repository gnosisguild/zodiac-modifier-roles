import { Annotation, Target, reconstructPermissions } from "zodiac-roles-sdk"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import { Permission } from "./types"
import PresetItem from "./PresetItem"
import TargetItem from "./TargetItem"
import { processAnnotations } from "./annotations"

interface Props {
  targets: Target[]
  annotations: Annotation[]
  chainId: ChainId
}

const PermissionsList = async ({ targets, annotations, chainId }: Props) => {
  const allPermissions = reconstructPermissions(targets)
  const { presets, permissions } = await processAnnotations(
    allPermissions,
    annotations
  )

  const permissionGroups = groupPermissions(permissions)
  console.log({ presets, permissions, permissionGroups })
  return (
    <Flex direction="column" gap={1}>
      {presets.map((preset, i) => (
        <PresetItem key={`${preset.serverUrl}${preset.path}`} {...preset} />
      ))}

      {permissionGroups.map(([targetAddress, permissions]) => (
        <TargetItem
          key={targetAddress}
          targetAddress={targetAddress}
          permissions={permissions}
        />
      ))}
    </Flex>
  )
}

export default PermissionsList

/** Group permissions by targetAddress */
const groupPermissions = (permissions: Permission[]) => {
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
