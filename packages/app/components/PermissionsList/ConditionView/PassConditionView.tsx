"use client"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import { ConditionHeader } from "./ConditionHeader"
import { Condition } from "zodiac-roles-sdk/."
import { useState } from "react"
import { ChildConditions } from "."

export interface Props {
  condition: Condition
  paramIndex?: number
}

export const PassConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
}) => {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <Box p={2} borderless className={classes.pass} title="No condition set">
      <div onClick={() => setCollapsed((val) => !val)}>
        <ConditionHeader
          condition={condition}
          paramIndex={paramIndex}
          collapsed
        />
      </div>
      {!collapsed && (
        <ChildConditions condition={condition} paramIndex={paramIndex} />
      )}
    </Box>
  )
}
