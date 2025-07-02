import { Annotation, Target } from "zodiac-roles-sdk"
import cn from "classnames"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import { processAnnotations } from "../processAnnotations"
import { diffPermissions, diffPresets } from "./diff"
import { PresetsAndPermissionsView } from "../PermissionsList"
import classes from "./style.module.css"
import { SpawnAnchorContext } from "@/ui/Anchor"
import { DIFF_CONTAINER_CLASS } from "./classes"

interface Props {
  left: { targets: Target[]; annotations: Annotation[] }
  right: { targets: Target[]; annotations: Annotation[] }
  chainId: ChainId
}

const PermissionsDiff = async ({ left, right, chainId }: Props) => {
  const { presets: leftPresets, permissions: leftPermissions } =
    await processAnnotations(left.targets, left.annotations)

  const { presets: rightPresets, permissions: rightPermissions } =
    await processAnnotations(right.targets, right.annotations)

  const [permissionsDiffLeft, permissionsDiffRight] = diffPermissions(
    leftPermissions,
    rightPermissions
  )

  const [presetsDiffLeft, presetsDiffRight] = diffPresets(
    leftPresets,
    rightPresets
  )

  return (
    <Flex direction="row" gap={1}>
      <Box p={3} className={cn(classes.left, DIFF_CONTAINER_CLASS)}>
        <SpawnAnchorContext namespace="left">
          <PresetsAndPermissionsView
            presets={[...presetsDiffLeft.keys()]}
            permissions={[...permissionsDiffLeft.keys()]}
            diff={{
              permissions: permissionsDiffLeft,
              presets: presetsDiffLeft,
            }}
            chainId={chainId}
          />
        </SpawnAnchorContext>
      </Box>
      <Box p={3} className={cn(classes.right, DIFF_CONTAINER_CLASS)}>
        <SpawnAnchorContext namespace="right">
          <PresetsAndPermissionsView
            presets={[...presetsDiffRight.keys()]}
            permissions={[...permissionsDiffRight.keys()]}
            diff={{
              permissions: permissionsDiffRight,
              presets: presetsDiffRight,
            }}
            chainId={chainId}
          />
        </SpawnAnchorContext>
      </Box>
    </Flex>
  )
}

export default PermissionsDiff
