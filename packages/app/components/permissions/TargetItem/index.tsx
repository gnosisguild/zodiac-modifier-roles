import {
  TargetPermission,
  FunctionPermissionCoerced,
  PermissionCoerced,
} from "zodiac-roles-sdk"
import Flex from "@/ui/Flex"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import FunctionPermissionItem from "./FunctionPermissionItem"
import { DiffFlag, PermissionsDiff } from "../types"
import { groupDiff } from "../PermissionsDiff/diff"
import DiffBox from "../DiffBox"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Disclosure from "@/ui/Disclosure"
import Switch from "@/ui/Switch"
import { fetchAbi } from "@/app/abi"
import ADDRESS_LABELS from "./addressLabels.json"
import StopPropagation from "@/ui/StopPropagation"

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = async ({ targetAddress, chainId, permissions, diff }) => {
  const { abi } = await fetchAbi(targetAddress, chainId)

  // don't take into account "shadow permissions" added in the diff view for the purpose of aligning items in the two columns
  const ownPermissions = diff
    ? permissions.filter((p) => diff.get(p)?.flag !== DiffFlag.Hidden)
    : permissions

  const isWildcarded = ownPermissions.some(
    (permission) => !("selector" in permission)
  )

  const label = (ADDRESS_LABELS as any)[chainId.toString()]?.[
    targetAddress.toLowerCase()
  ]

  const targetDiff =
    diff &&
    groupDiff(
      permissions.map((p) => {
        if (!diff.has(p)) {
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
      <Disclosure
        defaultOpen
        button={
          <Flex
            gap={4}
            justifyContent="space-between"
            alignItems="start"
            className={classes.targetHeader}
          >
            <LabeledData label="Target Contract">
              {label}

              {/* Prevent clicks on the copy button from toggling the panel */}
              <StopPropagation>
                <Address
                  address={targetAddress}
                  chainId={chainId}
                  displayFull
                  copyToClipboard
                  explorerLink
                  blockieClassName={classes.targetBlockie}
                  className={classes.targetAddress}
                />
              </StopPropagation>
            </LabeledData>
            <LabeledData label="Permissions">
              <div className={classes.functionCount}>
                {isWildcarded ? "Wildcard" : permissions.length}
              </div>
            </LabeledData>
          </Flex>
        }
      >
        <Flex direction="column" gap={3} className={classes.targetContent}>
          {(permissions as FunctionPermissionCoerced[]).map(
            (permission, index) =>
              permission.selector ? (
                <FunctionPermissionItem
                  data-testid="function-permission"
                  key={index} // selector is not unique, maybe use `permissionId(permission)` (a bit expensive to calculate, so should be cached)
                  {...permission}
                  diff={diff?.get(permission)?.flag}
                  abi={abi}
                  modified={
                    diff?.get(permission)?.modified as
                      | FunctionPermissionCoerced
                      | undefined
                  }
                  chainId={chainId}
                />
              ) : (
                <WildcardPermissionItem
                  data-testid="wildcard-permission"
                  key={index}
                  {...permission}
                  diff={diff?.get(permission)?.flag}
                  modified={
                    diff?.get(permission)?.modified as
                      | TargetPermission
                      | undefined
                  }
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
  TargetPermission & { diff?: DiffFlag; modified?: TargetPermission }
> = ({ delegatecall, send, diff, modified }) => {
  return (
    <DiffBox
      diff={diff}
      modified={modified && <WildcardPermissionItem {...modified} />}
    >
      <div className={classes.wildcardContainer}>
        <Flex direction="row" gap={0} justifyContent="space-between">
          <LabeledData label="Function Signature">
            <div className={classes.selector}>ALL FUNCTIONS</div>
          </LabeledData>
          <Flex gap={3} alignItems="start">
            <LabeledData label="Send value">
              <Switch checked={!!send} disabled />
            </LabeledData>
            <LabeledData label="Delegate call">
              <Switch checked={!!delegatecall} disabled />
            </LabeledData>
          </Flex>
        </Flex>
      </div>
    </DiffBox>
  )
}
