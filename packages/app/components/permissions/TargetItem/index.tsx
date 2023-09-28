import {
  TargetPermission,
  FunctionPermissionCoerced,
  PermissionCoerced,
} from "zodiac-roles-sdk"
import Flex from "@/ui/Flex"
import ExecutionOptions from "./ExecutionOptions"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import Box from "@/ui/Box"
import FunctionPermissionItem from "./FunctionPermissionItem"

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
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
            <FunctionPermissionItem
              key={permission.selector}
              {...permission}
              chainId={chainId}
            />
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
