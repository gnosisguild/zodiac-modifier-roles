import { Condition, Operator, ParameterType } from "zodiac-roles-sdk"
import { ReactNode } from "react"
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri"
import { PiDotBold } from "react-icons/pi"
import classes from "./style.module.css"
import Flex from "@/ui/Flex"

export interface Props {
  condition: Condition
  paramIndex?: number
  children?: ReactNode
  collapsed?: boolean
}

export const ConditionHeader: React.FC<Props> = ({
  condition,
  paramIndex,
  children,
  collapsed,
}) => {
  const { operator, paramType } = condition

  const paramName = paramIndex !== undefined ? `[${paramIndex}]` : "" // e.g.: array elements don't have a param name
  const paramTypeLabel = ParameterType[paramType]
  const operatorLabel = OperatorLabels[operator] || Operator[operator]

  const isComplexType = paramType >= ParameterType.Tuple

  return (
    <Flex gap={2} alignItems="center">
      <div className={classes.bullet}>
        {isComplexType ? (
          collapsed ? (
            <RiArrowDropRightLine size={16} />
          ) : (
            <RiArrowDropDownLine size={16} />
          )
        ) : (
          <PiDotBold size={16} />
        )}
      </div>
      <div className={classes.param}>
        <Flex gap={2} alignItems="center">
          {paramName && <div>{paramName}</div>}
          <div>
            <span className={classes.paramType}>{paramTypeLabel}</span>
          </div>
        </Flex>
      </div>
      {operator !== Operator.Pass && (
        <div className={classes.operator}>{operatorLabel}</div>
      )}
      {children}
    </Flex>
  )
}
const OperatorLabels: Record<number, string> = {
  [Operator.Matches]: "matches",
  [Operator.ArraySome]: "has at least one element that",
  [Operator.ArrayEvery]: "only has elements that",
  [Operator.ArraySubset]:
    "for each sub condition, has at least one element that meets it",

  [Operator.EqualToAvatar]: "is equal to the avatar",
  [Operator.EqualTo]: "is equal to",
  [Operator.GreaterThan]: "is greater than",
  [Operator.LessThan]: "is less than",
  [Operator.SignedIntGreaterThan]: "is greater than (signed int)",
  [Operator.SignedIntLessThan]: "is less than (signed int)",
}
