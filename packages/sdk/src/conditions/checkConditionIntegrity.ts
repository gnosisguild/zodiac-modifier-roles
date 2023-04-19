import { Condition, Operator, ParameterType } from "../types"

export const checkConditionIntegrity = (condition: Condition): void => {
  checkConsistentChildrenTypes(condition)
  checkConditionIntegrityRecursive(condition)
}

export const checkRootConditionIntegrity = (condition: Condition): void => {
  const rootType = checkConsistentChildrenTypes(condition)
  if (rootType !== ParameterType.AbiEncoded) {
    throw new Error(
      `Root param type must be \`AbiEncoded\`, got \`${ParameterType[rootType]}\``
    )
  }
  checkConditionIntegrityRecursive(condition)
}

const checkConsistentChildrenTypes = (condition: Condition): ParameterType => {
  if (condition.paramType !== ParameterType.None) {
    return condition.paramType
  }

  let expectedType: ParameterType | undefined = undefined
  condition.children?.forEach((child) => {
    const childType = checkConsistentChildrenTypes(child)
    if (childType === ParameterType.None) return
    if (expectedType && childType !== expectedType) {
      throw new Error(
        `Inconsistent children types (\`${ParameterType[expectedType]}\` and \`${ParameterType[childType]}\`)`
      )
    }
    expectedType = childType
  })

  return expectedType || ParameterType.None
}

const checkConditionIntegrityRecursive = (condition: Condition): void => {
  condition.children?.forEach(checkConditionIntegrityRecursive)

  checkParamTypeIntegrity(condition)
  checkCompValueIntegrity(condition)
  checkChildrenIntegrity(condition)
}

const checkParamTypeIntegrity = (condition: Condition): void => {
  if (
    condition.operator === Operator.ArraySome ||
    condition.operator === Operator.ArrayEvery ||
    condition.operator === Operator.ArraySubset
  ) {
    throw new Error(
      `\`${
        Operator[condition.operator]
      }\` condition not supported for paramType \`${
        ParameterType[condition.paramType]
      }\``
    )
  }

  if (condition.operator === Operator.Matches) {
    if (
      condition.paramType !== ParameterType.AbiEncoded &&
      condition.paramType !== ParameterType.Tuple &&
      condition.paramType !== ParameterType.Array
    ) {
      throw new Error(
        `\`Matches\` condition not supported for paramType \`${
          ParameterType[condition.paramType]
        }\``
      )
    }
  }

  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor ||
    condition.operator === Operator.Xor ||
    condition.operator === Operator.EtherWithinAllowance ||
    condition.operator === Operator.CallWithinAllowance
  ) {
    if (condition.paramType !== ParameterType.None) {
      throw new Error(
        `\`${
          Operator[condition.operator]
        }\` condition must use paramType \`None\`, got: \`${
          ParameterType[condition.paramType]
        }\``
      )
    }
  }

  if (
    condition.operator === Operator.LessThan ||
    condition.operator === Operator.GreaterThan ||
    condition.operator === Operator.SignedIntLessThan ||
    condition.operator === Operator.SignedIntGreaterThan ||
    condition.operator === Operator.WithinAllowance
  ) {
    if (condition.paramType !== ParameterType.Static) {
      throw new Error(
        `\`${Operator[condition.operator]}\` not supported for paramType \`${
          ParameterType[condition.paramType]
        }\``
      )
    }
  }
}

const checkCompValueIntegrity = (condition: Condition): void => {
  if (condition.operator >= Operator.EqualTo && !condition.compValue) {
    throw new Error(
      `\`${Operator[condition.operator]}\` condition must have a compValue`
    )
  }

  if (condition.operator < Operator.EqualTo && condition.compValue) {
    throw new Error(
      `\`${Operator[condition.operator]}\` condition cannot have a compValue`
    )
  }
}

const checkChildrenIntegrity = (condition: Condition): void => {
  if (
    condition.paramType === ParameterType.Tuple ||
    condition.paramType === ParameterType.Array
  ) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error(
        `Condition on \`${
          ParameterType[condition.paramType]
        }\` params must have children to describe the type structure, found violation in \`${
          Operator[condition.operator]
        }\` condition`
      )
    }
  }

  if (
    condition.operator === Operator.ArraySome ||
    condition.operator === Operator.ArrayEvery
  ) {
    if (condition.children?.length !== 1) {
      throw new Error(
        `\`${
          Operator[condition.operator]
        }\` conditions must have exactly one child`
      )
    }
  }

  if (
    condition.operator === Operator.Matches ||
    condition.operator === Operator.ArraySubset
  ) {
    throw new Error(
      `\`${Operator[condition.operator]}\` conditions must have children`
    )
  }

  if (
    condition.operator >= Operator.EqualToAvatar &&
    condition.operator !== Operator.Custom &&
    condition.paramType !== ParameterType.AbiEncoded &&
    condition.paramType !== ParameterType.Tuple &&
    condition.paramType !== ParameterType.Array
  ) {
    if (condition.children && condition.children?.length > 0) {
      throw new Error(
        `\`${Operator[condition.operator]}\` condition on \`${
          ParameterType[condition.paramType]
        }\` type param must not have children`
      )
    }
  }

  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor ||
    condition.operator === Operator.Xor
  ) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error(
        `\`${Operator[condition.operator]}\` condition must have children`
      )
    }
  }
}
