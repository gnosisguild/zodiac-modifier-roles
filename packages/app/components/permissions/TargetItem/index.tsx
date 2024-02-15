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
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Disclosure from "@/ui/Disclosure"

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
      borderless
      bg
      diff={targetDiff === DiffFlag.Modified ? undefined : targetDiff} // we don't highlight the modified target since this would get a bit too colorful
    >
      <Disclosure
        button={
          <Flex gap={4} justifyContent="space-between" alignItems="center">
            <LabeledData label="Target Contract">
              <Address
                address={targetAddress}
                chainId={chainId}
                displayFull
                copyToClipboard
                explorerLink
                blockieClassName={classes.targetBlockie}
                className={classes.targetAddress}
              />
            </LabeledData>
            <LabeledData label="Permissions">
              <div className={classes.functionCount}>
                {wildcardPermission ? "Wildcard" : permissions.length}
              </div>
            </LabeledData>
          </Flex>
        }
      >
        <Flex direction="column" gap={3} className={classes.targetContent}>
          {wildcardPermission && (
            <WildcardPermissionItem
              data-testid="wildcard-permission"
              {...wildcardPermission}
              diff={diff?.get(wildcardPermission)?.flag}
            />
          )}

          {!wildcardPermission &&
            (permissions as FunctionPermissionCoerced[]).map(
              (permission, index) => (
                <FunctionPermissionItem
                  data-testid="function-permission"
                  key={index} // selector is not unique, maybe use selector + conditionId?
                  {...permission}
                  diff={diff?.get(permission)?.flag}
                  modified={
                    diff?.get(permission)?.modified as
                      | FunctionPermissionCoerced
                      | undefined
                  }
                  chainId={chainId}
                />
              )
            )}
        </Flex>
      </Disclosure>
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
