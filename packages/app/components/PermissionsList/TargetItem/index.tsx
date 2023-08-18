import {
  TargetPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk/build/cjs/sdk/src/permissions/types"
import { Permission } from "../types"
import Box from "@/ui/Box"

const TargetItem: React.FC<{
  targetAddress: string
  permissions: Permission[]
}> = ({ targetAddress, permissions }) => {
  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )

  return (
    <Box p={2}>
      <span>{targetAddress}</span>
      {wildcardPermission && <WildcardPermissionItem {...wildcardPermission} />}
      {!wildcardPermission &&
        (permissions as FunctionPermissionCoerced[]).map((permission) => (
          <FunctionPermissionItem key={permission.selector} {...permission} />
        ))}
    </Box>
  )
}
export default TargetItem

const WildcardPermissionItem: React.FC<TargetPermission> = ({
  targetAddress,
  delegatecall,
  send,
}) => {
  return <div>ALL FUNCTIONS</div>
}

const FunctionPermissionItem: React.FC<FunctionPermissionCoerced> = ({
  targetAddress,
  selector,
  condition,
  delegatecall,
  send,
}) => {
  return <div>{selector}</div>
}
