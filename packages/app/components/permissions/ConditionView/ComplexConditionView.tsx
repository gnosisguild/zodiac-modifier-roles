import { Condition } from "zodiac-roles-sdk"
import { AbiFunction, AbiParameter } from "viem"
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
  return (
    <div className={classes.conditionContainer}>
      <div>
        <ConditionHeader
          condition={condition}
          paramIndex={paramIndex}
          abi={abi}
        />
      </div>
      {condition.children && (
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
