import {
  TargetPermission,
  FunctionPermissionCoerced,
  PermissionCoerced,
} from "zodiac-roles-sdk"
import { getAddress } from "viem"
import Flex from "@/ui/Flex"
import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import FunctionPermissionItem from "./FunctionPermissionItem"
import LabeledData from "@/ui/LabeledData"
import Disclosure from "@/ui/Disclosure"
import Switch from "@/ui/Switch"
import StopPropagation from "@/ui/StopPropagation"
import Anchor from "@/ui/Anchor"
import { fetchContractInfo } from "@/app/abi"
import addressLabels from "./addressLabels.json"
import { DiffFlag, PermissionsDiff } from "../types"
import { groupDiff } from "../PermissionsDiff/diff"
import DiffBox from "../DiffBox"
import classes from "./style.module.css"

const ADDRESS_LABELS = Object.fromEntries(
  Object.entries(addressLabels).map(([chain, labels]) => [
    chain,
    Object.fromEntries(
      Object.entries(labels).map(([address, label]) => [
        address.toLowerCase(),
        label,
      ])
    ),
  ])
)

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = async ({ targetAddress, chainId, permissions, diff }) => {
  const contractInfo = await fetchContractInfo(targetAddress, chainId)

  const defaultLabel = contractInfo.proxyTo ? (
    <>
      <span className={classes.proxy}>proxy to</span>{" "}
      {contractInfo.name || (
        <span className={classes.proxyTo}>
          {getAddress(contractInfo.proxyTo)}
        </span>
      )}
    </>
  ) : (
    contractInfo.name
  )

  // don't take into account "shadow permissions" added in the diff view for the purpose of aligning items in the two columns
  const ownPermissions = diff
    ? permissions.filter((p) => diff.get(p)?.flag !== DiffFlag.Hidden)
    : permissions

  const isWildcarded = ownPermissions.some(
    (permission) => !("selector" in permission)
  )

  const label =
    (ADDRESS_LABELS as any)[chainId.toString()]?.[
      targetAddress.toLowerCase()
    ] || defaultLabel

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

  const address = (
    <Address
      address={targetAddress}
      chainId={chainId}
      displayFull
      copyToClipboard
      explorerLink
      blockieClassName={classes.targetBlockie}
      className={classes.targetAddress}
    />
  )

  return (
    <DiffBox
      bg
      diff={targetDiff === DiffFlag.Modified ? undefined : targetDiff} // we don't highlight the modified target since this would get a bit too colorful
    >
      <Disclosure
        defaultOpen={targetDiff !== DiffFlag.Identical}
        button={
          <Flex
            gap={4}
            justifyContent="space-between"
            alignItems="start"
            className={classes.targetHeader}
          >
            <LabeledData label="Target Contract">
              {/* Prevent clicks on the anchor or address icons from toggling the panel */}
              <StopPropagation>
                <Flex gap={2} alignItems="center">
                  <Anchor name={targetAddress} className={classes.anchor} />
                  {label || address}
                </Flex>
                {label && address}
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
                  abi={contractInfo.abi}
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
