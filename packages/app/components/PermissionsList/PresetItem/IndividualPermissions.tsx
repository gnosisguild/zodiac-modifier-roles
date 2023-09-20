"use client"
import { useState } from "react"
import { Permission } from "../types"
import { groupPermissions } from "../groupPermissions"
import TargetItem from "../TargetItem"
import classes from "./style.module.css"
import { ChainId } from "@/app/chains"
import Box from "@/ui/Box"

const IndividualPermissions: React.FC<{
  permissions: Permission[]
  chainId: ChainId
}> = ({ permissions, chainId }) => {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)

  const permissionGroups = groupPermissions(permissions)

  return (
    <Box borderless bg={hover} p={3} className={classes.permissions}>
      <div
        onClick={() => setExpanded((val) => !val)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={classes.toggleButton}
      >
        {expanded ? "Hide permissions" : "Show permissions"}
      </div>

      {expanded && (
        <div className={classes.targetItems}>
          {permissionGroups.map(([targetAddress, permissions]) => (
            <TargetItem
              key={targetAddress}
              targetAddress={targetAddress}
              permissions={permissions}
              chainId={chainId}
            />
          ))}
        </div>
      )}
    </Box>
  )
}

export default IndividualPermissions
