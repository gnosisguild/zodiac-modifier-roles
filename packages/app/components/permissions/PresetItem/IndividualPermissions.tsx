import { PermissionCoerced } from "zodiac-roles-sdk"
import cn from "classnames"
import { groupPermissions } from "../groupPermissions"
import TargetItem from "../TargetItem"
import classes from "./style.module.css"
import { ChainId } from "@/app/chains"
import ExpandableBox from "@/ui/ExpandableBox"
import { PermissionsDiff } from "../types"
import Flex from "@/ui/Flex"

const IndividualPermissions: React.FC<{
  permissions: PermissionCoerced[]
  chainId: ChainId
  diff?: PermissionsDiff
}> = ({ permissions, chainId, diff }) => {
  const permissionGroups = groupPermissions(permissions)

  return (
    <ExpandableBox
      borderless
      p={3}
      className={cn(classes.permissions, BOX_CLASS)}
      labelCollapsed="Individual permissions"
      labelExpanded="Individual permissions"
      toggleClassName={TOGGLE_CLASS}
      onToggle={diff ? handleToggle : undefined}
    >
      <Flex gap={3} direction="column">
        {permissionGroups.map(([targetAddress, permissions]) => (
          <TargetItem
            key={targetAddress}
            targetAddress={targetAddress}
            permissions={permissions}
            chainId={chainId}
            diff={diff}
          />
        ))}
      </Flex>
    </ExpandableBox>
  )
}

export default IndividualPermissions

const BOX_CLASS = "permissionBox"
const TOGGLE_CLASS = "permissionBoxToggle"
export const DIFF_CONTAINER_CLASS = "diffContainer"

const handleToggle = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  const diffContainers = [
    ...document.querySelectorAll(`.${DIFF_CONTAINER_CLASS}`),
  ]
  if (diffContainers.length !== 2) {
    throw new Error("Expected exactly two diff containers")
  }

  // find clicked permission box
  const clickedBox = ev.currentTarget.closest(`.${BOX_CLASS}`)
  if (!clickedBox) {
    throw new Error("Expected parent permission box")
  }

  // determine parent diff container
  const parent = ev.currentTarget.closest(`.${DIFF_CONTAINER_CLASS}`)
  if (!parent) {
    throw new Error("Expected parent diff container")
  }

  // determine index of clicked permission box in parent diff container
  const clickedIndex = [...parent.querySelectorAll(`.${BOX_CLASS}`)].indexOf(
    clickedBox
  )

  // click permission box with same index in other diff container
  const otherParent = diffContainers.find((c) => c !== parent)
  const counterpartBox = otherParent?.querySelectorAll(`.${BOX_CLASS}`)[
    clickedIndex
  ]
  if (!counterpartBox) {
    throw new Error("Expected to find counterpart permission box")
  }
  const counterpartToggle = counterpartBox.querySelector(
    `.${TOGGLE_CLASS}`
  ) as HTMLElement | null
  if (!counterpartToggle) {
    throw new Error("Expected to find counterpart toggle")
  }
  counterpartToggle.click()
}
