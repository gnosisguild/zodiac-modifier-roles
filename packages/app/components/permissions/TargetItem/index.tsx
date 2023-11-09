import {
  TargetPermission,
  FunctionPermissionCoerced,
  PermissionCoerced,
} from "zodiac-roles-sdk"
import Flex from "@/ui/Flex"
import ExecutionOptions from "./ExecutionOptions"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import FunctionPermissionItem from "./FunctionPermissionItem"
import { DiffFlag, PermissionsDiff } from "../types"
import { groupDiff } from "../PermissionsDiff/diff"
import DiffBox from "../DiffBox"

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = ({ targetAddress, chainId, permissions, diff }) => {
  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )

  const targetDiff =
    diff &&
    groupDiff(
      permissions.map((p) => {
        if (!diff.has(p)) {
          console.log({ diff, p })
          throw new Error("Missing permissions diff entry")
        }
        return diff.get(p)!.flag
      })
    )

  return (
    <DiffBox
      bg
      diff={targetDiff === DiffFlag.Modified ? undefined : targetDiff} // we don't highlight the modified target since this would get a bit too colorful
    >
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
            diff={diff?.get(wildcardPermission)?.flag}
          />
        )}
        {!wildcardPermission &&
          (permissions as FunctionPermissionCoerced[]).map((permission) => (
            <FunctionPermissionItem
              key={permission.selector}
              {...permission}
              diff={diff?.get(permission)?.flag}
              modified={
                diff?.get(permission)?.modified as
                  | FunctionPermissionCoerced
                  | undefined
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
