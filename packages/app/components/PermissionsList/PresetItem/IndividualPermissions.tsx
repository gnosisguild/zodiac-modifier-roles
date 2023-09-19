"use client"
import { useState } from "react"
import { Permission } from "../types"
import { groupPermissions } from "../groupPermissions"
import TargetItem from "../TargetItem"

const IndividualPermissions: React.FC<{ permissions: Permission[] }> = ({
  permissions,
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return <div onClick={() => setExpanded(true)}>Show permissions</div>
  }

  const permissionGroups = groupPermissions(permissions)

  return (
    <>
      <div onClick={() => setExpanded(false)}>Hide permissions</div>

      {permissionGroups.map(([targetAddress, permissions]) => (
        <TargetItem
          key={targetAddress}
          targetAddress={targetAddress}
          permissions={permissions}
        />
      ))}
    </>
  )
}

export default IndividualPermissions
