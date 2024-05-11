import { PermissionCoerced } from "zodiac-roles-sdk"
import { groupPermissions } from "../groupPermissions"
import TargetItem from "../TargetItem"
import { ChainId } from "@/app/chains"
import { PermissionsDiff } from "../types"
import Flex from "@/ui/Flex"
import IndividualPermissionsExpandable from "./IndividualPermissionsExpandable"

const IndividualPermissions: React.FC<{
  uri: string
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = ({ uri, permissions, chainId, diff }) => {
  const permissionGroups = groupPermissions(permissions)

  return (
    <IndividualPermissionsExpandable namespace={uri} inDiffMode={!!diff}>
      <Flex gap={3} direction="column">
        {permissionGroups.map(([targetAddress, permissions]) => (
          <TargetItem
            key={targetAddress}
            targetAddress={targetAddress}
            permissions={permissions}
            chainId={chainId}
            diff={diff}
          />
        ))}
      </Flex>
    </IndividualPermissionsExpandable>
  )
}

export default IndividualPermissions
