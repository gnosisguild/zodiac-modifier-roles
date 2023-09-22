import {
  TargetPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk/build/cjs/sdk/src/permissions/types"
import { Permission } from "../types"
import Flex from "@/ui/Flex"
import ExecutionOptions from "./ExecutionOptions"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import Box from "@/ui/Box"
import ConditionView from "../ConditionView"

const TargetItem: React.FC<{
  targetAddress: string
  permissions: Permission[]
  chainId: ChainId
}> = ({ targetAddress, chainId, permissions }) => {
  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )

  return (
    <Box bg p={3}>
      <Flex direction="column" gap={3}>
        <Address
          address={targetAddress}
          chainId={chainId}
          displayFull
          copyToClipboard
          explorerLink
        />

        {wildcardPermission && (
          <WildcardPermissionItem {...wildcardPermission} />
        )}
        {!wildcardPermission &&
          (permissions as FunctionPermissionCoerced[]).map((permission) => (
            <FunctionPermissionItem key={permission.selector} {...permission} />
          ))}
      </Flex>
    </Box>
  )
}
export default TargetItem

const WildcardPermissionItem: React.FC<TargetPermission> = ({
  delegatecall,
  send,
}) => {
  return (
    <Box p={3}>
      <Flex direction="column" gap={3}>
        <div>ALL FUNCTIONS</div>
        <ExecutionOptions delegatecall={delegatecall} send={send} />
      </Flex>
    </Box>
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
    <Box p={3}>
      <Flex direction="column" gap={3}>
        <div>
          <code>{selector}</code>
        </div>
        {condition ? (
          <ConditionView condition={condition} />
        ) : (
          <div>No condition set</div>
        )}
        <ExecutionOptions delegatecall={delegatecall} send={send} />
      </Flex>
    </Box>
  )
}
