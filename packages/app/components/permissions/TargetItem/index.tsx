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
import { DiffFlag } from "../types"
import { groupDiff } from "../PermissionsDiff/diff"
import DiffBox from "../DiffBox"

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: Map<PermissionCoerced, DiffFlag>
  modifiedPairs?: Map<PermissionCoerced, PermissionCoerced>
}> = ({ targetAddress, chainId, permissions, diff, modifiedPairs }) => {
  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )

  const targetDiff =
    diff &&
    groupDiff(
      permissions.map((p) => {
        if (!diff.has(p)) {
          throw new Error("Missing diff entry")
        }
        return diff.get(p)!
      })
    )

  return (
    <DiffBox bg diff={targetDiff}>
      <Flex direction="column" gap={3}>
        <Address
          address={targetAddress}
          chainId={chainId}
          displayFull
          copyToClipboard
          explorerLink
        />

        {wildcardPermission && (
          <WildcardPermissionItem
            {...wildcardPermission}
            diff={diff?.get(wildcardPermission)}
          />
        )}
        {!wildcardPermission &&
          (permissions as FunctionPermissionCoerced[]).map((permission) => (
            <FunctionPermissionItem
              key={permission.selector}
              {...permission}
              diff={diff?.get(permission)}
              modified={
                modifiedPairs?.get(permission) as FunctionPermissionCoerced
              }
              chainId={chainId}
            />
          ))}
      </Flex>
    </DiffBox>
  )
}
export default TargetItem

const WildcardPermissionItem: React.FC<
  TargetPermission & { diff?: DiffFlag }
> = ({ delegatecall, send, diff }) => {
  return (
    <DiffBox diff={diff}>
      <Flex direction="column" gap={3}>
        <div>ALL FUNCTIONS</div>
        <ExecutionOptions delegatecall={delegatecall} send={send} />
      </Flex>
    </DiffBox>
  )
}
