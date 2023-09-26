import { PermissionCoerced } from "zodiac-roles-sdk"
import { groupPermissions } from "../groupPermissions"
import TargetItem from "../TargetItem"
import classes from "./style.module.css"
import { ChainId } from "@/app/chains"
import ExpandableBox from "@/ui/ExpandableBox"

const IndividualPermissions: React.FC<{
  permissions: PermissionCoerced[]
  chainId: ChainId
}> = ({ permissions, chainId }) => {
  const permissionGroups = groupPermissions(permissions)
  return (
    <ExpandableBox
      borderless
      p={3}
      className={classes.permissions}
      labelCollapsed="Show permissions"
      labelExpanded="Hide permissions"
    >
      {permissionGroups.map(([targetAddress, permissions]) => (
        <TargetItem
          key={targetAddress}
          targetAddress={targetAddress}
          permissions={permissions}
          chainId={chainId}
        />
      ))}
    </ExpandableBox>
  )
}

export default IndividualPermissions
