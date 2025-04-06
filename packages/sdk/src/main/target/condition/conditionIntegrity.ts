import { Condition, Operator, AbiType } from "zodiac-roles-deployments"

export const checkRootConditionIntegrity = (condition: Condition): void => {
  const rootType = checkConsistentChildrenTypes(condition)
  if (rootType !== AbiType.Calldata) {
    throw new Error(
      `Root param type must be \`Calldata\`, got \`${AbiType[rootType]}\``
    )
  }
  checkConditionIntegrityRecursive(condition)
}

export const checkConditionIntegrity = (condition: Condition): void => {
  checkConsistentChildrenTypes(condition)
  checkConditionIntegrityRecursive(condition)
}

/**
 * Validates that logical condition children have consistent types.
 * Since the children conditions address the very same value it does not make sense for them to declare incompatible param types.
 * */
const checkConsistentChildrenTypes = (condition: Condition): AbiType => {
  if (condition.paramType !== AbiType.None) {
    return condition.paramType
  }

  const [first, ...rest] = condition.children || []
  const expectedType = first
    ? checkConsistentChildrenTypes(first)
    : AbiType.None

  rest.forEach((child) => {
    const childType = checkConsistentChildrenTypes(child)
    checkParameterTypeCompatibility(expectedType, childType)
  })

  return expectedType
}

export const checkParameterTypeCompatibility = (
  left: AbiType,
  right: AbiType
): void => {
  if (right === AbiType.None) return

  if (right === left) return

  if (
    right === AbiType.Dynamic &&
    (left === AbiType.Calldata || left === AbiType.AbiEncoded)
  ) {
    return
  }

  if (
    (right === AbiType.Calldata || right === AbiType.AbiEncoded) &&
    left === AbiType.Dynamic
  ) {
    throw new Error(
      `Mixed children types: \`${AbiType[right]}\` must appear before \`${AbiType[left]}\``
    )
  }

  throw new Error(
    `Inconsistent children types (\`${AbiType[left]}\` and \`${AbiType[right]}\`)`
  )
}

const checkConditionIntegrityRecursive = (condition: Condition): void => {
  condition.children?.forEach(checkConditionIntegrityRecursive)

  checkParamTypeIntegrity(condition)
  checkCompValueIntegrity(condition)
  checkChildrenIntegrity(condition)
}

const checkParamTypeIntegrity = (condition: Condition): void => {
  const COMPATIBLE_TYPES = {
    [Operator.Pass]: [
      AbiType.Static,
      AbiType.Dynamic,
      AbiType.Tuple,
      AbiType.Array,
      AbiType.Calldata,
      AbiType.AbiEncoded,
    ],

    [Operator.And]: [AbiType.None],
    [Operator.Or]: [AbiType.None],
    [Operator.Nor]: [AbiType.None],

    [Operator.Matches]: [
      AbiType.Calldata,
      AbiType.AbiEncoded,
      AbiType.Tuple,
      AbiType.Array,
    ],

    [Operator.ArraySome]: [AbiType.Array],
    [Operator.ArrayEvery]: [AbiType.Array],
    [Operator.ArraySubset]: [AbiType.Array],

    [Operator.EqualToAvatar]: [AbiType.Static],
    [Operator.EqualTo]: [
      AbiType.Static,
      AbiType.Dynamic,
      AbiType.Tuple,
      AbiType.Array,
    ],

    [Operator.GreaterThan]: [AbiType.Static],
    [Operator.LessThan]: [AbiType.Static],
    [Operator.SignedIntGreaterThan]: [AbiType.Static],
    [Operator.SignedIntLessThan]: [AbiType.Static],

    [Operator.Bitmask]: [AbiType.Static, AbiType.Dynamic],

    [Operator.Custom]: [
      AbiType.Static,
      AbiType.Dynamic,
      AbiType.Tuple,
      AbiType.Array,
    ],

    [Operator.WithinAllowance]: [AbiType.Static],

    [Operator.EtherWithinAllowance]: [AbiType.None],
    [Operator.CallWithinAllowance]: [AbiType.None],
  }
  const compatibleTypes = COMPATIBLE_TYPES[condition.operator]

  if (!compatibleTypes.includes(condition.paramType)) {
    throw new Error(
      `\`${
        Operator[condition.operator]
      }\` condition not supported for paramType \`${
        AbiType[condition.paramType]
      }\``
    )
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
    condition.paramType === AbiType.Tuple ||
    condition.paramType === AbiType.Array
  ) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error(
        `Condition on \`${
          AbiType[condition.paramType]
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
    if (!condition.children || condition.children.length === 0) {
      throw new Error(
        `\`${Operator[condition.operator]}\` conditions must have children`
      )
    }
  }

  if (
    condition.operator >= Operator.EqualToAvatar &&
    condition.operator !== Operator.Custom && // TODO Does this make sense? Can Custom have children?
    condition.paramType !== AbiType.Calldata &&
    condition.paramType !== AbiType.AbiEncoded &&
    condition.paramType !== AbiType.Tuple &&
    condition.paramType !== AbiType.Array
  ) {
    if (condition.children && condition.children?.length > 0) {
      throw new Error(
        `\`${Operator[condition.operator]}\` condition on \`${
          AbiType[condition.paramType]
        }\` type param must not have children`
      )
    }
  }

  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error(
        `\`${Operator[condition.operator]}\` condition must have children`
      )
    }
  }
}
