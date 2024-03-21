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

const TargetItem: React.FC<{
  targetAddress: `0x${string}`
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = async ({ targetAddress, chainId, permissions, diff }) => {
  const { abi } = await fetchAbi(targetAddress, chainId)

  const wildcardPermission = permissions.find(
    (permission) => !("selector" in permission)
  )
  console.log((ADDRESS_LABELS as any)[chainId.toString()], chainId)
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
      borderless
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
                  abi={abi}
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
      <Flex direction="row" gap={5}>
        <Flex direction="row" gap={0} justifyContent="space-between">
          <LabeledData label="Function Signature">
            <Flex gap={2} alignItems="center" className={classes.signature}>
              <div className={classes.selector}>ALL FUNCTIONS</div>
            </Flex>
          </LabeledData>
          <Flex gap={3} alignItems="start">
            <LabeledData label="Send value">
              <Switch label="" checked={!!send} disabled />
            </LabeledData>
            <LabeledData label="Delegate call">
              <Switch label="" checked={!!delegatecall} disabled />
            </LabeledData>
          </Flex>
        </Flex>
      </Flex>
    </DiffBox>
  )
}
