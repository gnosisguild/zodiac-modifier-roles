import {
  TargetPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk/build/cjs/sdk/src/permissions/types"
import { Permission } from "../types"
import Box from "@/ui/Box"
import ExecutionOptions from "./ExecutionOptions"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"

const TargetItem: React.FC<{
  targetAddress: string
  permissions: Permission[]
  chainId: ChainId
}> = ({ targetAddress, chainId, permissions }) => {
  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )

  return (
    <Box p={2}>
      <Address
        address={targetAddress}
        chainId={chainId}
        displayFull
        copyToClipboard
        explorerLink
      />
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
  delegatecall,
  send,
}) => {
  return (
    <div>
      ALL FUNCTIONS
      <ExecutionOptions delegatecall={delegatecall} send={send} />
    </div>
  )
}

const FunctionPermissionItem: React.FC<FunctionPermissionCoerced> = ({
  targetAddress,
  selector,
  condition,
  delegatecall,
  send,
}) => {
  return (
    <div>
      <code>{selector}</code>
      <ExecutionOptions delegatecall={delegatecall} send={send} />
    </div>
  )
}
