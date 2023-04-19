import { Condition, ParameterType } from "../types"

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
  checkConditionIntegrity(condition)
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

  checkCompValueIntegrity(condition)
  checkChildrenIntegrity(condition)
}

const checkCompValueIntegrity = (condition: Condition): void => {}

const checkChildrenIntegrity = (condition: Condition): void => {}
