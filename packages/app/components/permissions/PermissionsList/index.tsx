import { Annotation, PermissionCoerced, Target } from "zodiac-roles-sdk"
import { Preset } from "zodiac-roles-sdk/annotations"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import PresetItem from "../PresetItem"
import TargetItem from "../TargetItem"
import { processAnnotations } from "../processAnnotations"
import { groupPermissions } from "../groupPermissions"
import { PermissionsDiff, PresetsDiff } from "../types"

interface Props {
  targets: Target[]
  annotations: Annotation[]
  chainId: ChainId
}

const PermissionsList = async ({ targets, annotations, chainId }: Props) => {
  const { presets, permissions } = await processAnnotations(
    targets,
    annotations
  )

  return (
    <PresetsAndPermissionsView
      presets={presets}
      permissions={permissions}
      chainId={chainId}
    />
  )
}

export default PermissionsList

interface PresetsAndPermissionsViewProps {
  permissions: PermissionCoerced[]
  presets: Preset[]
  chainId: ChainId
  diff?: { permissions: PermissionsDiff; presets: PresetsDiff }
}
export const PresetsAndPermissionsView = ({
  permissions,
  presets,
  chainId,
  diff,
}: PresetsAndPermissionsViewProps) => {
  const permissionGroups = groupPermissions(permissions)

  return (
    <Flex direction="column" gap={3}>
      {presets.map((preset, i) => (
        <PresetItem
          key={preset.uri}
          preset={preset}
          chainId={chainId}
          diff={diff?.presets}
        />
      ))}

      {permissionGroups.map(([targetAddress, permissions]) => (
        <TargetItem
          key={targetAddress}
          targetAddress={targetAddress}
          permissions={permissions}
          chainId={chainId}
          diff={diff?.permissions}
        />
      ))}
    </Flex>
  )
}
