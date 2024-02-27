import { Condition, Operator, ParameterType } from "zodiac-roles-sdk"
import { AbiFunction, AbiParameter } from "viem"
import { ReactNode } from "react"
import { BsLightningCharge } from "react-icons/bs"
import classes from "./style.module.css"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import { SlArrowDown } from "react-icons/sl"
import classNames from "classnames"
import { matchesAbi } from "./utils"
import { MdErrorOutline } from "react-icons/md"

interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
  children?: ReactNode
  collapsed?: boolean
}

const ConditionHeader: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
  children,
  collapsed,
}) => {
  const { operator, paramType } = condition
  const paramName =
    paramIndex !== undefined ? abi?.name || `[${paramIndex}]` : "" // e.g.: array elements don't have a param name

  const paramTypeLabel =
    !abi || "inputs" in abi ? ParameterType[paramType] : abi.type

  const abiMismatch = abi && condition && !matchesAbi(condition, abi)

  const operatorLabel = OperatorLabels[operator] || Operator[operator]

  // only conditions that aren't used are collapsible
  const isCollapsible =
    paramType >= ParameterType.Tuple &&
    !(
      condition.operator >= Operator.Matches &&
      condition.operator <= Operator.ArraySubset
    )

  return (
    <Flex
      gap={0}
      alignItems="center"
      justifyContent="space-between"
      className={classNames(
        classes.conditionHeader,
        isCollapsible && classes.hoverable
      )}
    >
      <Flex
        gap={3}
        alignItems="center"
        className={classes.conditionHeaderInner}
      >
        {paramName && (
          <LabeledData label="Parameter">
            <div className={classes.paramInfo}>{paramName}</div>
          </LabeledData>
        )}
        <LabeledData label="Type" className={classes.paramInfoLabel}>
          <div className={classes.paramInfo}>
            {abiMismatch ? (
              <Flex
                gap={1}
                alignItems="center"
                className={classes.abiMismatch}
                title="The condition is not compatible with the ABI parameter type"
              >
                {paramTypeLabel}
                <BsLightningCharge />
                {ParameterType[paramType]}
              </Flex>
            ) : (
              paramTypeLabel
            )}
          </div>
        </LabeledData>

        {operator !== Operator.Pass && (
          <LabeledData label="Condition">
            <div className={classes.operator}>{operatorLabel}</div>
          </LabeledData>
        )}
        {children}
      </Flex>
      {isCollapsible && (
        <SlArrowDown
          className={classNames(
            classes.collapseIcon,
            !collapsed && classes.openIcon
          )}
        />
      )}
    </Flex>
  )
}

export default ConditionHeader

const OperatorLabels: Record<number, ReactNode> = {
  [Operator.Matches]: "matches",
  [Operator.ArraySome]: "has at least one element that",
  [Operator.ArrayEvery]: "only has elements that",
  [Operator.ArraySubset]:
    "for each sub condition, has at least one element that meets it",

  [Operator.EqualToAvatar]: (
    <>
      is equal to <span className={classes.avatar}>AVATAR</span>
    </>
  ),
  [Operator.EqualTo]: "is equal to",
  [Operator.GreaterThan]: "is greater than",
  [Operator.LessThan]: "is less than",
  [Operator.SignedIntGreaterThan]: "is greater than (signed int)",
  [Operator.SignedIntLessThan]: "is less than (signed int)",

  [Operator.Bitmask]: "bytes match the bitmask",
}
