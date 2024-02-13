import { Condition, Operator } from "zodiac-roles-sdk"
import { Fragment, ReactNode } from "react"
import { AbiFunction, AbiParameter, parseAbiParameter } from "viem"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import Flex from "@/ui/Flex"
import Indent from "./Indent"
import ConditionHeader from "./ConditionHeader"
import PassConditionView from "./PassConditionView"
import BitmaskConditionView from "./BitmaskConditionView"

export interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
}

const ConditionView: React.FC<Props> = ({ condition, paramIndex, abi }) => {
  if (condition.operator === Operator.Pass) {
    return (
      <PassConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

  if (
    condition.operator >= Operator.And &&
    condition.operator <= Operator.Nor
  ) {
    return (
      <LogicalConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

  if (
    condition.operator >= Operator.Matches &&
    condition.operator <= Operator.ArraySubset
  ) {
    return (
      <ComplexConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

  if (
    condition.operator >= Operator.EqualToAvatar &&
    condition.operator <= Operator.SignedIntLessThan
  ) {
    return (
      <ComparisonConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

  if (condition.operator === Operator.Bitmask) {
    return (
      <BitmaskConditionView condition={condition} paramIndex={paramIndex} />
    )
  }

  // if (condition.operator === Operator.Custom) {
  //   return <CustomConditionView condition={condition} paramIndex={paramIndex} />
  // }

  // if (condition.operator === Operator.WithinAllowance) {
  //   return (
  //     <WithinAllowanceConditionView
  //       condition={condition}
  //       paramIndex={paramIndex}
  //     />
  //   )
  // }
  // if (
  //   condition.operator === Operator.EtherWithinAllowance ||
  //   condition.operator === Operator.CallWithinAllowance
  // ) {
  //   return (
  //     <GlobalWithinAllowanceConditionView
  //       condition={condition}
  //       paramIndex={paramIndex}
  //     />
  //   )
  // }

  return (
    <UnsupportedConditionView condition={condition} paramIndex={paramIndex} />
  )
}

export default ConditionView

const LogicalConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  const { operator, children } = condition
  const childrenLength = children?.length || 0
  const operatorLabel =
    operator === Operator.Nor && childrenLength === 1
      ? "Not"
      : Operator[operator]

  return (
    <Box p={2} className={classes.logicalCondition}>
      <div className={classes.logicalConditionBar} />
      {childrenLength <= 1 && (
        <div className={classes.singleItemOperatorLabel}>{operatorLabel}</div>
      )}

      <ChildConditions
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
        separator={
          <div className={classes.logicalBranchSeparator}>
            <div className={classes.operatorLabel}>{operatorLabel}</div>
          </div>
        }
      />
    </Box>
  )
}

const ComplexConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  return (
    <Box p={2} borderless>
      <ConditionHeader
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
      <ChildConditions
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    </Box>
  )
}

export const ChildConditions: React.FC<
  Props & {
    separator?: ReactNode
  }
> = ({ condition, paramIndex, abi, separator }) => {
  const { children, operator } = condition
  const childrenLength = children?.length || 0
  const indentLevels = calcChildrenIndentLevels(condition)

  return (
    <div className={classes.conditionBody}>
      <Flex direction="column" gap={1}>
        {children?.map((condition, index) => {
          let childParamIndex: number | undefined = undefined
          let childAbi: AbiFunction | AbiParameter | undefined = undefined
          if (isLogicalOperator(operator)) {
            // preserve scoped param
            childParamIndex = paramIndex
            childAbi = abi
          } else {
            // drill down to the fields
            if (operator === Operator.Matches || operator === Operator.Pass) {
              childParamIndex = index
            }

            if (abi) {
              if ("inputs" in abi) {
                // abi is AbiFunction
                childAbi = abi.inputs[index]
              } else {
                // abi is AbiParameter
                if ("components" in abi) {
                  // tuple type
                  childAbi = abi.components[index]
                } else {
                  const arrayComponents = getArrayComponents(abi.type)
                  if (arrayComponents) {
                    // array type
                    const [_length, elementType] = arrayComponents
                    childAbi = parseAbiParameter(elementType)
                  } else {
                    throw new Error(
                      "Tried to drill down to fields, but abi is neither AbiFunction, nor tuple or array type AbiParameter"
                    )
                  }
                }
              }
            }
          }

          return (
            <Fragment key={index}>
              <Indent level={indentLevels[index]}>
                <ConditionView
                  condition={condition}
                  paramIndex={childParamIndex}
                  abi={childAbi}
                />
              </Indent>
              {index < childrenLength - 1 && separator}
            </Fragment>
          )
        })}
      </Flex>
    </div>
  )
}

const isLogicalOperator = (operator: Operator) =>
  operator >= Operator.And && operator <= Operator.Nor

const calcMaxLogicalDepth = (condition: Condition): number => {
  const { children, operator } = condition
  if (!children) return 0
  return isLogicalOperator(operator)
    ? 1
    : 0 +
        Math.max(
          ...children.map((child) => {
            return isLogicalOperator(child.operator)
              ? 1 + calcMaxLogicalDepth(child)
              : 0
          })
        )
}

const calcChildrenIndentLevels = (condition: Condition): number[] => {
  const { children } = condition
  if (!children) return []

  const childrenDepths = children.map(calcMaxLogicalDepth)
  const maxDepth = Math.max(...childrenDepths)

  return childrenDepths.map((depth) => maxDepth - depth)
}

const ComparisonConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  return (
    <Box p={2} borderless>
      <ConditionHeader condition={condition} paramIndex={paramIndex} abi={abi}>
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

const getArrayComponents = (
  type: string
): [length: number | null, innerType: string] | null => {
  const matches = type.match(/^(.*)\[(\d+)?\]$/)
  return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : null
}
