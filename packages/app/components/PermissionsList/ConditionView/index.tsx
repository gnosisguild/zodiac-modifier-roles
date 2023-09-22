import { Condition, Operator, ParameterType } from "zodiac-roles-sdk"
import { Fragment, ReactNode } from "react"
import { RiArrowDropDownLine } from "react-icons/ri"
import { PiDotBold } from "react-icons/pi"
import cn from "classnames"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import Flex from "@/ui/Flex"

interface Props {
  condition: Condition
  paramIndex?: number
  isChild?: boolean
}

const ConditionView: React.FC<Props> = ({ condition, isChild, paramIndex }) => {
  if (condition.operator === Operator.Pass) {
    return <PassConditionView condition={condition} paramIndex={paramIndex} />
  }

  if (
    condition.operator >= Operator.And &&
    condition.operator <= Operator.Nor
  ) {
    return (
      <LogicalConditionView
        condition={condition}
        paramIndex={paramIndex}
        isChild={isChild}
      />
    )
  }

  if (
    condition.operator >= Operator.Matches &&
    condition.operator <= Operator.ArraySubset
  ) {
    return (
      <ComplexConditionView condition={condition} paramIndex={paramIndex} />
    )
  }

  if (
    condition.operator >= Operator.EqualToAvatar &&
    condition.operator <= Operator.SignedIntLessThan
  ) {
    return (
      <ComparisonConditionView condition={condition} paramIndex={paramIndex} />
    )
  }

  //   if (condition.operator === Operator.Bitmask) {
  //     return <BitmaskConditionView condition={condition} paramIndex={paramIndex} />
  //   }
  //   if (condition.operator === Operator.Custom) {
  //     return <CustomConditionView condition={condition} paramIndex={paramIndex} />
  //   }

  //   if (condition.operator === Operator.WithinAllowance) {
  //     return (
  //       <WithinAllowanceConditionView
  //         condition={condition}
  //         paramIndex={paramIndex}
  //       />
  //     )
  //   }
  //   if (
  //     condition.operator === Operator.EtherWithinAllowance ||
  //     condition.operator === Operator.CallWithinAllowance
  //   ) {
  //     return (
  //       <GlobalWithinAllowanceConditionView
  //         condition={condition}
  //         paramIndex={paramIndex}
  //       />
  //     )
  //   }

  return (
    <UnsupportedConditionView condition={condition} paramIndex={paramIndex} />
  )
}

export default ConditionView

const PassConditionView: React.FC<Props> = ({ condition, paramIndex }) => (
  <Box p={2} borderless className={classes.pass} title="No condition set">
    <ConditionHeader condition={condition} paramIndex={paramIndex} />
  </Box>
)

const LogicalConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  isChild,
}) => {
  const { operator, children } = condition
  const operatorLabel =
    operator === Operator.Nor && children?.length === 1
      ? "Not"
      : Operator[operator]
  return (
    <Box
      p={2}
      className={cn(classes.logicalCondition, isChild && classes.isChild)}
    >
      <div className={classes.logicalOperator}>{operatorLabel}</div>
      <div className={classes.childConditions}>
        {children?.map((condition, index) => (
          <Fragment key={index}>
            <ConditionView
              isChild
              condition={condition}
              paramIndex={paramIndex}
            />
            {index < children.length - 1 && (
              <div className={classes.logicalBranchSeparator} />
            )}
          </Fragment>
        ))}
      </div>
    </Box>
  )
}

const ComplexConditionView: React.FC<Props> = ({ condition, paramIndex }) => {
  const { operator, children } = condition
  return (
    <Box p={2} borderless>
      <ConditionHeader condition={condition} paramIndex={paramIndex} />
      <div className={classes.childConditions}>
        <Flex direction="column" gap={1}>
          {children?.map((condition, index) => (
            <ConditionView
              isChild
              key={index}
              condition={condition}
              paramIndex={operator === Operator.Matches ? index : undefined}
            />
          ))}
        </Flex>
      </div>
    </Box>
  )
}

const ComparisonConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
}) => {
  return (
    <Box p={2} borderless>
      <ConditionHeader condition={condition} paramIndex={paramIndex}>
        {condition.operator !== Operator.EqualToAvatar && (
          <input type="text" readOnly value={condition.compValue} />
        )}
      </ConditionHeader>
    </Box>
  )
}

const UnsupportedConditionView: React.FC<Props> = ({ condition }) => {
  return (
    <Box p={2}>
      <p>This condition is not supported</p>
      <pre>{JSON.stringify(condition, undefined, 2)}</pre>
    </Box>
  )
}

const ConditionHeader: React.FC<Props & { children?: ReactNode }> = ({
  condition,
  paramIndex,
  children,
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
          <RiArrowDropDownLine size={16} />
        ) : (
          <PiDotBold size={16} />
        )}
      </div>
      <div className={classes.param}>
        <Flex gap={2} alignItems="center">
          <div>{paramName}</div>
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
