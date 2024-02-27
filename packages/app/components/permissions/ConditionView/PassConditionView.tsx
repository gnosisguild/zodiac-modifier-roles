"use client"
import { Condition } from "zodiac-roles-sdk"
import { AbiFunction, AbiParameter } from "viem"
import { useState } from "react"
import classes from "./style.module.css"
import ConditionHeader from "./ConditionHeader"
import { ChildConditions } from "."
import classNames from "classnames"

interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
}

const PassConditionView: React.FC<Props> = ({ condition, paramIndex, abi }) => {
  const [collapsed, setCollapsed] = useState(true)
  const toggleCollapsed = () => setCollapsed((val) => !val)
  return (
    <div
      className={classNames(classes.pass, classes.conditionContainer)}
      title="No condition set"
    >
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

export default PassConditionView
