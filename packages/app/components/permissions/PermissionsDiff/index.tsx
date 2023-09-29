import { Annotation, Target, reconstructPermissions } from "zodiac-roles-sdk"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import { processAnnotations } from "../annotations"
import { diffPermissions, pairModified } from "./diff"
import { PresetsAndPermissionsView } from "../PermissionsList"
import classes from "./style.module.css"
import { DiffFlag } from "../types"

interface Props {
  left: { targets: Target[]; annotations: Annotation[] }
  right: { targets: Target[]; annotations: Annotation[] }
  chainId: ChainId
}

const PermissionsDiff = async ({ left, right, chainId }: Props) => {
  const { presets: leftPresets, permissions: leftPermissions } =
    await processAnnotations(
      reconstructPermissions(left.targets),
      left.annotations
    )

  const { presets: rightPresets, permissions: rightPermissions } =
    await processAnnotations(
      reconstructPermissions(right.targets),
      right.annotations
    )

  const [permissionsDiffLeft, permissionsDiffRight] = diffPermissions(
    leftPermissions,
    rightPermissions
  )
  const modifiedPairs = pairModified(permissionsDiffLeft, permissionsDiffRight)

  // const [presetsDiffLeft, presetsDiffRight] = diffPresets(
  //   leftPresets,
  //   rightPresets
  // )

  return (
    <Flex direction="row" gap={1}>
      <Box p={3} className={classes.left}>
        <PresetsAndPermissionsView
          presets={leftPresets}
          // presets={[...presetsDiffLeft.keys()]}
          permissions={[...permissionsDiffLeft.keys()]}
          diff={permissionsDiffLeft}
          modifiedPairs={modifiedPairs}
          chainId={chainId}
        />
      </Box>
      <Box p={3} className={classes.left}>
        <PresetsAndPermissionsView
          presets={rightPresets}
          // presets={[...presetsDiffRight.keys()]}
          permissions={[...permissionsDiffRight.keys()]}
          diff={permissionsDiffRight}
          modifiedPairs={modifiedPairs}
          chainId={chainId}
        />
      </Box>
    </Flex>
  )
}

export default PermissionsDiff
