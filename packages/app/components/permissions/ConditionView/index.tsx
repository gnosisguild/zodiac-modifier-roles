import { Condition, Operator, ParameterType } from "zodiac-roles-sdk"
import { Fragment, ReactNode } from "react"
import { AbiFunction, AbiParameter, decodeAbiParameters } from "viem"

import classes from "./style.module.css"
import Flex from "@/ui/Flex"
import ConditionHeader from "./ConditionHeader"
import PassConditionView from "./PassConditionView"
import BitmaskConditionView from "./BitmaskConditionView"
import LabeledData from "@/ui/LabeledData"
import classNames from "classnames"
import ComplexConditionView from "./ComplexConditionView"
import { isLogicalOperator, isArrayOperator, arrayElementType } from "./utils"
export { matchesAbi } from "./utils"

export interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
}

const ConditionView: React.FC<Props> = ({ condition, paramIndex, abi }) => {
  if (condition.paramType === ParameterType.Calldata) {
    return (
      <CalldataConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

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
      <BitmaskConditionView
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    )
  }

  // if (condition.operator === Operator.Custom) {
  //   return <CustomConditionView condition={condition} paramIndex={paramIndex} abi={abi} />
  // }

  // if (condition.operator === Operator.WithinAllowance) {
  //   return (
  //     <WithinAllowanceConditionView
  //       condition={condition}
  //       paramIndex={paramIndex}
  //       abi={abi}
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
  //       abi={abi}
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
    <div
      className={classNames(
        classes.logicalCondition,
        classes.conditionContainer
      )}
    >
      <div className={classes.logicalConditionBar} />
      {childrenLength <= 1 && (
        <div className={classes.singleItemOperatorLabel}>{operatorLabel}</div>
      )}

      <div className={classes.logicalChildren}>
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
      </div>
    </div>
  )
}

const CalldataConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  return (
    <div>
      <ChildConditions
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
    </div>
  )
}

export const ChildConditions: React.FC<
  Props & {
    separator?: ReactNode
  }
> = ({ condition, paramIndex, abi, separator }) => {
  const { children, operator } = condition
  const childrenLength = children?.length || 0
  const isCalldataCondition = condition.paramType === ParameterType.Calldata
  const isLogicalCondition =
    operator >= Operator.And && operator <= Operator.Nor

  return (
    <div
      className={classNames(
        classes.conditionBody,
        isCalldataCondition && classes.topLevelCondition
      )}
    >
      {!isLogicalCondition && !isCalldataCondition && (
        <div className={classes.verticalGuide} />
      )}
      <Flex direction="column" gap={2}>
        {children?.map((child, index) => {
          let childParamIndex: number | undefined = undefined
          let childAbi: AbiFunction | AbiParameter | undefined = undefined
          if (isLogicalOperator(operator)) {
            // preserve scoped param
            childParamIndex = paramIndex
            childAbi = abi
          } else if (isArrayOperator(operator)) {
            childParamIndex = undefined
            childAbi = abi && arrayElementType(abi)
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

                const elementType = arrayElementType(abi)
                if (elementType) {
                  // array type
                  childAbi = elementType
                } else if ("components" in abi && !!abi.components) {
                  // tuple type
                  childAbi = abi.components[index]
                } else if (abi.type === "bytes") {
                  // We're dealing with a `bytes` type that will be decoded according to the conditions type tree.
                  // From here on down, no ABI information will be available.
                  childAbi = undefined
                } else {
                  throw new Error(
                    "Tried to drill down to fields, but abi is neither AbiFunction, nor tuple, array, or bytes type AbiParameter"
                  )
                }
              }
            }
          }

          return (
            <Fragment key={index}>
              <ConditionView
                condition={child}
                paramIndex={childParamIndex}
                abi={childAbi}
              />
              {index < childrenLength - 1 && separator}
            </Fragment>
          )
        })}
      </Flex>
    </div>
  )
}

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

const ComparisonConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  if (abi?.type === "function")
    throw new Error("Unexpected comparison condition on function")

  let value = condition.compValue || ""
  const shallDecode = (type: string) =>
    type === "address" ||
    type === "string" ||
    type === "boolean" ||
    type.startsWith("int") ||
    type.startsWith("uint")
  if (condition.compValue && abi && shallDecode(abi.type)) {
    const [decoded] = decodeAbiParameters(
      [abi as AbiParameter],
      condition.compValue
    )
    value = String(decoded)
  }

  return (
    <div className={classes.conditionContainer}>
      <ConditionHeader condition={condition} paramIndex={paramIndex} abi={abi}>
        {condition.operator !== Operator.EqualToAvatar && (
          <LabeledData label="Value" className={classes.compValue}>
            <input
              type="text"
              readOnly
              value={value}
              className={classes.conditionInput}
            />
          </LabeledData>
        )}
      </ConditionHeader>
    </div>
  )
}

const UnsupportedConditionView: React.FC<Props> = ({ condition }) => {
  return (
    <Flex direction="column" gap={2} className={classes.unsupported}>
      <LabeledData label="Unsupported Condition">
        <p>
          Cannot parse this condition (it most likely came from a different
          interface)
        </p>
        <pre>{JSON.stringify(condition, undefined, 2)}</pre>
      </LabeledData>
    </Flex>
  )
}
