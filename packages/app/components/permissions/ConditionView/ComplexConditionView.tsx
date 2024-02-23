"use client"
import { Condition } from "zodiac-roles-sdk"
import { AbiFunction, AbiParameter } from "viem"
import { useState } from "react"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import ConditionHeader from "./ConditionHeader"
import { ChildConditions } from "."

interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
}

const ComplexConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const toggleCollapsed = () => setCollapsed((val) => !val)

  return (
    <div className={classes.conditionContainer}>
      <div onClick={condition.children ? toggleCollapsed : () => {}}>
        <ConditionHeader
          condition={condition}
          paramIndex={paramIndex}
          abi={abi}
          collapsed={collapsed}
        />
      </div>
      {!collapsed && condition.children && (
        <ChildConditions
          condition={condition}
          paramIndex={paramIndex}
          abi={abi}
        />
      )}
    </div>
  )
}

export default ComplexConditionView
