"use client"
import { Condition } from "zodiac-roles-sdk"
import { useState } from "react"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import ConditionHeader from "./ConditionHeader"
import { ChildConditions } from "."

interface Props {
  condition: Condition
  paramIndex?: number
}

const PassConditionView: React.FC<Props> = ({ condition, paramIndex }) => {
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

export default PassConditionView
