"use client"

import { ReactNode, useEffect, useState } from "react"
import cn from "classnames"
import { SpawnAnchorContext, useAnchor } from "@/ui/Anchor"
import ExpandableBox, { Props } from "@/ui/ExpandableBox"

import classes from "./style.module.css"
import { DIFF_CONTAINER_CLASS } from "../PermissionsDiff/classes"

const AnchorExpandableBox: React.FC<Props> = (props) => {
  const [hashOnMount, setHashOnMount] = useState<string | undefined>(undefined)

  const anchorPrefix = useAnchor("")
  useEffect(() => {
    setHashOnMount(typeof window !== "undefined" ? window.location.hash : "")
  }, [])

  return hashOnMount !== undefined ? (
    <ExpandableBox
      {...props}
      defaultExpanded={
        props.defaultExpanded || hashOnMount.startsWith("#" + anchorPrefix)
      }
    />
  ) : null
}

const IndividualPermissionsExpandable: React.FC<{
  namespace: string
  children: ReactNode
  inDiffMode?: boolean
}> = ({ namespace, children, inDiffMode }) => (
  <SpawnAnchorContext namespace={namespace}>
    <AnchorExpandableBox
      borderless
      p={3}
      className={cn(classes.permissions, BOX_CLASS)}
      labelCollapsed="Individual permissions"
      labelExpanded="Individual permissions"
      toggleClassName={TOGGLE_CLASS}
      onToggle={inDiffMode ? syncToggle : undefined}
    >
      {children}
    </AnchorExpandableBox>
  </SpawnAnchorContext>
)

export default IndividualPermissionsExpandable

const BOX_CLASS = "permissionBox"
const TOGGLE_CLASS = "permissionBoxToggle"

const syncToggle = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  // Don't handle the programmatically triggered click on counterpartToggle, so we don't get into a loop
  // https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
  if (!ev.isTrusted) return

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
